import * as Phaser from "phaser";
import type { ColliderSystem } from "../colliders/createColliderSystem";
import type { PrototypeSettings } from "../../settings/prototypeSettings";
import type { RuntimeSceneContent, RuntimeSolidBlock, RuntimeTileCell, RuntimeOneWayPlatform } from "../content/runtimeContent";

export interface BuiltSceneRuntime {
  solidBodies: Phaser.Physics.Arcade.StaticGroup;
  oneWayPlatforms: Phaser.Physics.Arcade.StaticGroup;
  destroy(): void;
}

export function buildSceneRuntime(
  scene: Phaser.Scene,
  colliders: ColliderSystem,
  settings: PrototypeSettings,
  runtimeScene: RuntimeSceneContent,
): BuiltSceneRuntime {
  const solidBodies = scene.physics.add.staticGroup();
  const oneWayPlatforms = scene.physics.add.staticGroup();
  const tileLayer = scene.add.layer();

  runtimeScene.tiles.forEach((tile) => {
    addTile(scene, tileLayer, tile, runtimeScene.tileWidth, runtimeScene.tileHeight);
  });

  runtimeScene.solidBlocks.forEach((block) => {
    createSolidCollider(solidBodies, colliders, block, runtimeScene.tileWidth, runtimeScene.tileHeight);
  });

  runtimeScene.oneWayPlatforms.forEach((platform) => {
    createPlatformCollider(oneWayPlatforms, colliders, settings, platform, runtimeScene.tileWidth, runtimeScene.tileHeight);
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

function addTile(
  scene: Phaser.Scene,
  tileLayer: Phaser.GameObjects.Layer,
  tile: RuntimeTileCell,
  tileWidth: number,
  tileHeight: number,
): Phaser.GameObjects.Image {
  const image = scene.add.image(
    (tile.x * tileWidth) + (tileWidth * 0.5),
    (tile.y * tileHeight) + (tileHeight * 0.5),
    tile.textureKey,
    tile.frame,
  );
  image.setOrigin(0.5, 0.5);
  tileLayer.add(image);
  return image;
}

function createSolidCollider(
  solidBodies: Phaser.Physics.Arcade.StaticGroup,
  colliders: ColliderSystem,
  block: RuntimeSolidBlock,
  tileWidth: number,
  tileHeight: number,
): void {
  const width = (block.end - block.start + 1) * tileWidth;
  const height = block.height * tileHeight;
  const x = (block.start * tileWidth) + (width * 0.5);
  const y = (block.top * tileHeight) + (height * 0.5);
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
  segment: RuntimeOneWayPlatform,
  tileWidth: number,
  tileHeight = tileWidth,
): void {
  const width = (segment.end - segment.start + 1) * tileWidth;
  const x = (segment.start * tileWidth) + (width * 0.5);
  const y = (segment.y * tileHeight) + settings.one_way_platforms.collider_y_offset_px;
  colliders.createStaticRect({
    type: "platform",
    group: oneWayPlatforms,
    x,
    y,
    width,
    height: settings.one_way_platforms.collider_height_px,
  });
}
