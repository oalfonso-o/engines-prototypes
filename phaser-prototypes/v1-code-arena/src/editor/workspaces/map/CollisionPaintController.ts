import type { CollisionCellRecord, MapCellRecord } from "../../domain/editorTypes";

export function setPaintCell(
  cells: MapCellRecord[],
  x: number,
  y: number,
  tilesetId: string,
  tileId: string,
): MapCellRecord[] {
  const withoutCell = cells.filter((cell) => cell.x !== x || cell.y !== y);
  return sortRowMajor([...withoutCell, { x, y, tilesetId, tileId }]);
}

export function erasePaintCell(cells: MapCellRecord[], x: number, y: number): MapCellRecord[] {
  return sortRowMajor(cells.filter((cell) => cell.x !== x || cell.y !== y));
}

export function toggleCollisionCell(cells: CollisionCellRecord[], x: number, y: number): CollisionCellRecord[] {
  const exists = cells.some((cell) => cell.x === x && cell.y === y);
  if (exists) {
    return sortRowMajor(cells.filter((cell) => cell.x !== x || cell.y !== y));
  }

  return sortRowMajor([...cells, { x, y }]);
}

export function sortRowMajor<T extends { x: number; y: number }>(cells: T[]): T[] {
  return [...cells].sort((left, right) => {
    if (left.y === right.y) {
      return left.x - right.x;
    }
    return left.y - right.y;
  });
}
