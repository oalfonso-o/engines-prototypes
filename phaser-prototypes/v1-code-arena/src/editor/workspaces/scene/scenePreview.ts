import type { CollisionCellRecord, TileFitMode } from "../../domain/editorTypes";

export interface ResolvedSceneTile {
  x: number;
  y: number;
  textureId: string;
  textureUrl: string;
  rect: { x: number; y: number; width: number; height: number };
}

export interface ScenePreviewMarker {
  x: number;
  y: number;
  color: string;
  label?: string;
  radius?: number;
}

export interface ScenePreviewZone {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label?: string;
}

export type ScenePreviewInteractionMode = "pan" | "entry-point" | "trigger-zone";

export interface ScenePreviewOptions {
  container: HTMLElement;
  widthInCells: number;
  heightInCells: number;
  tileWidth: number;
  tileHeight: number;
  tileFitMode: TileFitMode;
  tiles: ResolvedSceneTile[];
  collisionCells: CollisionCellRecord[];
  markers?: ScenePreviewMarker[];
  zones?: ScenePreviewZone[];
  interactionMode?: ScenePreviewInteractionMode;
  onPlaceEntryPoint?: (cellX: number, cellY: number) => void;
  onCreateTriggerZone?: (bounds: { startCellX: number; startCellY: number; endCellX: number; endCellY: number }) => void;
}

interface CellCoordinate {
  cellX: number;
  cellY: number;
}

