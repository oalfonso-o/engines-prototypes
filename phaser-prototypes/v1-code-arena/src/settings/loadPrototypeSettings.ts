import { parse } from "yaml";
import settingsYaml from "../../settings.yaml?raw";
import type { PrototypeSettings } from "./prototypeSettings";

const DEFAULT_SETTINGS: PrototypeSettings = {
  debug: {
    show_colliders: false,
  },
  player: {
    spawn_x: 144,
    spawn_y: 400,
    visual_offset_y: 26,
    sprite_scale: 1.35,
    body: {
      mode: "from_sprite",
      width: 20,
      height: 38,
      offset_x: 4,
      offset_y: 8,
      width_ratio: 0.8,
      height_ratio: 1,
      align_x: 0.5,
      align_y: 1,
    },
    movement: {
      max_run_speed: 220,
      ground_acceleration: 1800,
      ground_deceleration: 2400,
      air_acceleration: 1200,
      air_deceleration: 900,
      jump_velocity: 560,
      gravity_y: 1350,
      max_fall_speed: 860,
    },
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
