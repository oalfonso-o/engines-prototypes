import { isMap } from "../../domain/assetReferences";
import { createEditorId } from "../../domain/editorIds";
import { buildUniqueAssetName } from "../../domain/editorValidators";
import type {
  CollisionCellRecord,
  MapCellRecord,
  MapDefinition,
  TilesetDefinition,
  TileFitMode,
} from "../../domain/editorTypes";
import type { EditorStore } from "../../state/EditorStore";
import { clearElement, createButton, createElement } from "../../shared/dom";
import { createSelectFieldController, createTextFieldController } from "../../shared/formControls";
import { erasePaintCell, setPaintCell, sortRowMajor, toggleCollisionCell } from "./CollisionPaintController";
import { MapPalettePanel } from "./MapPalettePanel";
import type { EditorTranslator } from "../../i18n/EditorTranslator";
import { buildRelativeFilePath, joinRelativePath } from "../../storage/pathNaming";

interface ResolvedMapTile {
  x: number;
  y: number;
  textureKey: string;
  rect: { x: number; y: number; width: number; height: number };
}

export class MapEditorWorkspace {
  private readonly root = createElement("section", "workspace-screen");
  private readonly emptyStateHost = createElement("div");
  private readonly header = createElement("div", "workspace-header");
  private readonly copy = createElement("div", "workspace-copy");
  private readonly title = createElement("h2", "workspace-title");
  private readonly subtitle = createElement("p", "workspace-subtitle");
  private readonly body = createElement("div", "workspace-body map-workspace");
  private readonly paletteHost = createElement("div", "workspace-sidebar");
  private readonly controls = createElement("div", "workspace-sidebar");
  private readonly previewCard = createElement("div", "workspace-preview-card");
  private readonly previewHost = createElement("div", "workspace-preview");
  private readonly palettePanel: MapPalettePanel;
  private readonly nameField = createTextFieldController("", {
    onChange: (value) => {
      this.name = value;
      if (!this.readOnly) {
        this.render();
      }
    },
  });
  private readonly widthField = createTextFieldController("", {
    onChange: (value) => {
      this.widthInCells = value;
      if (!this.readOnly) {
        this.render();
      }
    },
  });
  private readonly heightField = createTextFieldController("", {
    onChange: (value) => {
      this.heightInCells = value;
      if (!this.readOnly) {
        this.render();
      }
    },
  });
  private readonly tileWidthField = createTextFieldController("", {
    onChange: (value) => {
      this.tileWidth = value;
      if (!this.readOnly) {
        this.render();
      }
    },
  });
  private readonly tileHeightField = createTextFieldController("", {
    onChange: (value) => {
      this.tileHeight = value;
      if (!this.readOnly) {
        this.render();
      }
    },
  });
  private readonly fitModeField = createSelectFieldController("", (value) => {
    this.tileFitMode = value as TileFitMode;
    this.render();
  });
  private readonly toolBar = createElement("div", "workspace-button-row");
  private readonly toolButtons: Record<"paint" | "erase" | "collision", HTMLButtonElement> = {
    paint: createButton("", "tab-button"),
    erase: createButton("", "tab-button"),
    collision: createButton("", "tab-button"),
  };
  private readonly saveButton = createButton("", "primary-button");
  private readonly backButton = createButton("", "secondary-button");
  private destroyPreview: (() => void) | null = null;
  private readonly existingMap: MapDefinition | null;
  private readonly readOnly: boolean;
  private name: string;
  private widthInCells: string;
  private heightInCells: string;
  private tileWidth: string;
  private tileHeight: string;
  private tileFitMode: TileFitMode;
  private cells: MapCellRecord[];
  private collisionCells: CollisionCellRecord[];
  private selectedTilesetId: string | null;
  private selectedTileId: string | null;
  private activeTool: "paint" | "erase" | "collision" = "paint";

