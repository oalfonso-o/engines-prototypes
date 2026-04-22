import type {
  AnimationDefinition,
  AssetDependencyEntry,
  AssetEntityType,
  CharacterDefinition,
  EditorEntityRecord,
  EditorSnapshot,
  MapDefinition,
  RawAssetRecord,
  SpriteSheetDefinition,
  TilesetDefinition,
} from "./editorTypes";

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

  const firstCell = asset.cells[0];
  if (!firstCell) {
    return null;
  }

  const tileset = snapshot.tilesets.find((entry) => entry.id === firstCell.tilesetId);
  return tileset?.sourceAssetId ?? null;
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
    return [{ id: asset.sourceAssetId, fallbackName: "Raw asset missing" }];
  }

  if (isAnimation(asset)) {
    return [{ id: asset.spriteSheetId, fallbackName: "Spritesheet missing" }];
  }

  if (isCharacter(asset)) {
    return compactReferences([
      buildOptionalReference(asset.idleAnimationId, "Idle animation missing"),
      buildOptionalReference(asset.runSideAnimationId, "Run animation missing"),
      buildOptionalReference(asset.jumpAnimationId, "Jump animation missing"),
      buildOptionalReference(asset.attackAnimationId, "Attack animation missing"),
    ]);
  }

  return uniqueReferences(
    asset.cells.map((cell) => ({
      id: cell.tilesetId,
      fallbackName: "Tileset missing",
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

export function isRawAsset(asset: EditorEntityRecord): asset is RawAssetRecord {
  return "sourceKind" in asset && "blobKey" in asset;
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
