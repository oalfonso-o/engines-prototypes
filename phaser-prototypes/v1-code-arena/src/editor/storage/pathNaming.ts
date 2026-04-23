export function slugifyForPath(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug.length > 0 ? slug : "item";
}

export function buildRelativeFilePath(fileName: string, extension: string): string {
  const normalizedExtension = extension.startsWith(".") ? extension : `.${extension}`;
  return `${slugifyForPath(fileName)}${normalizedExtension}`;
}

export function joinRelativePath(parentRelativePath: string, childSegment: string): string {
  return parentRelativePath ? `${parentRelativePath}/${childSegment}` : childSegment;
}

export function getRelativePathBasename(relativePath: string): string {
  const parts = relativePath.split("/");
  return parts[parts.length - 1] ?? relativePath;
}

export function getRelativePathExtension(relativePath: string): string {
  const basename = getRelativePathBasename(relativePath);
  const dotIndex = basename.lastIndexOf(".");
  return dotIndex <= 0 ? "" : basename.slice(dotIndex);
}

export function replaceRelativePathBasename(relativePath: string, nextBasename: string): string {
  const parts = relativePath.split("/");
  parts[parts.length - 1] = nextBasename;
  return parts.join("/");
}

export function resolveUniqueRelativePath(desiredRelativePath: string, occupiedRelativePaths: Set<string>): string {
  if (!occupiedRelativePaths.has(desiredRelativePath)) {
    return desiredRelativePath;
  }

  const extension = getRelativePathExtension(desiredRelativePath);
  const basename = getRelativePathBasename(desiredRelativePath);
  const stem = extension.length > 0 ? basename.slice(0, -extension.length) : basename;
  let counter = 2;

  while (true) {
    const candidateBasename = `${stem}-${counter}${extension}`;
    const candidatePath = replaceRelativePathBasename(desiredRelativePath, candidateBasename);
    if (!occupiedRelativePaths.has(candidatePath)) {
      return candidatePath;
    }
    counter += 1;
  }
}
