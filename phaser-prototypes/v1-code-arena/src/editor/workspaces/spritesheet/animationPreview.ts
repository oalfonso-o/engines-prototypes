import Phaser from "phaser";
import type { Rect } from "../../domain/editorTypes";

export interface AnimationPreviewFrame {
  id: string;
  rect: Rect;
}

export interface AnimationPreviewOptions {
  container: HTMLElement;
  imageUrl: string;
  frames: AnimationPreviewFrame[];
  frameDurationMs: number;
  loop: boolean;
  playing: boolean;
}

const PREVIEW_WIDTH = 360;
const PREVIEW_HEIGHT = 260;

export function mountAnimationPreview(options: AnimationPreviewOptions): Phaser.Game {
  class PreviewScene extends Phaser.Scene {
    preload(): void {
      this.load.image("sheet", options.imageUrl);
    }

    create(): void {
      this.add.rectangle(PREVIEW_WIDTH / 2, PREVIEW_HEIGHT / 2, PREVIEW_WIDTH - 12, PREVIEW_HEIGHT - 12, 0x10172b, 1)
        .setStrokeStyle(1, 0x2d3f60, 1);

      if (options.frames.length === 0) {
        this.add.text(PREVIEW_WIDTH / 2, PREVIEW_HEIGHT / 2, "Select frames", {
          color: "#9fb5d9",
          fontSize: "18px",
        }).setOrigin(0.5);
        return;
      }

      const image = this.add.image(PREVIEW_WIDTH / 2, PREVIEW_HEIGHT / 2, "sheet").setOrigin(0.5);
      let frameIndex = 0;
      const showFrame = (index: number): void => {
        const frame = options.frames[index];
        image.setCrop(frame.rect.x, frame.rect.y, frame.rect.width, frame.rect.height);
        const scale = Math.min(180 / frame.rect.width, 180 / frame.rect.height, 6);
        image.setDisplaySize(frame.rect.width * scale, frame.rect.height * scale);
      };

      showFrame(0);

      if (!options.playing || options.frames.length <= 1) {
        return;
      }

      const timer = this.time.addEvent({
        delay: options.frameDurationMs,
        loop: true,
        callback: () => {
          if (frameIndex === options.frames.length - 1) {
            if (!options.loop) {
              timer.remove(false);
              return;
            }
            frameIndex = 0;
          } else {
            frameIndex += 1;
          }
          showFrame(frameIndex);
        },
      });
    }
  }

  return new Phaser.Game({
    type: Phaser.AUTO,
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    parent: options.container,
    backgroundColor: "#09111d",
    render: {
      pixelArt: true,
      antialias: false,
    },
    scene: PreviewScene,
  });
}
