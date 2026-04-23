import Phaser from "phaser";
import type { EditorPreviewState } from "../../bridge/bridgeCommands";
import type { GameTranslator } from "../i18n/GameTranslator";
import { SCENE_KEYS } from "./sceneKeys";

export class EditorPreviewScene extends Phaser.Scene {
  private previewState: EditorPreviewState = { kind: "ambient-grid" };
  private grid?: Phaser.GameObjects.Graphics;
  private background?: Phaser.GameObjects.Rectangle;

  constructor(_translator: GameTranslator) {
    super(SCENE_KEYS.editorPreview);
  }

  create(): void {
    this.renderPreview();
    this.applyState();
  }

  setPreviewState(state: EditorPreviewState): void {
    this.previewState = state;
    if (this.grid) {
      this.applyState();
    }
  }

  refreshLocale(): void {}

  applySettings(): void {
    if (!this.scene.isActive(SCENE_KEYS.editorPreview)) {
      return;
    }

    this.renderPreview();
    this.applyState();
  }

  private applyState(): void {
    if (!this.grid || !this.background) {
      return;
    }

    const hidden = this.previewState.kind === "hidden";
    this.grid.setVisible(!hidden);
    this.background.setVisible(!hidden);
  }

  private renderPreview(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    this.background?.destroy();
    this.grid?.destroy();

    this.background = this.add.rectangle(width / 2, height / 2, width, height, 0x09111f, 1);
    this.grid = this.add.graphics().setAlpha(0.95);
    this.renderGrid();
  }

  private renderGrid(): void {
    if (!this.grid) {
      return;
    }

    const width = this.scale.width;
    const height = this.scale.height;
    this.grid.clear();
    this.grid.lineStyle(1, 0x1e3c63, 0.45);

    const spacing = 44;

    for (let x = -spacing; x < width + spacing; x += spacing) {
      this.grid.lineBetween(x, 0, x, height);
    }

    for (let y = -spacing; y < height + spacing; y += spacing) {
      this.grid.lineBetween(0, y, width, y);
    }
  }
}
