import { createEditorId } from "../../domain/editorIds";
import type { RawAssetRecord, TilesetDefinition } from "../../domain/editorTypes";
import type { GridPreviewCell } from "./tilesetGrid";

export interface TilesetSerializerInput {
  rawAsset: RawAssetRecord;
  name: string;
  cellWidth: number;
  cellHeight: number;
  offsetX: number;
  offsetY: number;
  cells: GridPreviewCell[];
}

export function buildTilesetDefinition(input: TilesetSerializerInput): TilesetDefinition {
  const now = new Date().toISOString();
  return {
    id: createEditorId(),
    name: input.name,
    sourceAssetId: input.rawAsset.id,
    cellWidth: input.cellWidth,
    cellHeight: input.cellHeight,
    offsetX: input.offsetX,
    offsetY: input.offsetY,
    tiles: input.cells
      .filter((cell) => cell.active)
      .map((cell) => ({
        id: cell.id,
        rect: cell.rect,
        label: null,
      })),
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}
