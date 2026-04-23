import * as Phaser from "phaser";
import {
  getWorldHeightPx,
  getWorldWidthPx,
  type PrototypeSettings,
} from "../../settings/prototypeSettings";
import type { RuntimeBackgroundLayerSource } from "../content/runtimeContent";
import { hexColorToNumber } from "../shared/color";

export interface BackgroundLayer {
  sprite: Phaser.GameObjects.TileSprite;
  factor: number;
}

const PARALLAX_DATA_KEY = "parallaxBackground";

export function createParallaxBackground(
  scene: Phaser.Scene,
  settings: PrototypeSettings,
  runtimeLayers?: RuntimeBackgroundLayerSource[],
): BackgroundLayer[] {
  const backgroundLayers: BackgroundLayer[] = [];
  const worldWidth = getWorldWidthPx(settings.world);
  const worldHeight = getWorldHeightPx(settings.world);
  const fallbackFactors = settings.parallax.factors;
  const layers = runtimeLayers && runtimeLayers.length > 0
    ? runtimeLayers
    : ["background:core:raw:swamp:bg-1", "background:core:raw:swamp:bg-2", "background:core:raw:swamp:bg-3", "background:core:raw:swamp:bg-4", "background:core:raw:swamp:bg-5"]
      .map((textureKey, index) => ({
        textureKey,
        factor: fallbackFactors[index] ?? fallbackFactors[fallbackFactors.length - 1] ?? 0,
        fitMode: "cover" as const,
        offsetX: 0,
        offsetY: 0,
      }));

  layers.forEach((layerDef, index) => {
    const layer = scene.add.tileSprite(
      worldWidth * 0.5,
      worldHeight * 0.5,
      worldWidth + settings.world.view_width,
      worldHeight,
      layerDef.textureKey,
    );
    layer.setData(PARALLAX_DATA_KEY, true);
    layer.setScrollFactor(0);
    layer.setTileScale(
      worldHeight / settings.parallax.height_reference_px,
      worldHeight / settings.parallax.height_reference_px,
    );
    layer.setTilePosition(layerDef.offsetX, layerDef.offsetY);
    layer.setAlpha(index === layers.length - 1 ? settings.parallax.farthest_layer_alpha : 1);
    layer.setDepth(-100 + index);
    backgroundLayers.push({ sprite: layer, factor: layerDef.factor });
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
