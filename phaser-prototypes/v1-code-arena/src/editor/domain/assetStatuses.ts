import { getAllAssets, getDependencyEntries, getEntityType } from "./assetReferences";
import type { AssetStatus, EditorEntityRecord, EditorSnapshot } from "./editorTypes";

export function getAssetStatus(asset: EditorEntityRecord, snapshot: EditorSnapshot): AssetStatus {
  if (asset.archivedAt) {
    return "archived";
  }

  const dependencies = getDependencyEntries(asset, snapshot);
  if (dependencies.some((dependency) => dependency.status === "missing")) {
    return "missing-dependencies";
  }

  if (dependencies.some((dependency) => dependency.status === "archived")) {
    return "uses-archived-dependencies";
  }

  return "active";
}

export function getAssetSummaries(snapshot: EditorSnapshot) {
  return getAllAssets(snapshot).map((asset) => ({
    id: asset.id,
    entityType: getEntityType(asset),
    name: asset.name,
    archivedAt: asset.archivedAt,
    status: getAssetStatus(asset, snapshot),
  }));
}
