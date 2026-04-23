import * as Phaser from "phaser";
import type { ColliderSystem } from "../colliders/createColliderSystem";
import type { CoinPosition, PrototypeSettings } from "../../settings/prototypeSettings";
import type { RuntimePickupSpawn } from "../content/runtimeContent";

type CoinSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
type CoinFieldState = {
  collectedIndexes: number[];
};

export class CoinField {
  private readonly scene: Phaser.Scene;
  private readonly pickupSpawns: RuntimePickupSpawn[];
  private readonly coins: Phaser.Physics.Arcade.Group;
  private overlap?: Phaser.Physics.Arcade.Collider;
  private coinsCollected = 0;

  constructor(scene: Phaser.Scene, colliders: ColliderSystem, settings: PrototypeSettings, pickupSpawns?: RuntimePickupSpawn[]) {
    this.scene = scene;
    this.pickupSpawns = pickupSpawns ?? buildFallbackPickupSpawns(settings.level.coin_positions, settings.world.tile_size);
    this.coins = scene.physics.add.group({
      allowGravity: false,
      immovable: true,
    });

    this.pickupSpawns.forEach((spawn) => {
      const coin = this.coins.create(
        spawn.x,
        spawn.y,
        spawn.textureKey,
        0,
      ) as CoinSprite;
      coin.play(spawn.animationKey);
      coin.setScale(spawn.scale);
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
    return this.pickupSpawns.length;
  }

  isComplete(): boolean {
    return this.coinsCollected === this.pickupSpawns.length;
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
      coin.play(this.pickupSpawns[index]?.animationKey ?? "pickup-animation:core:animation:coin-spin");
    });
  }

  destroy(): void {
    this.overlap?.destroy();
    this.coins.destroy(true);
  }
}

function buildFallbackPickupSpawns(coinPositions: CoinPosition[], tileSize: number): RuntimePickupSpawn[] {
  return coinPositions.map((position, index) => ({
    id: `coin-${index}`,
    x: position.x * tileSize,
    y: position.y * tileSize,
    textureKey: "pickup-texture:core:animation:coin-spin",
    animationKey: "pickup-animation:core:animation:coin-spin",
    scale: 2.4,
  }));
}
