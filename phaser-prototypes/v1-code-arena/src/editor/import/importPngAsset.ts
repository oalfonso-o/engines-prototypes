import { createEditorId } from "../domain/editorIds";
import type { RawAssetKind, RawAssetRecord } from "../domain/editorTypes";
import { inspectPngFile } from "./inspectPngFile";
import { buildRelativeFilePath } from "../storage/pathNaming";

export interface ImportedPngAsset {
  record: RawAssetRecord;
  blobKey: string;
  blob: Blob;
}

export async function importPngAsset(
  file: File,
  name: string,
  sourceKind: RawAssetKind,
  folderId: string | null,
): Promise<ImportedPngAsset> {
  const inspection = await inspectPngFile(file);
  const now = new Date().toISOString();
  const id = createEditorId();

  return {
    record: {
      id,
      name,
      storageRoot: "user",
      folderId,
      relativePath: buildRelativeFilePath(name, ".png"),
      originalFilename: file.name,
      mimeType: "image/png",
      width: inspection.width,
      height: inspection.height,
      sizeBytes: inspection.sizeBytes,
      sourceKind,
      storageMode: "blob",
      blobKey: id,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    blobKey: id,
    blob: file,
  };
}
