import * as Phaser from "phaser";
import { preloadGameAssets, createGameAnimations, createGameTextures } from "../assets/gameAssets";
import type { RuntimeAnimationSource, RuntimeTextureSource } from "../content/runtimeContent";
import { SCENE_KEYS } from "./sceneKeys";

export class BootScene extends Phaser.Scene {
  constructor(
    private readonly textureCatalog: RuntimeTextureSource[],
    private readonly animationCatalog: RuntimeAnimationSource[],
    private readonly onReady: () => void,
  ) {
    super(SCENE_KEYS.boot);
  }

  preload(): void {
    preloadGameAssets(this, this.textureCatalog);
  }

  create(): void {
    createGameTextures(this);
    createGameAnimations(this, this.animationCatalog);
    this.onReady();
  }
}
