import Phaser from "phaser";
import type { GameBridge } from "../../bridge/GameBridge";
import type { IntroSettings } from "../../settings/prototypeSettings";
import { SCENE_KEYS } from "./sceneKeys";

export class IntroScene extends Phaser.Scene {
  constructor(
    private readonly bridge: GameBridge,
    private settings: IntroSettings,
  ) {
    super(SCENE_KEYS.intro);
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const white = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0).setDepth(10);
    const black = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 1).setDepth(11);

    this.tweens.add({
      targets: white,
      alpha: 1,
      duration: this.settings.duration_ms * 0.5,
      ease: "Sine.easeInOut",
    });

    this.tweens.add({
      targets: black,
      alpha: 0,
      duration: this.settings.duration_ms * 0.5,
      ease: "Sine.easeInOut",
      yoyo: true,
      hold: 0,
    });

    this.time.delayedCall(this.settings.duration_ms, () => {
      this.bridge.emit("introCompleted", { type: "introCompleted" });
    });
  }

  applySettings(settings: IntroSettings): void {
    this.settings = settings;
  }
}
