export interface PngInspection {
  width: number;
  height: number;
  sizeBytes: number;
}

export async function inspectPngFile(file: File): Promise<PngInspection> {
  const bitmap = await createImageBitmap(file);
  try {
    return {
      width: bitmap.width,
      height: bitmap.height,
      sizeBytes: file.size,
    };
  } finally {
    bitmap.close();
  }
}
