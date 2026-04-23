import type { TilesetDefinition } from "../../domain/editorTypes";
import { clearElement, createElement } from "../../shared/dom";
import { createCroppedThumbnail, loadImage } from "../../shared/loadImage";
import type { EditorTranslator } from "../../i18n/EditorTranslator";

export interface MapPalettePanelOptions {
  tilesets: TilesetDefinition[];
  selectedTilesetId: string | null;
  selectedTileId: string | null;
  readOnly: boolean;
  rawUrlResolver: (rawAssetId: string) => string | null;
  onSelectTileset: (tilesetId: string) => void;
  onSelectTile: (tileId: string) => void;
}

export class MapPalettePanel {
  private renderToken = 0;

  constructor(
    private readonly root: HTMLElement,
    private readonly translator: EditorTranslator,
  ) {}

  update(options: MapPalettePanelOptions): void {
    this.renderToken += 1;
    const token = this.renderToken;
    clearElement(this.root);
    this.root.className = "map-palette";
    this.root.dataset.testid = "map-palette";

    if (options.tilesets.length === 0) {
      this.root.append(
        createEmptyState(
          this.translator.t("editor.workspace.map.palette.noMappedTilesetsTitle"),
          this.translator.t("editor.workspace.map.palette.noMappedTilesetsBody"),
        ),
      );
      return;
    }

    if (options.tilesets.length > 1) {
      const tilesetBar = createElement("div", "palette-tileset-bar");
      options.tilesets.forEach((tileset) => {
        const button = createElement(
          "button",
          tileset.id === options.selectedTilesetId ? "palette-tileset is-selected" : "palette-tileset",
          tileset.name,
        ) as HTMLButtonElement;
        button.type = "button";
        button.addEventListener("click", () => options.onSelectTileset(tileset.id));
        tilesetBar.append(button);
      });
      this.root.append(tilesetBar);
    }

    const selectedTileset = options.tilesets.find((entry) => entry.id === options.selectedTilesetId) ?? options.tilesets[0];
    if (!selectedTileset) {
      return;
    }

    const url = options.rawUrlResolver(selectedTileset.sourceAssetId);
    if (!url) {
      this.root.append(
        createEmptyState(
          this.translator.t("editor.workspace.map.palette.sourceMissingTitle"),
          this.translator.t("editor.workspace.map.palette.sourceMissingBody"),
        ),
      );
      return;
    }

    const tileGrid = createElement("div", "palette-tile-grid");
    this.root.append(tileGrid);
    void loadImage(url).then((image) => {
      if (token !== this.renderToken) {
        return;
      }

      selectedTileset.tiles.forEach((tile) => {
        const button = createElement(
          "button",
          tile.id === options.selectedTileId ? "palette-tile is-selected" : "palette-tile",
        ) as HTMLButtonElement;
        button.type = "button";
        button.title = tile.label ?? tile.id;
        button.setAttribute("aria-label", tile.label ?? tile.id);
        button.append(createCroppedThumbnail(image, tile.rect, 32, 32));
        button.addEventListener("click", () => options.onSelectTile(tile.id));
        tileGrid.append(button);
      });
    });
  }

  destroy(): void {
    clearElement(this.root);
  }
}

function createEmptyState(title: string, body: string): HTMLElement {
  const card = createElement("div", "empty-state");
  card.append(createElement("strong", "empty-title", title), createElement("p", "empty-copy", body));
  return card;
}
