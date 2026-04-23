import { parse } from "yaml";
import settingsYaml from "../../settings.yaml?raw";
import type { PrototypeSettings } from "./prototypeSettings";

const DEFAULT_SETTINGS: PrototypeSettings = {
  theme: {
    ui_font_stack: "\"Avenir Next\", \"Segoe UI\", \"Helvetica Neue\", sans-serif",
  },
  debug: {
    enabled: true,
    show_colliders: false,
    collider_colors: {
      floor: "#39ff14",
      platform: "#ff7a00",
      player: "#ff2d2d",
      coin: "#ff4fd8",
    },
  },
  world: {
    view_width: 960,
    view_height: 540,
    tile_size: 32,
    width_tiles: 60,
    height_tiles: 18,
    background_color: "#050a13",
  },
  intro: {
    duration_ms: 800,
  },
  audio: {
    music: {
      default_volume: 0.7,
      ducked_volume: 0.42,
    },
  },
  player: {
    spawn_x: 144,
    spawn_y: 400,
    visual: {
      offset_y: 26,
      scale: 1.35,
      origin_x: 0.5,
      origin_y: 0.8,
    },
    body: {
      mode: "from_sprite",
      fixed_width: 20,
      fixed_height: 38,
      fixed_offset_x: 4,
      fixed_offset_y: 8,
      width_ratio_of_sprite: 0.18,
      height_ratio_of_sprite: 0.72,
      align_x_within_sprite: 0.5,
      align_y_within_sprite: 1,
    },
    movement: {
      max_run_speed: 320,
      ground_acceleration: 1800,
      ground_deceleration: 2400,
      air_acceleration: 1200,
      air_deceleration: 900,
      jump_velocity: 600,
      gravity_y: 1350,
      max_fall_speed: 860,
    },
    camera: {
      world_bottom_padding_px: 160,
      follow_lerp_x: 0.09,
      follow_lerp_y: 0.09,
      deadzone_width: 160,
      deadzone_height: 90,
    },
    respawn: {
      fall_margin_px: 64,
      flash_duration_ms: 120,
      flash_color: "#78b4ff",
    },
    animation: {
      run_min_horizontal_speed: 4,
    },
  },
  one_way_platforms: {
    landing_tolerance_px: 4,
    drop_through_duration_ms: 180,
    drop_through_nudge_px: 2,
    drop_through_fall_speed: 48,
    collider_y_offset_px: 7,
    collider_height_px: 14,
  },
  menu_background: {
    hero_scale_multiplier: 1.05,
    camera_zoom: 1.35,
    camera_anchor_x: 0.45,
    camera_anchor_y: 0.55,
    drift_speed_x: 0.00035,
    drift_amplitude_x: 18,
    drift_speed_y: 0.00028,
    drift_amplitude_y: 10,
  },
  parallax: {
    factors: [0.04, 0.08, 0.12, 0.18, 0.26],
    height_reference_px: 324,
    farthest_layer_alpha: 0.92,
    overlay_color: "#0b1020",
    overlay_alpha: 0.18,
  },
  hud: {
    title: {
      x: 24,
      y: 18,
      font_size_px: 26,
      color: "#edf2ff",
    },
    status: {
      x: 24,
      y: 52,
      font_size_px: 18,
      color: "#b2c2e8",
    },
    instructions: {
      x: 24,
      bottom_offset_px: 28,
      y: 0,
      font_size_px: 16,
      color: "#d5ddf1",
    },
    complete: {
      right_offset_px: 24,
      y: 18,
      font_size_px: 22,
      color: "#ffd7a8",
    },
  },
  level: {
    ground_segments: [
      { start: 0, end: 11, top: 15, height: 3 },
      { start: 16, end: 27, top: 15, height: 3 },
      { start: 33, end: 44, top: 15, height: 3 },
      { start: 50, end: 59, top: 15, height: 3 },
      { start: 24, end: 26, top: 13, height: 5 },
      { start: 46, end: 48, top: 12, height: 6 },
    ],
    floating_platforms: [
      { start: 4, end: 8, y: 12 },
      { start: 10, end: 13, y: 10 },
      { start: 18, end: 22, y: 11 },
      { start: 26, end: 30, y: 9 },
      { start: 35, end: 38, y: 11 },
      { start: 40, end: 44, y: 8 },
      { start: 52, end: 55, y: 9 },
    ],
    water_strips: [
      { start: 12, end: 15, top: 15, rows: 3 },
      { start: 28, end: 32, top: 15, rows: 3 },
      { start: 45, end: 49, top: 15, rows: 3 },
    ],
    coin_positions: [
      { x: 6.5, y: 10.8 },
      { x: 11.5, y: 8.8 },
      { x: 20.5, y: 9.8 },
      { x: 28.5, y: 7.0 },
      { x: 25.5, y: 11.8 },
      { x: 37.0, y: 9.8 },
      { x: 42.0, y: 6.0 },
      { x: 54.0, y: 7.0 },
    ],
  },
};

export function loadPrototypeSettings(): PrototypeSettings {
  const parsed = parse(settingsYaml);
  if (!isPlainObject(parsed)) {
    return cloneDefaults();
  }

  const merged = mergeDeep(
    cloneDefaults() as unknown as Record<string, unknown>,
    parsed as Record<string, unknown>,
  );
  return merged as unknown as PrototypeSettings;
}

function mergeDeep(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  for (const [key, value] of Object.entries(source)) {
    if (isPlainObject(value) && isPlainObject(target[key])) {
      mergeDeep(target[key] as Record<string, unknown>, value);
      continue;
    }

    target[key] = value;
  }

  return target;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneDefaults(): PrototypeSettings {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as PrototypeSettings;
}
