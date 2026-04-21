export interface PrototypeSettings {
  debug: DebugSettings;
  player: PlayerSettings;
}

export interface DebugSettings {
  show_colliders: boolean;
}

export interface PlayerSettings {
  spawn_x: number;
  spawn_y: number;
  visual_offset_y: number;
  sprite_scale: number;
  body: PlayerBodySettings;
  movement: PlayerMovementSettings;
}

export interface PlayerBodySettings {
  mode: "fixed" | "from_sprite";
  width: number;
  height: number;
  offset_x: number;
  offset_y: number;
  width_ratio: number;
  height_ratio: number;
  align_x: number;
  align_y: number;
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
