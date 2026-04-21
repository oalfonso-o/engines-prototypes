import Phaser from "phaser";
import { VIEW_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from "./levelData";

export interface BackgroundLayer {
  sprite: Phaser.GameObjects.TileSprite;
  factor: number;
}

export function createParallaxBackground(scene: Phaser.Scene): BackgroundLayer[] {
  const backgroundLayers: BackgroundLayer[] = [];
  const factors = [0.04, 0.08, 0.12, 0.18, 0.26];
  const keys = ["swamp-bg-1", "swamp-bg-2", "swamp-bg-3", "swamp-bg-4", "swamp-bg-5"];

  keys.forEach((key, index) => {
    const layer = scene.add.tileSprite(
      WORLD_WIDTH * 0.5,
      WORLD_HEIGHT * 0.5,
      WORLD_WIDTH + VIEW_WIDTH,
      WORLD_HEIGHT,
      key,
    );
    layer.setScrollFactor(0);
    layer.setTileScale(WORLD_HEIGHT / 324, WORLD_HEIGHT / 324);
    layer.setAlpha(index === keys.length - 1 ? 0.92 : 1);
    layer.setDepth(-100 + index);
    backgroundLayers.push({ sprite: layer, factor: factors[index] });
  });

  scene.add.rectangle(WORLD_WIDTH * 0.5, WORLD_HEIGHT * 0.5, WORLD_WIDTH, WORLD_HEIGHT, 0x0b1020, 0.18)
    .setDepth(-110)
    .setScrollFactor(0);

  return backgroundLayers;
}

export function updateParallaxBackground(backgroundLayers: BackgroundLayer[], scrollX: number): void {
  backgroundLayers.forEach((layer) => {
    layer.sprite.tilePositionX = scrollX * layer.factor;
  });
}
