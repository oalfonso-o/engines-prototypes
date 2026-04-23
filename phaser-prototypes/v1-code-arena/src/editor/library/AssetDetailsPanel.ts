import {
  getDependencyEntries,
  getSourceRawAssetId,
  getUsedByEntries,
  isAnimation,
  isCharacter,
  isLevelComposition,
  isMap,
  isRawAsset,
  isSpriteSheet,
  isTileset,
} from "../domain/assetReferences";
import { getAssetStatus } from "../domain/assetStatuses";
import type {
  AssetDependencyEntry,
  AssetEntityType,
  EditorEntityRecord,
  EditorState,
  FolderRecord,
} from "../domain/editorTypes";
import type { EditorStore } from "../state/EditorStore";
import { createButton, createElement, clearElement } from "../shared/dom";
import { formatAssetTypeLabel, formatBytes, formatTimestamp } from "../shared/formatters";
import type { EditorTranslator } from "../i18n/EditorTranslator";

export class AssetDetailsPanel {
  private readonly header = createElement("div", "detail-header");
  private readonly heading = createElement("div", "detail-heading");
  private readonly title = createElement("h3", "detail-title");
  private readonly type = createElement("p", "detail-type");
  private readonly statusCluster = createElement("div", "detail-status-cluster");
  private readonly tabBar = createElement("div", "detail-tabbar");
  private readonly overviewTab = createTabButton("", () => this.store.setDetailTab("overview"));
  private readonly usedByTab = createTabButton("", () => this.store.setDetailTab("used-by"));
  private readonly dependenciesTab = createTabButton("", () => this.store.setDetailTab("dependencies"));
  private readonly body = createElement("div", "detail-tab-body");
  private readonly actions = createElement("div", "detail-actions");
  private readonly previewCard = createElement("div", "detail-card");
  private readonly preview = createElement("img", "detail-preview") as HTMLImageElement;

  constructor(
    private readonly root: HTMLElement,
    private readonly store: EditorStore,
    private readonly translator: EditorTranslator,
  ) {
    this.heading.append(this.title, this.type);
    this.header.append(this.heading, this.statusCluster);
    this.tabBar.append(this.overviewTab, this.usedByTab, this.dependenciesTab);
    this.root.className = "editor-detail-panel";
    this.root.append(this.header, this.tabBar, this.body, this.actions);
  }

  update(state: EditorState): void {
    const asset = state.selectedAssetId ? this.store.getAssetById(state.selectedAssetId) : null;
    const folder = !asset && state.selectedFolderId ? this.store.getFolderById(state.selectedFolderId) : null;
    this.overviewTab.textContent = this.translator.t("editor.details.tabs.overview");
    this.usedByTab.textContent = this.translator.t("editor.details.tabs.usedBy");
    this.dependenciesTab.textContent = this.translator.t("editor.details.tabs.dependencies");
    if (!asset && !folder) {
      this.header.hidden = true;
      this.tabBar.hidden = true;
      clearElement(this.actions);
      clearElement(this.body);
      this.body.append(
        createEmptyState(
          this.translator.t("editor.details.emptyTitle"),
          this.translator.t("editor.details.emptyBody"),
        ),
      );
      return;
    }

    this.header.hidden = false;
    this.tabBar.hidden = Boolean(folder);

    if (folder) {
      this.title.textContent = folder.name;
      this.type.textContent = this.translator.t("editor.details.folderType");
      clearElement(this.statusCluster);
      clearElement(this.body);
      const itemCount = countFolderItems(folder, state);
      const allowedActions = describeFolderActions(folder, this.translator);
      const list = createElement("dl", "detail-metadata");
      list.append(
        createElement("dt", "detail-term", this.translator.t("editor.details.metadata.name")),
        createElement("dd", "detail-value", folder.name),
        createElement("dt", "detail-term", this.translator.t("editor.details.metadata.root")),
        createElement("dd", "detail-value", folder.storageRoot),
        createElement("dt", "detail-term", this.translator.t("editor.details.metadata.relativePath")),
        createElement("dd", "detail-value", folder.relativePath || "/"),
        createElement("dt", "detail-term", this.translator.t("editor.details.metadata.items")),
        createElement("dd", "detail-value", `${itemCount}`),
        createElement("dt", "detail-term", this.translator.t("editor.details.metadata.allowedActions")),
        createElement("dd", "detail-value", allowedActions),
      );
      this.body.append(list);
      clearElement(this.actions);
      if (!folder.system && folder.storageRoot === "user") {
        const renameButton = createButton(this.translator.t("editor.details.actions.renameFolder"), "secondary-button");
        renameButton.addEventListener("click", async () => {
          const rawName = window.prompt(this.translator.t("editor.explorer.newFolderPrompt"), folder.name);
          if (!rawName) {
            return;
          }

          const name = rawName.trim();
          if (!name || name === folder.name) {
            return;
          }

          await this.store.renameFolder(folder, name);
        });

        const archiveToggle = createButton(this.translator.t("editor.details.actions.archive"), "secondary-button");
        archiveToggle.addEventListener("click", async () => {
          await this.store.archiveFolder(folder);
        });
        this.actions.append(renameButton);
        this.actions.append(archiveToggle);
      }
      return;
    }

    if (!asset) {
      return;
    }

    this.title.textContent = asset.name;
    this.type.textContent = getDetailTypeLabel(asset, this.translator);
    syncStatusCluster(this.statusCluster, getAssetStatus(asset, state.snapshot), this.translator);
    this.overviewTab.className = state.detailTab === "overview" ? "tab-button is-active" : "tab-button";
    this.usedByTab.className = state.detailTab === "used-by" ? "tab-button is-active" : "tab-button";
    this.dependenciesTab.className = state.detailTab === "dependencies" ? "tab-button is-active" : "tab-button";
    const previewUrl = resolvePreviewUrl(asset, state, this.store);
    if (previewUrl) {
      this.preview.src = previewUrl;
      this.preview.alt = asset.name;
      this.preview.hidden = false;
    } else {
      this.preview.hidden = true;
      this.preview.removeAttribute("src");
    }
    clearElement(this.previewCard);
    if (!this.preview.hidden) {
      this.previewCard.append(this.preview);
    }
    this.previewCard.append(createMetadataBlock(asset, state, this.translator));

    clearElement(this.body);
    if (state.detailTab === "overview") {
      this.body.append(this.previewCard);
    } else if (state.detailTab === "used-by") {
      this.body.append(buildDependencyTable(getUsedByEntries(asset, state.snapshot), this.store, this.translator));
    } else {
      this.body.append(buildDependencyTable(getDependencyEntries(asset, state.snapshot), this.store, this.translator));
    }

    clearElement(this.actions);
    appendAssetActions(this.actions, asset, state, this.store, this.translator);
  }
}

