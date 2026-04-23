import * as Phaser from "phaser";
import type { ColliderSystem } from "../colliders/createColliderSystem";
import { TILE_FRAME } from "./levelData";
import type { FloatingPlatform, GroundSegment, PrototypeSettings, WaterStrip } from "../../settings/prototypeSettings";

const LEGACY_SWAMP_TILESET_KEY = "tileset:core:tileset:swamp-main";

interface LegacyLevelSource {
  groundSegments: GroundSegment[];
  floatingPlatforms: FloatingPlatform[];
  waterStrips: WaterStrip[];
}

export interface BuiltLevel {
  solidBodies: Phaser.Physics.Arcade.StaticGroup;
  oneWayPlatforms: Phaser.Physics.Arcade.StaticGroup;
  destroy(): void;
}

export function buildLevel(
  scene: Phaser.Scene,
  colliders: ColliderSystem,
  settings: PrototypeSettings,
  levelSource?: LegacyLevelSource,
): BuiltLevel {
  const solidBodies = scene.physics.add.staticGroup();
  const oneWayPlatforms = scene.physics.add.staticGroup();
  const tileLayer = scene.add.layer();
  const tileSize = settings.world.tile_size;
  const layout = levelSource ?? {
    groundSegments: settings.level.ground_segments,
    floatingPlatforms: settings.level.floating_platforms,
    waterStrips: settings.level.water_strips,
  };

  layout.groundSegments.forEach((segment) => {
    renderGroundSegment(scene, tileLayer, segment, tileSize);
    createSolidCollider(solidBodies, colliders, segment.start, segment.end, segment.top, segment.height, tileSize);
  });

  layout.floatingPlatforms.forEach((segment) => {
    renderFloatingPlatform(scene, tileLayer, segment, tileSize);
    createPlatformCollider(oneWayPlatforms, colliders, settings, segment.start, segment.end, segment.y, tileSize);
  });

  layout.waterStrips.forEach((strip) => {
    renderWater(scene, tileLayer, strip, tileSize);
  });

  return {
    solidBodies,
    oneWayPlatforms,
    destroy(): void {
      tileLayer.destroy(true);
      solidBodies.destroy(true);
      oneWayPlatforms.destroy(true);
    },
  };
}

function renderGroundSegment(
  scene: Phaser.Scene,
  tileLayer: Phaser.GameObjects.Layer,
  segment: GroundSegment,
  tileSize: number,
): void {
  for (let x = segment.start; x <= segment.end; x += 1) {
    const topFrame = x === segment.start
      ? TILE_FRAME.groundLeft
      : x === segment.end
        ? TILE_FRAME.groundRight
        : TILE_FRAME.groundMid;
    addTile(scene, tileLayer, x, segment.top, topFrame, tileSize);

    for (let row = 1; row < segment.height; row += 1) {
      const fillFrame = x === segment.start
        ? TILE_FRAME.fillLeft
        : x === segment.end
          ? TILE_FRAME.fillRight
          : TILE_FRAME.fillMid;
      addTile(scene, tileLayer, x, segment.top + row, fillFrame, tileSize);
    }
  }
}

function renderFloatingPlatform(
  scene: Phaser.Scene,
  tileLayer: Phaser.GameObjects.Layer,
  segment: FloatingPlatform,
  tileSize: number,
): void {
  for (let x = segment.start; x <= segment.end; x += 1) {
    const frame = x === segment.start
      ? TILE_FRAME.platformLeft
      : x === segment.end
        ? TILE_FRAME.platformRight
        : TILE_FRAME.platformMid;
    addTile(scene, tileLayer, x, segment.y, frame, tileSize);
  }
}

function renderWater(
  scene: Phaser.Scene,
  tileLayer: Phaser.GameObjects.Layer,
  strip: WaterStrip,
  tileSize: number,
): void {
  for (let x = strip.start; x <= strip.end; x += 1) {
    for (let row = 0; row < strip.rows; row += 1) {
      addTile(scene, tileLayer, x, strip.top + row, TILE_FRAME.water, tileSize);
    }
  }
}

function addTile(
  scene: Phaser.Scene,
  tileLayer: Phaser.GameObjects.Layer,
  tileX: number,
  tileY: number,
  frame: number,
  tileSize: number,
): Phaser.GameObjects.Image {
  const image = scene.add.image(
    (tileX * tileSize) + (tileSize * 0.5),
    (tileY * tileSize) + (tileSize * 0.5),
    LEGACY_SWAMP_TILESET_KEY,
    frame,
  );
  image.setOrigin(0.5, 0.5);
  tileLayer.add(image);
  return image;
}

function createSolidCollider(
  solidBodies: Phaser.Physics.Arcade.StaticGroup,
  colliders: ColliderSystem,
  startTileX: number,
  endTileX: number,
  topTileY: number,
  heightInTiles: number,
  tileSize: number,
): void {
  const width = (endTileX - startTileX + 1) * tileSize;
  const height = heightInTiles * tileSize;
  const x = (startTileX * tileSize) + (width * 0.5);
  const y = (topTileY * tileSize) + (height * 0.5);
  colliders.createStaticRect({
    type: "floor",
    group: solidBodies,
    x,
    y,
    width,
    height,
  });
}

function createPlatformCollider(
  oneWayPlatforms: Phaser.Physics.Arcade.StaticGroup,
  colliders: ColliderSystem,
  settings: PrototypeSettings,
  startTileX: number,
  endTileX: number,
  tileY: number,
  tileSize: number,
): void {
  const width = (endTileX - startTileX + 1) * tileSize;
  const x = (startTileX * tileSize) + (width * 0.5);
  const y = (tileY * tileSize) + settings.one_way_platforms.collider_y_offset_px;
  colliders.createStaticRect({
    type: "platform",
    group: oneWayPlatforms,
    x,
    y,
    width,
    height: settings.one_way_platforms.collider_height_px,
  });
}
