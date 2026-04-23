import * as Phaser from "phaser";
import type { GameBridge } from "../../bridge/GameBridge";
import { CoinField } from "../collectibles/CoinField";
import type { ColliderSystem } from "../colliders/createColliderSystem";
import { createColliderSystem } from "../colliders/createColliderSystem";
import type { OneWayPlatformSystem } from "../colliders/createOneWayPlatformSystem";
import { createOneWayPlatformSystem } from "../colliders/createOneWayPlatformSystem";
import type { BuiltLevel } from "../level/buildLevel";
import { buildLevel } from "../level/buildLevel";
import {
  createParallaxBackground,
  destroyParallaxBackground,
  updateParallaxBackground,
  type BackgroundLayer,
} from "../level/parallaxBackground";
import { PlayerController, type PlayerControllerState } from "../player/PlayerController";
import { HudController } from "../ui/HudController";
import type { PrototypeSettings } from "../../settings/prototypeSettings";
import type { GameTranslator } from "../i18n/GameTranslator";
import { SCENE_KEYS } from "./sceneKeys";
import type { RuntimeCampaignContent } from "../content/runtimeContent";

type CampaignSceneState = {
  player: PlayerControllerState;
  coins: ReturnType<CoinField["captureState"]>;
};

export class CampaignScene extends Phaser.Scene {
  private backgroundLayers: BackgroundLayer[] = [];
  private coinField?: CoinField;
  private player?: PlayerController;
  private hud?: HudController;
  private escapeKey?: Phaser.Input.Keyboard.Key;
  private colliderSystem?: ColliderSystem;
  private builtLevel?: BuiltLevel;
  private oneWayPlatforms?: OneWayPlatformSystem;

  constructor(
    private prototypeSettings: PrototypeSettings,
    private readonly campaignContent: RuntimeCampaignContent,
    private readonly bridge: GameBridge,
    private readonly translator: GameTranslator,
  ) {
    super(SCENE_KEYS.campaign);
  }

  create(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input is not available");
    }

    this.teardownRuntime();
    this.escapeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.buildRuntime();
  }

  update(_time: number, delta: number): void {
    if (this.escapeKey && Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      this.bridge.emit("campaignPauseRequested", { type: "campaignPauseRequested" });
      return;
    }

    updateParallaxBackground(this.backgroundLayers, this.cameras.main.scrollX);
    if (this.player?.update(delta)) {
      return;
    }

    this.hud?.update(
      this.coinField?.getCollectedCount() ?? 0,
      this.coinField?.getTotalCount() ?? 0,
      this.coinField?.isComplete() ?? false,
    );
  }

  applySettings(nextSettings: PrototypeSettings): void {
    const snapshot = this.captureState();
    this.prototypeSettings = nextSettings;

    if (!this.scene.isActive(SCENE_KEYS.campaign) && !this.scene.isPaused(SCENE_KEYS.campaign)) {
      return;
    }

    this.teardownRuntime();
    this.buildRuntime();
    if (snapshot) {
      this.restoreState(snapshot);
    }
  }

  private buildRuntime(): void {
    this.physics.world.gravity.y = this.prototypeSettings.player.movement.gravity_y;
    this.backgroundLayers = createParallaxBackground(this, this.prototypeSettings);

    this.colliderSystem = createColliderSystem(this, this.prototypeSettings.debug);
    this.builtLevel = buildLevel(this, this.colliderSystem, this.prototypeSettings, {
      groundSegments: this.campaignContent.groundSegments,
      floatingPlatforms: this.campaignContent.floatingPlatforms,
      waterStrips: this.campaignContent.waterStrips,
    });
    this.oneWayPlatforms = createOneWayPlatformSystem(
      this,
      this.builtLevel.oneWayPlatforms,
      this.prototypeSettings.one_way_platforms,
    );
    this.coinField = new CoinField(this, this.colliderSystem, this.prototypeSettings, this.campaignContent.coinPositions);
    this.player = new PlayerController(
      this,
      this.prototypeSettings.world,
      {
        ...this.prototypeSettings.player,
        spawn_x: this.campaignContent.spawnX,
        spawn_y: this.campaignContent.spawnY,
      },
      this.builtLevel.solidBodies,
      this.colliderSystem,
      this.oneWayPlatforms,
    );
    this.coinField.attachPlayer(this.player.getBody());
    this.hud = new HudController(this, this.prototypeSettings, this.translator);
    this.player.configureCamera(this.cameras.main);
    this.hud.update(this.coinField.getCollectedCount(), this.coinField.getTotalCount(), this.coinField.isComplete());
  }

  private teardownRuntime(): void {
    destroyParallaxBackground(this, this.backgroundLayers);
    this.backgroundLayers = [];
    this.hud?.destroy();
    this.hud = undefined;
    this.coinField?.destroy();
    this.coinField = undefined;
    this.player?.destroy();
    this.player = undefined;
    this.oneWayPlatforms?.destroy();
    this.oneWayPlatforms = undefined;
    this.builtLevel?.destroy();
    this.builtLevel = undefined;
    this.colliderSystem?.destroy();
    this.colliderSystem = undefined;
  }

  private captureState(): CampaignSceneState | null {
    if (!this.player || !this.coinField) {
      return null;
    }

    return {
      player: this.player.captureState(),
      coins: this.coinField.captureState(),
    };
  }

  private restoreState(state: CampaignSceneState): void {
    this.player?.restoreState(state.player);
    this.coinField?.restoreState(state.coins);
    this.hud?.update(
      this.coinField?.getCollectedCount() ?? 0,
      this.coinField?.getTotalCount() ?? 0,
      this.coinField?.isComplete() ?? false,
    );
  }
}
