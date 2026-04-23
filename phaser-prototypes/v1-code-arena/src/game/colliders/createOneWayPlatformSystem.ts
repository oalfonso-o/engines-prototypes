import Phaser from "phaser";
import type { OneWayPlatformSettings } from "../../settings/prototypeSettings";

type DynamicArcadeActor = Phaser.GameObjects.GameObject & {
  body: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | null;
  x: number;
  y: number;
  active: boolean;
};

type StaticArcadeObject = Phaser.GameObjects.GameObject & {
  body: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | null;
  active: boolean;
};

type RegisteredActor = {
  target: DynamicArcadeActor;
  body: Phaser.Physics.Arcade.Body;
  allowManualDropThrough: boolean;
  ignorePlatformsUntilMs: number;
};

export interface OneWayPlatformActorOptions {
  allowManualDropThrough?: boolean;
}

export interface OneWayPlatformSystem {
  registerActor(target: DynamicArcadeActor, options?: OneWayPlatformActorOptions): void;
  requestDropDown(target: DynamicArcadeActor): boolean;
  destroy(): void;
}

export function createOneWayPlatformSystem(
  scene: Phaser.Scene,
  platforms: Phaser.Physics.Arcade.StaticGroup,
  settings: OneWayPlatformSettings,
): OneWayPlatformSystem {
  const actors = new Map<DynamicArcadeActor, RegisteredActor>();
  const platformColliders: Phaser.Physics.Arcade.Collider[] = [];

  return {
    registerActor(target, options = {}): void {
      if (actors.has(target)) {
        return;
      }

      const body = getDynamicBody(target);
      const entry: RegisteredActor = {
        target,
        body,
        allowManualDropThrough: options.allowManualDropThrough ?? false,
        ignorePlatformsUntilMs: 0,
      };

      actors.set(target, entry);

      const collider = scene.physics.add.collider(
        target,
        platforms,
        undefined,
        (_actorObject, platformObject) => shouldCollideWithPlatform(entry, platformObject, scene.time.now, settings),
      );
      platformColliders.push(collider);
    },

    requestDropDown(target): boolean {
      const entry = actors.get(target);
      if (!entry || !entry.allowManualDropThrough) {
        return false;
      }

      const standingPlatform = findStandingPlatform(entry, platforms, settings);
      if (!standingPlatform) {
        return false;
      }

      entry.ignorePlatformsUntilMs = scene.time.now + settings.drop_through_duration_ms;
      entry.target.y += settings.drop_through_nudge_px;
      entry.body.updateFromGameObject();
      entry.body.velocity.y = Math.max(entry.body.velocity.y, settings.drop_through_fall_speed);
      return true;
    },

    destroy(): void {
      platformColliders.splice(0).forEach((collider) => collider.destroy());
      actors.clear();
    },
  };
}

function shouldCollideWithPlatform(
  entry: RegisteredActor,
  platformObject: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile,
  nowMs: number,
  settings: OneWayPlatformSettings,
): boolean {
  if (entry.ignorePlatformsUntilMs > nowMs) {
    return false;
  }

  if (!isStaticArcadeObject(platformObject) || !platformObject.active) {
    return false;
  }

  const platformBody = getStaticBody(platformObject);
  const actorBody = entry.body;
  const previousBottom = actorBody.prev.y + actorBody.height;
  const platformTop = platformBody.y;
  const isFallingOrSettling = actorBody.velocity.y >= 0;
  const wasAbovePlatform = previousBottom <= platformTop + settings.landing_tolerance_px;

  return isFallingOrSettling && wasAbovePlatform;
}

function findStandingPlatform(
  entry: RegisteredActor,
  platforms: Phaser.Physics.Arcade.StaticGroup,
  settings: OneWayPlatformSettings,
): StaticArcadeObject | null {
  const actorBody = entry.body;
  const actorBottom = actorBody.y + actorBody.height;
  const actorLeft = actorBody.x;
  const actorRight = actorBody.x + actorBody.width;

  const children = platforms.getChildren() as StaticArcadeObject[];
  for (const platform of children) {
    if (!platform.active) {
      continue;
    }

    const platformBody = getStaticBody(platform);
    const platformTop = platformBody.y;
    const platformLeft = platformBody.x;
    const platformRight = platformBody.x + platformBody.width;
    const overlapsHorizontally = actorRight > platformLeft && actorLeft < platformRight;
    const isStandingOnTop = Math.abs(actorBottom - platformTop) <= settings.landing_tolerance_px;

    if (overlapsHorizontally && isStandingOnTop) {
      return platform;
    }
  }

  return null;
}

function isStaticArcadeObject(
  value: unknown,
): value is StaticArcadeObject {
  return value instanceof Phaser.GameObjects.GameObject;
}

function getDynamicBody(target: DynamicArcadeActor): Phaser.Physics.Arcade.Body {
  if (!target.body) {
    throw new Error("Expected dynamic arcade body");
  }

  if (target.body instanceof Phaser.Physics.Arcade.StaticBody) {
    throw new Error("Expected dynamic arcade body");
  }

  return target.body;
}

function getStaticBody(target: StaticArcadeObject): Phaser.Physics.Arcade.StaticBody {
  if (!target.body) {
    throw new Error("Expected static arcade body");
  }

  if (!(target.body instanceof Phaser.Physics.Arcade.StaticBody)) {
    throw new Error("Expected static arcade body");
  }

  return target.body;
}
