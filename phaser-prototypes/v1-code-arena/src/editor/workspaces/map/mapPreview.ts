import type { CollisionCellRecord, TileFitMode } from "../../domain/editorTypes";

export interface ResolvedMapTile {
  x: number;
  y: number;
  textureId: string;
  textureUrl: string;
  rect: { x: number; y: number; width: number; height: number };
}

export interface MapPreviewMarker {
  x: number;
  y: number;
  color: string;
  label?: string;
  radius?: number;
}

export interface MapPreviewOptions {
  container: HTMLElement;
  widthInCells: number;
  heightInCells: number;
  tileWidth: number;
  tileHeight: number;
  tileFitMode: TileFitMode;
  tiles: ResolvedMapTile[];
  collisionCells: CollisionCellRecord[];
  readOnly: boolean;
  onCellClick: (x: number, y: number) => void;
  markers?: MapPreviewMarker[];
}

export function mountMapPreview(options: MapPreviewOptions): () => void {
  const width = Math.max(540, Math.floor(options.container.clientWidth || 760));
  const height = Math.max(360, Math.min(500, Math.round(width * 0.62)));
  const mapPixelWidth = options.widthInCells * options.tileWidth;
  const mapPixelHeight = options.heightInCells * options.tileHeight;

  const textureSources = new Map<string, string>();
  options.tiles.forEach((tile) => {
    textureSources.set(tile.textureId, tile.textureUrl);
  });

  const canvas = document.createElement("canvas");
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  options.container.replaceChildren(canvas);

  const context = canvas.getContext("2d");
  if (!context) {
    return () => {
      canvas.remove();
    };
  }

  context.scale(dpr, dpr);
  context.imageSmoothingEnabled = false;
  const images = new Map<string, HTMLImageElement>();
  let disposed = false;

  const render = (): void => {
    if (disposed) {
      return;
    }

    const scale = Math.min((width - 32) / mapPixelWidth, (height - 32) / mapPixelHeight, 2.2);
    const drawWidth = mapPixelWidth * scale;
    const drawHeight = mapPixelHeight * scale;
    const offsetX = Math.round((width - drawWidth) / 2);
    const offsetY = Math.round((height - drawHeight) / 2);

    context.clearRect(0, 0, width, height);

    options.tiles.forEach((tile) => {
      const image = images.get(tile.textureId);
      if (!image) {
        return;
      }

      const destinationX = offsetX + tile.x * options.tileWidth * scale;
      const destinationY = offsetY + tile.y * options.tileHeight * scale;

      if (options.tileFitMode === "scale-to-fit") {
        context.drawImage(
          image,
          tile.rect.x,
          tile.rect.y,
          tile.rect.width,
          tile.rect.height,
          destinationX,
          destinationY,
          options.tileWidth * scale,
          options.tileHeight * scale,
        );
        return;
      }

      const drawCellWidth = Math.min(tile.rect.width, options.tileWidth);
      const drawCellHeight = Math.min(tile.rect.height, options.tileHeight);
      context.drawImage(
        image,
        tile.rect.x,
        tile.rect.y,
        drawCellWidth,
        drawCellHeight,
        destinationX,
        destinationY,
        drawCellWidth * scale,
        drawCellHeight * scale,
      );
    });

    context.strokeStyle = "rgba(111, 136, 173, 0.35)";
    context.lineWidth = 1;
    for (let x = 0; x <= options.widthInCells; x += 1) {
      const px = offsetX + x * options.tileWidth * scale;
      context.beginPath();
      context.moveTo(px, offsetY);
      context.lineTo(px, offsetY + drawHeight);
      context.stroke();
    }
    for (let y = 0; y <= options.heightInCells; y += 1) {
      const py = offsetY + y * options.tileHeight * scale;
      context.beginPath();
      context.moveTo(offsetX, py);
      context.lineTo(offsetX + drawWidth, py);
      context.stroke();
    }

    context.fillStyle = "rgba(255, 111, 168, 0.14)";
    context.strokeStyle = "rgba(255, 111, 168, 0.9)";
    context.lineWidth = 2;
    options.collisionCells.forEach((cell) => {
      const x = offsetX + cell.x * options.tileWidth * scale;
      const y = offsetY + cell.y * options.tileHeight * scale;
      context.fillRect(x, y, options.tileWidth * scale, options.tileHeight * scale);
      context.strokeRect(x, y, options.tileWidth * scale, options.tileHeight * scale);
    });

    options.markers?.forEach((marker) => {
      const radius = marker.radius ?? 6;
      const markerX = offsetX + marker.x * scale;
      const markerY = offsetY + marker.y * scale;
      context.fillStyle = marker.color;
      context.beginPath();
      context.arc(markerX, markerY, radius, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "rgba(8, 16, 27, 0.92)";
      context.lineWidth = 2;
      context.stroke();
      if (marker.label) {
        context.fillStyle = "#f7fbff";
        context.font = "11px sans-serif";
        context.fillText(marker.label, markerX + radius + 4, markerY + 4);
      }
    });
  };

  textureSources.forEach((url, key) => {
    const image = new Image();
    images.set(key, image);
    image.onload = render;
    image.src = url;
  });

  const handleClick = (event: MouseEvent): void => {
    if (options.readOnly) {
      return;
    }

    const scale = Math.min((width - 32) / mapPixelWidth, (height - 32) / mapPixelHeight, 2.2);
    const drawWidth = mapPixelWidth * scale;
    const drawHeight = mapPixelHeight * scale;
    const offsetX = Math.round((width - drawWidth) / 2);
    const offsetY = Math.round((height - drawHeight) / 2);
    const rect = canvas.getBoundingClientRect();
    const localX = event.clientX - rect.left - offsetX;
    const localY = event.clientY - rect.top - offsetY;
    if (localX < 0 || localY < 0 || localX >= drawWidth || localY >= drawHeight) {
      return;
    }
    const cellX = Math.floor(localX / (options.tileWidth * scale));
    const cellY = Math.floor(localY / (options.tileHeight * scale));
    options.onCellClick(cellX, cellY);
  };

  if (!options.readOnly) {
    canvas.addEventListener("click", handleClick);
  }

  render();

  return () => {
    disposed = true;
    canvas.removeEventListener("click", handleClick);
    canvas.remove();
  };
}
