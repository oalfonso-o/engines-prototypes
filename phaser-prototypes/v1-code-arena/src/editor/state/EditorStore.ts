import { getAllAssets, isRawAsset, resolveAssetById } from "../domain/assetReferences";
import { getAssetStatus } from "../domain/assetStatuses";
import type {
  AnimationDefinition,
  AssetSummary,
  CharacterDefinition,
  DetailTab,
  EditorEntityRecord,
  FolderRecord,
  EditorRoute,
  EditorSnapshot,
  EditorState,
  ImportDraft,
  LibraryTab,
  LevelCompositionRecord,
  MapDefinition,
  RawAssetBlobRecord,
  RawAssetRecord,
  SpriteSheetDefinition,
  TilesetDefinition,
} from "../domain/editorTypes";
import { normalizeAssetName } from "../domain/editorValidators";
import type { EditorRouteController } from "../app/EditorRouter";
import { ROOT_FOLDER_IDS } from "../content/coreAssetManifest";
import { EditorRepository } from "../storage/editorRepository";
import { ObjectUrlRegistry } from "../storage/objectUrlRegistry";
import { resolveAssetUrl } from "../storage/assetPathResolver";
import { movePathOnDisk, writeJsonOnDisk } from "../storage/devFsClient";
import {
  getRelativePathBasename,
  getRelativePathExtension,
  joinRelativePath,
  replaceRelativePathBasename,
  resolveUniqueRelativePath,
  slugifyForPath,
} from "../storage/pathNaming";

type StoreListener = (state: EditorState) => void;

const EMPTY_SNAPSHOT: EditorSnapshot = {
  folders: [],
  rawAssets: [],
  rawAssetBlobs: [],
  tilesets: [],
  spritesheets: [],
  animations: [],
  characters: [],
  maps: [],
  levelCompositions: [],
};

export class EditorStore {
  private readonly listeners = new Set<StoreListener>();
  private state: EditorState = {
    isReady: false,
    route: { kind: "library" },
    snapshot: EMPTY_SNAPSHOT,
    searchQuery: "",
    libraryTab: "raw",
    detailTab: "overview",
    selectedAssetId: null,
    selectedFolderId: null,
    importModalOpen: false,
  };

  private importDraft: ImportDraft = {
    file: null,
    name: "",
    sourceKind: null,
    destinationFolderId: null,
    error: null,
  };

  constructor(
    private readonly repository: EditorRepository,
    private readonly router: EditorRouteController,
    private readonly objectUrlRegistry: ObjectUrlRegistry,
  ) {}

  async init(): Promise<void> {
    this.router.subscribe((route) => {
      this.state = {
        ...this.state,
        route,
        selectedAssetId: route.kind === "library" ? this.state.selectedAssetId : route.id || null,
      };
      this.emit();
    });

    await this.reload();
  }

  subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): EditorState {
    return this.state;
  }

  getImportDraft(): ImportDraft {
    return this.importDraft;
  }

  getAssetById(id: string): EditorEntityRecord | null {
    return resolveAssetById(this.state.snapshot, id)?.asset ?? null;
  }

  getFolderById(id: string): FolderRecord | null {
    return this.state.snapshot.folders.find((entry) => entry.id === id) ?? null;
  }

  getAllAssets(): EditorEntityRecord[] {
    return getAllAssets(this.state.snapshot);
  }

  getAssetSummaries(): AssetSummary[] {
    return getAllAssets(this.state.snapshot).map((asset) => ({
      id: asset.id,
      entityType: resolveAssetById(this.state.snapshot, asset.id)?.entityType ?? "raw-asset",
      name: asset.name,
      archivedAt: asset.archivedAt,
      status: getAssetStatus(asset, this.state.snapshot),
    }));
  }

  getRawAssetUrl(rawAssetId: string): string | null {
    const rawAsset = this.state.snapshot.rawAssets.find((entry) => entry.id === rawAssetId);
    if (!rawAsset) {
      return null;
    }

    if (rawAsset.storageMode === "disk") {
      return resolveAssetUrl(rawAsset.storageRoot, rawAsset.relativePath);
    }

    const blob = this.state.snapshot.rawAssetBlobs.find((entry) => entry.id === rawAssetId);
    if (!blob) {
      return null;
    }

    return this.objectUrlRegistry.resolve(`${rawAsset.id}:${rawAsset.updatedAt}`, blob.blob);
  }

  setSearchQuery(searchQuery: string): void {
    this.state = {
      ...this.state,
      searchQuery,
    };
    this.emit();
  }

  setLibraryTab(libraryTab: LibraryTab): void {
    this.state = {
      ...this.state,
      libraryTab,
    };
    this.emit();
  }

  setDetailTab(detailTab: DetailTab): void {
    this.state = {
      ...this.state,
      detailTab,
    };
    this.emit();
  }

  selectAsset(assetId: string | null): void {
    this.state = {
      ...this.state,
      selectedAssetId: assetId,
      selectedFolderId: null,
    };
    this.emit();
  }

  selectFolder(folderId: string | null): void {
    this.state = {
      ...this.state,
      selectedFolderId: folderId,
      selectedAssetId: null,
    };
    this.emit();
  }

  openImportModal(): void {
    this.importDraft = {
      file: null,
      name: "",
      sourceKind: null,
      destinationFolderId: this.resolveDefaultImportFolderId(),
      error: null,
    };
    this.state = {
      ...this.state,
      importModalOpen: true,
    };
    this.emit();
  }

  closeImportModal(): void {
    this.state = {
      ...this.state,
      importModalOpen: false,
    };
    this.emit();
  }

  updateImportDraft(nextDraft: Partial<ImportDraft>): void {
    this.importDraft = {
      ...this.importDraft,
      ...nextDraft,
    };
    this.emit();
  }

  async reload(): Promise<void> {
    const snapshot = await this.repository.loadSnapshot();
    this.state = {
      ...this.state,
      isReady: true,
      snapshot,
      route: this.router.getCurrentRoute(),
    };
    if (
      this.state.selectedFolderId
      && !snapshot.folders.some((entry) => entry.id === this.state.selectedFolderId)
    ) {
      this.state.selectedFolderId = null;
    }
    if (
      this.state.selectedAssetId
      && !this.getAllAssets().some((entry) => entry.id === this.state.selectedAssetId)
    ) {
      this.state.selectedAssetId = null;
    }
    this.emit();
  }

  navigate(route: EditorRoute): void {
    this.router.navigate(route);
  }

  async archiveAsset(asset: EditorEntityRecord): Promise<void> {
    const archivedRoot = this.getFolderById(ROOT_FOLDER_IDS.archived);
    if (!archivedRoot) {
      return;
    }

    await this.moveAssetToFolder(asset, archivedRoot);
    await this.reload();
  }

  async renameAsset(asset: EditorEntityRecord, name: string): Promise<void> {
    if (asset.storageRoot === "core") {
      return;
    }

    const folder = asset.folderId ? this.getFolderById(asset.folderId) : this.getFolderRoot(asset.storageRoot);
    if (!folder) {
      return;
    }

    const now = new Date().toISOString();
    const nextBasename = `${slugifyForPath(name)}${getRelativePathExtension(asset.relativePath)}`;
    const occupiedPaths = this.buildOccupiedRelativePathSet(asset.storageRoot, {
      assetIds: new Set([asset.id]),
    });
    const nextRelativePath = resolveUniqueRelativePath(
      replaceRelativePathBasename(joinRelativePath(folder.relativePath, getRelativePathBasename(asset.relativePath)), nextBasename),
      occupiedPaths,
    );

    if (shouldMoveEntityFile(asset) && asset.relativePath !== nextRelativePath) {
      await movePathOnDisk("file", asset.storageRoot, asset.relativePath, asset.storageRoot, nextRelativePath);
    }

    const updatedAsset = {
      ...asset,
      name,
      relativePath: nextRelativePath,
      updatedAt: now,
    };
    await this.persistUserEntityDefinition(updatedAsset);
    await this.repository.saveEntities([updatedAsset]);
    await this.reload();
  }

  async unarchiveAsset(asset: EditorEntityRecord): Promise<void> {
    const userRoot = this.getFolderById(ROOT_FOLDER_IDS.user);
    if (!userRoot) {
      return;
    }

    await this.moveAssetToFolder(asset, userRoot);
    await this.reload();
  }

  async saveRawAsset(record: RawAssetRecord, blobRecord?: RawAssetBlobRecord | null): Promise<void> {
    await this.repository.saveRawAsset(record, blobRecord);
    await this.reload();
  }

  async saveFolder(record: FolderRecord): Promise<void> {
    await this.repository.saveFolder(record);
    await this.reload();
  }

  async saveTileset(record: TilesetDefinition): Promise<void> {
    await this.persistUserEntityDefinition(record);
    await this.repository.saveTileset(record);
    await this.reload();
  }

  async saveSpriteSheet(record: SpriteSheetDefinition): Promise<void> {
    await this.persistUserEntityDefinition(record);
    await this.repository.saveSpriteSheet(record);
    await this.reload();
  }

  async saveAnimation(record: AnimationDefinition): Promise<void> {
    await this.persistUserEntityDefinition(record);
    await this.repository.saveAnimation(record);
    await this.reload();
  }

  async saveCharacter(record: CharacterDefinition): Promise<void> {
    await this.persistUserEntityDefinition(record);
    await this.repository.saveCharacter(record);
    await this.reload();
  }

  async saveMap(record: MapDefinition): Promise<void> {
    await this.persistUserEntityDefinition(record);
    await this.repository.saveMap(record);
    await this.reload();
  }

  async saveLevelComposition(record: LevelCompositionRecord): Promise<void> {
    await this.persistUserEntityDefinition(record);
    await this.repository.saveLevelComposition(record);
    await this.reload();
  }

  async renameFolder(folder: FolderRecord, name: string): Promise<void> {
    if (folder.system || folder.storageRoot === "core") {
      return;
    }

    const parentFolder = folder.parentFolderId ? this.getFolderById(folder.parentFolderId) : null;
    const desiredRelativePath = joinRelativePath(parentFolder?.relativePath ?? "", slugifyForPath(name));
    const nextRelativePath = resolveUniqueRelativePath(
      desiredRelativePath,
      this.buildOccupiedRelativePathSet(folder.storageRoot, { folderIds: new Set(this.getFolderSubtreeIds(folder.id)) }),
    );

    await this.moveFolderSubtree(folder, parentFolder, nextRelativePath, name);
    await this.reload();
  }

  async archiveFolder(folder: FolderRecord): Promise<void> {
    const archivedRoot = this.getFolderById(ROOT_FOLDER_IDS.archived);
    if (!archivedRoot) {
      return;
    }

    const nextRelativePath = resolveUniqueRelativePath(
      folder.slug,
      this.buildOccupiedRelativePathSet("archived", { folderIds: new Set(this.getFolderSubtreeIds(folder.id)) }),
    );
    await this.moveFolderSubtree(folder, archivedRoot, nextRelativePath);
    await this.reload();
  }

  async unarchiveFolder(folder: FolderRecord): Promise<void> {
    const userRoot = this.getFolderById(ROOT_FOLDER_IDS.user);
    if (!userRoot) {
      return;
    }

    const nextRelativePath = resolveUniqueRelativePath(
      folder.slug,
      this.buildOccupiedRelativePathSet("user", { folderIds: new Set(this.getFolderSubtreeIds(folder.id)) }),
    );
    await this.moveFolderSubtree(folder, userRoot, nextRelativePath);
    await this.reload();
  }

  async moveAssetToFolder(asset: EditorEntityRecord, targetFolder: FolderRecord): Promise<void> {
    if (asset.storageRoot === "core" || targetFolder.storageRoot === "core") {
      return;
    }

    const basename = getRelativePathBasename(asset.relativePath);
    const nextRelativePath = resolveUniqueRelativePath(
      joinRelativePath(targetFolder.relativePath, basename),
      this.buildOccupiedRelativePathSet(targetFolder.storageRoot, { assetIds: new Set([asset.id]) }),
    );

    if (shouldMoveEntityFile(asset) && (asset.storageRoot !== targetFolder.storageRoot || asset.relativePath !== nextRelativePath)) {
      await movePathOnDisk("file", asset.storageRoot, asset.relativePath, targetFolder.storageRoot, nextRelativePath);
    }

    const now = new Date().toISOString();
    const updatedAsset = {
      ...asset,
      storageRoot: targetFolder.storageRoot,
      folderId: targetFolder.id,
      relativePath: nextRelativePath,
      archivedAt: targetFolder.storageRoot === "archived" ? asset.archivedAt ?? now : null,
      updatedAt: now,
    };
    await this.persistUserEntityDefinition(updatedAsset);
    await this.repository.saveEntities([updatedAsset]);
  }

  async moveFolderToFolder(folder: FolderRecord, targetFolder: FolderRecord): Promise<void> {
    if (folder.system || folder.storageRoot === "core" || targetFolder.storageRoot === "core") {
      return;
    }
    if (folder.id === targetFolder.id) {
      return;
    }
    if (this.getFolderSubtreeIds(folder.id).includes(targetFolder.id)) {
      return;
    }

    const nextRelativePath = resolveUniqueRelativePath(
      joinRelativePath(targetFolder.relativePath, folder.slug),
      this.buildOccupiedRelativePathSet(targetFolder.storageRoot, { folderIds: new Set(this.getFolderSubtreeIds(folder.id)) }),
    );
    await this.moveFolderSubtree(folder, targetFolder, nextRelativePath);
    await this.reload();
  }

  isAssetNameTaken(name: string, excludeId?: string): boolean {
    const normalized = normalizeAssetName(name).toLocaleLowerCase();
    return this.getAllAssets().some((asset) => asset.id !== excludeId && asset.name.toLocaleLowerCase() === normalized);
  }

  destroy(): void {
    this.objectUrlRegistry.revokeAll();
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  private async moveFolderSubtree(
    folder: FolderRecord,
    targetParentFolder: FolderRecord | null,
    nextRelativePath: string,
    nextName?: string,
  ): Promise<void> {
    if (folder.storageRoot === "core") {
      return;
    }

    const subtreeIds = new Set(this.getFolderSubtreeIds(folder.id));
    const folderMap = new Map(this.state.snapshot.folders.map((entry) => [entry.id, entry]));
    const now = new Date().toISOString();
    const nextStorageRoot = targetParentFolder?.storageRoot ?? folder.storageRoot;
    if (folder.relativePath !== nextRelativePath || folder.storageRoot !== nextStorageRoot) {
      await movePathOnDisk("directory", folder.storageRoot, folder.relativePath, nextStorageRoot, nextRelativePath);
    }

    const updatedFolders = this.state.snapshot.folders
      .filter((entry) => subtreeIds.has(entry.id))
      .sort((left, right) => left.relativePath.length - right.relativePath.length)
      .map((entry) => {
        const suffix = entry.id === folder.id
          ? ""
          : entry.relativePath.slice(folder.relativePath.length + 1);
        const relativePath = suffix ? `${nextRelativePath}/${suffix}` : nextRelativePath;
        return {
          ...entry,
          name: entry.id === folder.id && nextName ? nextName : entry.name,
          slug: entry.id === folder.id && nextName ? slugifyForPath(nextName) : entry.slug,
          storageRoot: nextStorageRoot,
          parentFolderId: entry.id === folder.id ? targetParentFolder?.id ?? null : entry.parentFolderId,
          relativePath,
          updatedAt: now,
        };
      });
    const updatedFolderMap = new Map(updatedFolders.map((entry) => [entry.id, entry]));

    const updatedAssets = this.getAllAssets()
      .filter((entry) => entry.folderId && subtreeIds.has(entry.folderId))
      .map((entry) => {
        const targetFolder = updatedFolderMap.get(entry.folderId ?? "") ?? folderMap.get(entry.folderId ?? "");
        if (!targetFolder) {
          return entry;
        }
        const relativePath = joinRelativePath(targetFolder.relativePath, getRelativePathBasename(entry.relativePath));
        return {
          ...entry,
          storageRoot: nextStorageRoot,
          relativePath,
          archivedAt: nextStorageRoot === "archived" ? entry.archivedAt ?? now : null,
          updatedAt: now,
        };
      });

    for (const entry of updatedAssets) {
      await this.persistUserEntityDefinition(entry);
    }
    await this.repository.saveFolders(updatedFolders);
    await this.repository.saveEntities(updatedAssets);
  }

  private getFolderRoot(storageRoot: FolderRecord["storageRoot"]): FolderRecord | null {
    const rootId = storageRoot === "core"
      ? ROOT_FOLDER_IDS.core
      : storageRoot === "archived"
        ? ROOT_FOLDER_IDS.archived
        : ROOT_FOLDER_IDS.user;
    return this.getFolderById(rootId);
  }

  private getFolderSubtreeIds(folderId: string): string[] {
    const childrenByParent = new Map<string | null, FolderRecord[]>();
    this.state.snapshot.folders.forEach((entry) => {
      const bucket = childrenByParent.get(entry.parentFolderId) ?? [];
      bucket.push(entry);
      childrenByParent.set(entry.parentFolderId, bucket);
    });

    const result: string[] = [];
    const stack = [folderId];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }
      result.push(current);
      const children = childrenByParent.get(current) ?? [];
      children.forEach((entry) => stack.push(entry.id));
    }
    return result;
  }

  private buildOccupiedRelativePathSet(
    storageRoot: FolderRecord["storageRoot"],
    options?: {
      folderIds?: Set<string>;
      assetIds?: Set<string>;
    },
  ): Set<string> {
    const occupied = new Set<string>();
    this.state.snapshot.folders.forEach((entry) => {
      if (entry.storageRoot !== storageRoot) {
        return;
      }
      if (options?.folderIds?.has(entry.id)) {
        return;
      }
      occupied.add(entry.relativePath);
    });
    this.getAllAssets().forEach((entry) => {
      if (entry.storageRoot !== storageRoot) {
        return;
      }
      if (options?.assetIds?.has(entry.id)) {
        return;
      }
      occupied.add(entry.relativePath);
    });
    return occupied;
  }

  private async persistUserEntityDefinition(record: EditorEntityRecord): Promise<void> {
    if (record.storageRoot !== "user" && record.storageRoot !== "archived") {
      return;
    }
    if (isRawAsset(record)) {
      return;
    }

    await writeJsonOnDisk(record.storageRoot, record.relativePath, JSON.stringify(record, null, 2));
  }

  private resolveDefaultImportFolderId(): string | null {
    const assetsRawFolder = this.state.snapshot.folders.find(
      (entry) => entry.storageRoot === "user" && entry.relativePath === "assets-raw",
    );
    if (assetsRawFolder) {
      return assetsRawFolder.id;
    }

    const userRoot = this.state.snapshot.folders.find(
      (entry) => entry.storageRoot === "user" && entry.parentFolderId === null,
    );
    return userRoot?.id ?? null;
  }
}

function shouldMoveEntityFile(asset: EditorEntityRecord): boolean {
  return !isRawAsset(asset) || asset.storageMode === "disk";
}
