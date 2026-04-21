import Phaser from "phaser";
import type { ColliderSystem } from "../colliders/createColliderSystem";
import { COIN_POSITIONS, TILE_SIZE } from "../level/levelData";

type CoinSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

export class CoinField {
  private readonly scene: Phaser.Scene;
  private readonly coins: Phaser.Physics.Arcade.Group;
  private coinsCollected = 0;

  constructor(scene: Phaser.Scene, colliders: ColliderSystem) {
    this.scene = scene;
    this.coins = scene.physics.add.group({
      allowGravity: false,
      immovable: true,
    });

    COIN_POSITIONS.forEach((position) => {
      const coin = this.coins.create(
        position.x * TILE_SIZE,
        position.y * TILE_SIZE,
        "swamp-coin",
        0,
      ) as CoinSprite;
      coin.play("coin-spin");
      coin.setScale(2.4);
      colliders.attachDynamicCircle(coin, {
        type: "coin",
        radius: 10,
        offsetX: -5,
        offsetY: -5,
      });
    });
  }

  attachPlayer(playerBody: Phaser.Physics.Arcade.Image): void {
    this.scene.physics.add.overlap(playerBody, this.coins, (_player, coin) => {
      const collectible = coin as CoinSprite;
      if (!collectible.active) {
        return;
      }

      collectible.disableBody(true, true);
      this.coinsCollected += 1;
    });
  }

  getCollectedCount(): number {
    return this.coinsCollected;
  }

  getTotalCount(): number {
    return COIN_POSITIONS.length;
  }

  isComplete(): boolean {
    return this.coinsCollected === COIN_POSITIONS.length;
  }
}
