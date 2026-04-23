import * as Phaser from "phaser";
import type { ColliderSystem } from "../colliders/createColliderSystem";
import { createColliderSystem } from "../colliders/createColliderSystem";
import type { BuiltLevel } from "../level/buildLevel";
import { buildLevel } from "../level/buildLevel";
import {
  createParallaxBackground,
  destroyParallaxBackground,
  updateParallaxBackground,
  type BackgroundLayer,
} from "../level/parallaxBackground";
import {
  type GroundSegment,
  getWorldHeightPx,
  getWorldWidthPx,
  type PrototypeSettings,
} from "../../settings/prototypeSettings";
import { resolvePlayerBodyColliderConfig } from "../player/resolvePlayerBodyColliderConfig";
import { SCENE_KEYS } from "./sceneKeys";

export class MenuBackgroundScene extends Phaser.Scene {
  private prototypeSettings: PrototypeSettings;
  private backgroundLayers: BackgroundLayer[] = [];
  private hero?: Phaser.GameObjects.Sprite;
  private heroBodyAnchor?: Phaser.GameObjects.Image;
  private baseScrollX = 0;
  private baseScrollY = 0;
  private colliderSystem?: ColliderSystem;
  private builtLevel?: BuiltLevel;

  constructor(settings: PrototypeSettings) {
    super(SCENE_KEYS.menuBackground);
    this.prototypeSettings = settings;
  }

  create(): void {
    this.teardownScene();
    this.buildScene();
  }

  update(time: number): void {
    const driftX = Math.sin(time * this.prototypeSettings.menu_background.drift_speed_x)
      * this.prototypeSettings.menu_background.drift_amplitude_x;
    const driftY = Math.cos(time * this.prototypeSettings.menu_background.drift_speed_y)
      * this.prototypeSettings.menu_background.drift_amplitude_y;
    const targetScrollX = this.baseScrollX + driftX;
    const targetScrollY = this.baseScrollY + driftY;
    this.cameras.main.setScroll(
      Phaser.Math.Linear(this.cameras.main.scrollX, targetScrollX, 0.045),
      Phaser.Math.Linear(this.cameras.main.scrollY, targetScrollY, 0.045),
    );
    updateParallaxBackground(this.backgroundLayers, this.cameras.main.scrollX);
  }

  applySettings(nextSettings: PrototypeSettings): void {
    this.prototypeSettings = nextSettings;
    if (!this.scene.isActive(SCENE_KEYS.menuBackground)) {
      return;
    }

    this.teardownScene();
    this.buildScene();
  }

  private buildScene(): void {
    this.backgroundLayers = createParallaxBackground(this, this.prototypeSettings);
    this.colliderSystem = createColliderSystem(this, this.prototypeSettings.debug);
    this.builtLevel = buildLevel(this, this.colliderSystem, this.prototypeSettings);

    const worldWidth = getWorldWidthPx(this.prototypeSettings.world);
    const worldHeight = getWorldHeightPx(this.prototypeSettings.world);

    this.hero = this.add.sprite(
      this.prototypeSettings.player.spawn_x,
      this.prototypeSettings.player.spawn_y + this.prototypeSettings.player.visual.offset_y,
      "player-idle-texture",
      0,
    );
    this.hero.setScale(
      this.prototypeSettings.player.visual.scale * this.prototypeSettings.menu_background.hero_scale_multiplier,
    );
    this.hero.setOrigin(
      this.prototypeSettings.player.visual.origin_x,
      this.prototypeSettings.player.visual.origin_y,
    );
    this.hero.play("player-idle");

    this.heroBodyAnchor = this.add.image(
      this.prototypeSettings.player.spawn_x,
      this.prototypeSettings.player.spawn_y,
      "player-hitbox",
    );
    this.heroBodyAnchor.setVisible(false);
    this.groundHeroOnFloor();

    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setRoundPixels(false);
    this.cameras.main.setZoom(this.prototypeSettings.menu_background.camera_zoom);

    this.baseScrollX = Math.max(
      0,
      (this.hero?.x ?? 0)
        - ((this.scale.width / this.cameras.main.zoom) * this.prototypeSettings.menu_background.camera_anchor_x),
    );
    this.baseScrollY = Math.max(
      0,
      (this.hero?.y ?? 0)
        - ((this.scale.height / this.cameras.main.zoom) * this.prototypeSettings.menu_background.camera_anchor_y),
    );
    this.cameras.main.setScroll(this.baseScrollX, this.baseScrollY);
  }

  private teardownScene(): void {
    destroyParallaxBackground(this, this.backgroundLayers);
    this.backgroundLayers = [];
    this.heroBodyAnchor?.destroy();
    this.heroBodyAnchor = undefined;
    this.hero?.destroy();
    this.hero = undefined;
    this.builtLevel?.destroy();
    this.builtLevel = undefined;
    this.colliderSystem?.destroy();
    this.colliderSystem = undefined;
  }

  private groundHeroOnFloor(): void {
    if (!this.hero || !this.heroBodyAnchor) {
      return;
    }

    const colliderConfig = resolvePlayerBodyColliderConfig(
      this.heroBodyAnchor,
      this.hero,
      this.prototypeSettings.player.body,
    );
    const groundTopY = this.findGroundTopYForX(this.prototypeSettings.player.spawn_x);
    const bodyCenterY = groundTopY
      - colliderConfig.offsetY
      - colliderConfig.height
      + (this.heroBodyAnchor.displayHeight * this.heroBodyAnchor.originY);

    this.heroBodyAnchor.setPosition(this.prototypeSettings.player.spawn_x, bodyCenterY);
    this.hero.setPosition(
      this.heroBodyAnchor.x,
      this.heroBodyAnchor.y + this.prototypeSettings.player.visual.offset_y,
    );
  }

  private findGroundTopYForX(worldX: number): number {
    const tileSize = this.prototypeSettings.world.tile_size;
    const tileX = worldX / tileSize;
    const matchingSegments = this.prototypeSettings.level.ground_segments
      .filter((segment) => this.segmentContainsX(segment, tileX));
    const topTileY = matchingSegments.reduce<number | null>((current, segment) => {
      if (current === null) {
        return segment.top;
      }

      return Math.min(current, segment.top);
    }, null);

    if (topTileY === null) {
      return this.prototypeSettings.player.spawn_y;
    }

    return topTileY * tileSize;
  }

  private segmentContainsX(segment: GroundSegment, tileX: number): boolean {
    return tileX >= segment.start && tileX <= segment.end + 1;
  }
}
