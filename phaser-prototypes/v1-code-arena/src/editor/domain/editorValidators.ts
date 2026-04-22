import type { EditorEntityRecord } from "./editorTypes";

export function validatePositiveInteger(value: string, label: string): string | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return `${label} debe ser un entero positivo mayor que 0.`;
  }

  return null;
}

export function validateNonNegativeInteger(value: string, label: string): string | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return `${label} debe ser un entero mayor o igual que 0.`;
  }

  return null;
}

export function normalizeAssetName(rawName: string): string {
  return rawName.trim();
}

export function validateRequiredName(name: string): string | null {
  if (normalizeAssetName(name).length === 0) {
    return "El nombre es obligatorio.";
  }

  return null;
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
