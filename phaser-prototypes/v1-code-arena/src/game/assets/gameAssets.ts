import Phaser from "phaser";

export function preloadGameAssets(scene: Phaser.Scene): void {
  scene.load.spritesheet("shinobi-idle", "assets/shinobi/Idle.png", {
    frameWidth: 128,
    frameHeight: 128,
  });
  scene.load.spritesheet("shinobi-run", "assets/shinobi/Run.png", {
    frameWidth: 128,
    frameHeight: 128,
  });
  scene.load.spritesheet("shinobi-jump", "assets/shinobi/Jump.png", {
    frameWidth: 128,
    frameHeight: 128,
  });

  scene.load.spritesheet("swamp-tiles", "assets/swamp/Tileset.png", {
    frameWidth: 32,
    frameHeight: 32,
  });
  scene.load.image("swamp-bg-1", "assets/swamp/background/1.png");
  scene.load.image("swamp-bg-2", "assets/swamp/background/2.png");
  scene.load.image("swamp-bg-3", "assets/swamp/background/3.png");
  scene.load.image("swamp-bg-4", "assets/swamp/background/4.png");
  scene.load.image("swamp-bg-5", "assets/swamp/background/5.png");
  scene.load.spritesheet("swamp-coin", "assets/swamp/animated/Coin.png", {
    frameWidth: 10,
    frameHeight: 10,
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

export function createGameAnimations(scene: Phaser.Scene): void {
  ensureAnimation(scene, "player-idle", "shinobi-idle", 6, 8, -1);
  ensureAnimation(scene, "player-run", "shinobi-run", 8, 12, -1);
  ensureAnimation(scene, "player-jump", "shinobi-jump", 12, 14, -1);
  ensureAnimation(scene, "coin-spin", "swamp-coin", 4, 10, -1);
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
