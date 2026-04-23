import type {
  ActionDefinition,
  AnimationDefinition,
  AssetDependencyEntry,
  AssetEntityType,
  CharacterDefinition,
  EditorEntityRecord,
  EditorSnapshot,
  LevelCompositionRecord,
  MapDefinition,
  RawAssetRecord,
  SceneDefinition,
  SpriteSheetDefinition,
  TilesetDefinition,
} from "./editorTypes";
import { CORE_DERIVED_IDS } from "../content/coreDerivedManifest";

interface AssetLookupEntry {
  entityType: AssetEntityType;
  asset: EditorEntityRecord;
}

export function getAllAssets(snapshot: EditorSnapshot): EditorEntityRecord[] {
  return [
    ...snapshot.rawAssets,
    ...snapshot.tilesets,
    ...snapshot.spritesheets,
    ...snapshot.animations,
    ...snapshot.characters,
    ...snapshot.maps,
    ...snapshot.levelCompositions,
    ...snapshot.scenes,
    ...snapshot.actions,
  ];
}

export function resolveAssetById(snapshot: EditorSnapshot, id: string): AssetLookupEntry | null {
  const allAssets = getAllAssets(snapshot);
  const asset = allAssets.find((entry) => entry.id === id);
  if (!asset) {
    return null;
  }

  return {
    entityType: getEntityType(asset),
    asset,
  };
}

export function getEntityType(asset: EditorEntityRecord): AssetEntityType {
  if (isRawAsset(asset)) {
    return "raw-asset";
  }
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
  if (isLevelComposition(asset)) {
    return "level";
  }
  if (isAction(asset)) {
    return "action";
  }
  if (isScene(asset)) {
    return "scene";
  }

  return "map";
}

export function getDependencyEntries(asset: EditorEntityRecord, snapshot: EditorSnapshot): AssetDependencyEntry[] {
  const references = getDirectReferences(asset);
  return references.map((reference) => {
    const resolved = resolveAssetById(snapshot, reference.id);
    if (!resolved) {
      return {
        id: reference.id,
        entityType: "missing",
        name: reference.fallbackName,
        status: "missing",
      };
    }

    return {
      id: resolved.asset.id,
      entityType: resolved.entityType,
      name: resolved.asset.name,
      status: resolved.asset.archivedAt ? "archived" : "active",
    };
  });
}

export function getUsedByEntries(asset: EditorEntityRecord, snapshot: EditorSnapshot): AssetDependencyEntry[] {
  const allAssets = getAllAssets(snapshot);
  return allAssets
    .filter((candidate) => candidate.id !== asset.id)
    .filter((candidate) => getDirectReferences(candidate).some((reference) => reference.id === asset.id))
    .map((candidate) => ({
      id: candidate.id,
      entityType: getEntityType(candidate),
      name: candidate.name,
      status: candidate.archivedAt ? "archived" : "active",
    }));
}

export function getDirectReferenceIds(asset: EditorEntityRecord): string[] {
  return getDirectReferences(asset).map((reference) => reference.id);
}

export function getSourceRawAssetId(asset: EditorEntityRecord, snapshot: EditorSnapshot): string | null {
  if (isRawAsset(asset)) {
    return asset.id;
  }

  if (isTileset(asset) || isSpriteSheet(asset)) {
    return asset.sourceAssetId;
  }

  if (isAnimation(asset)) {
    const spritesheet = snapshot.spritesheets.find((entry) => entry.id === asset.spriteSheetId);
    return spritesheet?.sourceAssetId ?? null;
  }

  if (isCharacter(asset)) {
    const animation = snapshot.animations.find((entry) => entry.id === asset.idleAnimationId);
    if (!animation) {
      return null;
    }

    const spritesheet = snapshot.spritesheets.find((entry) => entry.id === animation.spriteSheetId);
    return spritesheet?.sourceAssetId ?? null;
  }

  if (isLevelComposition(asset)) {
    const map = snapshot.maps.find((entry) => entry.id === asset.mapId);
    if (!map) {
      return null;
    }

    return getMapSourceRawAssetId(map, snapshot);
  }

  if (isMap(asset)) {
    return getMapSourceRawAssetId(asset, snapshot);
  }

  if (isScene(asset)) {
    const backgroundLayer = asset.layers.find((layer) => layer.kind === "background");
    if (backgroundLayer) {
      return backgroundLayer.assetId;
    }

    const tileLayer = asset.layers.find(
      (layer): layer is Extract<typeof asset.layers[number], { kind: "tiles" }> =>
        layer.kind === "tiles" && layer.cells.length > 0,
    );
    const firstCell = tileLayer?.cells[0];
    if (!firstCell) {
      return null;
    }

    const tileset = snapshot.tilesets.find((entry) => entry.id === firstCell.tilesetId);
    return tileset?.sourceAssetId ?? null;
  }

  if (isAction(asset) && asset.kind === "scene-transition") {
    const targetScene = snapshot.scenes.find((entry) => entry.id === asset.targetSceneId);
    if (!targetScene) {
      return null;
    }
    return getSourceRawAssetId(targetScene, snapshot);
  }

  return null;
}

interface DirectReference {
  id: string;
  fallbackName: string;
}

