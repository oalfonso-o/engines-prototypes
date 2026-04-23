import Phaser from "phaser";
import type { GameTranslator } from "../i18n/GameTranslator";
import { campaign as defaultCampaignCopy } from "../../app/i18n/locales/en/campaign";
import type { HudTextBlockSettings, PrototypeSettings } from "../../settings/prototypeSettings";

export class HudController {
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly instructionsText: Phaser.GameObjects.Text;
  private readonly completeText: Phaser.GameObjects.Text;
  private readonly translator: GameTranslator | null;

  constructor(scene: Phaser.Scene, settings: PrototypeSettings, translator?: GameTranslator) {
    this.translator = translator ?? null;
    const { hud, world } = settings;

    this.titleText = scene.add.text(
      hud.title.x ?? 0,
      hud.title.y,
      this.translate("campaign.ui.title", defaultCampaignCopy.ui.title),
      this.createTextStyle(hud.title),
    ).setScrollFactor(0);

    this.statusText = scene.add.text(
      hud.status.x ?? 0,
      hud.status.y,
      "",
      this.createTextStyle(hud.status),
    ).setScrollFactor(0);

    this.instructionsText = scene.add.text(
      hud.instructions.x ?? 0,
      world.view_height - (hud.instructions.bottom_offset_px ?? 0),
      this.translate("campaign.ui.instructions", defaultCampaignCopy.ui.instructions),
      this.createTextStyle(hud.instructions),
    ).setScrollFactor(0);

    this.completeText = scene.add.text(
      world.view_width - (hud.complete.right_offset_px ?? 0),
      hud.complete.y,
      "",
      this.createTextStyle(hud.complete),
    ).setOrigin(1, 0).setScrollFactor(0);
  }

  update(coinsCollected: number, totalCoins: number, levelComplete: boolean): void {
    this.statusText.setText(this.translate("campaign.ui.coins", defaultCampaignCopy.ui.coins, {
      collected: coinsCollected,
      total: totalCoins,
    }));
    this.completeText.setText(levelComplete ? this.translate("campaign.ui.complete", defaultCampaignCopy.ui.complete) : "");
  }

  private translate(
    key: string,
    fallback: string,
    options?: Record<string, unknown>,
  ): string {
    if (!this.translator) {
      return fallback;
    }

    return this.translator.t(key, options);
  }

  private createTextStyle(config: HudTextBlockSettings): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "Georgia, serif",
      fontSize: `${config.font_size_px}px`,
      color: config.color,
    };
  }

  destroy(): void {
    this.titleText.destroy();
    this.statusText.destroy();
    this.instructionsText.destroy();
    this.completeText.destroy();
  }
}
