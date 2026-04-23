import type { StorageRoot } from "../domain/editorTypes";

type PathKind = "file" | "directory";

export async function createFolderOnDisk(relativePath: string): Promise<void> {
  await postJson("/__dev/editor/folders", { relativePath });
}

export async function writePngOnDisk(relativePath: string, blob: Blob): Promise<void> {
  const response = await fetch("/__dev/editor/import-png", {
    method: "POST",
    headers: {
      "Content-Type": "image/png",
      "x-relative-path": relativePath,
    },
    body: blob,
  });

  if (!response.ok) {
    throw new Error(await response.text() || "Failed to import PNG");
  }
}

export async function writeJsonOnDisk(storageRoot: StorageRoot, relativePath: string, content: string): Promise<void> {
  const response = await fetch("/__dev/editor/write-json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "x-storage-root": storageRoot,
      "x-relative-path": relativePath,
    },
    body: content,
  });

  if (!response.ok) {
    throw new Error(await response.text() || "Failed to write JSON definition");
  }
}

export async function movePathOnDisk(
  kind: PathKind,
  fromRoot: StorageRoot,
  fromRelativePath: string,
  toRoot: StorageRoot,
  toRelativePath: string,
): Promise<void> {
  await postJson("/__dev/editor/move-path", {
    kind,
    fromRoot,
    fromRelativePath,
    toRoot,
    toRelativePath,
  });
}

async function postJson(url: string, payload: unknown): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text() || `Request failed: ${url}`);
  }
}