function getDirectReferences(asset: EditorEntityRecord): DirectReference[] {
  if (isRawAsset(asset)) {
    return [];
  }

  if (isTileset(asset) || isSpriteSheet(asset)) {
    return [{ id: asset.sourceAssetId, fallbackName: "rawAssetMissing" }];
  }

  if (isAnimation(asset)) {
    return [{ id: asset.spriteSheetId, fallbackName: "spritesheetMissing" }];
  }

  if (isCharacter(asset)) {
    return compactReferences([
      buildOptionalReference(asset.idleAnimationId, "idleAnimationMissing"),
      buildOptionalReference(asset.runSideAnimationId, "runAnimationMissing"),
      buildOptionalReference(asset.jumpAnimationId, "jumpAnimationMissing"),
      buildOptionalReference(asset.attackAnimationId, "attackAnimationMissing"),
    ]);
  }

  if (isLevelComposition(asset)) {
    return uniqueReferences(compactReferences([
      buildOptionalReference(asset.mapId, "missing"),
      buildOptionalReference(asset.playerCharacterId, "missing"),
      ...asset.placements.map((placement) => buildOptionalReference(resolvePlacementAssetId(placement), "missing")),
    ]));
  }

  if (isScene(asset)) {
    const layerReferences = asset.layers.flatMap((layer) => {
      if (layer.kind === "background") {
        return [buildOptionalReference(layer.assetId, "rawAssetMissing")];
      }
      if (layer.kind === "tiles") {
        return layer.cells.map((cell) => buildOptionalReference(cell.tilesetId, "tilesetMissing"));
      }
      if (layer.kind !== "objects") {
        return [];
      }

      return layer.objects.flatMap((object) => {
        switch (object.type) {
          case "player-spawn":
            return [buildOptionalReference(object.characterId, "missing")];
          case "pickup":
          case "enemy-spawn":
          case "boss-spawn":
          case "prop":
            return [buildOptionalReference(object.assetId, "missing")];
          case "trigger-zone":
            return [buildOptionalReference(object.actionId, "missing")];
          case "entry-point":
            return [];
        }
      });
    });

    return uniqueReferences(compactReferences([
      buildOptionalReference(asset.defaultPlayerCharacterId, "missing"),
      ...layerReferences,
    ]));
  }

  if (isAction(asset)) {
    if (asset.kind === "scene-transition") {
      return compactReferences([buildOptionalReference(asset.targetSceneId, "missing")]);
    }
    if (asset.kind === "sequence") {
      return uniqueReferences(compactReferences(asset.actionIds.map((id) => buildOptionalReference(id, "missing"))));
    }
    if (asset.kind === "conditional") {
      return compactReferences([
        buildOptionalReference(asset.thenActionId, "missing"),
        buildOptionalReference(asset.elseActionId, "missing"),
      ]);
    }
    return [];
  }

  return uniqueReferences(
    asset.cells.map((cell) => ({
      id: cell.tilesetId,
      fallbackName: "tilesetMissing",
    })),
  );
}

function compactReferences(references: Array<DirectReference | null>): DirectReference[] {
  return references.filter((entry): entry is DirectReference => entry !== null);
}

function buildOptionalReference(id: string | null, fallbackName: string): DirectReference | null {
  if (!id) {
    return null;
  }

  return { id, fallbackName };
}

function uniqueReferences(references: DirectReference[]): DirectReference[] {
  const seen = new Set<string>();
  return references.filter((reference) => {
    if (seen.has(reference.id)) {
      return false;
    }

    seen.add(reference.id);
    return true;
  });
}

function getMapSourceRawAssetId(asset: MapDefinition, snapshot: EditorSnapshot): string | null {
  const firstCell = asset.cells[0];
  if (!firstCell) {
    return null;
  }

  const tileset = snapshot.tilesets.find((entry) => entry.id === firstCell.tilesetId);
  return tileset?.sourceAssetId ?? null;
}

function resolvePlacementAssetId(placement: LevelCompositionRecord["placements"][number]): string | null {
  if (placement.assetId) {
    return placement.assetId;
  }

  switch (placement.type) {
    case "coin":
      return CORE_DERIVED_IDS.animationCoinSpin;
  }
}

export function isRawAsset(asset: EditorEntityRecord): asset is RawAssetRecord {
  return "sourceKind" in asset && "storageMode" in asset;
}

export function isTileset(asset: EditorEntityRecord): asset is TilesetDefinition {
  return "tiles" in asset;
}

export function isSpriteSheet(asset: EditorEntityRecord): asset is SpriteSheetDefinition {
  return "frames" in asset;
}

export function isAnimation(asset: EditorEntityRecord): asset is AnimationDefinition {
  return "frameIds" in asset;
}

export function isCharacter(asset: EditorEntityRecord): asset is CharacterDefinition {
  return "idleAnimationId" in asset;
}

export function isMap(asset: EditorEntityRecord): asset is MapDefinition {
  return "cells" in asset && "tileFitMode" in asset;
}

const _mapTypeGuardCheck: (asset: EditorEntityRecord) => asset is MapDefinition = isMap;
void _mapTypeGuardCheck;

export function isLevelComposition(asset: EditorEntityRecord): asset is LevelCompositionRecord {
  return "placements" in asset && "playerCharacterId" in asset && "mapId" in asset;
}

export function isScene(asset: EditorEntityRecord): asset is SceneDefinition {
  return "layers" in asset && "defaultPlayerCharacterId" in asset;
}

export function isAction(asset: EditorEntityRecord): asset is ActionDefinition {
  return "kind" in asset && !("layers" in asset) && !("cells" in asset);
}