  constructor(
    private readonly container: HTMLElement,
    private readonly store: EditorStore,
    private readonly translator: EditorTranslator,
    routeId: string,
  ) {
    this.palettePanel = new MapPalettePanel(this.paletteHost, this.translator);
    const asset = this.store.getAssetById(routeId);
    const activeTilesets = this.getActiveTilesets();
    const firstTile = activeTilesets[0]?.tiles[0] ?? null;

    if (asset && isMap(asset)) {
      this.existingMap = asset;
      this.readOnly = true;
      this.name = asset.name;
      this.widthInCells = String(asset.widthInCells);
      this.heightInCells = String(asset.heightInCells);
      this.tileWidth = String(asset.tileWidth);
      this.tileHeight = String(asset.tileHeight);
      this.tileFitMode = asset.tileFitMode;
      this.cells = [...asset.cells];
      this.collisionCells = [...asset.collisionCells];
      this.selectedTilesetId = asset.cells[0]?.tilesetId ?? activeTilesets[0]?.id ?? null;
      this.selectedTileId = asset.cells[0]?.tileId ?? firstTile?.id ?? null;
    } else if (routeId === "new") {
      this.existingMap = null;
      this.readOnly = false;
      this.name = buildUniqueAssetName("map", this.store.getAllAssets());
      this.widthInCells = "24";
      this.heightInCells = "14";
      this.tileWidth = String(firstTile?.rect.width ?? 16);
      this.tileHeight = String(firstTile?.rect.height ?? 16);
      this.tileFitMode = "crop";
      this.cells = [];
      this.collisionCells = [];
      this.selectedTilesetId = activeTilesets[0]?.id ?? null;
      this.selectedTileId = firstTile?.id ?? null;
    } else {
      this.existingMap = null;
      this.readOnly = true;
      this.name = "";
      this.widthInCells = "24";
      this.heightInCells = "14";
      this.tileWidth = "16";
      this.tileHeight = "16";
      this.tileFitMode = "crop";
      this.cells = [];
      this.collisionCells = [];
      this.selectedTilesetId = activeTilesets[0]?.id ?? null;
      this.selectedTileId = firstTile?.id ?? null;
    }

    this.syncSelection();
    this.buildShell();
    this.container.append(this.root);
    this.render();
  }

  destroy(): void {
    this.destroyGame();
    this.palettePanel.destroy();
    clearElement(this.container);
  }

