import Phaser from "phaser";
import { preloadGameAssets, createGameAnimations, createGameTextures } from "../assets/gameAssets";
import { createColliderSystem } from "../colliders/createColliderSystem";
import { CoinField } from "../collectibles/CoinField";
import { buildLevel } from "../level/buildLevel";
import { createParallaxBackground, updateParallaxBackground, type BackgroundLayer } from "../level/parallaxBackground";
import { PlayerController } from "../player/PlayerController";
import { HudController } from "../ui/HudController";
import type { PrototypeSettings } from "../../settings/prototypeSettings";

export class CodeArenaScene extends Phaser.Scene {
  private readonly prototypeSettings: PrototypeSettings;
  private backgroundLayers: BackgroundLayer[] = [];
  private coinField!: CoinField;
  private player!: PlayerController;
  private hud!: HudController;

  constructor(settings: PrototypeSettings) {
    super("CodeArenaScene");
    this.prototypeSettings = settings;
  }

  preload(): void {
    preloadGameAssets(this);
  }

  create(): void {
    createGameTextures(this);
    createGameAnimations(this);
    this.backgroundLayers = createParallaxBackground(this);

    const colliders = createColliderSystem(this, this.prototypeSettings.debug.show_colliders);
    const level = buildLevel(this, colliders);
    this.coinField = new CoinField(this, colliders);
    this.player = new PlayerController(this, this.prototypeSettings.player, level.solidBodies, colliders);
    this.coinField.attachPlayer(this.player.getBody());
    this.hud = new HudController(this);
    this.player.configureCamera(this.cameras.main);
    this.hud.update(this.coinField.getCollectedCount(), this.coinField.getTotalCount(), this.coinField.isComplete());
  }

  update(_time: number, delta: number): void {
    updateParallaxBackground(this.backgroundLayers, this.cameras.main.scrollX);
    if (this.player.update(delta)) {
      return;
    }
    this.hud.update(this.coinField.getCollectedCount(), this.coinField.getTotalCount(), this.coinField.isComplete());
  }
}
