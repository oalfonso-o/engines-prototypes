import {
  isAction,
  isAnimation,
  isCharacter,
  isGame,
  isLevelComposition,
  isMap,
  isRawAsset,
  isScene,
  isSpriteSheet,
  isTileset,
} from "../domain/assetReferences";
import type { EditorStore } from "../state/EditorStore";

export function openAssetSelection(store: EditorStore, assetId: string): void {
  const asset = store.getAssetById(assetId);
  if (!asset) {
    return;
  }

  store.selectAsset(assetId);

  if (isRawAsset(asset)) {
    if (asset.sourceKind === "image-source") {
      store.navigate({ kind: "raw-asset", id: assetId });
      return;
    }

    if (asset.sourceKind === "tileset-source") {
      store.navigate({ kind: "tileset", id: assetId });
      return;
    }

    if (asset.sourceKind === "spritesheet-source") {
      store.navigate({ kind: "spritesheet", id: assetId });
    }
    return;
  }

  if (isTileset(asset)) {
    store.navigate({ kind: "tileset", id: assetId });
    return;
  }

  if (isSpriteSheet(asset)) {
    store.navigate({ kind: "spritesheet", id: assetId });
    return;
  }

  if (isAnimation(asset)) {
    store.navigate({ kind: "animation", id: assetId });
    return;
  }

  if (isCharacter(asset)) {
    store.navigate({ kind: "character", id: assetId });
    return;
  }

  if (isMap(asset)) {
    store.navigate({ kind: "map", id: assetId });
    return;
  }

  if (isLevelComposition(asset)) {
    store.navigate({ kind: "level", id: assetId });
    return;
  }

  if (isScene(asset)) {
    store.navigate({ kind: "scene", id: assetId });
    return;
  }

  if (isAction(asset)) {
    store.navigate({ kind: "action", id: assetId });
    return;
  }

  if (isGame(asset)) {
    store.navigate({ kind: "game", id: assetId });
  }
}
