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
  EditorEntityRecord,
  EditorState,
  FolderRecord,
} from "../domain/editorTypes";
import type { EditorStore } from "../state/EditorStore";
import { clearElement, createButton, createElement } from "../shared/dom";
import { formatAssetTypeLabel, formatBytes, formatTimestamp } from "../shared/formatters";
import { openAssetSelection } from "../shared/openAssetSelection";
import type { EditorTranslator } from "../i18n/EditorTranslator";
import type { WorkspacePropertiesContributor } from "./WorkspacePropertiesContributor";
import { createIcon, type EditorIconName } from "../shared/icons";

export class PropertiesPanel {
  private readonly header = createElement("div", "properties-header");
  private readonly metaRow = createElement("div", "properties-meta-row");
  private readonly metaCopy = createElement("div", "properties-meta-copy");
  private readonly metaActions = createElement("div", "properties-meta-actions");
  private readonly label = createElement("p", "properties-panel-label");
  private readonly type = createElement("p", "properties-type");
  private readonly titleRow = createElement("div", "properties-title-row");
  private readonly title = createElement("h3", "properties-title");
  private readonly statusCluster = createElement("div", "properties-status-cluster");
  private readonly archiveButton = createButton("", "properties-header-icon");
  private readonly archiveButtonIcon = createIcon("archive");
  private readonly tabBar = createElement("div", "properties-tabbar");
  private readonly propertiesTab = createTabButton("", () => this.store.setPropertiesTab("properties"));
  private readonly tilesTab = createTabButton("", () => this.store.setPropertiesTab("tiles"));
  private readonly usedByTab = createTabButton("", () => this.store.setPropertiesTab("used-by"));
  private readonly dependenciesTab = createTabButton("", () => this.store.setPropertiesTab("dependencies"));
  private readonly body = createElement("div", "properties-tab-body");
  private readonly actions = createElement("div", "properties-actions");

  constructor(
    private readonly root: HTMLElement,
    private readonly store: EditorStore,
    private readonly translator: EditorTranslator,
  ) {
    this.archiveButton.append(this.archiveButtonIcon);
    this.archiveButton.dataset.testid = "properties-archive-button";
    this.metaCopy.append(this.label, this.type);
    this.metaActions.append(this.statusCluster, this.archiveButton);
    this.metaRow.append(this.metaCopy, this.metaActions);
    this.titleRow.append(this.title);
    this.header.append(this.metaRow, this.titleRow);
    this.tabBar.append(this.propertiesTab, this.tilesTab, this.usedByTab, this.dependenciesTab);
    this.root.className = "editor-properties-panel";
    this.root.dataset.testid = "editor-properties-panel";
    this.root.append(this.header, this.tabBar, this.body, this.actions);
  }

  update(state: EditorState, contributor: WorkspacePropertiesContributor | null): void {
    const asset = state.selectedAssetId ? this.store.getAssetById(state.selectedAssetId) : null;
    const folder = !asset && state.selectedFolderId ? this.store.getFolderById(state.selectedFolderId) : null;
    const isActiveAssetRoute = asset
      && state.route.kind !== "library"
      && state.route.id === asset.id;
    const supportsTilesTab = Boolean(asset && isMap(asset) && contributor?.renderTiles && isActiveAssetRoute);
    const activeTab = state.propertiesTab === "tiles" && !supportsTilesTab ? "properties" : state.propertiesTab;

    this.label.textContent = this.translator.t("editor.properties.panelLabel");
    this.propertiesTab.textContent = this.translator.t("editor.properties.tabs.properties");
    this.tilesTab.textContent = this.translator.t("editor.properties.tabs.tiles");
    this.usedByTab.textContent = this.translator.t("editor.properties.tabs.usedBy");
    this.dependenciesTab.textContent = this.translator.t("editor.properties.tabs.dependencies");
    this.archiveButton.title = this.translator.t("editor.details.actions.archive");
    this.archiveButton.setAttribute("aria-label", this.translator.t("editor.details.actions.archive"));

    if (!asset && !folder) {
      this.header.hidden = true;
      this.tabBar.hidden = true;
      this.tilesTab.hidden = true;
      this.archiveButton.hidden = true;
      clearElement(this.actions);
      this.actions.hidden = true;
      clearElement(this.body);
      this.body.append(
        createEmptyState(
          this.translator.t("editor.properties.emptyTitle"),
          this.translator.t("editor.properties.emptyBody"),
        ),
      );
      return;
    }

    this.header.hidden = false;
    this.tabBar.hidden = Boolean(folder);

    if (folder) {
      this.title.textContent = folder.name;
      this.type.textContent = this.translator.t("editor.properties.folderType");
      clearElement(this.statusCluster);
      this.configureFolderHeaderActions(folder);
      clearElement(this.body);

      const overview = createPropertiesSection(this.translator.t("editor.properties.sections.overview"));
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
      overview.append(list);
      this.body.append(overview);

      clearElement(this.actions);
      this.actions.hidden = true;
      return;
    }

    if (!asset) {
      return;
    }

    this.title.textContent = asset.name;
    this.type.textContent = getAssetTypeLabel(asset, this.translator);
    syncStatusCluster(this.statusCluster, getAssetStatus(asset, state.snapshot), this.translator);
    this.tilesTab.hidden = !supportsTilesTab;
    this.propertiesTab.className = activeTab === "properties" ? "tab-button is-active" : "tab-button";
    this.tilesTab.className = activeTab === "tiles" ? "tab-button is-active" : "tab-button";
    this.usedByTab.className = activeTab === "used-by" ? "tab-button is-active" : "tab-button";
    this.dependenciesTab.className = activeTab === "dependencies" ? "tab-button is-active" : "tab-button";
    this.configureHeaderActions(asset, state);

    clearElement(this.body);
    if (activeTab === "properties") {
      const overview = createPropertiesSection(this.translator.t("editor.properties.sections.overview"));
      overview.append(createMetadataBlock(asset, state, this.translator));
      this.body.append(overview);

      if (contributor && isActiveAssetRoute) {
        const editorSection = createPropertiesSection(this.translator.t("editor.properties.sections.editor"));
        contributor.renderProperties(editorSection);
        if (editorSection.childElementCount > 1) {
          this.body.append(editorSection);
        }
      }
    } else if (activeTab === "tiles") {
      const tilesSection = createElement("section", "properties-section properties-section-tiles");
      contributor?.renderTiles?.(tilesSection);
      this.body.append(tilesSection);
    } else if (activeTab === "used-by") {
      this.body.append(buildDependencyTable(getUsedByEntries(asset, state.snapshot), this.store, this.translator));
    } else {
      this.body.append(buildDependencyTable(getDependencyEntries(asset, state.snapshot), this.store, this.translator));
    }

    clearElement(this.actions);
    appendAssetActions(this.actions, asset, this.store, this.translator);
    this.actions.hidden = this.actions.childElementCount === 0;
  }

