import Phaser from "phaser";
import type { RuntimeAnimationSource, RuntimeTextureSource } from "../content/runtimeContent";

export function preloadGameAssets(scene: Phaser.Scene, textures: RuntimeTextureSource[]): void {
  textures.forEach((texture) => {
    if (texture.type === "image") {
      scene.load.image(texture.key, texture.url);
      return;
    }

    scene.load.spritesheet(texture.key, texture.url, {
      frameWidth: texture.frameWidth ?? 32,
      frameHeight: texture.frameHeight ?? 32,
    });
  });
}

export function createGameTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists("player-hitbox")) {
    return;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
  graphics.clear();
  graphics.fillStyle(0xffffff, 1);
  graphics.fillRect(0, 0, 28, 48);
  graphics.generateTexture("player-hitbox", 28, 48);
  graphics.destroy();
}

export function createGameAnimations(scene: Phaser.Scene, animations: RuntimeAnimationSource[]): void {
  animations.forEach((animation) => {
    ensureAnimation(scene, animation.key, animation.textureKey, animation.frameCount, animation.frameRate, animation.repeat);
  });
}

function ensureAnimation(
  scene: Phaser.Scene,
  key: string,
  texture: string,
  frameCount: number,
  frameRate: number,
  repeat: number,
): void {
  if (scene.anims.exists(key)) {
    return;
  }

  scene.anims.create({
    key,
    frames: scene.anims.generateFrameNumbers(texture, {
      start: 0,
      end: frameCount - 1,
    }),
    frameRate,
    repeat,
  });
}
