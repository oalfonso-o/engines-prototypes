import Phaser from "phaser";
import type { DynamicRectColliderConfig } from "../colliders/createColliderSystem";
import type { PlayerBodySettings, PlayerSettings } from "../../settings/prototypeSettings";
import type { ColliderSystem } from "../colliders/createColliderSystem";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../level/levelData";

type ControlKeys = {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
  altJump: Phaser.Input.Keyboard.Key;
  reset: Phaser.Input.Keyboard.Key;
};

type PlayerAnimationKey = "player-idle" | "player-run" | "player-jump";

export class PlayerController {
  private readonly scene: Phaser.Scene;
  private readonly playerSettings: PlayerSettings;
  private readonly playerBody: Phaser.Physics.Arcade.Image;
  private readonly playerSprite: Phaser.GameObjects.Sprite;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keys: ControlKeys;
  private currentPlayerAnim: PlayerAnimationKey | "" = "";

  constructor(
    scene: Phaser.Scene,
    playerSettings: PlayerSettings,
    solidBodies: Phaser.Physics.Arcade.StaticGroup,
    colliders: ColliderSystem,
  ) {
    this.scene = scene;
    this.playerSettings = playerSettings;

    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input is not available");
    }

    this.cursors = keyboard.createCursorKeys();
    this.keys = keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.W,
      altJump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      reset: Phaser.Input.Keyboard.KeyCodes.R,
    }) as ControlKeys;

    this.playerBody = scene.physics.add.image(
      playerSettings.spawn_x,
      playerSettings.spawn_y,
      "player-hitbox",
    );
    this.playerBody.setVisible(false);
    this.playerBody.setCollideWorldBounds(true);

    this.playerSprite = scene.add.sprite(
      this.playerBody.x,
      this.playerBody.y + playerSettings.visual_offset_y,
      "shinobi-idle",
      0,
    );
    this.playerSprite.setScale(playerSettings.sprite_scale);
    this.playerSprite.setOrigin(0.5, 0.8);
    this.playAnimation("player-idle");

    colliders.attachDynamicRect(this.playerBody, this.resolveBodyColliderConfig());

    scene.physics.add.collider(this.playerBody, solidBodies);
  }

  getBody(): Phaser.Physics.Arcade.Image {
    return this.playerBody;
  }

  configureCamera(camera: Phaser.Cameras.Scene2D.Camera): void {
    this.scene.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT + 160);
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.startFollow(this.playerBody, true, 0.09, 0.09);
    camera.setDeadzone(160, 90);
    camera.setRoundPixels(true);
  }

  update(delta: number): boolean {
    if (Phaser.Input.Keyboard.JustDown(this.keys.reset)) {
      this.scene.scene.restart();
      return true;
    }

    if (this.playerBody.y > WORLD_HEIGHT + 64) {
      this.respawn();
    }

    let horizontal = 0;
    if (this.cursors.left.isDown || this.keys.left.isDown) {
      horizontal -= 1;
    }
    if (this.cursors.right.isDown || this.keys.right.isDown) {
      horizontal += 1;
    }

    const movement = this.playerSettings.movement;
    const playerPhysicsBody = this.getPhysicsBody();
    const targetVelocityX = horizontal * movement.max_run_speed;
    const currentVelocityX = playerPhysicsBody.velocity.x;
    const grounded = this.isGrounded();
    const acceleration = grounded ? movement.ground_acceleration : movement.air_acceleration;
    const deceleration = grounded ? movement.ground_deceleration : movement.air_deceleration;

    if (horizontal !== 0) {
      this.playerBody.setVelocityX(approach(currentVelocityX, targetVelocityX, acceleration * delta * 0.001));
    } else {
      this.playerBody.setVelocityX(approach(currentVelocityX, 0, deceleration * delta * 0.001));
    }

    const wantsJump = Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.keys.jump)
      || Phaser.Input.Keyboard.JustDown(this.keys.altJump);

    if (wantsJump && grounded) {
      this.playerBody.setVelocityY(-movement.jump_velocity);
    }

    if (playerPhysicsBody.velocity.y > movement.max_fall_speed) {
      this.playerBody.setVelocityY(movement.max_fall_speed);
    }

    if (horizontal < 0) {
      this.playerSprite.setFlipX(true);
    } else if (horizontal > 0) {
      this.playerSprite.setFlipX(false);
    }

    this.updateAnimation();
    this.syncVisual();
    return false;
  }

  private syncVisual(): void {
    this.playerSprite.setPosition(this.playerBody.x, this.playerBody.y + this.playerSettings.visual_offset_y);
  }

  private respawn(): void {
    this.playerBody.setPosition(this.playerSettings.spawn_x, this.playerSettings.spawn_y);
    this.playerBody.setVelocity(0, 0);
    this.scene.cameras.main.flash(120, 120, 180, 255, false);
  }

  private updateAnimation(): void {
    if (!this.isGrounded()) {
      this.playAnimation("player-jump");
      return;
    }

    if (Math.abs(this.getPhysicsBody().velocity.x) > 4) {
      this.playAnimation("player-run");
      return;
    }

    this.playAnimation("player-idle");
  }

  private playAnimation(key: PlayerAnimationKey): void {
    if (this.currentPlayerAnim === key) {
      return;
    }

    this.currentPlayerAnim = key;
    this.playerSprite.play(key, true);
  }

  private isGrounded(): boolean {
    const playerPhysicsBody = this.getPhysicsBody();
    return playerPhysicsBody.blocked.down || playerPhysicsBody.touching.down;
  }

  private getPhysicsBody(): Phaser.Physics.Arcade.Body {
    return this.playerBody.body as Phaser.Physics.Arcade.Body;
  }

  private resolveBodyColliderConfig(): DynamicRectColliderConfig {
    if (this.playerSettings.body.mode === "from_sprite") {
      return this.createSpriteSizedBodyConfig(this.playerSettings.body);
    }

    return {
      type: "player",
      width: this.playerSettings.body.width,
      height: this.playerSettings.body.height,
      offsetX: this.playerSettings.body.offset_x,
      offsetY: this.playerSettings.body.offset_y,
    };
  }

  private createSpriteSizedBodyConfig(bodySettings: PlayerBodySettings): DynamicRectColliderConfig {
    const spriteWidth = this.playerSprite.displayWidth;
    const spriteHeight = this.playerSprite.displayHeight;
    const colliderWidth = Math.max(1, Math.round(spriteWidth * bodySettings.width_ratio));
    const colliderHeight = Math.max(1, Math.round(spriteHeight * bodySettings.height_ratio));

    const bodyTopLeftX = this.playerBody.x - (this.playerBody.displayWidth * this.playerBody.originX);
    const bodyTopLeftY = this.playerBody.y - (this.playerBody.displayHeight * this.playerBody.originY);
    const spriteTopLeftX = this.playerSprite.x - (spriteWidth * this.playerSprite.originX);
    const spriteTopLeftY = this.playerSprite.y - (spriteHeight * this.playerSprite.originY);

    const spriteLocalLeft = spriteTopLeftX - bodyTopLeftX;
    const spriteLocalTop = spriteTopLeftY - bodyTopLeftY;
    const offsetX = Math.round(spriteLocalLeft + ((spriteWidth - colliderWidth) * bodySettings.align_x));
    const offsetY = Math.round(spriteLocalTop + ((spriteHeight - colliderHeight) * bodySettings.align_y));

    return {
      type: "player",
      width: colliderWidth,
      height: colliderHeight,
      offsetX,
      offsetY,
    };
  }
}

function approach(current: number, target: number, delta: number): number {
  if (current < target) {
    return Math.min(current + delta, target);
  }

  if (current > target) {
    return Math.max(current - delta, target);
  }

  return target;
}
