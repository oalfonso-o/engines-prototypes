import { isScene } from "../../domain/assetReferences";
import { createEditorId } from "../../domain/editorIds";
import { buildUniqueAssetName } from "../../domain/editorValidators";
import type {
  CollisionCellRecord,
  SceneDefinition,
  SceneLayerRecord,
  SceneTileLayerRecord,
  TilesetDefinition,
  TileFitMode,
} from "../../domain/editorTypes";
import { ROOT_FOLDER_IDS } from "../../content/coreAssetManifest";
import type { WorkspacePropertiesContributor } from "../../properties/WorkspacePropertiesContributor";
import type { EditorStore } from "../../state/EditorStore";
import { clearElement, createButton, createElement } from "../../shared/dom";
import { createTextFieldController } from "../../shared/formControls";
import { buildRelativeFilePath, joinRelativePath } from "../../storage/pathNaming";
import type { EditorTranslator } from "../../i18n/EditorTranslator";
import {
  mountScenePreview,
  type ResolvedSceneTile,
  type ScenePreviewMarker,
  type ScenePreviewZone,
} from "./scenePreview";

export class SceneWorkspace implements WorkspacePropertiesContributor {
  private readonly root = createElement("section", "workspace-screen scene-workspace-screen");
  private readonly emptyStateHost = createElement("div");
  private readonly body = createElement("div", "workspace-body scene-workspace");
  private readonly previewHost = createElement("div", "workspace-preview scene-preview");
  private readonly controls = createElement("div", "scene-properties-grid");
  private readonly layersSection = createElement("section", "scene-layers-section");
  private readonly layersList = createElement("div", "scene-layer-list");
  private readonly actions = createElement("div", "workspace-button-row scene-workspace-actions");
  private readonly nameField = createTextFieldController("", {
    onChange: (value) => {
      this.name = value;
      this.render();
    },
  });
  private readonly widthField = createTextFieldController("", {
    onChange: (value) => {
      this.widthInCells = value;
      this.render();
    },
  });
  private readonly heightField = createTextFieldController("", {
    onChange: (value) => {
      this.heightInCells = value;
      this.render();
    },
  });
  private readonly tileWidthField = createTextFieldController("", {
    onChange: (value) => {
      this.tileWidth = value;
      this.render();
    },
  });
  private readonly tileHeightField = createTextFieldController("", {
    onChange: (value) => {
      this.tileHeight = value;
      this.render();
    },
  });
  private readonly saveButton = createButton("", "primary-button");
  private destroyPreview: (() => void) | null = null;
  private readonly routeId: string;
  private readonly editable: boolean;
  private readonly existingSceneId: string | null;
  private readonly createdAt: string | null;
  private readonly existingRelativePath: string | null;
  private readonly existingFolderId: string | null;
  private readonly defaultPlayerCharacterId: string | null;
  private readonly tileFitMode: TileFitMode;
  private name: string;
  private widthInCells: string;
  private heightInCells: string;
  private tileWidth: string;
  private tileHeight: string;
  private layers: SceneLayerRecord[];

