import Phaser from "phaser";
import { VIEW_HEIGHT, VIEW_WIDTH } from "../level/levelData";

export class HudController {
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly completeText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    scene.add.text(24, 18, "PHASER V1 PLATFORMER", {
      fontFamily: "Georgia, serif",
      fontSize: "26px",
      color: "#edf2ff",
    }).setScrollFactor(0);

    this.statusText = scene.add.text(24, 52, "", {
      fontFamily: "Georgia, serif",
      fontSize: "18px",
      color: "#b2c2e8",
    }).setScrollFactor(0);

    scene.add.text(24, VIEW_HEIGHT - 28, "Left/right move. Up, W or Space jump. R resets. Collect all swamp coins.", {
      fontFamily: "Georgia, serif",
      fontSize: "16px",
      color: "#d5ddf1",
    }).setScrollFactor(0);

    this.completeText = scene.add.text(VIEW_WIDTH - 24, 18, "", {
      fontFamily: "Georgia, serif",
      fontSize: "22px",
      color: "#ffd7a8",
    }).setOrigin(1, 0).setScrollFactor(0);
  }

  update(coinsCollected: number, totalCoins: number, levelComplete: boolean): void {
    this.statusText.setText(`Coins: ${coinsCollected} / ${totalCoins}`);
    this.completeText.setText(levelComplete ? "Swamp clear" : "");
  }
}
