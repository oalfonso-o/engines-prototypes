import type { AssetEntityType } from "../domain/editorTypes";
import type { EditorTranslator } from "../i18n/EditorTranslator";

export function formatBytes(sizeBytes: number, translator: EditorTranslator): string {
  return translator.formatBytes(sizeBytes);
}

export function formatAssetTypeLabel(entityType: AssetEntityType, translator: EditorTranslator, sourceKind?: string): string {
  return translator.formatAssetTypeLabel(entityType, sourceKind as never);
}

export function formatTimestamp(value: string | null, translator: EditorTranslator): string {
  return translator.formatTimestamp(value);
}
