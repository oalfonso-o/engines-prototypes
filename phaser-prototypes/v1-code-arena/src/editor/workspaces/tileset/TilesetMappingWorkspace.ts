import type Phaser from "phaser";
import { buildUniqueAssetName, validateNonNegativeInteger, validatePositiveInteger, validateRequiredName } from "../../domain/editorValidators";
import type { RawAssetRecord, TilesetDefinition } from "../../domain/editorTypes";
import type { EditorStore } from "../../state/EditorStore";
import { buildUniformGrid } from "../../shared/geometry";
import { clearElement, createButton, createElement } from "../../shared/dom";
import { buildTilesetDefinition } from "./tilesetSerializer";
import { mountTilesetGridPreview } from "./tilesetGrid";
import type { GridPreviewCell } from "./tilesetGrid";

export class TilesetMappingWorkspace {
  private readonly root = createElement("section", "workspace-screen");
  private game: Phaser.Game | null = null;
  private readonly sourceRawAsset: RawAssetRecord | null;
  private readonly existingTileset: TilesetDefinition | null;
  private readonly imageUrl: string | null;
  private readonly readOnly: boolean;
  private draftName: string;
  private cellWidth: string;
  private cellHeight: string;
  private offsetX: string;
  private offsetY: string;
  private cells: GridPreviewCell[] = [];
  private hasOverflow = false;

  constructor(
    private readonly container: HTMLElement,
    private readonly store: EditorStore,
    routeId: string,
  ) {
    const asset = this.store.getAssetById(routeId);
    if (asset && "tiles" in asset) {
      this.existingTileset = asset;
      this.sourceRawAsset = this.store.getState().snapshot.rawAssets.find((entry) => entry.id === asset.sourceAssetId) ?? null;
      this.imageUrl = this.sourceRawAsset ? this.store.getRawAssetUrl(this.sourceRawAsset.id) : null;
      this.readOnly = true;
      this.draftName = asset.name;
      this.cellWidth = String(asset.cellWidth);
      this.cellHeight = String(asset.cellHeight);
      this.offsetX = String(asset.offsetX);
      this.offsetY = String(asset.offsetY);
      this.cells = asset.tiles.map((tile) => ({ id: tile.id, rect: tile.rect, active: true }));
    } else if (asset && "sourceKind" in asset && asset.sourceKind === "tileset-source") {
      this.existingTileset = null;
      this.sourceRawAsset = asset;
      this.imageUrl = this.store.getRawAssetUrl(asset.id);
      this.readOnly = false;
      this.draftName = buildUniqueAssetName(`${asset.name}-tileset`, this.store.getAllAssets());
      this.cellWidth = String(Math.max(1, Math.min(16, asset.width)));
      this.cellHeight = String(Math.max(1, Math.min(16, asset.height)));
      this.offsetX = "0";
      this.offsetY = "0";
      this.generateGrid();
    } else {
      this.existingTileset = null;
      this.sourceRawAsset = null;
      this.imageUrl = null;
      this.readOnly = true;
      this.draftName = "";
      this.cellWidth = "16";
      this.cellHeight = "16";
      this.offsetX = "0";
      this.offsetY = "0";
    }

    this.container.append(this.root);
    this.render();
  }

  destroy(): void {
    this.destroyGame();
    clearElement(this.container);
  }

