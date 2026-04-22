import { getAllAssets, resolveAssetById } from "../domain/assetReferences";
import { getAssetStatus } from "../domain/assetStatuses";
import type {
  AnimationDefinition,
  AssetSummary,
  CharacterDefinition,
  DetailTab,
  EditorEntityRecord,
  EditorRoute,
  EditorSnapshot,
  EditorState,
  ImportDraft,
  LibraryTab,
  MapDefinition,
  RawAssetBlobRecord,
  RawAssetRecord,
  SpriteSheetDefinition,
  TilesetDefinition,
} from "../domain/editorTypes";
import { normalizeAssetName } from "../domain/editorValidators";
import type { EditorRouter } from "../app/EditorRouter";
import { EditorRepository } from "../storage/editorRepository";
import { ObjectUrlRegistry } from "../storage/objectUrlRegistry";

type StoreListener = (state: EditorState) => void;

const EMPTY_SNAPSHOT: EditorSnapshot = {
  rawAssets: [],
  rawAssetBlobs: [],
  tilesets: [],
  spritesheets: [],
  animations: [],
  characters: [],
  maps: [],
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
    importModalOpen: false,
  };

  private importDraft: ImportDraft = {
    file: null,
    name: "",
    sourceKind: null,
    error: null,
  };

  constructor(
    private readonly repository: EditorRepository,
    private readonly router: EditorRouter,
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
    const blob = this.state.snapshot.rawAssetBlobs.find((entry) => entry.id === rawAssetId);
    if (!rawAsset || !blob) {
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
    };
    this.emit();
  }

  openImportModal(): void {
    this.importDraft = {
      file: null,
      name: "",
      sourceKind: null,
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
    this.emit();
  }

  navigate(route: EditorRoute): void {
    this.router.navigate(route);
  }

  async archiveAsset(asset: EditorEntityRecord): Promise<void> {
    await this.repository.archiveAsset(asset);
    await this.reload();
  }

  async unarchiveAsset(asset: EditorEntityRecord): Promise<void> {
    await this.repository.unarchiveAsset(asset);
    await this.reload();
  }

  async saveRawAsset(record: RawAssetRecord, blobRecord: RawAssetBlobRecord): Promise<void> {
    await this.repository.saveRawAsset(record, blobRecord);
    await this.reload();
  }

  async saveTileset(record: TilesetDefinition): Promise<void> {
    await this.repository.saveTileset(record);
    await this.reload();
  }

  async saveSpriteSheet(record: SpriteSheetDefinition): Promise<void> {
    await this.repository.saveSpriteSheet(record);
    await this.reload();
  }

  async saveAnimation(record: AnimationDefinition): Promise<void> {
    await this.repository.saveAnimation(record);
    await this.reload();
  }

  async saveCharacter(record: CharacterDefinition): Promise<void> {
    await this.repository.saveCharacter(record);
    await this.reload();
  }

  async saveMap(record: MapDefinition): Promise<void> {
    await this.repository.saveMap(record);
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
}
