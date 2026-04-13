from __future__ import annotations

import argparse
import math
from dataclasses import dataclass
from pathlib import Path

import pygame

from pyiso.config import PlayerConfig, RenderConfig, TITLE
from pyiso.depth_render import DepthRenderer
from pyiso.map_loader import load_map
from pyiso.movement import current_surface_height, current_tile
from pyiso.physics import WorldPosition, is_position_valid, move_with_collision, resolve_invalid_landing_position
from pyiso.render import IsoRenderer


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MAP_DIR = ROOT / "maps" / "three_lanes"


@dataclass
class PlayerState:
    position: WorldPosition
    height: float
    facing_vector: tuple[float, float] = (0.0, -1.0)
    jump_progress: float = 0.0
    jump_duration: float = 0.30
    jump_cooldown: float = 0.0
    jump_active: bool = False
    last_move_vector: tuple[float, float] = (0.0, 0.0)

    def visual_position(self, jump_arc_height: float, shadow_radius: float) -> dict[str, float]:
        jump_offset = 0.0
        if self.jump_active:
            phase = min(self.jump_progress, 1.0)
            jump_offset = jump_arc_height * 4.0 * phase * (1.0 - phase)
        return {
            "grid_x": self.position.x,
            "grid_y": self.position.y,
            "height": self.height,
            "jump_offset": jump_offset,
            "facing_vector": self.facing_vector,
            "shadow_radius": shadow_radius,
        }


class PrototypeGame:
    def __init__(self, map_dir: Path = DEFAULT_MAP_DIR) -> None:
        self.render_config = RenderConfig()
        self.player_config = PlayerConfig()
        self.map_dir = map_dir
        self.game_map = load_map(map_dir)
        self.player = self._spawn_player()

    def reload_map(self) -> None:
        self.game_map = load_map(self.map_dir)
        self.player = self._spawn_player()

    def update(self, dt: float, pressed: set[int]) -> None:
        self.player.jump_cooldown = max(0.0, self.player.jump_cooldown - dt)
        self._update_jump(dt)

        input_x, input_y = self._read_input_vector(pressed)
        if abs(input_x) > 0.0001 or abs(input_y) > 0.0001:
            self.player.facing_vector = (input_x, input_y)
            self.player.last_move_vector = (input_x, input_y)

        if pygame.K_SPACE in pressed and not self.player.jump_active and self.player.jump_cooldown <= 0.0:
            self.player.jump_active = True
            self.player.jump_progress = 0.0
            self.player.jump_cooldown = self.player_config.jump_cooldown_seconds

        delta_x = input_x * self.player_config.move_speed_tiles_per_second * dt
        delta_y = input_y * self.player_config.move_speed_tiles_per_second * dt
        collision = move_with_collision(
            self.game_map,
            self.player.position,
            delta_x,
            delta_y,
            self.player_config.collision_radius_tiles,
            self.player_config.jump_step_height if self.player.jump_active else self.player_config.ground_step_height,
            self.player_config.collision_substep_distance,
        )
        self.player.position = collision.position
        if not self.player.jump_active and not is_position_valid(
            self.game_map,
            self.player.position,
            self.player_config.collision_radius_tiles,
            self.player_config.ground_step_height,
        ):
            resolved = resolve_invalid_landing_position(
                self.game_map,
                self.player.position,
                self.player_config.collision_radius_tiles,
                self.player_config.ground_step_height,
            )
            if resolved is not None:
                self.player.position = resolved
        surface_height = current_surface_height(self.game_map, self.player.position)
        if surface_height is not None:
            self.player.height = surface_height

    def handle_event(self, event: pygame.event.Event) -> bool:
        if event.type == pygame.QUIT:
            return False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                return False
            if event.key == pygame.K_r:
                self.reload_map()
        return True

    def build_status_lines(self, fps: float | None = None) -> list[str]:
        tile = current_tile(self.game_map, self.player.position)
        ramp = tile.ramp.value if tile and tile.ramp else "."
        terrain = tile.terrain if tile else "x"
        tile_x = int(math.floor(self.player.position.x))
        tile_y = int(math.floor(self.player.position.y))
        lines = [
            "Canuter iso v2  |  WASD libre  |  Space salto  |  R recargar mapa",
            f"world=({self.player.position.x:.2f},{self.player.position.y:.2f}) tile=({tile_x},{tile_y}) h={self.player.height:.2f} terrain={terrain} ramp={ramp}",
            "layout: top lane en L, bot lane en L, mid diagonal con meseta central",
        ]
        if fps is not None:
            lines.insert(0, f"FPS: {fps:05.1f}")
        return lines

    def _spawn_player(self) -> PlayerState:
        spawn_x, spawn_y = self.game_map.player_spawn
        position = WorldPosition(spawn_x + 0.5, spawn_y + 0.5)
        height = current_surface_height(self.game_map, position)
        if height is None:
            height = 0.0
        return PlayerState(position=position, height=height, jump_duration=self.player_config.jump_duration_seconds)

    def _update_jump(self, dt: float) -> None:
        if not self.player.jump_active:
            return
        self.player.jump_progress = min(1.0, self.player.jump_progress + (dt / self.player.jump_duration))
        if self.player.jump_progress >= 1.0:
            self.player.jump_active = False
            self.player.jump_progress = 0.0

    def _read_input_vector(self, pressed: set[int]) -> tuple[float, float]:
        screen_x = 0.0
        screen_y = 0.0
        if pygame.K_a in pressed or pygame.K_LEFT in pressed:
            screen_x -= 1.0
        if pygame.K_d in pressed or pygame.K_RIGHT in pressed:
            screen_x += 1.0
        if pygame.K_w in pressed or pygame.K_UP in pressed:
            screen_y -= 1.0
        if pygame.K_s in pressed or pygame.K_DOWN in pressed:
            screen_y += 1.0
        return screen_input_to_world_vector(screen_x, screen_y)


