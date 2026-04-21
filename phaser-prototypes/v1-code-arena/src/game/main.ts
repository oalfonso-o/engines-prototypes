import Phaser from "phaser";
import { CodeArenaScene } from "./scenes/CodeArenaScene";
import type { PrototypeSettings } from "../settings/prototypeSettings";

function createGameConfig(parent: string, settings: PrototypeSettings): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 540,
    backgroundColor: "#0b1020",
    pixelArt: true,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: settings.player.movement.gravity_y },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [new CodeArenaScene(settings)],
  };
}

export function startGame(parent: string, settings: PrototypeSettings): Phaser.Game {
  return new Phaser.Game(createGameConfig(parent, settings));
}