  private render(): void {
    this.destroyGame();
    clearElement(this.root);

    if (!this.sourceRawAsset) {
      this.root.append(createMessageCard("Tileset no disponible", "Abre un raw asset de tipo tileset o un tileset guardado."));
      return;
    }

    const header = createElement("div", "workspace-header");
    const copy = createElement("div", "workspace-copy");
    copy.append(
      createElement("h2", "workspace-title", this.readOnly ? this.existingTileset?.name ?? "Tileset" : "Create tileset mapping"),
      createElement(
        "p",
        "workspace-subtitle",
        this.readOnly
          ? `Read only. ${this.cells.length} tiles guardados desde ${this.sourceRawAsset.name}.`
          : `PNG source: ${this.sourceRawAsset.name}. Haz click en una celda para activarla o desactivarla.`,
      ),
    );
    header.append(copy);
    if (this.hasOverflow && !this.readOnly) {
      header.append(createElement("span", "status-badge badge-warning", "Overflow ignored"));
    }

    const body = createElement("div", "workspace-body");
    const controls = createElement("div", "workspace-sidebar");
    const previewCard = createElement("div", "workspace-preview-card");
    const previewHost = createElement("div", "workspace-preview");
    previewCard.append(previewHost);

    controls.append(
      this.buildTextField("Name", this.draftName, this.readOnly, (value) => {
        this.draftName = value;
      }),
      this.buildTextField("Cell width", this.cellWidth, this.readOnly, (value) => {
        this.cellWidth = value;
      }),
      this.buildTextField("Cell height", this.cellHeight, this.readOnly, (value) => {
        this.cellHeight = value;
      }),
      this.buildTextField("Offset X", this.offsetX, this.readOnly, (value) => {
        this.offsetX = value;
      }),
      this.buildTextField("Offset Y", this.offsetY, this.readOnly, (value) => {
        this.offsetY = value;
      }),
    );

    const summary = createElement("p", "workspace-summary", `${this.cells.filter((cell) => cell.active).length} active tiles`);
    controls.append(summary);

    if (!this.readOnly) {
      const generate = createButton("Generate grid", "secondary-button");
      generate.addEventListener("click", () => {
        this.generateGrid();
        this.render();
      });
      const save = createButton("Save tileset mapping", "primary-button");
      save.addEventListener("click", async () => {
        const error = this.validate();
        if (error) {
          window.alert(error);
          return;
        }
        if (!this.sourceRawAsset) {
          return;
        }

        const definition = buildTilesetDefinition({
          rawAsset: this.sourceRawAsset,
          name: this.draftName.trim(),
          cellWidth: Number.parseInt(this.cellWidth, 10),
          cellHeight: Number.parseInt(this.cellHeight, 10),
          offsetX: Number.parseInt(this.offsetX, 10),
          offsetY: Number.parseInt(this.offsetY, 10),
          cells: this.cells,
        });
        await this.store.saveTileset(definition);
        this.store.setLibraryTab("game");
        this.store.selectAsset(definition.id);
        this.store.navigate({ kind: "tileset", id: definition.id });
      });
      controls.append(generate, save);
    } else {
      const openLibrary = createButton("Back to library", "secondary-button");
      openLibrary.addEventListener("click", () => this.store.navigate({ kind: "library" }));
      controls.append(openLibrary);
    }

    body.append(controls, previewCard);
    this.root.append(header, body);

    if (this.imageUrl) {
      this.game = mountTilesetGridPreview({
        container: previewHost,
        imageUrl: this.imageUrl,
        imageWidth: this.sourceRawAsset.width,
        imageHeight: this.sourceRawAsset.height,
        cells: this.cells,
        readOnly: this.readOnly,
        activeStrokeColor: 0x9aff57,
        inactiveStrokeColor: 0x4b5b6d,
        fillColor: 0x79db39,
        onToggle: (cellId) => {
          if (this.readOnly) {
            return;
          }
          this.cells = this.cells.map((cell) => (cell.id === cellId ? { ...cell, active: !cell.active } : cell));
          this.render();
        },
      });
    } else {
      previewCard.append(createMessageCard("Sin preview", "No se pudo resolver el PNG fuente de este tileset."));
    }
  }

  private buildTextField(
    label: string,
    value: string,
    disabled: boolean,
    onChange: (value: string) => void,
  ): HTMLElement {
    const field = createElement("label", "form-field");
    field.append(createElement("span", "form-label", label));
    const input = createElement("input", "text-input") as HTMLInputElement;
    input.type = "text";
    input.value = value;
    input.disabled = disabled;
    input.addEventListener("change", () => {
      onChange(input.value);
      if (!this.readOnly) {
        this.render();
      }
    });
    field.append(input);
    return field;
  }

  private generateGrid(): void {
    if (!this.sourceRawAsset) {
      return;
    }

    const parsedCellWidth = Number.parseInt(this.cellWidth, 10);
    const parsedCellHeight = Number.parseInt(this.cellHeight, 10);
    const parsedOffsetX = Number.parseInt(this.offsetX, 10);
    const parsedOffsetY = Number.parseInt(this.offsetY, 10);
    if (
      !Number.isInteger(parsedCellWidth) ||
      !Number.isInteger(parsedCellHeight) ||
      !Number.isInteger(parsedOffsetX) ||
      !Number.isInteger(parsedOffsetY) ||
      parsedCellWidth <= 0 ||
      parsedCellHeight <= 0 ||
      parsedOffsetX < 0 ||
      parsedOffsetY < 0
    ) {
      return;
    }

    const grid = buildUniformGrid(
      this.sourceRawAsset.width,
      this.sourceRawAsset.height,
      parsedCellWidth,
      parsedCellHeight,
      parsedOffsetX,
      parsedOffsetY,
    );
    this.hasOverflow = grid.hasOverflow;
    this.cells = grid.cells.map((cell) => ({
      id: cell.id,
      rect: cell.rect,
      active: true,
    }));
  }

  private validate(): string | null {
    const nameError = validateRequiredName(this.draftName);
    if (nameError) {
      return nameError;
    }
    if (this.store.isAssetNameTaken(this.draftName.trim())) {
      return "El nombre del tileset ya existe.";
    }

    const widthError = validatePositiveInteger(this.cellWidth, "Cell width");
    if (widthError) {
      return widthError;
    }
    const heightError = validatePositiveInteger(this.cellHeight, "Cell height");
    if (heightError) {
      return heightError;
    }
    const offsetXError = validateNonNegativeInteger(this.offsetX, "Offset X");
    if (offsetXError) {
      return offsetXError;
    }
    const offsetYError = validateNonNegativeInteger(this.offsetY, "Offset Y");
    if (offsetYError) {
      return offsetYError;
    }
    if (this.cells.filter((cell) => cell.active).length === 0) {
      return "Debe quedar al menos una celda activa.";
    }
    return null;
  }

  private destroyGame(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}

function createMessageCard(title: string, body: string): HTMLElement {
  const card = createElement("div", "empty-state");
  card.append(createElement("strong", "empty-title", title), createElement("p", "empty-copy", body));
  return card;
}
