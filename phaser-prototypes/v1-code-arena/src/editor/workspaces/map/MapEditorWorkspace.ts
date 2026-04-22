import Phaser from "phaser";
import { isMap } from "../../domain/assetReferences";
import { createEditorId } from "../../domain/editorIds";
import { buildUniqueAssetName, validatePositiveInteger, validateRequiredName } from "../../domain/editorValidators";
import type {
  CollisionCellRecord,
  MapCellRecord,
  MapDefinition,
  TilesetDefinition,
  TileFitMode,
} from "../../domain/editorTypes";
import type { EditorStore } from "../../state/EditorStore";
import { clearElement, createButton, createElement } from "../../shared/dom";
import { erasePaintCell, setPaintCell, sortRowMajor, toggleCollisionCell } from "./CollisionPaintController";
import { MapPalettePanel } from "./MapPalettePanel";

interface ResolvedMapTile {
  x: number;
  y: number;
  textureKey: string;
  rect: { x: number; y: number; width: number; height: number };
}

export class MapEditorWorkspace {
  private readonly root = createElement("section", "workspace-screen");
  private readonly paletteHost = createElement("div", "workspace-sidebar");
  private readonly previewHost = createElement("div", "workspace-preview");
  private readonly palettePanel = new MapPalettePanel(this.paletteHost);
  private game: Phaser.Game | null = null;
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
    routeId: string,
  ) {
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
    this.container.append(this.root);
    this.render();
  }

  destroy(): void {
    this.destroyGame();
    this.palettePanel.destroy();
    clearElement(this.container);
  }

  private render(): void {
    this.destroyGame();
    clearElement(this.root);
    this.syncSelection();

    if (!this.readOnly && this.getActiveTilesets().length === 0) {
      this.root.append(createEmptyState("No tilesets available", "Necesitas al menos un tileset activo y mapeado para crear un mapa."));
      return;
    }

    const header = createElement("div", "workspace-header");
    const copy = createElement("div", "workspace-copy");
    copy.append(
      createElement("h2", "workspace-title", this.readOnly ? this.existingMap?.name ?? "Map" : "Create map"),
      createElement(
        "p",
        "workspace-subtitle",
        this.readOnly
          ? "Read only. El preview omite referencias faltantes sin romper el render."
          : "Paint reemplaza el tile visual de la celda. Erase solo borra la capa visual. Collision alterna la celda de colisión.",
      ),
    );
    header.append(copy);

    const body = createElement("div", "workspace-body map-workspace");
    const previewCard = createElement("div", "workspace-preview-card");
    previewCard.append(this.previewHost);

    const form = createElement("div", "workspace-sidebar");
    form.append(
      buildTextField("Name", this.name, this.readOnly, (value) => {
        this.name = value;
      }, () => this.render()),
      buildTextField("Width in cells", this.widthInCells, this.readOnly, (value) => {
        this.widthInCells = value;
      }, () => this.render()),
      buildTextField("Height in cells", this.heightInCells, this.readOnly, (value) => {
        this.heightInCells = value;
      }, () => this.render()),
      buildTextField("Tile width", this.tileWidth, this.readOnly, (value) => {
        this.tileWidth = value;
      }, () => this.render()),
      buildTextField("Tile height", this.tileHeight, this.readOnly, (value) => {
        this.tileHeight = value;
      }, () => this.render()),
    );

    const fitModeField = createElement("label", "form-field");
    fitModeField.append(createElement("span", "form-label", "Tile fit mode"));
    const fitModeSelect = createElement("select", "text-input") as HTMLSelectElement;
    fitModeSelect.disabled = this.readOnly;
    fitModeSelect.append(new Option("crop", "crop"), new Option("scale-to-fit", "scale-to-fit"));
    fitModeSelect.value = this.tileFitMode;
    fitModeSelect.addEventListener("change", () => {
      this.tileFitMode = fitModeSelect.value as TileFitMode;
      this.render();
    });
    fitModeField.append(fitModeSelect);
    form.append(fitModeField);

    const toolBar = createElement("div", "workspace-button-row");
    (["paint", "erase", "collision"] as const).forEach((tool) => {
      const button = createButton(
        tool.charAt(0).toUpperCase() + tool.slice(1),
        this.activeTool === tool ? "tab-button is-active" : "tab-button",
      );
      button.disabled = this.readOnly;
      button.addEventListener("click", () => {
        this.activeTool = tool;
        this.render();
      });
      toolBar.append(button);
    });
    form.append(toolBar);

    if (!this.readOnly) {
      const save = createButton("Save map", "primary-button");
      save.addEventListener("click", async () => {
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
      form.append(save);
    } else {
      const backButton = createButton("Back to library", "secondary-button");
      backButton.addEventListener("click", () => this.store.navigate({ kind: "library" }));
      form.append(backButton);
    }

    this.palettePanel.update({
      tilesets: this.readOnly ? this.store.getState().snapshot.tilesets : this.getActiveTilesets(),
      selectedTilesetId: this.selectedTilesetId,
      selectedTileId: this.selectedTileId,
      readOnly: this.readOnly,
      rawUrlResolver: (rawAssetId) => this.store.getRawAssetUrl(rawAssetId),
      onSelectTileset: (tilesetId) => {
        this.selectedTilesetId = tilesetId;
        this.selectedTileId = this.getSelectedTileset()?.tiles[0]?.id ?? null;
        this.render();
      },
      onSelectTile: (tileId) => {
        this.selectedTileId = tileId;
        this.render();
      },
    });

    body.append(this.paletteHost, form, previewCard);
    this.root.append(header, body);

    const dimensions = this.parseDimensions();
    if (!dimensions) {
      previewCard.append(createEmptyState("Invalid map dimensions", "Todos los tamaños del mapa deben ser enteros positivos."));
      return;
    }

    this.game = mountMapPreview({
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
    const nameError = validateRequiredName(this.name);
    if (nameError) {
      return nameError;
    }
    if (this.store.isAssetNameTaken(this.name.trim())) {
      return "El nombre del mapa ya existe.";
    }
    const widthError = validatePositiveInteger(this.widthInCells, "Width in cells");
    if (widthError) {
      return widthError;
    }
    const heightError = validatePositiveInteger(this.heightInCells, "Height in cells");
    if (heightError) {
      return heightError;
    }
    const tileWidthError = validatePositiveInteger(this.tileWidth, "Tile width");
    if (tileWidthError) {
      return tileWidthError;
    }
    const tileHeightError = validatePositiveInteger(this.tileHeight, "Tile height");
    if (tileHeightError) {
      return tileHeightError;
    }
    return null;
  }

  private destroyGame(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
    clearElement(this.previewHost);
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

function mountMapPreview(options: MapPreviewOptions): Phaser.Game {
  const width = Math.max(620, options.container.clientWidth || 760);
  const height = 520;
  const mapPixelWidth = options.widthInCells * options.tileWidth;
  const mapPixelHeight = options.heightInCells * options.tileHeight;

  const textureSources = new Map<string, string>();
  options.tiles.forEach((tile) => {
    const [rawAssetId, url] = tile.textureKey.split(":");
    textureSources.set(rawAssetId, url);
  });

  class MapScene extends Phaser.Scene {
    preload(): void {
      textureSources.forEach((url, key) => {
        this.load.image(key, url);
      });
    }

    create(): void {
      const scale = Math.min((width - 32) / mapPixelWidth, (height - 32) / mapPixelHeight, 2.2);
      const drawWidth = mapPixelWidth * scale;
      const drawHeight = mapPixelHeight * scale;
      const offsetX = Math.round((width - drawWidth) / 2);
      const offsetY = Math.round((height - drawHeight) / 2);

      this.add.rectangle(width / 2, height / 2, width - 12, height - 12, 0x0f1528, 1)
        .setStrokeStyle(1, 0x2a3556, 1);
      this.add.rectangle(offsetX + drawWidth / 2, offsetY + drawHeight / 2, drawWidth, drawHeight, 0x19253f, 1)
        .setStrokeStyle(1, 0x334a71, 1);

      options.tiles.forEach((tile) => {
        const rawAssetId = tile.textureKey.split(":")[0];
        if (!this.textures.exists(rawAssetId)) {
          return;
        }
        const image = this.add.image(
          offsetX + tile.x * options.tileWidth * scale,
          offsetY + tile.y * options.tileHeight * scale,
          rawAssetId,
        ).setOrigin(0, 0);

        image.setCrop(tile.rect.x, tile.rect.y, tile.rect.width, tile.rect.height);

        if (options.tileFitMode === "scale-to-fit") {
          image.setDisplaySize(options.tileWidth * scale, options.tileHeight * scale);
        } else {
          const drawCellWidth = Math.min(tile.rect.width, options.tileWidth);
          const drawCellHeight = Math.min(tile.rect.height, options.tileHeight);
          image.setCrop(tile.rect.x, tile.rect.y, drawCellWidth, drawCellHeight);
          image.setDisplaySize(drawCellWidth * scale, drawCellHeight * scale);
        }
      });

      const graphics = this.add.graphics();
      graphics.lineStyle(1, 0x6f88ad, 0.35);
      for (let x = 0; x <= options.widthInCells; x += 1) {
        const px = offsetX + x * options.tileWidth * scale;
        graphics.lineBetween(px, offsetY, px, offsetY + drawHeight);
      }
      for (let y = 0; y <= options.heightInCells; y += 1) {
        const py = offsetY + y * options.tileHeight * scale;
        graphics.lineBetween(offsetX, py, offsetX + drawWidth, py);
      }

      const collisionGraphics = this.add.graphics();
      collisionGraphics.lineStyle(2, 0xff6fa8, 0.9);
      collisionGraphics.fillStyle(0xff6fa8, 0.14);
      options.collisionCells.forEach((cell) => {
        const x = offsetX + cell.x * options.tileWidth * scale;
        const y = offsetY + cell.y * options.tileHeight * scale;
        collisionGraphics.fillRect(x, y, options.tileWidth * scale, options.tileHeight * scale);
        collisionGraphics.strokeRect(x, y, options.tileWidth * scale, options.tileHeight * scale);
      });

      if (options.readOnly) {
        return;
      }

      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        const localX = pointer.x - offsetX;
        const localY = pointer.y - offsetY;
        if (localX < 0 || localY < 0 || localX >= drawWidth || localY >= drawHeight) {
          return;
        }
        const cellX = Math.floor(localX / (options.tileWidth * scale));
        const cellY = Math.floor(localY / (options.tileHeight * scale));
        options.onCellClick(cellX, cellY);
      });
    }
  }

  return new Phaser.Game({
    type: Phaser.AUTO,
    width,
    height,
    parent: options.container,
    backgroundColor: "#08101b",
    render: {
      pixelArt: true,
      antialias: false,
    },
    scene: MapScene,
  });
}

function buildTextField(
  label: string,
  value: string,
  disabled: boolean,
  onChange: (value: string) => void,
  onRender: () => void,
): HTMLElement {
  const field = createElement("label", "form-field");
  field.append(createElement("span", "form-label", label));
  const input = createElement("input", "text-input") as HTMLInputElement;
  input.type = "text";
  input.value = value;
  input.disabled = disabled;
  input.addEventListener("change", () => {
    onChange(input.value);
    if (!disabled) {
      onRender();
    }
  });
  field.append(input);
  return field;
}

function createEmptyState(title: string, body: string): HTMLElement {
  const card = createElement("div", "empty-state");
  card.append(createElement("strong", "empty-title", title), createElement("p", "empty-copy", body));
  return card;
}
