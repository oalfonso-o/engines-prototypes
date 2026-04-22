import { getAssetStatus } from "../domain/assetStatuses";
import type { EditorSnapshot } from "../domain/editorTypes";
import { formatAssetTypeLabel } from "../shared/formatters";
import type { LibraryRow } from "./AssetLibraryFilters";

export function buildGameAssetRows(snapshot: EditorSnapshot): LibraryRow[] {
  const tilesets = snapshot.tilesets.map((asset) => ({
    id: asset.id,
    entityType: "tileset" as const,
    name: asset.name,
    archivedAt: asset.archivedAt,
    status: getAssetStatus(asset, snapshot),
    typeLabel: formatAssetTypeLabel("tileset"),
    sizeLabel: `${asset.tiles.length} tiles`,
    sourceKind: null,
  }));

  const spritesheets = snapshot.spritesheets.map((asset) => ({
    id: asset.id,
    entityType: "spritesheet" as const,
    name: asset.name,
    archivedAt: asset.archivedAt,
    status: getAssetStatus(asset, snapshot),
    typeLabel: formatAssetTypeLabel("spritesheet"),
    sizeLabel: `${asset.frames.length} frames`,
    sourceKind: null,
  }));

  const animations = snapshot.animations.map((asset) => ({
    id: asset.id,
    entityType: "animation" as const,
    name: asset.name,
    archivedAt: asset.archivedAt,
    status: getAssetStatus(asset, snapshot),
    typeLabel: formatAssetTypeLabel("animation"),
    sizeLabel: `${asset.frameIds.length} frames`,
    sourceKind: null,
  }));

  const characters = snapshot.characters.map((asset) => ({
    id: asset.id,
    entityType: "character" as const,
    name: asset.name,
    archivedAt: asset.archivedAt,
    status: getAssetStatus(asset, snapshot),
    typeLabel: formatAssetTypeLabel("character"),
    sizeLabel: `${countCharacterSlots(asset)} slots`,
    sourceKind: null,
  }));

  const maps = snapshot.maps.map((asset) => ({
    id: asset.id,
    entityType: "map" as const,
    name: asset.name,
    archivedAt: asset.archivedAt,
    status: getAssetStatus(asset, snapshot),
    typeLabel: formatAssetTypeLabel("map"),
    sizeLabel: `${asset.widthInCells}x${asset.heightInCells}`,
    sourceKind: null,
  }));

  return [...tilesets, ...spritesheets, ...animations, ...characters, ...maps];
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
