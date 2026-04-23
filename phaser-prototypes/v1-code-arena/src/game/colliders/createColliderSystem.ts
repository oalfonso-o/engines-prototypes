import Phaser from "phaser";
import type { DebugSettings } from "../../settings/prototypeSettings";
import { hexColorToNumber } from "../shared/color";
import type { ColliderType } from "./colliderTypes";

type StaticRect = Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.StaticBody };
type ArcadeRectBody = Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody;
type DynamicBodyGameObject = Phaser.GameObjects.GameObject & {
  body: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | null;
};

type TrackedRectCollider = {
  type: ColliderType;
  shape: "rect";
  body: ArcadeRectBody;
  owner?: Phaser.GameObjects.GameObject;
};

type TrackedCircleCollider = {
  type: ColliderType;
  shape: "circle";
  body: Phaser.Physics.Arcade.Body;
  owner: Phaser.GameObjects.GameObject;
};

type TrackedCollider = TrackedRectCollider | TrackedCircleCollider;

export interface StaticRectColliderConfig {
  type: ColliderType;
  group: Phaser.Physics.Arcade.StaticGroup;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DynamicRectColliderConfig {
  type: ColliderType;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export interface DynamicCircleColliderConfig {
  type: ColliderType;
  radius: number;
  offsetX: number;
  offsetY: number;
}

export interface ColliderSystem {
  createStaticRect(config: StaticRectColliderConfig): StaticRect;
  attachDynamicRect(target: DynamicBodyGameObject, config: DynamicRectColliderConfig): Phaser.Physics.Arcade.Body;
  attachDynamicCircle(target: DynamicBodyGameObject, config: DynamicCircleColliderConfig): Phaser.Physics.Arcade.Body;
  destroy(): void;
}

export function createColliderSystem(scene: Phaser.Scene, debugSettings: DebugSettings): ColliderSystem {
  const trackedColliders: TrackedCollider[] = [];
  const showDebug = debugSettings.enabled && debugSettings.show_colliders;
  const debugColors: Record<ColliderType, number> = {
    floor: hexColorToNumber(debugSettings.collider_colors.floor),
    platform: hexColorToNumber(debugSettings.collider_colors.platform),
    player: hexColorToNumber(debugSettings.collider_colors.player),
    coin: hexColorToNumber(debugSettings.collider_colors.coin),
  };
  const debugGraphics = showDebug ? scene.add.graphics().setDepth(1000) : null;
  let destroyed = false;

  const renderDebug = (): void => {
    if (!debugGraphics) {
      return;
    }

    debugGraphics.clear();
    trackedColliders.forEach((collider) => {
      if (!isColliderRenderable(collider)) {
        return;
      }

      debugGraphics.lineStyle(2, debugColors[collider.type], 1);

      if (collider.shape === "rect") {
        debugGraphics.strokeRect(collider.body.x, collider.body.y, collider.body.width, collider.body.height);
        return;
      }

      debugGraphics.strokeCircle(
        collider.body.x + collider.body.halfWidth,
        collider.body.y + collider.body.halfHeight,
        collider.body.halfWidth,
      );
    });
  };

  const teardown = (): void => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    scene.events.off(Phaser.Scenes.Events.POST_UPDATE, renderDebug);
    debugGraphics?.destroy();
    trackedColliders.length = 0;
  };

  if (debugGraphics) {
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, renderDebug);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, teardown);
    scene.events.once(Phaser.Scenes.Events.DESTROY, teardown);
  }

  return {
    createStaticRect(config): StaticRect {
      const rect = scene.add.rectangle(config.x, config.y, config.width, config.height, 0xffffff, 0) as StaticRect;
      rect.setVisible(false);
      scene.physics.add.existing(rect, true);
      config.group.add(rect);

      if (debugGraphics) {
        trackedColliders.push({
          type: config.type,
          shape: "rect",
          body: rect.body,
        });
      }

      return rect;
    },

    attachDynamicRect(target, config): Phaser.Physics.Arcade.Body {
      const body = getDynamicBody(target);
      body.setSize(config.width, config.height);
      body.setOffset(config.offsetX, config.offsetY);

      if (debugGraphics) {
        trackedColliders.push({
          type: config.type,
          shape: "rect",
          body,
          owner: target,
        });
      }

      return body;
    },

    attachDynamicCircle(target, config): Phaser.Physics.Arcade.Body {
      const body = getDynamicBody(target);
      body.setCircle(config.radius, config.offsetX, config.offsetY);

      if (debugGraphics) {
        trackedColliders.push({
          type: config.type,
          shape: "circle",
          body,
          owner: target,
        });
      }

      return body;
    },

    destroy(): void {
      teardown();
    },
  };
}

function isColliderRenderable(collider: TrackedCollider): boolean {
  const bodyEnabled = collider.body.enable;
  const ownerActive = collider.owner ? collider.owner.active : true;
  return bodyEnabled && ownerActive;
}

function getDynamicBody(target: DynamicBodyGameObject): Phaser.Physics.Arcade.Body {
  if (!target.body) {
    throw new Error("Expected dynamic arcade body");
  }

  if (target.body instanceof Phaser.Physics.Arcade.StaticBody) {
    throw new Error("Expected dynamic arcade body");
  }

  return target.body;
}
