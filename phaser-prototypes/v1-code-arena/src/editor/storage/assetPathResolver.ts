import type { StorageRoot } from "../domain/editorTypes";

const ROOT_URLS: Record<StorageRoot, string> = {
  core: "editor-assets/core",
  user: "editor-assets/user",
  archived: "editor-assets/archived",
};

export function resolveAssetUrl(storageRoot: StorageRoot, relativePath: string): string {
  const encodedPath = relativePath
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");

  return encodedPath.length > 0
    ? `${ROOT_URLS[storageRoot]}/${encodedPath}`
    : ROOT_URLS[storageRoot];
}