function buildDependencyTable(entries: AssetDependencyEntry[], store: EditorStore, translator: EditorTranslator): HTMLElement {
  if (entries.length === 0) {
    return createEmptyState(
      translator.t("editor.details.noEntriesTitle"),
      translator.t("editor.details.noEntriesBody"),
    );
  }

  const table = createElement("div", "detail-reference-table");
  entries.forEach((entry) => {
    const row = createElement("div", "detail-reference-row");
    const left = createElement("div", "detail-reference-copy");
    left.append(
      createElement("strong", "detail-reference-name", resolveDependencyName(entry, translator)),
      createElement("span", "detail-reference-meta", translator.formatDependencyMeta(entry.entityType, entry.status)),
    );
    row.append(left);

    if (entry.entityType !== "missing") {
      const button = createButton(translator.t("editor.details.select"), "ghost-button");
      button.addEventListener("click", () => {
        store.selectAsset(entry.id);
        store.setDetailTab("overview");
      });
      row.append(button);
    }

    table.append(row);
  });
  return table;
}

function appendAssetActions(
  container: HTMLElement,
  asset: EditorEntityRecord,
  state: EditorState,
  store: EditorStore,
  translator: EditorTranslator,
): void {
  const primaryAction = createPrimaryAction(asset, store, translator);
  if (primaryAction) {
    container.append(primaryAction);
  }

  if (isSpriteSheet(asset) && !asset.archivedAt) {
    const createAnimation = createButton(translator.t("editor.details.actions.createAnimation"), "secondary-button");
    createAnimation.addEventListener("click", () => store.navigate({ kind: "animation", id: asset.id }));
    container.append(createAnimation);
  }

  if (!asset.archivedAt) {
    const archiveToggle = createButton(translator.t("editor.details.actions.archive"), "secondary-button");
    archiveToggle.addEventListener("click", async () => {
      const usedByEntries = getUsedByEntries(asset, state.snapshot);
      if (usedByEntries.length > 0) {
        const lines = usedByEntries
          .map((entry) => `- ${entry.name} (${translator.formatEntityType(entry.entityType)})`)
          .join("\n");
        const accepted = window.confirm(translator.t("editor.details.archiveConfirm", { lines }));
        if (!accepted) {
          return;
        }
      }

      await store.archiveAsset(asset);
    });
    container.append(archiveToggle);
  }
}

