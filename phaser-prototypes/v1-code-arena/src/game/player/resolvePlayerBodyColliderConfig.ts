import type { DynamicRectColliderConfig } from "../colliders/createColliderSystem";
import type { PlayerBodySettings } from "../../settings/prototypeSettings";

type BodyAnchorLike = {
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  originX: number;
  originY: number;
};

type SpriteLike = {
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  originX: number;
  originY: number;
};

export function resolvePlayerBodyColliderConfig(
  bodyAnchor: BodyAnchorLike,
  sprite: SpriteLike,
  bodySettings: PlayerBodySettings,
): DynamicRectColliderConfig {
  if (bodySettings.mode === "fixed") {
    return {
      type: "player",
      width: bodySettings.fixed_width,
      height: bodySettings.fixed_height,
      offsetX: bodySettings.fixed_offset_x,
      offsetY: bodySettings.fixed_offset_y,
    };
  }

  const spriteWidth = sprite.displayWidth;
  const spriteHeight = sprite.displayHeight;
  const colliderWidth = Math.max(1, Math.round(spriteWidth * bodySettings.width_ratio_of_sprite));
  const colliderHeight = Math.max(1, Math.round(spriteHeight * bodySettings.height_ratio_of_sprite));

  const bodyTopLeftX = bodyAnchor.x - (bodyAnchor.displayWidth * bodyAnchor.originX);
  const bodyTopLeftY = bodyAnchor.y - (bodyAnchor.displayHeight * bodyAnchor.originY);
  const spriteTopLeftX = sprite.x - (spriteWidth * sprite.originX);
  const spriteTopLeftY = sprite.y - (spriteHeight * sprite.originY);

  const spriteLocalLeft = spriteTopLeftX - bodyTopLeftX;
  const spriteLocalTop = spriteTopLeftY - bodyTopLeftY;
  const offsetX = Math.round(
    spriteLocalLeft + ((spriteWidth - colliderWidth) * bodySettings.align_x_within_sprite),
  );
  const offsetY = Math.round(
    spriteLocalTop + ((spriteHeight - colliderHeight) * bodySettings.align_y_within_sprite),
  );

  return {
    type: "player",
    width: colliderWidth,
    height: colliderHeight,
    offsetX,
    offsetY,
  };
}
