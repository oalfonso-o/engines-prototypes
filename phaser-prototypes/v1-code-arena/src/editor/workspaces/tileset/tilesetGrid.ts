import Phaser from "phaser";
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

export function mountTilesetGridPreview(options: GridPreviewOptions): Phaser.Game {
  const width = Math.max(640, options.container.clientWidth || 780);

  class GridScene extends Phaser.Scene {
    preload(): void {
      this.load.image("source", options.imageUrl);
    }

    create(): void {
      const scale = Math.min((width - 48) / options.imageWidth, (PREVIEW_HEIGHT - 48) / options.imageHeight, 1);
      const drawWidth = options.imageWidth * scale;
      const drawHeight = options.imageHeight * scale;
      const offsetX = Math.round((width - drawWidth) / 2);
      const offsetY = Math.round((PREVIEW_HEIGHT - drawHeight) / 2);

      this.add.rectangle(width / 2, PREVIEW_HEIGHT / 2, width - 18, PREVIEW_HEIGHT - 18, 0x11182e, 1)
        .setStrokeStyle(1, 0x2a355e, 1);

      this.add.image(offsetX, offsetY, "source")
        .setOrigin(0, 0)
        .setDisplaySize(drawWidth, drawHeight);

      const graphics = this.add.graphics();
      options.cells.forEach((cell) => {
        const color = cell.active ? options.activeStrokeColor : options.inactiveStrokeColor;
        const alpha = cell.active ? 0.2 : 0.05;
        graphics.fillStyle(options.fillColor, alpha);
        graphics.fillRect(
          offsetX + cell.rect.x * scale,
          offsetY + cell.rect.y * scale,
          cell.rect.width * scale,
          cell.rect.height * scale,
        );
        graphics.lineStyle(2, color, cell.active ? 0.95 : 0.55);
        graphics.strokeRect(
          offsetX + cell.rect.x * scale,
          offsetY + cell.rect.y * scale,
          cell.rect.width * scale,
          cell.rect.height * scale,
        );
      });

      if (options.readOnly) {
        return;
      }

      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        const localX = (pointer.x - offsetX) / scale;
        const localY = (pointer.y - offsetY) / scale;
        const hit = options.cells.find((cell) => rectContainsPoint(cell.rect, localX, localY));
        if (hit) {
          options.onToggle(hit.id);
        }
      });
    }
  }

  return new Phaser.Game({
    type: Phaser.AUTO,
    width,
    height: PREVIEW_HEIGHT,
    parent: options.container,
    backgroundColor: "#0a1020",
    render: {
      pixelArt: true,
      antialias: false,
    },
    scene: GridScene,
  });
}
