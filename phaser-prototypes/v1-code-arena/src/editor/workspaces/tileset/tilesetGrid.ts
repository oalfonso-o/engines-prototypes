import type { Rect } from "../../domain/editorTypes";
import { rectContainsPoint } from "../../shared/geometry";

export interface GridPreviewCell {
  id: string;
  rect: Rect;
  active: boolean;
}

export interface GridPreviewOptions {
  container: HTMLElement;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  cells: GridPreviewCell[];
  readOnly: boolean;
  activeStrokeColor: number;
  inactiveStrokeColor: number;
  fillColor: number;
  onToggle: (cellId: string) => void;
}

const PREVIEW_HEIGHT = 520;

export function mountTilesetGridPreview(options: GridPreviewOptions): () => void {
  const width = Math.max(640, options.container.clientWidth || 780);
  const canvas = document.createElement("canvas");
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  canvas.width = width * dpr;
  canvas.height = PREVIEW_HEIGHT * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${PREVIEW_HEIGHT}px`;
  options.container.replaceChildren(canvas);

  const context = canvas.getContext("2d");
  if (!context) {
    return () => {
      canvas.remove();
    };
  }

  context.scale(dpr, dpr);
  context.imageSmoothingEnabled = false;
  const image = new Image();
  let disposed = false;

  const render = (): void => {
    if (disposed) {
      return;
    }

    const scale = Math.min((width - 48) / options.imageWidth, (PREVIEW_HEIGHT - 48) / options.imageHeight, 1);
    const drawWidth = options.imageWidth * scale;
    const drawHeight = options.imageHeight * scale;
    const offsetX = Math.round((width - drawWidth) / 2);
    const offsetY = Math.round((PREVIEW_HEIGHT - drawHeight) / 2);

    context.clearRect(0, 0, width, PREVIEW_HEIGHT);

    if (image.complete) {
      context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    }

    options.cells.forEach((cell) => {
      const color = cell.active ? options.activeStrokeColor : options.inactiveStrokeColor;
      const alpha = cell.active ? 0.2 : 0.05;
      context.fillStyle = intToCss(options.fillColor, alpha);
      context.fillRect(
        offsetX + cell.rect.x * scale,
        offsetY + cell.rect.y * scale,
        cell.rect.width * scale,
        cell.rect.height * scale,
      );
      context.strokeStyle = intToCss(color, cell.active ? 0.95 : 0.55);
      context.lineWidth = 2;
      context.strokeRect(
        offsetX + cell.rect.x * scale,
        offsetY + cell.rect.y * scale,
        cell.rect.width * scale,
        cell.rect.height * scale,
      );
    });
  };

  const handleClick = (event: MouseEvent): void => {
    if (options.readOnly) {
      return;
    }

    const scale = Math.min((width - 48) / options.imageWidth, (PREVIEW_HEIGHT - 48) / options.imageHeight, 1);
    const drawWidth = options.imageWidth * scale;
    const drawHeight = options.imageHeight * scale;
    const offsetX = Math.round((width - drawWidth) / 2);
    const offsetY = Math.round((PREVIEW_HEIGHT - drawHeight) / 2);
    const rect = canvas.getBoundingClientRect();
    const localX = (event.clientX - rect.left - offsetX) / scale;
    const localY = (event.clientY - rect.top - offsetY) / scale;
    const hit = options.cells.find((cell) => rectContainsPoint(cell.rect, localX, localY));
    if (hit) {
      options.onToggle(hit.id);
    }
  };

  canvas.addEventListener("click", handleClick);
  image.onload = render;
  image.src = options.imageUrl;
  render();

  return () => {
    disposed = true;
    canvas.removeEventListener("click", handleClick);
    canvas.remove();
  };
}

function intToCss(color: number, alpha: number): string {
  const red = (color >> 16) & 0xff;
  const green = (color >> 8) & 0xff;
  const blue = color & 0xff;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