  private configureHeaderActions(asset: EditorEntityRecord, state: EditorState): void {
    this.archiveButton.hidden = false;
    this.archiveButton.onclick = null;
    const archived = Boolean(asset.archivedAt);
    this.setArchiveButtonIcon(archived ? "restore" : "archive");
    this.archiveButton.title = archived
      ? this.translator.t("editor.details.actions.unarchive")
      : this.translator.t("editor.details.actions.archive");
    this.archiveButton.setAttribute("aria-label", this.archiveButton.title);
    this.archiveButton.onclick = async () => {
      if (!asset.archivedAt) {
        const usedByEntries = getUsedByEntries(asset, state.snapshot);
        if (usedByEntries.length > 0) {
          const lines = usedByEntries
            .map((entry) => `- ${entry.name} (${this.translator.formatEntityType(entry.entityType)})`)
            .join("\n");
          const accepted = window.confirm(this.translator.t("editor.details.archiveConfirm", { lines }));
          if (!accepted) {
            return;
          }
        }

        await this.store.archiveAsset(asset);
        return;
      }

      await this.store.unarchiveAsset(asset);
    };
  }

  private configureFolderHeaderActions(folder: FolderRecord): void {
    const archivable = !folder.system && folder.storageRoot !== "core";
    this.archiveButton.hidden = !archivable;
    this.archiveButton.onclick = null;
    if (!archivable) {
      return;
    }

    const archived = folder.storageRoot === "archived";
    this.setArchiveButtonIcon(archived ? "restore" : "archive");
    this.archiveButton.title = archived
      ? this.translator.t("editor.details.actions.unarchive")
      : this.translator.t("editor.details.actions.archive");
    this.archiveButton.setAttribute("aria-label", this.archiveButton.title);
    this.archiveButton.onclick = async () => {
      if (archived) {
        await this.store.unarchiveFolder(folder);
        return;
      }

      await this.store.archiveFolder(folder);
    };
  }

  private setArchiveButtonIcon(iconName: EditorIconName): void {
    this.archiveButtonIcon.dataset.iconName = iconName;
    this.archiveButtonIcon.innerHTML = createIcon(iconName).innerHTML;
  }
}

function buildDependencyTable(entries: AssetDependencyEntry[], store: EditorStore, translator: EditorTranslator): HTMLElement {
  if (entries.length === 0) {
    return createEmptyState(
      translator.t("editor.properties.noEntriesTitle"),
      translator.t("editor.properties.noEntriesBody"),
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
      const button = createButton(translator.t("editor.properties.select"), "ghost-button");
      button.addEventListener("click", () => {
        openAssetSelection(store, entry.id);
        store.setPropertiesTab("properties");
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
  store: EditorStore,
  translator: EditorTranslator,
): void {
  const primaryAction = createPrimaryAction(asset, store, translator);
  if (primaryAction) {
    container.append(primaryAction);
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

  if (isLevelComposition(asset) || isMap(asset)) {
    return null;
  }

  return null;
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

function createPropertiesSection(title: string): HTMLElement {
  const section = createElement("section", "properties-section");
  section.append(createElement("h4", "properties-section-title", title));
  return section;
}

function getAssetTypeLabel(asset: EditorEntityRecord, translator: EditorTranslator): string {
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

export function resolvePreviewUrl(asset: EditorEntityRecord, state: EditorState, store: EditorStore): string | null {
  const rawAssetId = getSourceRawAssetId(asset, state.snapshot);
  if (!rawAssetId) {
    return null;
  }
  return store.getRawAssetUrl(rawAssetId);
}
