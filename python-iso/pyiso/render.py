from __future__ import annotations

from dataclasses import dataclass
import math

import pygame

from pyiso.config import BACKGROUND, CLIFF_GLOW, GRID_GLOW, HUD_TEXT, PLAYER_CORE, PLAYER_OUTLINE, RenderConfig
from pyiso.iso import diamond_points, grid_to_screen, origin_for_focus
from pyiso.map_data import GameMap, TERRAIN_INFO, Tile


def _mix(color: tuple[int, int, int], other: tuple[int, int, int], ratio: float) -> tuple[int, int, int]:
    return tuple(round((c * (1.0 - ratio)) + (o * ratio)) for c, o in zip(color, other))


@dataclass
class IsoRenderer:
    config: RenderConfig
    font: pygame.font.Font

    def compute_origin(self, player_visual: dict[str, float]) -> tuple[float, float]:
        jump_offset_pixels = player_visual["jump_offset"] * self.config.height_step
        target_x = self.config.screen_width / 2.0
        target_y = (self.config.screen_height / 2.0) + 26.0 + jump_offset_pixels
        return origin_for_focus(
            player_visual["grid_x"],
            player_visual["grid_y"],
            player_visual["height"],
            self.config.tile_width,
            self.config.tile_height,
            self.config.height_step,
            target_x,
            target_y,
        )

    def draw(
        self,
        screen: pygame.Surface,
        game_map: GameMap,
        player_visual: dict[str, float],
        status_lines: list[str],
    ) -> None:
        screen.fill(BACKGROUND)
        origin_x, origin_y = self.compute_origin(player_visual)
        for row in game_map.tiles:
            for tile in row:
                self._draw_tile(screen, game_map, tile, origin_x, origin_y)
        self._draw_player(screen, player_visual, origin_x, origin_y)
        self._draw_hud(screen, status_lines)

    def _draw_tile(
        self,
        screen: pygame.Surface,
        game_map: GameMap,
        tile: Tile,
        origin_x: float,
        origin_y: float,
    ) -> None:
        if tile.terrain == "x":
            return

        top_color = TERRAIN_INFO[tile.terrain]["top"]
        edge_color = TERRAIN_INFO[tile.terrain]["edge"]
        top_points, corner_heights = self._tile_top_points(tile, origin_x, origin_y)
        top_fill = _mix(top_color, GRID_GLOW, 0.16) if tile.ramp is not None else top_color

        south_face = self._build_face_points(game_map, tile, corner_heights, top_points, "south")
        if south_face is not None:
            self._draw_face(
                screen,
                south_face,
                _mix(edge_color, CLIFF_GLOW, 0.18),
                _mix(_mix(edge_color, CLIFF_GLOW, 0.18), CLIFF_GLOW, 0.65),
            )

        east_face = self._build_face_points(game_map, tile, corner_heights, top_points, "east")
        if east_face is not None:
            self._draw_face(
                screen,
                east_face,
                _mix(edge_color, GRID_GLOW, 0.12),
                _mix(_mix(edge_color, GRID_GLOW, 0.12), GRID_GLOW, 0.68),
            )
        pygame.draw.polygon(screen, top_fill, top_points)
        pygame.draw.polygon(screen, _mix(top_fill, GRID_GLOW, 0.68), top_points, width=2)
        if tile.ramp is not None:
            self._draw_ramp_overlay(screen, top_points, tile.ramp.value, top_fill, edge_color)

    def _draw_face(
        self,
        screen: pygame.Surface,
        points: list[tuple[int, int]],
        fill_color: tuple[int, int, int],
        outline_color: tuple[int, int, int],
    ) -> None:
        pygame.draw.polygon(screen, fill_color, points)
        pygame.draw.lines(screen, outline_color, False, points, 2)

    def _tile_top_points(
        self,
        tile: Tile,
        origin_x: float,
        origin_y: float,
    ) -> tuple[list[tuple[int, int]], dict[str, float]]:
        center_x, center_y = grid_to_screen(
            tile.x + 0.5,
            tile.y + 0.5,
            tile.height,
            self.config.tile_width,
            self.config.tile_height,
            self.config.height_step,
            origin_x,
            origin_y,
        )
        return diamond_points(center_x, center_y, self.config.tile_width, self.config.tile_height), {
            "north": float(tile.height),
            "east": float(tile.height),
            "south": float(tile.height),
            "west": float(tile.height),
        }

    def _build_face_points(
        self,
        game_map: GameMap,
        tile: Tile,
        corner_heights: dict[str, float],
        top_points: list[tuple[int, int]],
        face: str,
    ) -> list[tuple[int, int]] | None:
        if face == "south":
            neighbor = game_map.neighbor(tile.x, tile.y, 0, 1)
            neighbor_height = float(neighbor.height) if neighbor and neighbor.terrain != "x" else -1.0
            visible_left = corner_heights["west"] - neighbor_height
            visible_right = corner_heights["south"] - neighbor_height
            if max(visible_left, visible_right) <= 0.0:
                return None
            top_left, top_right = top_points[3], top_points[2]
            bottom_right = (top_right[0], round(top_right[1] + (visible_right * self.config.height_step)))
            bottom_left = (top_left[0], round(top_left[1] + (visible_left * self.config.height_step)))
            return [top_left, top_right, bottom_right, bottom_left]

        neighbor = game_map.neighbor(tile.x, tile.y, 1, 0)
        neighbor_height = float(neighbor.height) if neighbor and neighbor.terrain != "x" else -1.0
        visible_left = corner_heights["south"] - neighbor_height
        visible_right = corner_heights["east"] - neighbor_height
        if max(visible_left, visible_right) <= 0.0:
            return None
        top_left, top_right = top_points[2], top_points[1]
        bottom_right = (top_right[0], round(top_right[1] + (visible_right * self.config.height_step)))
        bottom_left = (top_left[0], round(top_left[1] + (visible_left * self.config.height_step)))
        return [top_left, top_right, bottom_right, bottom_left]

    def _draw_ramp_overlay(
        self,
        screen: pygame.Surface,
        top_points: list[tuple[int, int]],
        direction: str,
        top_color: tuple[int, int, int],
        edge_color: tuple[int, int, int],
    ) -> None:
        plane_points, triangle_points = self._ramp_visual_polygons(top_points, direction)
        north, east, south, west = plane_points
        center_x = sum(point[0] for point in plane_points) / 4.0
        center_y = sum(point[1] for point in plane_points) / 4.0
        half_w = self.config.tile_width / 2.0
        half_h = self.config.tile_height / 2.0
        line_color = _mix(top_color, CLIFF_GLOW, 0.52)
        plane_fill = _mix(top_color, GRID_GLOW, 0.22)
        triangle_fill = _mix(edge_color, CLIFF_GLOW, 0.22)

        pygame.draw.polygon(screen, plane_fill, plane_points)
        pygame.draw.polygon(screen, _mix(plane_fill, GRID_GLOW, 0.72), plane_points, width=2)
        pygame.draw.polygon(screen, triangle_fill, triangle_points)
        pygame.draw.polygon(screen, _mix(triangle_fill, CLIFF_GLOW, 0.62), triangle_points, width=2)

        if direction == "N":
            start = south
            end = north
            wing_left = (round(end[0] - 10), round(end[1] + 8))
            wing_right = (round(end[0] + 10), round(end[1] + 8))
        elif direction == "S":
            start = north
            end = south
            wing_left = (round(end[0] - 10), round(end[1] - 8))
            wing_right = (round(end[0] + 10), round(end[1] - 8))
        elif direction == "E":
            start = west
            end = east
            wing_left = (round(end[0] - 12), round(end[1] - 6))
            wing_right = (round(end[0] - 12), round(end[1] + 6))
        else:
            start = east
            end = west
            wing_left = (round(end[0] + 12), round(end[1] - 6))
            wing_right = (round(end[0] + 12), round(end[1] + 6))

        pygame.draw.line(screen, line_color, start, end, width=3)
        pygame.draw.line(screen, line_color, wing_left, end, width=3)
        pygame.draw.line(screen, line_color, wing_right, end, width=3)

        stripe_color = _mix(top_color, GRID_GLOW, 0.55)
        if direction in {"N", "S"}:
            for offset in (-12, 12):
                pygame.draw.line(
                    screen,
                    stripe_color,
                    (round(center_x - half_w * 0.35), round(center_y + offset * 0.45)),
                    (round(center_x + half_w * 0.35), round(center_y + offset * 0.45)),
                    width=2,
                )
        else:
            for offset in (-14, 14):
                pygame.draw.line(
                    screen,
                    stripe_color,
                    (round(center_x + offset * 0.45), round(center_y - half_h * 0.35)),
                    (round(center_x + offset * 0.45), round(center_y + half_h * 0.35)),
                    width=2,
                )

    def _ramp_visual_polygons(
        self,
        base_points: list[tuple[int, int]],
        direction: str,
    ) -> tuple[list[tuple[int, int]], list[tuple[int, int]]]:
        north, east, south, west = base_points
        lifted = {
            "N": {0, 1},
            "E": {1, 2},
            "S": {2, 3},
            "W": {3, 0},
        }[direction]

        plane_points: list[tuple[int, int]] = []
        for index, (x, y) in enumerate(base_points):
            if index in lifted:
                plane_points.append((x, y - self.config.height_step))
            else:
                plane_points.append((x, y))

        if direction == "N":
            triangle_points = [plane_points[1], east, south]
        elif direction == "E":
            triangle_points = [plane_points[2], south, west]
        elif direction == "S":
            triangle_points = [plane_points[3], west, north]
        else:
            triangle_points = [plane_points[0], north, east]
        return plane_points, triangle_points

    def _draw_player(
        self,
        screen: pygame.Surface,
        player_visual: dict[str, float],
        origin_x: float,
        origin_y: float,
    ) -> None:
        base_x, base_y = grid_to_screen(
            player_visual["grid_x"],
            player_visual["grid_y"],
            player_visual["height"],
            self.config.tile_width,
            self.config.tile_height,
            self.config.height_step,
            origin_x,
            origin_y,
        )
        jump_offset = player_visual["jump_offset"] * self.config.height_step
        body_y = base_y - 26 - jump_offset

        shadow_radius = float(player_visual.get("shadow_radius", 0.24))
        shadow_width = max(14, round(self.config.tile_width * math.sqrt(2.0) * shadow_radius))
        shadow_height = max(8, round(self.config.tile_height * math.sqrt(2.0) * shadow_radius))
        shadow_rect = pygame.Rect(0, 0, shadow_width, shadow_height)
        shadow_rect.center = (round(base_x), round(base_y))
        pygame.draw.ellipse(screen, (8, 12, 18), shadow_rect)
        pygame.draw.ellipse(screen, (20, 65, 75), shadow_rect, width=2)

        torso_rect = pygame.Rect(0, 0, 30, 44)
        torso_rect.center = (round(base_x), round(body_y))
        pygame.draw.ellipse(screen, PLAYER_CORE, torso_rect)
        pygame.draw.ellipse(screen, PLAYER_OUTLINE, torso_rect, width=3)

        head_center = (round(base_x), round(body_y - 28))
        pygame.draw.circle(screen, PLAYER_CORE, head_center, 12)
        pygame.draw.circle(screen, PLAYER_OUTLINE, head_center, 12, width=3)

        facing_x, facing_y = player_visual["facing_vector"]
        target_x, target_y = grid_to_screen(
            player_visual["grid_x"] + facing_x * 0.35,
            player_visual["grid_y"] + facing_y * 0.35,
            player_visual["height"],
            self.config.tile_width,
            self.config.tile_height,
            self.config.height_step,
            origin_x,
            origin_y,
        )
        pygame.draw.line(screen, PLAYER_OUTLINE, (base_x, body_y - 8), (target_x, target_y - 18 - jump_offset), 3)
        pygame.draw.circle(screen, PLAYER_OUTLINE, (round(target_x), round(target_y - 18 - jump_offset)), 5, width=2)

    def _draw_hud(self, screen: pygame.Surface, status_lines: list[str]) -> None:
        panel = pygame.Surface((520, 126), pygame.SRCALPHA)
        panel.fill((6, 10, 18, 210))
        screen.blit(panel, (18, 18))
        for index, line in enumerate(status_lines):
            surface = self.font.render(line, True, HUD_TEXT)
            screen.blit(surface, (30, 28 + index * 24))