  constructor(
    private readonly container: HTMLElement,
    private readonly store: EditorStore,
    private readonly translator: EditorTranslator,
    routeId: string,
  ) {
    this.routeId = routeId;
    const asset = this.store.getAssetById(routeId);
    const scene = asset && isScene(asset) ? asset : null;
    this.root.dataset.testid = "scene-workspace";
    this.previewHost.dataset.testid = "scene-preview";

    if (scene) {
      this.editable = scene.storageRoot === "user" && !scene.archivedAt;
      this.existingSceneId = scene.id;
      this.createdAt = scene.createdAt;
      this.existingRelativePath = scene.relativePath;
      this.existingFolderId = scene.folderId;
      this.defaultPlayerCharacterId = scene.defaultPlayerCharacterId;
      this.tileFitMode = scene.tileFitMode;
      this.name = scene.name;
      this.widthInCells = String(scene.widthInCells);
      this.heightInCells = String(scene.heightInCells);
      this.tileWidth = String(scene.tileWidth);
      this.tileHeight = String(scene.tileHeight);
      this.layers = cloneLayers(scene.layers);
    } else if (routeId === "new") {
      this.editable = true;
      this.existingSceneId = null;
      this.createdAt = null;
      this.existingRelativePath = null;
      this.existingFolderId = null;
      this.defaultPlayerCharacterId = null;
      this.tileFitMode = "crop";
      this.name = buildUniqueAssetName("scene", this.store.getAllAssets());
      this.widthInCells = "24";
      this.heightInCells = "14";
      this.tileWidth = "32";
      this.tileHeight = "32";
      this.layers = createDefaultLayers();
    } else {
      this.editable = false;
      this.existingSceneId = null;
      this.createdAt = null;
      this.existingRelativePath = null;
      this.existingFolderId = null;
      this.defaultPlayerCharacterId = null;
      this.tileFitMode = "crop";
      this.name = "";
      this.widthInCells = "24";
      this.heightInCells = "14";
      this.tileWidth = "32";
      this.tileHeight = "32";
      this.layers = createDefaultLayers();
    }

    this.saveButton.dataset.testid = "scene-save-button";
    this.saveButton.addEventListener("click", async () => {
      const error = this.validate();
      if (error) {
        window.alert(error);
        return;
      }

      const targetFolder = this.resolveTargetFolderId();
      if (!targetFolder) {
        return;
      }

      const now = new Date().toISOString();
      const definition: SceneDefinition = {
        id: this.existingSceneId ?? createEditorId(),
        name: this.name.trim(),
        storageRoot: "user",
        folderId: targetFolder,
        relativePath: this.existingRelativePath ?? joinRelativePath(
          this.store.getFolderById(targetFolder)?.relativePath ?? "",
          buildRelativeFilePath(this.name.trim(), ".json"),
        ),
        widthInCells: Number.parseInt(this.widthInCells, 10),
        heightInCells: Number.parseInt(this.heightInCells, 10),
        tileWidth: Number.parseInt(this.tileWidth, 10),
        tileHeight: Number.parseInt(this.tileHeight, 10),
        tileFitMode: this.tileFitMode,
        defaultPlayerCharacterId: this.defaultPlayerCharacterId,
        layers: cloneLayers(this.layers),
        archivedAt: null,
        createdAt: this.createdAt ?? now,
        updatedAt: now,
      };

      await this.store.saveScene(definition);
      this.store.setLibraryTab("game");
      this.store.selectAsset(definition.id);
      this.store.navigate({ kind: "scene", id: definition.id });
    });

    this.controls.append(
      this.nameField.field,
      this.widthField.field,
      this.heightField.field,
      this.tileWidthField.field,
      this.tileHeightField.field,
    );
    this.actions.append(this.saveButton);
    this.layersSection.append(createElement("h5", "scene-section-title"), this.layersList);
    this.body.append(this.previewHost);
    this.root.append(this.emptyStateHost, this.body);
    this.container.append(this.root);
    this.render();
  }

  update(): void {
    this.render();
  }

  destroy(): void {
    this.destroyCanvas();
    clearElement(this.container);
  }

  renderProperties(container: HTMLElement): void {
    container.append(this.controls, this.layersSection, this.actions);
  }

  private render(): void {
    this.destroyCanvas();
    clearElement(this.emptyStateHost);

    if (!this.existingSceneId && this.routeId !== "new") {
      this.body.hidden = true;
      this.emptyStateHost.append(
        createEmptyState(
          this.translator.t("editor.workspace.scene.unavailableTitle"),
          this.translator.t("editor.workspace.scene.unavailableBody"),
        ),
      );
      return;
    }

    this.body.hidden = false;
    this.nameField.label.textContent = this.translator.t("editor.workspace.scene.labels.name");
    this.widthField.label.textContent = this.translator.t("editor.workspace.scene.labels.widthInCells");
    this.heightField.label.textContent = this.translator.t("editor.workspace.scene.labels.heightInCells");
    this.tileWidthField.label.textContent = this.translator.t("editor.workspace.scene.labels.tileWidth");
    this.tileHeightField.label.textContent = this.translator.t("editor.workspace.scene.labels.tileHeight");
    this.saveButton.textContent = this.translator.t("editor.workspace.scene.save");
    this.nameField.sync(this.name, !this.editable);
    this.widthField.sync(this.widthInCells, !this.editable);
    this.heightField.sync(this.heightInCells, !this.editable);
    this.tileWidthField.sync(this.tileWidth, !this.editable);
    this.tileHeightField.sync(this.tileHeight, !this.editable);
    this.saveButton.hidden = !this.editable;
    this.layersSection.querySelector(".scene-section-title")!.textContent = this.translator.t("editor.workspace.scene.sections.layers");

    const layerRows = this.layers.map((layer) => {
      const row = createElement("div", "scene-layer-row");
      const label = createElement("div", "scene-layer-copy");
      label.append(
        createElement("strong", "scene-layer-name", layer.name),
        createElement("span", "scene-layer-meta", describeLayer(layer, this.translator)),
      );
      row.append(label);
      return row;
    });
    this.layersList.replaceChildren(...layerRows);

    const dimensions = this.parseDimensions();
    if (!dimensions) {
      this.emptyStateHost.append(
        createEmptyState(
          this.translator.t("editor.workspace.scene.invalidDimensionsTitle"),
          this.translator.t("editor.workspace.scene.invalidDimensionsBody"),
        ),
      );
      this.body.hidden = true;
      return;
    }

    this.body.hidden = false;
    this.destroyPreview = mountScenePreview({
      container: this.previewHost,
      widthInCells: dimensions.widthInCells,
      heightInCells: dimensions.heightInCells,
      tileWidth: dimensions.tileWidth,
      tileHeight: dimensions.tileHeight,
      tileFitMode: this.tileFitMode,
      tiles: resolvePlacedTiles(this.layers, this.store.getState().snapshot.tilesets, this.store),
      collisionCells: resolveCollisionCells(this.layers),
      markers: resolveMarkers(this.layers),
      zones: resolveZones(this.layers),
    });
  }

