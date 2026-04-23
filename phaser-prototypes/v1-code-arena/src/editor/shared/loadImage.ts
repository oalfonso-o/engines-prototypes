import type { Rect } from "../domain/editorTypes";

const imagePromises = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(url: string): Promise<HTMLImageElement> {
  const cached = imagePromises.get(url);
  if (cached) {
    return cached;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image ${url}`));
    image.src = url;
  });

  imagePromises.set(url, promise);
  return promise;
}

export function createCroppedThumbnail(
  image: CanvasImageSource,
  rect: Rect,
  maxWidth: number,
  maxHeight: number,
): HTMLCanvasElement {
  const scale = Math.min(maxWidth / rect.width, maxHeight / rect.height, 1.75);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(rect.width * scale));
  canvas.height = Math.max(1, Math.round(rect.height * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    return canvas;
  }

  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    image,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas;
}