function createPrimaryAction(asset: EditorEntityRecord, store: EditorStore, translator: EditorTranslator): HTMLButtonElement | null {
  if (isRawAsset(asset)) {
    if (asset.archivedAt) {
      return null;
    }

    if (asset.sourceKind === "image-source") {
      return null;
    }

    const label = asset.sourceKind === "tileset-source"
      ? translator.t("editor.details.actions.createTilesetMapping")
      : translator.t("editor.details.actions.createSpritesheetMapping");
    const route = asset.sourceKind === "tileset-source"
      ? { kind: "tileset" as const, id: asset.id }
      : { kind: "spritesheet" as const, id: asset.id };
    const button = createButton(label, "primary-button");
    button.addEventListener("click", () => store.navigate(route));
    return button;
  }

  if (isLevelComposition(asset)) {
    return null;
  }

  const button = createButton(
    translator.t("editor.details.actions.open", { assetType: assetRouteLabel(asset, translator) }),
    "primary-button",
  );
  button.addEventListener("click", () => {
    store.navigate({ kind: assetRouteKind(asset), id: asset.id });
  });
  return button;
}

function createMetadataBlock(asset: EditorEntityRecord, state: EditorState, translator: EditorTranslator): HTMLElement {
  const list = createElement("dl", "detail-metadata");
  const append = (label: string, value: string): void => {
    list.append(createElement("dt", "detail-term", label), createElement("dd", "detail-value", value));
  };

  append(translator.t("editor.details.metadata.name"), asset.name);
  append(translator.t("editor.details.metadata.created"), formatTimestamp(asset.createdAt, translator));
  append(translator.t("editor.details.metadata.updated"), formatTimestamp(asset.updatedAt, translator));
  append(translator.t("editor.details.metadata.archived"), formatTimestamp(asset.archivedAt, translator));

  if (isRawAsset(asset)) {
    append(translator.t("editor.details.metadata.originalFile"), asset.originalFilename);
    append(translator.t("editor.details.metadata.dimensions"), `${asset.width}x${asset.height}`);
    append(translator.t("editor.details.metadata.size"), formatBytes(asset.sizeBytes, translator));
    append(
      translator.t("editor.details.metadata.sourceKind"),
      asset.sourceKind === "tileset-source"
        ? translator.t("editor.library.modal.tilesetSource")
        : asset.sourceKind === "image-source"
          ? translator.t("editor.assetTypes.rawImagePng")
          : translator.t("editor.library.modal.spritesheetSource"),
    );
  } else if (isTileset(asset)) {
    append(translator.t("editor.details.metadata.tiles"), `${asset.tiles.length}`);
    append(translator.t("editor.details.metadata.cell"), `${asset.cellWidth}x${asset.cellHeight}`);
    append(translator.t("editor.details.metadata.offset"), `${asset.offsetX}, ${asset.offsetY}`);
  } else if (isSpriteSheet(asset)) {
    append(translator.t("editor.details.metadata.frames"), `${asset.frames.length}`);
    append(translator.t("editor.details.metadata.cell"), `${asset.cellWidth}x${asset.cellHeight}`);
    append(translator.t("editor.details.metadata.offset"), `${asset.offsetX}, ${asset.offsetY}`);
  } else if (isAnimation(asset)) {
    append(translator.t("editor.details.metadata.frames"), `${asset.frameIds.length}`);
    append(translator.t("editor.details.metadata.frameMs"), `${asset.frameDurationMs}`);
    append(translator.t("editor.details.metadata.loop"), asset.loop ? translator.t("editor.common.yes") : translator.t("editor.common.no"));
  } else if (isCharacter(asset)) {
    append(translator.t("editor.details.metadata.idle"), asset.idleAnimationId);
    append(translator.t("editor.details.metadata.run"), asset.runSideAnimationId ?? translator.t("editor.common.idleFallback"));
    append(translator.t("editor.details.metadata.jump"), asset.jumpAnimationId ?? translator.t("editor.common.idleFallback"));
    append(translator.t("editor.details.metadata.attack"), asset.attackAnimationId ?? translator.t("editor.common.idleFallback"));
  } else if (isMap(asset)) {
    append(translator.t("editor.details.metadata.grid"), `${asset.widthInCells}x${asset.heightInCells}`);
    append(translator.t("editor.details.metadata.tile"), `${asset.tileWidth}x${asset.tileHeight}`);
    append(
      translator.t("editor.details.metadata.fitMode"),
      translator.t(`editor.workspace.map.fitModes.${asset.tileFitMode}`),
    );
    append(translator.t("editor.details.metadata.cells"), `${asset.cells.length}`);
    append(translator.t("editor.details.metadata.collisionCells"), `${asset.collisionCells.length}`);
  } else {
    append(translator.t("editor.details.metadata.pickups"), `${asset.placements.length}`);
  }

  const dependencies = getDependencyEntries(asset, state.snapshot);
  append(translator.t("editor.details.metadata.dependencies"), `${dependencies.length}`);
  return list;
}

