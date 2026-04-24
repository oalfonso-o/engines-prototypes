import * as Phaser from "phaser";
import {
  getWorldHeightPx,
  getWorldWidthPx,
  type WorldSettings,
  type PlayerSettings,
} from "../../settings/prototypeSettings";
import type { ColliderSystem } from "../colliders/createColliderSystem";
import type { OneWayPlatformSystem } from "../colliders/createOneWayPlatformSystem";
import type { RuntimePlayerContent } from "../content/runtimeContent";
import { hexColorToNumber } from "../shared/color";
import { resolvePlayerBodyColliderConfig } from "./resolvePlayerBodyColliderConfig";

type ControlKeys = {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
  altJump: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  reset: Phaser.Input.Keyboard.Key;
};

export interface PlayerControllerState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  flipX: boolean;
}

export class PlayerController {
  private readonly scene: Phaser.Scene;
  private readonly worldSettings: WorldSettings;
  private readonly playerSettings: PlayerSettings;
  private readonly oneWayPlatforms: OneWayPlatformSystem;
  private readonly runtimePlayer: RuntimePlayerContent;
  private readonly playerBody: Phaser.Physics.Arcade.Image;
  private readonly playerSprite: Phaser.GameObjects.Sprite;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keys: ControlKeys;
  private currentPlayerAnim = "";

  constructor(
    scene: Phaser.Scene,
    worldSettings: WorldSettings,
    playerSettings: PlayerSettings,
    runtimePlayer: RuntimePlayerContent,
    solidBodies: Phaser.Physics.Arcade.StaticGroup,
    colliders: ColliderSystem,
    oneWayPlatforms: OneWayPlatformSystem,
  ) {
    this.scene = scene;
    this.worldSettings = worldSettings;
    this.playerSettings = playerSettings;
    this.runtimePlayer = runtimePlayer;
    this.oneWayPlatforms = oneWayPlatforms;

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
      down: Phaser.Input.Keyboard.KeyCodes.S,
      reset: Phaser.Input.Keyboard.KeyCodes.R,
    }) as ControlKeys;

    this.playerBody = scene.physics.add.image(
      runtimePlayer.spawnX,
      runtimePlayer.spawnY,
      "player-hitbox",
    );
    this.playerBody.setVisible(false);
    this.playerBody.setCollideWorldBounds(true);

    this.playerSprite = scene.add.sprite(
      this.playerBody.x,
      this.playerBody.y + playerSettings.visual.offset_y,
      runtimePlayer.idleTextureKey,
      0,
    );
    this.playerSprite.setScale(playerSettings.visual.scale);
    this.playerSprite.setOrigin(playerSettings.visual.origin_x, playerSettings.visual.origin_y);
    this.playAnimation(this.runtimePlayer.animationKeys.idle);

    colliders.attachDynamicRect(
      this.playerBody,
      resolvePlayerBodyColliderConfig(this.playerBody, this.playerSprite, this.playerSettings.body),
    );

    scene.physics.add.collider(this.playerBody, solidBodies);
    oneWayPlatforms.registerActor(this.playerBody, { allowManualDropThrough: true });
  }

  getBody(): Phaser.Physics.Arcade.Image {
    return this.playerBody;
  }

  captureState(): PlayerControllerState {
    const body = this.getPhysicsBody();
    return {
      x: this.playerBody.x,
      y: this.playerBody.y,
      velocityX: body.velocity.x,
      velocityY: body.velocity.y,
      flipX: this.playerSprite.flipX,
    };
  }

  restoreState(state: PlayerControllerState): void {
    this.playerBody.setPosition(state.x, state.y);
    this.playerBody.setVelocity(state.velocityX, state.velocityY);
    this.playerSprite.setFlipX(state.flipX);
    this.syncVisual();
    this.updateAnimation();
  }

  configureCamera(camera: Phaser.Cameras.Scene2D.Camera): void {
    const worldWidth = getWorldWidthPx(this.worldSettings);
    const worldHeight = getWorldHeightPx(this.worldSettings);
    this.scene.physics.world.setBounds(
      0,
      0,
      worldWidth,
      worldHeight + this.playerSettings.camera.world_bottom_padding_px,
    );
    camera.setBounds(0, 0, worldWidth, worldHeight);
    camera.startFollow(
      this.playerBody,
      true,
      this.playerSettings.camera.follow_lerp_x,
      this.playerSettings.camera.follow_lerp_y,
    );
    camera.setDeadzone(
      this.playerSettings.camera.deadzone_width,
      this.playerSettings.camera.deadzone_height,
    );
    camera.setRoundPixels(true);
  }

  update(delta: number): boolean {
    if (Phaser.Input.Keyboard.JustDown(this.keys.reset)) {
      this.scene.scene.restart();
      return true;
    }

    if (this.playerBody.y > getWorldHeightPx(this.worldSettings) + this.playerSettings.respawn.fall_margin_px) {
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

    const wantsDropThrough = Phaser.Input.Keyboard.JustDown(this.cursors.down)
      || Phaser.Input.Keyboard.JustDown(this.keys.down);

    if (wantsDropThrough) {
      this.oneWayPlatforms.requestDropDown(this.playerBody);
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
      this.playerSprite.setFlipX(this.runtimePlayer.sideFacing === "right");
    } else if (horizontal > 0) {
      this.playerSprite.setFlipX(this.runtimePlayer.sideFacing === "left");
    }

    this.updateAnimation();
    this.syncVisual();
    return false;
  }

  private syncVisual(): void {
    this.playerSprite.setPosition(this.playerBody.x, this.playerBody.y + this.playerSettings.visual.offset_y);
  }

  private respawn(): void {
    this.playerBody.setPosition(this.runtimePlayer.spawnX, this.runtimePlayer.spawnY);
    this.playerBody.setVelocity(0, 0);
    const flashColor = hexColorToNumber(this.playerSettings.respawn.flash_color);
    const flashR = (flashColor >> 16) & 0xff;
    const flashG = (flashColor >> 8) & 0xff;
    const flashB = flashColor & 0xff;
    this.scene.cameras.main.flash(
      this.playerSettings.respawn.flash_duration_ms,
      flashR,
      flashG,
      flashB,
      false,
    );
  }

  private updateAnimation(): void {
    if (!this.isGrounded()) {
      this.playAnimation(this.runtimePlayer.animationKeys.jump);
      return;
    }

    if (Math.abs(this.getPhysicsBody().velocity.x) > this.playerSettings.animation.run_min_horizontal_speed) {
      this.playAnimation(this.runtimePlayer.animationKeys.run);
      return;
    }

    this.playAnimation(this.runtimePlayer.animationKeys.idle);
  }

  private playAnimation(key: string): void {
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

  destroy(): void {
    this.playerSprite.destroy();
    this.playerBody.destroy();
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
