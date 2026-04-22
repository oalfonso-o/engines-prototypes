import type { AssetEntityType } from "../domain/editorTypes";

export function formatBytes(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatAssetTypeLabel(entityType: AssetEntityType, sourceKind?: string): string {
  if (entityType === "raw-asset") {
    return sourceKind === "tileset-source" ? "Raw Tileset PNG" : "Raw Spritesheet PNG";
  }

  switch (entityType) {
    case "tileset":
      return "Tileset";
    case "spritesheet":
      return "Spritesheet";
    case "animation":
      return "Animation";
    case "character":
      return "Character";
    case "map":
      return "Map";
    default:
      return entityType;
  }
}

export function formatTimestamp(value: string | null): string {
  if (!value) {
    return "No";
  }

  return new Date(value).toLocaleString("es-ES");
}
