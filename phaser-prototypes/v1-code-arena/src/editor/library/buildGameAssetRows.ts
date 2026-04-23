import { getAssetStatus } from "../domain/assetStatuses";
import type { EditorSnapshot } from "../domain/editorTypes";
import { formatAssetTypeLabel } from "../shared/formatters";
import type { EditorTranslator } from "../i18n/EditorTranslator";
import type { LibraryRow } from "./AssetLibraryFilters";

export function buildGameAssetRows(snapshot: EditorSnapshot, translator: EditorTranslator): LibraryRow[] {
  const tilesets = snapshot.tilesets.map((asset) => ({
    id: asset.id,
    entityType: "tileset" as const,
    name: asset.name,
    archivedAt: asset.archivedAt,
    status: getAssetStatus(asset, snapshot),
    typeLabel: formatAssetTypeLabel("tileset", translator),
    sizeLabel: translator.t("editor.library.size.tiles", { count: asset.tiles.length }),
    sourceKind: null,
  }));

  const spritesheets = snapshot.spritesheets.map((asset) => ({
    id: asset.id,
    entityType: "spritesheet" as const,
    name: asset.name,
    archivedAt: asset.archivedAt,
    status: getAssetStatus(asset, snapshot),
    typeLabel: formatAssetTypeLabel("spritesheet", translator),
    sizeLabel: translator.t("editor.library.size.frames", { count: asset.frames.length }),
    sourceKind: null,
  }));

  const animations = snapshot.animations.map((asset) => ({
    id: asset.id,
    entityType: "animation" as const,
    name: asset.name,
    archivedAt: asset.archivedAt,
    status: getAssetStatus(asset, snapshot),
    typeLabel: formatAssetTypeLabel("animation", translator),
    sizeLabel: translator.t("editor.library.size.frames", { count: asset.frameIds.length }),
    sourceKind: null,
  }));

  const characters = snapshot.characters.map((asset) => ({
    id: asset.id,
    entityType: "character" as const,
    name: asset.name,
    archivedAt: asset.archivedAt,
    status: getAssetStatus(asset, snapshot),
    typeLabel: formatAssetTypeLabel("character", translator),
    sizeLabel: translator.t("editor.library.size.slots", { count: countCharacterSlots(asset) }),
    sourceKind: null,
  }));

  const maps = snapshot.maps.map((asset) => ({
    id: asset.id,
    entityType: "map" as const,
    name: asset.name,
    archivedAt: asset.archivedAt,
    status: getAssetStatus(asset, snapshot),
    typeLabel: formatAssetTypeLabel("map", translator),
    sizeLabel: translator.t("editor.library.size.mapGrid", {
      width: asset.widthInCells,
      height: asset.heightInCells,
    }),
    sourceKind: null,
  }));

  const levels = snapshot.levelCompositions.map((asset) => ({
    id: asset.id,
    entityType: "level" as const,
    name: asset.name,
    archivedAt: asset.archivedAt,
    status: getAssetStatus(asset, snapshot),
    typeLabel: formatAssetTypeLabel("level", translator),
    sizeLabel: translator.t("editor.library.size.pickups", { count: asset.placements.length }),
    sourceKind: null,
  }));

  const scenes = snapshot.scenes.map((asset) => ({
    id: asset.id,
    entityType: "scene" as const,
    name: asset.name,
    archivedAt: asset.archivedAt,
    status: getAssetStatus(asset, snapshot),
    typeLabel: formatAssetTypeLabel("scene", translator),
    sizeLabel: translator.t("editor.library.size.mapGrid", {
      width: asset.widthInCells,
      height: asset.heightInCells,
    }),
    sourceKind: null,
  }));

  const actions = snapshot.actions.map((asset) => ({
    id: asset.id,
    entityType: "action" as const,
    name: asset.name,
    archivedAt: asset.archivedAt,
    status: getAssetStatus(asset, snapshot),
    typeLabel: formatAssetTypeLabel("action", translator),
    sizeLabel: asset.kind,
    sourceKind: null,
  }));

  return [...tilesets, ...spritesheets, ...animations, ...characters, ...maps, ...levels, ...scenes, ...actions];
}

function countCharacterSlots(asset: EditorSnapshot["characters"][number]): number {
  let count = 1;
  if (asset.runSideAnimationId) {
    count += 1;
  }
  if (asset.jumpAnimationId) {
    count += 1;
  }
  if (asset.attackAnimationId) {
    count += 1;
  }
  return count;
}