  private parseDimensions():
    | { widthInCells: number; heightInCells: number; tileWidth: number; tileHeight: number }
    | null {
    const widthInCells = Number.parseInt(this.widthInCells, 10);
    const heightInCells = Number.parseInt(this.heightInCells, 10);
    const tileWidth = Number.parseInt(this.tileWidth, 10);
    const tileHeight = Number.parseInt(this.tileHeight, 10);
    if (
      !Number.isInteger(widthInCells)
      || !Number.isInteger(heightInCells)
      || !Number.isInteger(tileWidth)
      || !Number.isInteger(tileHeight)
      || widthInCells <= 0
      || heightInCells <= 0
      || tileWidth <= 0
      || tileHeight <= 0
    ) {
      return null;
    }

    return { widthInCells, heightInCells, tileWidth, tileHeight };
  }

  private validate(): string | null {
    const nameError = this.translator.validateRequiredName(this.name);
    if (nameError) {
      return nameError;
    }
    if (this.store.isAssetNameTaken(this.name.trim(), this.existingSceneId ?? undefined)) {
      return this.translator.t("editor.validation.duplicateSceneName");
    }
    const widthError = this.translator.validatePositiveInteger(
      this.widthInCells,
      this.translator.t("editor.workspace.scene.labels.widthInCells"),
    );
    if (widthError) {
      return widthError;
    }
    const heightError = this.translator.validatePositiveInteger(
      this.heightInCells,
      this.translator.t("editor.workspace.scene.labels.heightInCells"),
    );
    if (heightError) {
      return heightError;
    }
    const tileWidthError = this.translator.validatePositiveInteger(
      this.tileWidth,
      this.translator.t("editor.workspace.scene.labels.tileWidth"),
    );
    if (tileWidthError) {
      return tileWidthError;
    }
    const tileHeightError = this.translator.validatePositiveInteger(
      this.tileHeight,
      this.translator.t("editor.workspace.scene.labels.tileHeight"),
    );
    if (tileHeightError) {
      return tileHeightError;
    }
    return null;
  }

  private resolveTargetFolderId(): string | null {
    if (this.existingFolderId) {
      return this.existingFolderId;
    }

    const state = this.store.getState();
    const selectedFolder = state.selectedFolderId ? this.store.getFolderById(state.selectedFolderId) : null;
    if (selectedFolder?.storageRoot === "user") {
      return selectedFolder.id;
    }

    const selectedAsset = state.selectedAssetId ? this.store.getAssetById(state.selectedAssetId) : null;
    if (selectedAsset?.storageRoot === "user") {
      return selectedAsset.folderId ?? ROOT_FOLDER_IDS.user;
    }

    return ROOT_FOLDER_IDS.user;
  }

  private destroyCanvas(): void {
    if (this.destroyPreview) {
      this.destroyPreview();
      this.destroyPreview = null;
    }
    clearElement(this.previewHost);
  }
}

function cloneLayers(layers: SceneLayerRecord[]): SceneLayerRecord[] {
  return JSON.parse(JSON.stringify(layers)) as SceneLayerRecord[];
}