function syncStatusCluster(cluster: HTMLElement, status: ReturnType<typeof getAssetStatus>, translator: EditorTranslator): void {
  clearElement(cluster);
  if (status === "archived") {
    cluster.append(createBadge(translator.t("editor.statuses.archived"), "badge-archived"));
  } else if (status === "uses-archived-dependencies") {
    cluster.append(createBadge(translator.t("editor.statuses.uses-archived-dependencies"), "badge-warning"));
  } else if (status === "missing-dependencies") {
    cluster.append(createBadge(translator.t("editor.statuses.missing-dependencies"), "badge-danger"));
  } else {
    cluster.append(createBadge(translator.t("editor.statuses.active"), "badge-active"));
  }
}

function createBadge(label: string, className: string): HTMLElement {
  return createElement("span", `status-badge ${className}`, label);
}

function createTabButton(label: string, onClick: () => void): HTMLButtonElement {
  const button = createButton(label, "tab-button");
  button.addEventListener("click", onClick);
  return button;
}

function createEmptyState(title: string, body: string): HTMLElement {
  const element = createElement("div", "empty-state");
  element.append(createElement("strong", "empty-title", title), createElement("p", "empty-copy", body));
  return element;
}

function getDetailTypeLabel(asset: EditorEntityRecord, translator: EditorTranslator): string {
  if (isRawAsset(asset)) {
    return formatAssetTypeLabel("raw-asset", translator, asset.sourceKind);
  }
  if (isTileset(asset)) {
    return formatAssetTypeLabel("tileset", translator);
  }
  if (isSpriteSheet(asset)) {
    return formatAssetTypeLabel("spritesheet", translator);
  }
  if (isAnimation(asset)) {
    return formatAssetTypeLabel("animation", translator);
  }
  if (isCharacter(asset)) {
    return formatAssetTypeLabel("character", translator);
  }
  if (isLevelComposition(asset)) {
    return formatAssetTypeLabel("level", translator);
  }
  return formatAssetTypeLabel("map", translator);
}

function assetRouteKind(asset: EditorEntityRecord): "tileset" | "spritesheet" | "animation" | "character" | "map" {
  if (isTileset(asset)) {
    return "tileset";
  }
  if (isSpriteSheet(asset)) {
    return "spritesheet";
  }
  if (isAnimation(asset)) {
    return "animation";
  }
  if (isCharacter(asset)) {
    return "character";
  }
  return "map";
}

function assetRouteLabel(asset: EditorEntityRecord, translator: EditorTranslator): string {
  return translator.formatEntityType(assetRouteKind(asset) as AssetEntityType);
}

function resolveDependencyName(entry: AssetDependencyEntry, translator: EditorTranslator): string {
  if (entry.status !== "missing") {
    return entry.name;
  }

  switch (entry.name) {
    case "rawAssetMissing":
      return translator.t("editor.references.rawAssetMissing");
    case "spritesheetMissing":
      return translator.t("editor.references.spritesheetMissing");
    case "idleAnimationMissing":
      return translator.t("editor.references.idleAnimationMissing");
    case "runAnimationMissing":
      return translator.t("editor.references.runAnimationMissing");
    case "jumpAnimationMissing":
      return translator.t("editor.references.jumpAnimationMissing");
    case "attackAnimationMissing":
      return translator.t("editor.references.attackAnimationMissing");
    case "tilesetMissing":
      return translator.t("editor.references.tilesetMissing");
    default:
      return entry.name;
  }
}

function resolvePreviewUrl(asset: EditorEntityRecord, state: EditorState, store: EditorStore): string | null {
  const rawAssetId = getSourceRawAssetId(asset, state.snapshot);
  if (!rawAssetId) {
    return null;
  }
  return store.getRawAssetUrl(rawAssetId);
}

function countFolderItems(folder: FolderRecord, state: EditorState): number {
  const childFolderCount = state.snapshot.folders.filter((entry) => entry.parentFolderId === folder.id).length;
  const childAssetCount = [
    ...state.snapshot.rawAssets,
    ...state.snapshot.tilesets,
    ...state.snapshot.spritesheets,
    ...state.snapshot.animations,
    ...state.snapshot.characters,
    ...state.snapshot.maps,
    ...state.snapshot.levelCompositions,
  ].filter((entry) => entry.folderId === folder.id).length;
  return childFolderCount + childAssetCount;
}

function describeFolderActions(folder: FolderRecord, translator: EditorTranslator): string {
  if (folder.storageRoot !== "user") {
    return translator.t("editor.details.folderActions.browse");
  }

  if (folder.system) {
    return [
      translator.t("editor.details.folderActions.importPng"),
      translator.t("editor.details.folderActions.createFolder"),
    ].join(", ");
  }

  return [
    translator.t("editor.details.folderActions.importPng"),
    translator.t("editor.details.folderActions.createFolder"),
    translator.t("editor.details.folderActions.renameFolder"),
    translator.t("editor.details.folderActions.archiveFolder"),
  ].join(", ");
}
