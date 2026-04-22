import {
  getDependencyEntries,
  getSourceRawAssetId,
  getUsedByEntries,
  isAnimation,
  isCharacter,
  isRawAsset,
  isSpriteSheet,
  isTileset,
} from "../domain/assetReferences";
import { getAssetStatus } from "../domain/assetStatuses";
import type {
  AssetDependencyEntry,
  EditorEntityRecord,
  EditorState,
} from "../domain/editorTypes";
import type { EditorStore } from "../state/EditorStore";
import { createButton, createElement, clearElement } from "../shared/dom";
import { formatAssetTypeLabel, formatBytes, formatTimestamp } from "../shared/formatters";

export class AssetDetailsPanel {
  constructor(
    private readonly root: HTMLElement,
    private readonly store: EditorStore,
  ) {}

  update(state: EditorState): void {
    clearElement(this.root);
    this.root.className = "editor-detail-panel";

    const asset = state.selectedAssetId ? this.store.getAssetById(state.selectedAssetId) : null;
    if (!asset) {
      this.root.append(
        createEmptyState(
          "Selecciona un asset",
          "El panel de detalle te mostrará preview, dependencias y acciones del asset seleccionado.",
        ),
      );
      return;
    }

    const status = getAssetStatus(asset, state.snapshot);
    const header = createElement("div", "detail-header");
    const heading = createElement("div", "detail-heading");
    heading.append(
      createElement("h3", "detail-title", asset.name),
      createElement("p", "detail-type", getDetailTypeLabel(asset)),
    );
    header.append(heading, createStatusCluster(status));

    const previewUrl = resolvePreviewUrl(asset, state, this.store);
    const overviewCard = createElement("div", "detail-card");
    if (previewUrl) {
      const preview = createElement("img", "detail-preview") as HTMLImageElement;
      preview.src = previewUrl;
      preview.alt = asset.name;
      overviewCard.append(preview);
    }
    overviewCard.append(createMetadataBlock(asset, state));

    const tabBar = createElement("div", "detail-tabbar");
    tabBar.append(
      createTabButton("Overview", state.detailTab === "overview", () => this.store.setDetailTab("overview")),
      createTabButton("Used By", state.detailTab === "used-by", () => this.store.setDetailTab("used-by")),
      createTabButton(
        "Dependencies",
        state.detailTab === "dependencies",
        () => this.store.setDetailTab("dependencies"),
      ),
    );

    const body = createElement("div", "detail-tab-body");
    if (state.detailTab === "overview") {
      body.append(overviewCard);
    } else if (state.detailTab === "used-by") {
      body.append(buildDependencyTable(getUsedByEntries(asset, state.snapshot), this.store));
    } else {
      body.append(buildDependencyTable(getDependencyEntries(asset, state.snapshot), this.store));
    }

    const actions = createElement("div", "detail-actions");
    appendAssetActions(actions, asset, state, this.store);

    this.root.append(header, tabBar, body, actions);
  }
}