def screen_input_to_world_vector(screen_x: float, screen_y: float) -> tuple[float, float]:
    world_x = screen_x + screen_y
    world_y = screen_y - screen_x
    length = math.hypot(world_x, world_y)
    if length <= 0.0001:
        return 0.0, 0.0
    return world_x / length, world_y / length


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--headless", action="store_true")
    parser.add_argument("--frames", type=int, default=0)
    parser.add_argument("--legacy-render", action="store_true")
    args = parser.parse_args(argv)

    pygame.init()
    try:
        screen = pygame.display.set_mode((RenderConfig().screen_width, RenderConfig().screen_height))
        pygame.display.set_caption(TITLE)
        clock = pygame.time.Clock()
        font = pygame.font.SysFont("consolas", 18)
        renderer = IsoRenderer(RenderConfig(), font) if args.legacy_render else DepthRenderer(RenderConfig(), font)
        prototype = PrototypeGame()
        pressed: set[int] = set()
        frame_budget = args.frames if args.frames > 0 else None

        running = True
        while running:
            for event in pygame.event.get():
                if event.type == pygame.KEYDOWN:
                    pressed.add(event.key)
                elif event.type == pygame.KEYUP and event.key in pressed:
                    pressed.remove(event.key)
                running = running and prototype.handle_event(event)
            dt = clock.tick(60) / 1000.0
            prototype.update(dt, pressed)
            renderer.draw(
                screen,
                prototype.game_map,
                prototype.player.visual_position(
                    prototype.player_config.jump_arc_height,
                    prototype.player_config.collision_radius_tiles,
                ),
                prototype.build_status_lines(clock.get_fps()),
            )
            pygame.display.flip()

            if frame_budget is not None:
                frame_budget -= 1
                if frame_budget <= 0:
                    break
        return 0
    finally:
        pygame.quit()
