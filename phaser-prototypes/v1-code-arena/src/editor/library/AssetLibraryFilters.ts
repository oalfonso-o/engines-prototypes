import { getAssetStatus } from "../domain/assetStatuses";
import type {
  AssetEntityType,
  AssetStatus,
  EditorSnapshot,
  LibraryTab,
  RawAssetKind,
} from "../domain/editorTypes";
import { formatAssetTypeLabel, formatBytes } from "../shared/formatters";
import type { EditorTranslator } from "../i18n/EditorTranslator";

export interface LibraryRow {
  id: string;
  entityType: AssetEntityType;
  name: string;
  archivedAt: string | null;
  status: AssetStatus;
  typeLabel: string;
  sizeLabel: string;
  sourceKind: RawAssetKind | null;
}

export function buildRawAssetRows(snapshot: EditorSnapshot, translator: EditorTranslator): LibraryRow[] {
  return snapshot.rawAssets.map((asset) => ({
    id: asset.id,
    entityType: "raw-asset",
    name: asset.name,
    archivedAt: asset.archivedAt,
    status: getAssetStatus(asset, snapshot),
    typeLabel: formatAssetTypeLabel("raw-asset", translator, asset.sourceKind),
    sizeLabel: translator.t("editor.library.size.rawAsset", {
      width: asset.width,
      height: asset.height,
      size: formatBytes(asset.sizeBytes, translator),
    }),
    sourceKind: asset.sourceKind,
  }));
}

export function filterLibraryRows(rows: LibraryRow[], searchQuery: string, _tab: LibraryTab): LibraryRow[] {
  const normalized = searchQuery.trim().toLocaleLowerCase();
  if (!normalized) {
    return rows;
  }

  return rows.filter((row) => {
    const haystack = `${row.name} ${row.typeLabel} ${row.sizeLabel}`.toLocaleLowerCase();
    return haystack.includes(normalized);
  });
}