function createDefaultLayers(): SceneLayerRecord[] {
  return [
    {
      id: "layer-terrain",
      name: "Terrain",
      kind: "tiles",
      visible: true,
      locked: false,
      cells: [],
    },
    {
      id: "layer-solid",
      name: "Solid",
      kind: "collision",
      visible: true,
      locked: false,
      collisionKind: "solid",
      cells: [],
    },
    {
      id: "layer-objects",
      name: "Objects",
      kind: "objects",
      visible: true,
      locked: false,
      objects: [],
    },
  ];
}

function resolvePlacedTiles(
  layers: SceneLayerRecord[],
  tilesets: TilesetDefinition[],
  store: EditorStore,
): ResolvedSceneTile[] {
  return layers
    .filter((layer): layer is SceneTileLayerRecord => layer.kind === "tiles" && layer.visible)
    .flatMap((layer) => layer.cells)
    .flatMap((cell) => {
      const tileset = tilesets.find((entry) => entry.id === cell.tilesetId);
      if (!tileset) {
        return [];
      }

      const tile = tileset.tiles.find((entry) => entry.id === cell.tileId);
      if (!tile) {
        return [];
      }

      const textureUrl = store.getRawAssetUrl(tileset.sourceAssetId);
      if (!textureUrl) {
        return [];
      }

      return [{
        x: cell.x,
        y: cell.y,
        textureId: tileset.sourceAssetId,
        textureUrl,
        rect: tile.rect,
      }];
    });
}

function resolveCollisionCells(layers: SceneLayerRecord[]): CollisionCellRecord[] {
  return layers
    .filter((layer): layer is Extract<SceneLayerRecord, { kind: "collision" }> => layer.kind === "collision" && layer.visible)
    .flatMap((layer) => layer.cells);
}

function resolveMarkers(layers: SceneLayerRecord[]): ScenePreviewMarker[] {
  return layers
    .filter((layer): layer is Extract<SceneLayerRecord, { kind: "objects" }> => layer.kind === "objects" && layer.visible)
    .flatMap((layer) => layer.objects)
    .flatMap((object) => {
      switch (object.type) {
        case "player-spawn":
          return [{ x: object.x, y: object.y, color: "#5ed18b", label: "Spawn", radius: 7 }];
        case "entry-point":
          return [{ x: object.x, y: object.y, color: "#72d4ff", label: object.name || "Entry", radius: 6 }];
        case "pickup":
          return [{ x: object.x, y: object.y, color: "#f1ad5a", radius: 5 }];
        case "enemy-spawn":
          return [{ x: object.x, y: object.y, color: "#ff8c69", radius: 6 }];
        case "boss-spawn":
          return [{ x: object.x, y: object.y, color: "#ff6fa8", radius: 7 }];
        case "prop":
          return [{ x: object.x, y: object.y, color: "#b7c5d9", radius: 4 }];
        case "trigger-zone":
          return [];
      }
    });
}

function resolveZones(layers: SceneLayerRecord[]): ScenePreviewZone[] {
  return layers
    .filter((layer): layer is Extract<SceneLayerRecord, { kind: "objects" }> => layer.kind === "objects" && layer.visible)
    .flatMap((layer) => layer.objects)
    .flatMap((object) => {
      if (object.type !== "trigger-zone") {
        return [];
      }

      return [{
        x: object.x,
        y: object.y,
        width: object.width,
        height: object.height,
        color: "#ff6fa8",
        label: "Trigger",
      }];
    });
}

function describeLayer(layer: SceneLayerRecord, translator: EditorTranslator): string {
  if (layer.kind === "tiles") {
    return translator.t("editor.workspace.scene.layerMeta.tiles", { count: layer.cells.length });
  }
  if (layer.kind === "collision") {
    return translator.t("editor.workspace.scene.layerMeta.collision", {
      collisionKind: layer.collisionKind,
      count: layer.cells.length,
    });
  }
  if (layer.kind === "objects") {
    return translator.t("editor.workspace.scene.layerMeta.objects", { count: layer.objects.length });
  }
  return translator.t("editor.workspace.scene.layerMeta.background");
}

function createEmptyState(title: string, body: string): HTMLElement {
  const card = createElement("div", "empty-state");
  card.append(createElement("strong", "empty-title", title), createElement("p", "empty-copy", body));
  return card;
}
