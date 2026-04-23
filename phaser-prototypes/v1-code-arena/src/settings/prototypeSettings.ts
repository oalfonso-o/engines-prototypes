export interface PrototypeSettings {
  theme: ThemeSettings;
  debug: DebugSettings;
  world: WorldSettings;
  intro: IntroSettings;
  audio: AudioSettings;
  player: PlayerSettings;
  one_way_platforms: OneWayPlatformSettings;
  menu_background: MenuBackgroundSettings;
  parallax: ParallaxSettings;
  hud: HudSettings;
  level: LevelSettings;
}

export interface ThemeSettings {
  ui_font_stack: string;
}

export interface DebugSettings {
  enabled: boolean;
  show_colliders: boolean;
  collider_colors: ColliderColorSettings;
}

export interface ColliderColorSettings {
  floor: string;
  platform: string;
  player: string;
  coin: string;
}

export interface WorldSettings {
  view_width: number;
  view_height: number;
  tile_size: number;
  width_tiles: number;
  height_tiles: number;
  background_color: string;
}

export interface IntroSettings {
  duration_ms: number;
}

export interface AudioSettings {
  music: {
    default_volume: number;
    ducked_volume: number;
  };
}

export interface PlayerSettings {
  spawn_x: number;
  spawn_y: number;
  visual: PlayerVisualSettings;
  body: PlayerBodySettings;
  movement: PlayerMovementSettings;
  camera: PlayerCameraSettings;
  respawn: PlayerRespawnSettings;
  animation: PlayerAnimationSettings;
}

export interface PlayerVisualSettings {
  offset_y: number;
  scale: number;
  origin_x: number;
  origin_y: number;
}

export interface PlayerBodySettings {
  mode: "fixed" | "from_sprite";
  fixed_width: number;
  fixed_height: number;
  fixed_offset_x: number;
  fixed_offset_y: number;
  width_ratio_of_sprite: number;
  height_ratio_of_sprite: number;
  align_x_within_sprite: number;
  align_y_within_sprite: number;
}

export interface PlayerMovementSettings {
  max_run_speed: number;
  ground_acceleration: number;
  ground_deceleration: number;
  air_acceleration: number;
  air_deceleration: number;
  jump_velocity: number;
  gravity_y: number;
  max_fall_speed: number;
}

export interface PlayerCameraSettings {
  world_bottom_padding_px: number;
  follow_lerp_x: number;
  follow_lerp_y: number;
  deadzone_width: number;
  deadzone_height: number;
}

export interface PlayerRespawnSettings {
  fall_margin_px: number;
  flash_duration_ms: number;
  flash_color: string;
}

export interface PlayerAnimationSettings {
  run_min_horizontal_speed: number;
}

export interface OneWayPlatformSettings {
  landing_tolerance_px: number;
  drop_through_duration_ms: number;
  drop_through_nudge_px: number;
  drop_through_fall_speed: number;
  collider_y_offset_px: number;
  collider_height_px: number;
}

export interface MenuBackgroundSettings {
  hero_scale_multiplier: number;
  camera_zoom: number;
  camera_anchor_x: number;
  camera_anchor_y: number;
  drift_speed_x: number;
  drift_amplitude_x: number;
  drift_speed_y: number;
  drift_amplitude_y: number;
}

export interface ParallaxSettings {
  factors: number[];
  height_reference_px: number;
  farthest_layer_alpha: number;
  overlay_color: string;
  overlay_alpha: number;
}

export interface HudTextBlockSettings {
  x?: number;
  y: number;
  right_offset_px?: number;
  bottom_offset_px?: number;
  font_size_px: number;
  color: string;
}

export interface HudSettings {
  title: HudTextBlockSettings;
  status: HudTextBlockSettings;
  instructions: HudTextBlockSettings;
  complete: HudTextBlockSettings;
}

export interface GroundSegment {
  start: number;
  end: number;
  top: number;
  height: number;
}

export interface FloatingPlatform {
  start: number;
  end: number;
  y: number;
}

export interface WaterStrip {
  start: number;
  end: number;
  top: number;
  rows: number;
}

export interface CoinPosition {
  x: number;
  y: number;
}

export interface LevelSettings {
  ground_segments: GroundSegment[];
  floating_platforms: FloatingPlatform[];
  water_strips: WaterStrip[];
  coin_positions: CoinPosition[];
}

export function getWorldWidthPx(world: WorldSettings): number {
  return world.width_tiles * world.tile_size;
}

export function getWorldHeightPx(world: WorldSettings): number {
  return world.height_tiles * world.tile_size;
}
