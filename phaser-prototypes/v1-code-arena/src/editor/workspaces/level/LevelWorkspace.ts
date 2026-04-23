import { isLevelComposition, isMap } from "../../domain/assetReferences";
import type {
  LevelCompositionRecord,
  MapDefinition,
  MapCellRecord,
  TilesetDefinition,
} from "../../domain/editorTypes";
import type { EditorStore } from "../../state/EditorStore";
import { clearElement, createElement } from "../../shared/dom";
import type { EditorTranslator } from "../../i18n/EditorTranslator";
import type { WorkspacePropertiesContributor } from "../../properties/WorkspacePropertiesContributor";
import { mountMapPreview, type MapPreviewMarker, type ResolvedMapTile } from "../map/mapPreview";

export class LevelWorkspace implements WorkspacePropertiesContributor {
  private readonly root = createElement("section", "workspace-screen map-workspace-screen");
  private readonly emptyStateHost = createElement("div");
  private readonly body = createElement("div", "workspace-body map-workspace");
  private readonly previewCard = createElement("div", "workspace-preview-card map-preview-panel");
  private readonly previewHost = createElement("div", "workspace-preview map-preview");
  private destroyPreview: (() => void) | null = null;
  private readonly level: LevelCompositionRecord | null;
  private readonly map: MapDefinition | null;

  constructor(
    private readonly container: HTMLElement,
    private readonly store: EditorStore,
    private readonly translator: EditorTranslator,
    routeId: string,
  ) {
    const asset = this.store.getAssetById(routeId);
    this.level = asset && isLevelComposition(asset) ? asset : null;
    const mapAsset = this.level ? this.store.getAssetById(this.level.mapId) : null;
    this.map = mapAsset && isMap(mapAsset) ? mapAsset : null;

    this.root.dataset.testid = "level-workspace";
    this.previewHost.dataset.testid = "level-preview";
    this.previewCard.append(this.previewHost);
    this.body.append(this.previewCard);
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
    if (!this.level) {
      return;
    }

    const overview = createElement("dl", "detail-metadata");
    appendMetadata(overview, this.translator.t("editor.details.metadata.grid"), this.map ? `${this.map.widthInCells}x${this.map.heightInCells}` : this.translator.t("editor.entities.missing"));
    appendMetadata(overview, this.translator.t("editor.details.metadata.pickups"), `${this.level.placements.length}`);
    appendMetadata(overview, this.translator.t("editor.workspace.level.properties.map"), this.map?.name ?? this.translator.t("editor.entities.missing"));
    appendMetadata(overview, this.translator.t("editor.workspace.level.properties.player"), this.resolvePlayerName());
    appendMetadata(overview, this.translator.t("editor.workspace.level.properties.spawn"), `${this.level.spawnX}, ${this.level.spawnY}`);
    appendMetadata(overview, this.translator.t("editor.workspace.level.properties.groundSegments"), `${this.level.groundSegments.length}`);
    appendMetadata(overview, this.translator.t("editor.workspace.level.properties.floatingPlatforms"), `${this.level.floatingPlatforms.length}`);
    appendMetadata(overview, this.translator.t("editor.workspace.level.properties.waterStrips"), `${this.level.waterStrips.length}`);
    container.append(overview);
  }

  private render(): void {
    this.destroyCanvas();

    if (!this.level || !this.map) {
      this.body.hidden = true;
      clearElement(this.emptyStateHost);
      this.emptyStateHost.append(
        createEmptyState(
          this.translator.t("editor.workspace.level.unavailableTitle"),
          this.translator.t("editor.workspace.level.unavailableBody"),
        ),
      );
      return;
    }

    clearElement(this.emptyStateHost);
    this.body.hidden = false;

    this.destroyPreview = mountMapPreview({
      container: this.previewHost,
      widthInCells: this.map.widthInCells,
      heightInCells: this.map.heightInCells,
      tileWidth: this.map.tileWidth,
      tileHeight: this.map.tileHeight,
      tileFitMode: this.map.tileFitMode,
      tiles: resolvePlacedTiles(this.map.cells, this.store.getState().snapshot.tilesets, this.store),
      collisionCells: this.map.collisionCells,
      readOnly: true,
      onCellClick: () => undefined,
      markers: this.resolveMarkers(),
    });
  }

  private resolveMarkers(): MapPreviewMarker[] {
    if (!this.level) {
      return [];
    }

    return [
      {
        x: this.level.spawnX,
        y: this.level.spawnY,
        color: "#5ed18b",
        label: "Spawn",
        radius: 7,
      },
      ...this.level.placements.map((placement, index) => ({
        x: placement.x,
        y: placement.y,
        color: "#f1ad5a",
        label: index < 3 ? "Pickup" : undefined,
        radius: 5,
      })),
    ];
  }

  private resolvePlayerName(): string {
    if (!this.level) {
      return this.translator.t("editor.entities.missing");
    }

    return this.store.getAssetById(this.level.playerCharacterId)?.name ?? this.translator.t("editor.entities.missing");
  }

  private destroyCanvas(): void {
    if (this.destroyPreview) {
      this.destroyPreview();
      this.destroyPreview = null;
    }
    clearElement(this.previewHost);
  }
}

function resolvePlacedTiles(
  cells: MapCellRecord[],
  tilesets: TilesetDefinition[],
  store: EditorStore,
): ResolvedMapTile[] {
  return cells.flatMap((cell) => {
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

function appendMetadata(list: HTMLElement, label: string, value: string): void {
  list.append(createElement("dt", "detail-term", label), createElement("dd", "detail-value", value));
}

function createEmptyState(title: string, body: string): HTMLElement {
  const card = createElement("div", "empty-state");
  card.append(createElement("strong", "empty-title", title), createElement("p", "empty-copy", body));
  return card;
}