function buildDependencyTable(entries: AssetDependencyEntry[], store: EditorStore): HTMLElement {
  if (entries.length === 0) {
    return createEmptyState("Sin entradas", "No hay referencias directas en esta vista.");
  }

  const table = createElement("div", "detail-reference-table");
  entries.forEach((entry) => {
    const row = createElement("div", "detail-reference-row");
    const left = createElement("div", "detail-reference-copy");
    left.append(
      createElement("strong", "detail-reference-name", entry.name),
      createElement("span", "detail-reference-meta", `${entry.entityType} · ${entry.status}`),
    );
    row.append(left);

    if (entry.entityType !== "missing") {
      const button = createButton("Select", "ghost-button");
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
): void {
  const primaryAction = createPrimaryAction(asset, store);
  if (primaryAction) {
    container.append(primaryAction);
  }

  if (isSpriteSheet(asset) && !asset.archivedAt) {
    const createAnimation = createButton("Create animation", "secondary-button");
    createAnimation.addEventListener("click", () => store.navigate({ kind: "animation", id: asset.id }));
    container.append(createAnimation);
  }

  const archiveToggle = createButton(asset.archivedAt ? "Unarchive" : "Archive", "secondary-button");
  archiveToggle.addEventListener("click", async () => {
    if (asset.archivedAt) {
      await store.unarchiveAsset(asset);
      return;
    }

    const usedByEntries = getUsedByEntries(asset, state.snapshot);
    if (usedByEntries.length > 0) {
      const lines = usedByEntries.map((entry) => `- ${entry.name} (${entry.entityType})`).join("\n");
      const accepted = window.confirm(
        `Este asset está siendo usado por:\n${lines}\n\nSi lo archivas, esos assets seguirán existiendo pero quedarán marcados con warning. ¿Continuar?`,
      );
      if (!accepted) {
        return;
      }
    }

    await store.archiveAsset(asset);
  });
  container.append(archiveToggle);
}

function createPrimaryAction(asset: EditorEntityRecord, store: EditorStore): HTMLButtonElement | null {
  if (isRawAsset(asset)) {
    if (asset.archivedAt) {
      return null;
    }

    const label = asset.sourceKind === "tileset-source" ? "Create tileset mapping" : "Create spritesheet mapping";
    const route = asset.sourceKind === "tileset-source"
      ? { kind: "tileset" as const, id: asset.id }
      : { kind: "spritesheet" as const, id: asset.id };
    const button = createButton(label, "primary-button");
    button.addEventListener("click", () => store.navigate(route));
    return button;
  }

  const button = createButton(`Open ${assetRouteLabel(asset)}`, "primary-button");
  button.addEventListener("click", () => {
    store.navigate({ kind: assetRouteKind(asset), id: asset.id });
  });
  return button;
}

function createMetadataBlock(asset: EditorEntityRecord, state: EditorState): HTMLElement {
  const list = createElement("dl", "detail-metadata");
  const append = (label: string, value: string): void => {
    list.append(createElement("dt", "detail-term", label), createElement("dd", "detail-value", value));
  };

  append("Name", asset.name);
  append("Created", formatTimestamp(asset.createdAt));
  append("Updated", formatTimestamp(asset.updatedAt));
  append("Archived", formatTimestamp(asset.archivedAt));

  if (isRawAsset(asset)) {
    append("Original file", asset.originalFilename);
    append("Dimensions", `${asset.width}x${asset.height}`);
    append("Size", formatBytes(asset.sizeBytes));
    append("Source kind", asset.sourceKind);
  } else if (isTileset(asset)) {
    append("Tiles", `${asset.tiles.length}`);
    append("Cell", `${asset.cellWidth}x${asset.cellHeight}`);
    append("Offset", `${asset.offsetX}, ${asset.offsetY}`);
  } else if (isSpriteSheet(asset)) {
    append("Frames", `${asset.frames.length}`);
    append("Cell", `${asset.cellWidth}x${asset.cellHeight}`);
    append("Offset", `${asset.offsetX}, ${asset.offsetY}`);
  } else if (isAnimation(asset)) {
    append("Frames", `${asset.frameIds.length}`);
    append("Frame ms", `${asset.frameDurationMs}`);
    append("Loop", asset.loop ? "Yes" : "No");
  } else if (isCharacter(asset)) {
    append("Idle", asset.idleAnimationId);
    append("Run", asset.runSideAnimationId ?? "idle fallback");
    append("Jump", asset.jumpAnimationId ?? "idle fallback");
    append("Attack", asset.attackAnimationId ?? "idle fallback");
  } else {
    append("Grid", `${asset.widthInCells}x${asset.heightInCells}`);
    append("Tile", `${asset.tileWidth}x${asset.tileHeight}`);
    append("Fit mode", asset.tileFitMode);
    append("Cells", `${asset.cells.length}`);
    append("Collision cells", `${asset.collisionCells.length}`);
  }

  const dependencies = getDependencyEntries(asset, state.snapshot);
  append("Dependencies", `${dependencies.length}`);
  return list;
}

function createStatusCluster(status: ReturnType<typeof getAssetStatus>): HTMLElement {
  const cluster = createElement("div", "detail-status-cluster");
  if (status === "archived") {
    cluster.append(createBadge("Archived", "badge-archived"));
  } else if (status === "uses-archived-dependencies") {
    cluster.append(createBadge("Uses Archived", "badge-warning"));
  } else if (status === "missing-dependencies") {
    cluster.append(createBadge("Missing Dependencies", "badge-danger"));
  } else {
    cluster.append(createBadge("Active", "badge-active"));
  }
  return cluster;
}

function createBadge(label: string, className: string): HTMLElement {
  return createElement("span", `status-badge ${className}`, label);
}

function createTabButton(label: string, active: boolean, onClick: () => void): HTMLButtonElement {
  const button = createButton(label, active ? "tab-button is-active" : "tab-button");
  button.addEventListener("click", onClick);
  return button;
}

function createEmptyState(title: string, body: string): HTMLElement {
  const element = createElement("div", "empty-state");
  element.append(createElement("strong", "empty-title", title), createElement("p", "empty-copy", body));
  return element;
}

function getDetailTypeLabel(asset: EditorEntityRecord): string {
  if (isRawAsset(asset)) {
    return formatAssetTypeLabel("raw-asset", asset.sourceKind);
  }
  if (isTileset(asset)) {
    return formatAssetTypeLabel("tileset");
  }
  if (isSpriteSheet(asset)) {
    return formatAssetTypeLabel("spritesheet");
  }
  if (isAnimation(asset)) {
    return formatAssetTypeLabel("animation");
  }
  if (isCharacter(asset)) {
    return formatAssetTypeLabel("character");
  }
  return formatAssetTypeLabel("map");
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

function assetRouteLabel(asset: EditorEntityRecord): string {
  return assetRouteKind(asset);
}

function resolvePreviewUrl(asset: EditorEntityRecord, state: EditorState, store: EditorStore): string | null {
  const rawAssetId = getSourceRawAssetId(asset, state.snapshot);
  if (!rawAssetId) {
    return null;
  }
  return store.getRawAssetUrl(rawAssetId);
}
