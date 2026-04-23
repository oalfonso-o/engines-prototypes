import type { EditorEntityRecord } from "./editorTypes";

export function normalizeAssetName(rawName: string): string {
  return rawName.trim();
}

export function isAssetNameTaken(
  name: string,
  assets: EditorEntityRecord[],
  excludeId?: string,
): boolean {
  const normalized = normalizeAssetName(name).toLocaleLowerCase();
  return assets.some((asset) => asset.id !== excludeId && asset.name.toLocaleLowerCase() === normalized);
}

export function buildUniqueAssetName(baseName: string, assets: EditorEntityRecord[]): string {
  const seed = normalizeAssetName(baseName) || "asset";
  if (!isAssetNameTaken(seed, assets)) {
    return seed;
  }

  let counter = 2;
  while (isAssetNameTaken(`${seed}-${counter}`, assets)) {
    counter += 1;
  }

  return `${seed}-${counter}`;
}
