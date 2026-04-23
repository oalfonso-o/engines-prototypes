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
  emptyLabel?: string;
}

const PREVIEW_WIDTH = 360;
const PREVIEW_HEIGHT = 260;

export function mountAnimationPreview(options: AnimationPreviewOptions): () => void {
  const canvas = document.createElement("canvas");
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  canvas.width = PREVIEW_WIDTH * dpr;
  canvas.height = PREVIEW_HEIGHT * dpr;
  canvas.style.width = `${PREVIEW_WIDTH}px`;
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
  let animationFrameId = 0;
  let frameIndex = 0;
  let lastAdvance = performance.now();

  const drawFrame = (): void => {
    context.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
    context.fillStyle = "#09111d";
    context.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
    context.strokeStyle = "#2d3f60";
    context.strokeRect(6, 6, PREVIEW_WIDTH - 12, PREVIEW_HEIGHT - 12);

    if (options.frames.length === 0) {
      context.fillStyle = "#9fb5d9";
      context.font = "18px serif";
      context.textAlign = "center";
      context.fillText(options.emptyLabel ?? "", PREVIEW_WIDTH / 2, PREVIEW_HEIGHT / 2);
      return;
    }

    const frame = options.frames[frameIndex];
    const scale = Math.min(180 / frame.rect.width, 180 / frame.rect.height, 6);
    const drawWidth = frame.rect.width * scale;
    const drawHeight = frame.rect.height * scale;
    const drawX = (PREVIEW_WIDTH - drawWidth) / 2;
    const drawY = (PREVIEW_HEIGHT - drawHeight) / 2;
    if (image.complete) {
      context.drawImage(
        image,
        frame.rect.x,
        frame.rect.y,
        frame.rect.width,
        frame.rect.height,
        drawX,
        drawY,
        drawWidth,
        drawHeight,
      );
    }
  };

  const tick = (time: number): void => {
    if (disposed) {
      return;
    }

    if (options.playing && options.frames.length > 1 && time - lastAdvance >= options.frameDurationMs) {
      lastAdvance = time;
      if (frameIndex === options.frames.length - 1) {
        if (options.loop) {
          frameIndex = 0;
        }
      } else {
        frameIndex += 1;
      }
    }

    drawFrame();
    animationFrameId = window.requestAnimationFrame(tick);
  };

  image.onload = () => {
    drawFrame();
  };
  image.src = options.imageUrl;
  drawFrame();
  animationFrameId = window.requestAnimationFrame(tick);

  return () => {
    disposed = true;
    window.cancelAnimationFrame(animationFrameId);
    canvas.remove();
  };
}
