from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RenderConfig:
    screen_width: int = 1280
    screen_height: int = 800
    tile_width: int = 96
    tile_height: int = 48
    height_step: int = 28
    wall_darkness_step: int = 26
    margin_top: int = 120


@dataclass(frozen=True)
class PlayerConfig:
    move_speed_tiles_per_second: float = 4.2
    collision_radius_tiles: float = 0.24
    jump_duration_seconds: float = 0.30
    jump_arc_height: float = 0.9
    jump_cooldown_seconds: float = 0.12
    jump_step_height: float = 1.05
    ground_step_height: float = 0.34
    collision_substep_distance: float = 0.12


TITLE = "Canuter Python Iso Prototype"
BACKGROUND = (7, 8, 14)
GRID_GLOW = (34, 200, 255)
CLIFF_GLOW = (255, 87, 182)
PLAYER_CORE = (255, 250, 246)
PLAYER_OUTLINE = (39, 255, 199)
HUD_TEXT = (218, 242, 255)
