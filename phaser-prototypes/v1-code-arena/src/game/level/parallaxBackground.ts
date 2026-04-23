import Phaser from "phaser";
import {
  getWorldHeightPx,
  getWorldWidthPx,
  type PrototypeSettings,
} from "../../settings/prototypeSettings";
import { hexColorToNumber } from "../shared/color";

export interface BackgroundLayer {
  sprite: Phaser.GameObjects.TileSprite;
  factor: number;
}

const PARALLAX_DATA_KEY = "parallaxBackground";

export function createParallaxBackground(
  scene: Phaser.Scene,
  settings: PrototypeSettings,
): BackgroundLayer[] {
  const backgroundLayers: BackgroundLayer[] = [];
  const worldWidth = getWorldWidthPx(settings.world);
  const worldHeight = getWorldHeightPx(settings.world);
  const factors = settings.parallax.factors;
  const keys = ["swamp-bg-1", "swamp-bg-2", "swamp-bg-3", "swamp-bg-4", "swamp-bg-5"];

  keys.forEach((key, index) => {
    const layer = scene.add.tileSprite(
      worldWidth * 0.5,
      worldHeight * 0.5,
      worldWidth + settings.world.view_width,
      worldHeight,
      key,
    );
    layer.setData(PARALLAX_DATA_KEY, true);
    layer.setScrollFactor(0);
    layer.setTileScale(
      worldHeight / settings.parallax.height_reference_px,
      worldHeight / settings.parallax.height_reference_px,
    );
    layer.setAlpha(index === keys.length - 1 ? settings.parallax.farthest_layer_alpha : 1);
    layer.setDepth(-100 + index);
    backgroundLayers.push({ sprite: layer, factor: factors[index] ?? factors[factors.length - 1] ?? 0 });
  });

  scene.add.rectangle(
    worldWidth * 0.5,
    worldHeight * 0.5,
    worldWidth,
    worldHeight,
    hexColorToNumber(settings.parallax.overlay_color),
    settings.parallax.overlay_alpha,
  )
    .setData(PARALLAX_DATA_KEY, true)
    .setDepth(-110)
    .setScrollFactor(0);

  return backgroundLayers;
}

export function updateParallaxBackground(backgroundLayers: BackgroundLayer[], scrollX: number): void {
  backgroundLayers.forEach((layer) => {
    layer.sprite.tilePositionX = scrollX * layer.factor;
  });
}

export function destroyParallaxBackground(
  scene: Phaser.Scene,
  backgroundLayers: BackgroundLayer[],
): void {
  const layerSprites = new Set(backgroundLayers.map((layer) => layer.sprite));
  backgroundLayers.forEach((layer) => {
    layer.sprite.destroy();
  });

  scene.children.list
    .filter((child) => child.getData?.(PARALLAX_DATA_KEY) && !layerSprites.has(child as Phaser.GameObjects.TileSprite))
    .forEach((child) => child.destroy());
}
