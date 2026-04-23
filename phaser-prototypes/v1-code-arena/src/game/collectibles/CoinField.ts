import Phaser from "phaser";
import type { ColliderSystem } from "../colliders/createColliderSystem";
import type { CoinPosition, PrototypeSettings } from "../../settings/prototypeSettings";

type CoinSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
type CoinFieldState = {
  collectedIndexes: number[];
};

export class CoinField {
  private readonly scene: Phaser.Scene;
  private readonly coinPositions: CoinPosition[];
  private readonly coins: Phaser.Physics.Arcade.Group;
  private overlap?: Phaser.Physics.Arcade.Collider;
  private coinsCollected = 0;

  constructor(scene: Phaser.Scene, colliders: ColliderSystem, settings: PrototypeSettings, coinPositions?: CoinPosition[]) {
    this.scene = scene;
    this.coinPositions = coinPositions ?? settings.level.coin_positions;
    this.coins = scene.physics.add.group({
      allowGravity: false,
      immovable: true,
    });

    this.coinPositions.forEach((position) => {
      const coin = this.coins.create(
        position.x * settings.world.tile_size,
        position.y * settings.world.tile_size,
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
    this.overlap = this.scene.physics.add.overlap(playerBody, this.coins, (_player, coin) => {
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
    return this.coinPositions.length;
  }

  isComplete(): boolean {
    return this.coinsCollected === this.coinPositions.length;
  }

  captureState(): CoinFieldState {
    const collectedIndexes: number[] = [];
    (this.coins.getChildren() as CoinSprite[]).forEach((coin, index) => {
      if (!coin.active) {
        collectedIndexes.push(index);
      }
    });
    return { collectedIndexes };
  }

  restoreState(state: CoinFieldState): void {
    this.coinsCollected = 0;
    (this.coins.getChildren() as CoinSprite[]).forEach((coin, index) => {
      const collected = state.collectedIndexes.includes(index);
      if (collected) {
        coin.disableBody(true, true);
        this.coinsCollected += 1;
        return;
      }

      coin.enableBody(false, coin.x, coin.y, true, true);
      coin.play("coin-spin");
    });
  }

  destroy(): void {
    this.overlap?.destroy();
    this.coins.destroy(true);
  }
}
