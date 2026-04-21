import Phaser from "phaser";
import type { ColliderSystem } from "../colliders/createColliderSystem";
import {
  FLOATING_PLATFORMS,
  GROUND_SEGMENTS,
  TILE_FRAME,
  TILE_SIZE,
  WATER_STRIPS,
} from "./levelData";

export interface BuiltLevel {
  solidBodies: Phaser.Physics.Arcade.StaticGroup;
}

export function buildLevel(scene: Phaser.Scene, colliders: ColliderSystem): BuiltLevel {
  const solidBodies = scene.physics.add.staticGroup();
  const tileLayer = scene.add.layer();

  GROUND_SEGMENTS.forEach((segment) => {
    renderGroundSegment(scene, tileLayer, segment);
    createSolidCollider(solidBodies, colliders, segment.start, segment.end, segment.top, segment.height);
  });

  FLOATING_PLATFORMS.forEach((segment) => {
    renderFloatingPlatform(scene, tileLayer, segment);
    createPlatformCollider(solidBodies, colliders, segment.start, segment.end, segment.y);
  });

  WATER_STRIPS.forEach((strip) => {
    renderWater(scene, tileLayer, strip);
  });

  return { solidBodies };
}

function renderGroundSegment(
  scene: Phaser.Scene,
  tileLayer: Phaser.GameObjects.Layer,
  segment: (typeof GROUND_SEGMENTS)[number],
): void {
  for (let x = segment.start; x <= segment.end; x += 1) {
    const topFrame = x === segment.start
      ? TILE_FRAME.groundLeft
      : x === segment.end
        ? TILE_FRAME.groundRight
        : TILE_FRAME.groundMid;
    addTile(scene, tileLayer, x, segment.top, topFrame);

    for (let row = 1; row < segment.height; row += 1) {
      const fillFrame = x === segment.start
        ? TILE_FRAME.fillLeft
        : x === segment.end
          ? TILE_FRAME.fillRight
          : TILE_FRAME.fillMid;
      addTile(scene, tileLayer, x, segment.top + row, fillFrame);
    }
  }
}

function renderFloatingPlatform(
  scene: Phaser.Scene,
  tileLayer: Phaser.GameObjects.Layer,
  segment: (typeof FLOATING_PLATFORMS)[number],
): void {
  for (let x = segment.start; x <= segment.end; x += 1) {
    const frame = x === segment.start
      ? TILE_FRAME.platformLeft
      : x === segment.end
        ? TILE_FRAME.platformRight
        : TILE_FRAME.platformMid;
    addTile(scene, tileLayer, x, segment.y, frame);
  }
}

function renderWater(
  scene: Phaser.Scene,
  tileLayer: Phaser.GameObjects.Layer,
  strip: (typeof WATER_STRIPS)[number],
): void {
  for (let x = strip.start; x <= strip.end; x += 1) {
    for (let row = 0; row < strip.rows; row += 1) {
      addTile(scene, tileLayer, x, strip.top + row, TILE_FRAME.water);
    }
  }
}

function addTile(
  scene: Phaser.Scene,
  tileLayer: Phaser.GameObjects.Layer,
  tileX: number,
  tileY: number,
  frame: number,
): Phaser.GameObjects.Image {
  const image = scene.add.image(
    (tileX * TILE_SIZE) + (TILE_SIZE * 0.5),
    (tileY * TILE_SIZE) + (TILE_SIZE * 0.5),
    "swamp-tiles",
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
): void {
  const width = (endTileX - startTileX + 1) * TILE_SIZE;
  const height = heightInTiles * TILE_SIZE;
  const x = (startTileX * TILE_SIZE) + (width * 0.5);
  const y = (topTileY * TILE_SIZE) + (height * 0.5);
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
  solidBodies: Phaser.Physics.Arcade.StaticGroup,
  colliders: ColliderSystem,
  startTileX: number,
  endTileX: number,
  tileY: number,
): void {
  const width = (endTileX - startTileX + 1) * TILE_SIZE;
  const x = (startTileX * TILE_SIZE) + (width * 0.5);
  const y = (tileY * TILE_SIZE) + 7;
  colliders.createStaticRect({
    type: "platform",
    group: solidBodies,
    x,
    y,
    width,
    height: 14,
  });
}