export function mountScenePreview(options: ScenePreviewOptions): () => void {
  const width = Math.max(640, Math.floor(options.container.clientWidth || 960));
  const height = Math.max(420, Math.floor(options.container.clientHeight || 560));
  const scenePixelWidth = options.widthInCells * options.tileWidth;
  const scenePixelHeight = options.heightInCells * options.tileHeight;
  const baseScale = Math.min((width - 80) / scenePixelWidth, (height - 80) / scenePixelHeight, 3);
  const minScale = Math.max(baseScale * 0.6, 0.15);
  const maxScale = Math.max(baseScale, 1) * 6;
  const interactionMode = options.interactionMode ?? "pan";

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
  canvas.className = "scene-preview-canvas";
  canvas.dataset.mode = interactionMode;
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
  let scale = baseScale;
  let panX = 0;
  let panY = 0;
  let dragState: { x: number; y: number } | null = null;
  let triggerDragStart: CellCoordinate | null = null;
  let triggerDragCurrent: CellCoordinate | null = null;

  const getOffsets = (nextScale = scale) => ({
    x: Math.round(((width - (scenePixelWidth * nextScale)) * 0.5) + panX),
    y: Math.round(((height - (scenePixelHeight * nextScale)) * 0.5) + panY),
  });

  const getDraftZone = (): ScenePreviewZone | null => {
    if (!triggerDragStart || !triggerDragCurrent) {
      return null;
    }

    const minCellX = Math.min(triggerDragStart.cellX, triggerDragCurrent.cellX);
    const minCellY = Math.min(triggerDragStart.cellY, triggerDragCurrent.cellY);
    const maxCellX = Math.max(triggerDragStart.cellX, triggerDragCurrent.cellX);
    const maxCellY = Math.max(triggerDragStart.cellY, triggerDragCurrent.cellY);
    return {
      x: minCellX * options.tileWidth,
      y: minCellY * options.tileHeight,
      width: (maxCellX - minCellX + 1) * options.tileWidth,
      height: (maxCellY - minCellY + 1) * options.tileHeight,
      color: "#72d4ff",
    };
  };

  const render = (): void => {
    if (disposed) {
      return;
    }

    const offset = getOffsets();
    const drawWidth = scenePixelWidth * scale;
    const drawHeight = scenePixelHeight * scale;
    const draftZone = getDraftZone();

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#060b14";
    context.fillRect(0, 0, width, height);

    context.fillStyle = "rgba(12, 18, 31, 0.98)";
    context.fillRect(offset.x, offset.y, drawWidth, drawHeight);

    options.tiles.forEach((tile) => {
      const image = images.get(tile.textureId);
      if (!image) {
        return;
      }

      const destinationX = offset.x + (tile.x * options.tileWidth * scale);
      const destinationY = offset.y + (tile.y * options.tileHeight * scale);
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

    context.strokeStyle = "rgba(111, 136, 173, 0.18)";
    context.lineWidth = 1;
    for (let x = 0; x <= options.widthInCells; x += 1) {
      const px = offset.x + x * options.tileWidth * scale;
      context.beginPath();
      context.moveTo(px, offset.y);
      context.lineTo(px, offset.y + drawHeight);
      context.stroke();
    }
    for (let y = 0; y <= options.heightInCells; y += 1) {
      const py = offset.y + y * options.tileHeight * scale;
      context.beginPath();
      context.moveTo(offset.x, py);
      context.lineTo(offset.x + drawWidth, py);
      context.stroke();
    }

    context.strokeStyle = "rgba(111, 136, 173, 0.7)";
    context.lineWidth = 1.5;
    context.strokeRect(offset.x, offset.y, drawWidth, drawHeight);

    context.fillStyle = "rgba(255, 111, 168, 0.16)";
    context.strokeStyle = "rgba(255, 111, 168, 0.74)";
    context.lineWidth = 1.2;
    options.collisionCells.forEach((cell) => {
      const x = offset.x + (cell.x * options.tileWidth * scale);
      const y = offset.y + (cell.y * options.tileHeight * scale);
      context.fillRect(x, y, options.tileWidth * scale, options.tileHeight * scale);
      context.strokeRect(x, y, options.tileWidth * scale, options.tileHeight * scale);
    });

    [...(options.zones ?? []), ...(draftZone ? [draftZone] : [])].forEach((zone) => {
      const x = offset.x + (zone.x * scale);
      const y = offset.y + (zone.y * scale);
      const zoneWidth = zone.width * scale;
      const zoneHeight = zone.height * scale;
      context.fillStyle = `${zone.color}22`;
      context.strokeStyle = zone.color;
      context.lineWidth = 2;
      context.fillRect(x, y, zoneWidth, zoneHeight);
      context.strokeRect(x, y, zoneWidth, zoneHeight);
      if (zone.label) {
        context.fillStyle = "#f7fbff";
        context.font = "11px sans-serif";
        context.fillText(zone.label, x + 6, y + 16);
      }
    });

    options.markers?.forEach((marker) => {
      const radius = marker.radius ?? 6;
      const markerX = offset.x + (marker.x * scale);
      const markerY = offset.y + (marker.y * scale);
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

  const resolveCellFromPointer = (event: PointerEvent): CellCoordinate | null => {
    const rect = canvas.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const offset = getOffsets();
    const worldX = (localX - offset.x) / scale;
    const worldY = (localY - offset.y) / scale;
    if (worldX < 0 || worldY < 0 || worldX >= scenePixelWidth || worldY >= scenePixelHeight) {
      return null;
    }

    return {
      cellX: clamp(Math.floor(worldX / options.tileWidth), 0, options.widthInCells - 1),
      cellY: clamp(Math.floor(worldY / options.tileHeight), 0, options.heightInCells - 1),
    };
  };

  const handlePointerDown = (event: PointerEvent): void => {
    if (interactionMode === "entry-point") {
      const cell = resolveCellFromPointer(event);
      if (!cell) {
        return;
      }
      options.onPlaceEntryPoint?.(cell.cellX, cell.cellY);
      return;
    }

    if (interactionMode === "trigger-zone") {
      const cell = resolveCellFromPointer(event);
      if (!cell) {
        return;
      }
      triggerDragStart = cell;
      triggerDragCurrent = cell;
      canvas.setPointerCapture(event.pointerId);
      render();
      return;
    }

    dragState = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("is-dragging");
  };

  const handlePointerMove = (event: PointerEvent): void => {
    if (interactionMode === "trigger-zone") {
      if (!triggerDragStart) {
        return;
      }
      const cell = resolveCellFromPointer(event);
      if (!cell) {
        return;
      }
      triggerDragCurrent = cell;
      render();
      return;
    }

    if (!dragState) {
      return;
    }

    panX += event.clientX - dragState.x;
    panY += event.clientY - dragState.y;
    dragState = { x: event.clientX, y: event.clientY };
    render();
  };

  const handlePointerUp = (event: PointerEvent): void => {
    if (interactionMode === "trigger-zone") {
      if (triggerDragStart && triggerDragCurrent) {
        options.onCreateTriggerZone?.({
          startCellX: triggerDragStart.cellX,
          startCellY: triggerDragStart.cellY,
          endCellX: triggerDragCurrent.cellX,
          endCellY: triggerDragCurrent.cellY,
        });
      }
      triggerDragStart = null;
      triggerDragCurrent = null;
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      render();
      return;
    }

    dragState = null;
    canvas.classList.remove("is-dragging");
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    const offset = getOffsets();
    const worldX = (localX - offset.x) / scale;
    const worldY = (localY - offset.y) / scale;
    const nextScale = clamp(
      scale * (event.deltaY < 0 ? 1.12 : 0.89),
      minScale,
      maxScale,
    );
    const centeredOffsetX = (width - (scenePixelWidth * nextScale)) * 0.5;
    const centeredOffsetY = (height - (scenePixelHeight * nextScale)) * 0.5;
    panX = localX - centeredOffsetX - (worldX * nextScale);
    panY = localY - centeredOffsetY - (worldY * nextScale);
    scale = nextScale;
    render();
  };

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerUp);
  canvas.addEventListener("wheel", handleWheel, { passive: false });

  render();

  return () => {
    disposed = true;
    canvas.removeEventListener("pointerdown", handlePointerDown);
    canvas.removeEventListener("pointermove", handlePointerMove);
    canvas.removeEventListener("pointerup", handlePointerUp);
    canvas.removeEventListener("pointercancel", handlePointerUp);
    canvas.removeEventListener("wheel", handleWheel);
    canvas.remove();
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
