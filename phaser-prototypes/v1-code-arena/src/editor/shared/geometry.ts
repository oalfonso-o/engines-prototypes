import { createEditorId } from "../domain/editorIds";
import type { Rect } from "../domain/editorTypes";

export interface GridBuildResult {
  cells: Array<{ id: string; rect: Rect }>;
  hasOverflow: boolean;
}

export function buildUniformGrid(
  imageWidth: number,
  imageHeight: number,
  cellWidth: number,
  cellHeight: number,
  offsetX: number,
  offsetY: number,
): GridBuildResult {
  const cells: Array<{ id: string; rect: Rect }> = [];

  for (let y = offsetY; y + cellHeight <= imageHeight; y += cellHeight) {
    for (let x = offsetX; x + cellWidth <= imageWidth; x += cellWidth) {
      cells.push({
        id: createEditorId(),
        rect: {
          x,
          y,
          width: cellWidth,
          height: cellHeight,
        },
      });
    }
  }

  const maxX = cells.length === 0 ? offsetX : Math.max(...cells.map((entry) => entry.rect.x + entry.rect.width));
  const maxY = cells.length === 0 ? offsetY : Math.max(...cells.map((entry) => entry.rect.y + entry.rect.height));

  return {
    cells,
    hasOverflow: maxX < imageWidth || maxY < imageHeight,
  };
}

export function rectContainsPoint(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && y >= rect.y && x < rect.x + rect.width && y < rect.y + rect.height;
}
