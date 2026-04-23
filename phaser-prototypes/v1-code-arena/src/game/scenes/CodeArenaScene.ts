import * as Phaser from "phaser";
import { preloadGameAssets, createGameAnimations, createGameTextures } from "../assets/gameAssets";
import { createColliderSystem } from "../colliders/createColliderSystem";
import { createOneWayPlatformSystem } from "../colliders/createOneWayPlatformSystem";
import { CoinField } from "../collectibles/CoinField";
import { buildLevel } from "../level/buildLevel";
import { createParallaxBackground, updateParallaxBackground, type BackgroundLayer } from "../level/parallaxBackground";
import { PlayerController } from "../player/PlayerController";
import { HudController } from "../ui/HudController";
import type { PrototypeSettings } from "../../settings/prototypeSettings";
import { createFallbackAnimations, createFallbackTextures, type RuntimePlayerContent } from "../content/runtimeContent";

export class CodeArenaScene extends Phaser.Scene {
  private prototypeSettings: PrototypeSettings;
  private backgroundLayers: BackgroundLayer[] = [];
  private coinField!: CoinField;
  private player!: PlayerController;
  private hud!: HudController;

  constructor(settings: PrototypeSettings) {
    super("CodeArenaScene");
    this.prototypeSettings = settings;
  }

  preload(): void {
    preloadGameAssets(this, createFallbackTextures());
  }

  create(): void {
    createGameTextures(this);
    createGameAnimations(this, createFallbackAnimations());
    this.backgroundLayers = createParallaxBackground(this, this.prototypeSettings);

    const colliders = createColliderSystem(this, this.prototypeSettings.debug);
    const level = buildLevel(this, colliders, this.prototypeSettings);
    const oneWayPlatforms = createOneWayPlatformSystem(
      this,
      level.oneWayPlatforms,
      this.prototypeSettings.one_way_platforms,
    );
    this.coinField = new CoinField(this, colliders, this.prototypeSettings);
    this.player = new PlayerController(
      this,
      this.prototypeSettings.world,
      this.prototypeSettings.player,
      createFallbackPlayer(this.prototypeSettings),
      level.solidBodies,
      colliders,
      oneWayPlatforms,
    );
    this.coinField.attachPlayer(this.player.getBody());
    this.hud = new HudController(this, this.prototypeSettings);
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

function createFallbackPlayer(settings: PrototypeSettings): RuntimePlayerContent {
  return {
    characterId: "fallback:player",
    spawnX: settings.player.spawn_x,
    spawnY: settings.player.spawn_y,
    idleTextureKey: "player-idle-texture",
    animationKeys: {
      idle: "player-idle",
      run: "player-run",
      jump: "player-jump",
      attack: null,
    },
  };
}
