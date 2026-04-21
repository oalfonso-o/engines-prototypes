export type ColliderType = "floor" | "platform" | "player" | "coin";

export const COLLIDER_DEBUG_COLORS: Record<ColliderType, number> = {
  floor: 0x39ff14,
  platform: 0xff7a00,
  player: 0xff2d2d,
  coin: 0xff4fd8,
};