  private buildShell(): void {
    this.copy.append(this.title, this.subtitle);
    this.header.append(this.copy);

    (["paint", "erase", "collision"] as const).forEach((tool) => {
      this.toolButtons[tool].addEventListener("click", () => {
        this.activeTool = tool;
        this.render();
      });
      this.toolBar.append(this.toolButtons[tool]);
    });

    this.saveButton.addEventListener("click", async () => {
      const error = this.validate();
      if (error) {
        window.alert(error);
        return;
      }
      const now = new Date().toISOString();
      const width = Number.parseInt(this.widthInCells, 10);
      const height = Number.parseInt(this.heightInCells, 10);
      const definition: MapDefinition = {
        id: createEditorId(),
        name: this.name.trim(),
        storageRoot: "user",
        folderId: this.getPrimaryTileset()?.folderId ?? null,
        relativePath: joinRelativePath(
          this.store.getFolderById(this.getPrimaryTileset()?.folderId ?? "")?.relativePath ?? "",
          buildRelativeFilePath(this.name.trim(), ".json"),
        ),
        widthInCells: width,
        heightInCells: height,
        tileWidth: Number.parseInt(this.tileWidth, 10),
        tileHeight: Number.parseInt(this.tileHeight, 10),
        tileFitMode: this.tileFitMode,
        cells: sortRowMajor(this.cells.filter((cell) => cell.x < width && cell.y < height)),
        collisionCells: sortRowMajor(this.collisionCells.filter((cell) => cell.x < width && cell.y < height)),
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      await this.store.saveMap(definition);
      this.store.setLibraryTab("game");
      this.store.selectAsset(definition.id);
      this.store.navigate({ kind: "map", id: definition.id });
    });
    this.backButton.addEventListener("click", () => this.store.navigate({ kind: "library" }));

    this.previewCard.append(this.previewHost);
    this.controls.append(
      this.nameField.field,
      this.widthField.field,
      this.heightField.field,
      this.tileWidthField.field,
      this.tileHeightField.field,
      this.fitModeField.field,
      this.toolBar,
      this.saveButton,
      this.backButton,
    );
    this.body.append(this.paletteHost, this.controls, this.previewCard);
    this.root.append(this.emptyStateHost, this.header, this.body);
  }

  private render(): void {
    this.destroyGame();
    this.syncSelection();

    if (!this.readOnly && this.getActiveTilesets().length === 0) {
      this.header.hidden = true;
      this.body.hidden = true;
      clearElement(this.emptyStateHost);
      this.emptyStateHost.append(
        createEmptyState(
          this.translator.t("editor.workspace.map.noTilesetsTitle"),
          this.translator.t("editor.workspace.map.noTilesetsBody"),
        ),
      );
      return;
    }

    clearElement(this.emptyStateHost);
    this.header.hidden = false;
    this.body.hidden = false;
    this.nameField.label.textContent = this.translator.t("editor.workspace.map.labels.name");
    this.widthField.label.textContent = this.translator.t("editor.workspace.map.labels.widthInCells");
    this.heightField.label.textContent = this.translator.t("editor.workspace.map.labels.heightInCells");
    this.tileWidthField.label.textContent = this.translator.t("editor.workspace.map.labels.tileWidth");
    this.tileHeightField.label.textContent = this.translator.t("editor.workspace.map.labels.tileHeight");
    this.fitModeField.label.textContent = this.translator.t("editor.workspace.map.labels.tileFitMode");
    this.toolButtons.paint.textContent = this.translator.t("editor.workspace.map.tools.paint");
    this.toolButtons.erase.textContent = this.translator.t("editor.workspace.map.tools.erase");
    this.toolButtons.collision.textContent = this.translator.t("editor.workspace.map.tools.collision");
    this.saveButton.textContent = this.translator.t("editor.workspace.map.save");
    this.backButton.textContent = this.translator.t("editor.common.backToLibrary");
    this.title.textContent = this.readOnly
      ? this.existingMap?.name ?? this.translator.t("editor.workspace.map.titleReadOnly")
      : this.translator.t("editor.workspace.map.titleCreate");
    this.subtitle.textContent = this.readOnly
      ? this.translator.t("editor.workspace.map.subtitleReadOnly")
      : this.translator.t("editor.workspace.map.subtitleCreate");
    this.nameField.sync(this.name, this.readOnly);
    this.widthField.sync(this.widthInCells, this.readOnly);
    this.heightField.sync(this.heightInCells, this.readOnly);
    this.tileWidthField.sync(this.tileWidth, this.readOnly);
    this.tileHeightField.sync(this.tileHeight, this.readOnly);
    this.fitModeField.sync(
      [
        { label: this.translator.t("editor.workspace.map.fitModes.crop"), value: "crop" },
        { label: this.translator.t("editor.workspace.map.fitModes.scaleToFit"), value: "scale-to-fit" },
      ],
      this.tileFitMode,
      this.readOnly,
    );

    (["paint", "erase", "collision"] as const).forEach((tool) => {
      this.toolButtons[tool].className = this.activeTool === tool ? "tab-button is-active" : "tab-button";
      this.toolButtons[tool].disabled = this.readOnly;
    });
    this.saveButton.hidden = this.readOnly;
    this.backButton.hidden = !this.readOnly;

    this.palettePanel.update({
      tilesets: this.readOnly ? this.store.getState().snapshot.tilesets : this.getActiveTilesets(),
      selectedTilesetId: this.selectedTilesetId,
      selectedTileId: this.selectedTileId,
      readOnly: this.readOnly,
      rawUrlResolver: (rawAssetId: string) => this.store.getRawAssetUrl(rawAssetId),
      onSelectTileset: (tilesetId: string) => {
        this.selectedTilesetId = tilesetId;
        this.selectedTileId = this.getSelectedTileset()?.tiles[0]?.id ?? null;
        this.render();
      },
      onSelectTile: (tileId: string) => {
        this.selectedTileId = tileId;
        this.render();
      },
    });

    clearElement(this.previewCard);
    this.previewCard.append(this.previewHost);
    const dimensions = this.parseDimensions();
    if (!dimensions) {
      this.previewCard.append(
        createEmptyState(
          this.translator.t("editor.workspace.map.invalidDimensionsTitle"),
          this.translator.t("editor.workspace.map.invalidDimensionsBody"),
        ),
      );
      return;
    }

    this.destroyPreview = mountMapPreview({
      container: this.previewHost,
      widthInCells: dimensions.widthInCells,
      heightInCells: dimensions.heightInCells,
      tileWidth: dimensions.tileWidth,
      tileHeight: dimensions.tileHeight,
      tileFitMode: this.tileFitMode,
      tiles: this.resolvePlacedTiles(dimensions.widthInCells, dimensions.heightInCells),
      collisionCells: this.collisionCells.filter((cell) => cell.x < dimensions.widthInCells && cell.y < dimensions.heightInCells),
      readOnly: this.readOnly,
      onCellClick: (x, y) => {
        if (this.readOnly) {
          return;
        }
        this.applyTool(x, y);
        this.render();
      },
    });
  }

  private getActiveTilesets(): TilesetDefinition[] {
    return this.store.getState().snapshot.tilesets.filter((entry) => !entry.archivedAt);
  }

  private getSelectedTileset(): TilesetDefinition | null {
    const tilesets = this.readOnly ? this.store.getState().snapshot.tilesets : this.getActiveTilesets();
    return tilesets.find((entry) => entry.id === this.selectedTilesetId) ?? tilesets[0] ?? null;
  }

  private syncSelection(): void {
    const selectedTileset = this.getSelectedTileset();
    if (!selectedTileset) {
      this.selectedTilesetId = null;
      this.selectedTileId = null;
      return;
    }
    this.selectedTilesetId = selectedTileset.id;
    const selectedTile = selectedTileset.tiles.find((tile) => tile.id === this.selectedTileId) ?? selectedTileset.tiles[0] ?? null;
    this.selectedTileId = selectedTile?.id ?? null;
  }

  private applyTool(x: number, y: number): void {
    if (this.activeTool === "paint") {
      if (!this.selectedTilesetId || !this.selectedTileId) {
        return;
      }
      this.cells = setPaintCell(this.cells, x, y, this.selectedTilesetId, this.selectedTileId);
      return;
    }

    if (this.activeTool === "erase") {
      this.cells = erasePaintCell(this.cells, x, y);
      return;
    }

    this.collisionCells = toggleCollisionCell(this.collisionCells, x, y);
  }

  private resolvePlacedTiles(maxWidth: number, maxHeight: number): ResolvedMapTile[] {
    const tilesets = this.store.getState().snapshot.tilesets;
    return this.cells
      .filter((cell) => cell.x < maxWidth && cell.y < maxHeight)
      .flatMap((cell) => {
        const tileset = tilesets.find((entry) => entry.id === cell.tilesetId);
        if (!tileset) {
          return [];
        }
        const tile = tileset.tiles.find((entry) => entry.id === cell.tileId);
        if (!tile) {
          return [];
        }
        const textureUrl = this.store.getRawAssetUrl(tileset.sourceAssetId);
        if (!textureUrl) {
          return [];
        }
        return [{
          x: cell.x,
          y: cell.y,
          textureKey: `${tileset.sourceAssetId}:${textureUrl}`,
          rect: tile.rect,
        }];
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
      !Number.isInteger(widthInCells) ||
      !Number.isInteger(heightInCells) ||
      !Number.isInteger(tileWidth) ||
      !Number.isInteger(tileHeight) ||
      widthInCells <= 0 ||
      heightInCells <= 0 ||
      tileWidth <= 0 ||
      tileHeight <= 0
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
    if (this.store.isAssetNameTaken(this.name.trim())) {
      return this.translator.t("editor.validation.duplicateMapName");
    }
    const widthError = this.translator.validatePositiveInteger(
      this.widthInCells,
      this.translator.t("editor.workspace.map.labels.widthInCells"),
    );
    if (widthError) {
      return widthError;
    }
    const heightError = this.translator.validatePositiveInteger(
      this.heightInCells,
      this.translator.t("editor.workspace.map.labels.heightInCells"),
    );
    if (heightError) {
      return heightError;
    }
    const tileWidthError = this.translator.validatePositiveInteger(
      this.tileWidth,
      this.translator.t("editor.workspace.map.labels.tileWidth"),
    );
    if (tileWidthError) {
      return tileWidthError;
    }
    const tileHeightError = this.translator.validatePositiveInteger(
      this.tileHeight,
      this.translator.t("editor.workspace.map.labels.tileHeight"),
    );
    if (tileHeightError) {
      return tileHeightError;
    }
    return null;
  }

  private destroyGame(): void {
    if (this.destroyPreview) {
      this.destroyPreview();
      this.destroyPreview = null;
    }
    clearElement(this.previewHost);
  }
  private getPrimaryTileset(): TilesetDefinition | null {
    const selected = this.selectedTilesetId
      ? this.store.getAssetById(this.selectedTilesetId)
      : null;
    if (selected && "tiles" in selected) {
      return selected;
    }

    return this.getActiveTilesets()[0] ?? null;
  }
}

interface MapPreviewOptions {
  container: HTMLElement;
  widthInCells: number;
  heightInCells: number;
  tileWidth: number;
  tileHeight: number;
  tileFitMode: TileFitMode;
  tiles: ResolvedMapTile[];
  collisionCells: CollisionCellRecord[];
  readOnly: boolean;
  onCellClick: (x: number, y: number) => void;
}

function mountMapPreview(options: MapPreviewOptions): () => void {
  const width = Math.max(620, options.container.clientWidth || 760);
  const height = 520;
  const mapPixelWidth = options.widthInCells * options.tileWidth;
  const mapPixelHeight = options.heightInCells * options.tileHeight;

  const textureSources = new Map<string, string>();
  options.tiles.forEach((tile) => {
    const [rawAssetId, url] = tile.textureKey.split(":");
    textureSources.set(rawAssetId, url);
  });

  const canvas = document.createElement("canvas");
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  options.container.replaceChildren(canvas);

  const context = canvas.getContext("2d");
  if (!context) {
    return () => {
      canvas.remove();
    };
  }

  context.scale(dpr, dpr);
  context.imageSmoothingEnabled = false;
  const images = new Map<string, HTMLImageElement>();
  let disposed = false;

  const render = (): void => {
    if (disposed) {
      return;
    }

    const scale = Math.min((width - 32) / mapPixelWidth, (height - 32) / mapPixelHeight, 2.2);
    const drawWidth = mapPixelWidth * scale;
    const drawHeight = mapPixelHeight * scale;
    const offsetX = Math.round((width - drawWidth) / 2);
    const offsetY = Math.round((height - drawHeight) / 2);

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#08101b";
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "#2a3556";
    context.strokeRect(6, 6, width - 12, height - 12);
    context.fillStyle = "#19253f";
    context.fillRect(offsetX, offsetY, drawWidth, drawHeight);
    context.strokeStyle = "#334a71";
    context.strokeRect(offsetX, offsetY, drawWidth, drawHeight);

    options.tiles.forEach((tile) => {
      const rawAssetId = tile.textureKey.split(":")[0];
      const image = images.get(rawAssetId);
      if (!image) {
        return;
      }

      const destinationX = offsetX + tile.x * options.tileWidth * scale;
      const destinationY = offsetY + tile.y * options.tileHeight * scale;

      if (options.tileFitMode === "scale-to-fit") {
        context.drawImage(
          image,
          tile.rect.x,
          tile.rect.y,
          tile.rect.width,
          tile.rect.height,
          destinationX,
          destinationY,
          options.tileWidth * scale,
          options.tileHeight * scale,
        );
        return;
      }

      const drawCellWidth = Math.min(tile.rect.width, options.tileWidth);
      const drawCellHeight = Math.min(tile.rect.height, options.tileHeight);
      context.drawImage(
        image,
        tile.rect.x,
        tile.rect.y,
        drawCellWidth,
        drawCellHeight,
        destinationX,
        destinationY,
        drawCellWidth * scale,
        drawCellHeight * scale,
      );
    });

    context.strokeStyle = "rgba(111, 136, 173, 0.35)";
    context.lineWidth = 1;
    for (let x = 0; x <= options.widthInCells; x += 1) {
      const px = offsetX + x * options.tileWidth * scale;
      context.beginPath();
      context.moveTo(px, offsetY);
      context.lineTo(px, offsetY + drawHeight);
      context.stroke();
    }
    for (let y = 0; y <= options.heightInCells; y += 1) {
      const py = offsetY + y * options.tileHeight * scale;
      context.beginPath();
      context.moveTo(offsetX, py);
      context.lineTo(offsetX + drawWidth, py);
      context.stroke();
    }

    context.fillStyle = "rgba(255, 111, 168, 0.14)";
    context.strokeStyle = "rgba(255, 111, 168, 0.9)";
    context.lineWidth = 2;
    options.collisionCells.forEach((cell) => {
      const x = offsetX + cell.x * options.tileWidth * scale;
      const y = offsetY + cell.y * options.tileHeight * scale;
      context.fillRect(x, y, options.tileWidth * scale, options.tileHeight * scale);
      context.strokeRect(x, y, options.tileWidth * scale, options.tileHeight * scale);
    });
  };

  textureSources.forEach((url, key) => {
    const image = new Image();
    images.set(key, image);
    image.onload = render;
    image.src = url;
  });

  const handleClick = (event: MouseEvent): void => {
    if (options.readOnly) {
      return;
    }

    const scale = Math.min((width - 32) / mapPixelWidth, (height - 32) / mapPixelHeight, 2.2);
    const drawWidth = mapPixelWidth * scale;
    const drawHeight = mapPixelHeight * scale;
    const offsetX = Math.round((width - drawWidth) / 2);
    const offsetY = Math.round((height - drawHeight) / 2);
    const rect = canvas.getBoundingClientRect();
    const localX = event.clientX - rect.left - offsetX;
    const localY = event.clientY - rect.top - offsetY;
    if (localX < 0 || localY < 0 || localX >= drawWidth || localY >= drawHeight) {
      return;
    }
    const cellX = Math.floor(localX / (options.tileWidth * scale));
    const cellY = Math.floor(localY / (options.tileHeight * scale));
    options.onCellClick(cellX, cellY);
  };

  if (!options.readOnly) {
    canvas.addEventListener("click", handleClick);
  }

  render();

  return () => {
    disposed = true;
    canvas.removeEventListener("click", handleClick);
    canvas.remove();
  };
}

function createEmptyState(title: string, body: string): HTMLElement {
  const card = createElement("div", "empty-state");
  card.append(createElement("strong", "empty-title", title), createElement("p", "empty-copy", body));
  return card;
}
