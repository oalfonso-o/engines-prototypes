from __future__ import annotations

from array import array
from dataclasses import dataclass
import math

import pygame

from pyiso.config import BACKGROUND, CLIFF_GLOW, GRID_GLOW, PLAYER_CORE, PLAYER_OUTLINE
from pyiso.map_data import TERRAIN_INFO, GameMap, Tile
from pyiso.iso import grid_to_screen
from pyiso.render import IsoRenderer, _mix

ACTOR_DEPTH_BIAS = 0.25


@dataclass(frozen=True)
class DepthVertex:
    x: float
    y: float
    depth: float


@dataclass(frozen=True)
class DepthTriangle:
    a: DepthVertex
    b: DepthVertex
    c: DepthVertex
    color: tuple[int, int, int]


@dataclass(frozen=True)
class DepthEllipse:
    center_x: float
    center_y: float
    radius_x: float
    radius_y: float
    fill_color: tuple[int, int, int] | None
    outline_color: tuple[int, int, int]
    outline_width: float = 0.0
    ground_y: float | None = None
    ground_depth: float | None = None


@dataclass(frozen=True)
class DepthLine:
    start: DepthVertex
    end: DepthVertex
    color: tuple[int, int, int]
    width: float


@dataclass
class DepthRenderer(IsoRenderer):
    """Parallel renderer prototype.

    This renderer keeps the existing player/HUD path from IsoRenderer but
    replaces the world fill pass with a software depth-buffer rasterizer.
    """

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
        depth_buffer = array("f", [float("-inf")]) * (screen.get_width() * screen.get_height())
        self._draw_world_depth(depth_buffer, game_map, origin_x, origin_y, screen.get_width(), screen.get_height())
        self._draw_player_shadow(screen, player_visual, origin_x, origin_y)
        self._draw_player_depth(screen, depth_buffer, player_visual, origin_x, origin_y)
        self._draw_hud(screen, status_lines)

    def _draw_world_depth(
        self,
        depth_buffer: array,
        game_map: GameMap,
        origin_x: float,
        origin_y: float,
        screen_width: int,
        screen_height: int,
    ) -> None:
        triangles = self._build_world_triangles(game_map, origin_x, origin_y)
        lines = self._build_world_lines(game_map, origin_x, origin_y)
        for triangle in triangles:
            self._rasterize_triangle(None, depth_buffer, triangle, screen_width, screen_height)
        for line in lines:
            self._rasterize_line(None, depth_buffer, line, screen_width, screen_height)

    def _build_world_triangles(
        self,
        game_map: GameMap,
        origin_x: float,
        origin_y: float,
    ) -> list[DepthTriangle]:
        triangles: list[DepthTriangle] = []
        for row in game_map.tiles:
            for tile in row:
                if tile.terrain == "x":
                    continue
                triangles.extend(self._build_tile_triangles(game_map, tile, origin_x, origin_y))
        return triangles

    def _build_tile_triangles(
        self,
        game_map: GameMap,
        tile: Tile,
        origin_x: float,
        origin_y: float,
    ) -> list[DepthTriangle]:
        top_color = TERRAIN_INFO[tile.terrain]["top"]
        edge_color = TERRAIN_INFO[tile.terrain]["edge"]
        top_points, corner_heights = self._tile_top_points(tile, origin_x, origin_y)
        top_fill = _mix(top_color, GRID_GLOW, 0.16) if tile.ramp is not None else top_color
        top_world_vertices = self._top_world_vertices(tile, corner_heights, origin_x, origin_y)

        triangles: list[DepthTriangle] = []
        south_face = self._build_face_points(game_map, tile, corner_heights, top_points, "south")
        if south_face is not None:
            south_face_vertices = self._face_world_vertices(game_map, tile, corner_heights, "south", origin_x, origin_y)
            triangles.extend(
                self._vertices_to_triangles(
                    south_face_vertices,
                    _mix(edge_color, CLIFF_GLOW, 0.18),
                )
            )

        east_face = self._build_face_points(game_map, tile, corner_heights, top_points, "east")
        if east_face is not None:
            east_face_vertices = self._face_world_vertices(game_map, tile, corner_heights, "east", origin_x, origin_y)
            triangles.extend(
                self._vertices_to_triangles(
                    east_face_vertices,
                    _mix(edge_color, GRID_GLOW, 0.12),
                )
            )

        triangles.extend(self._vertices_to_triangles(top_world_vertices, top_fill))
        if tile.ramp is not None:
            ramp_plane_vertices = self._ramp_plane_world_vertices(tile, origin_x, origin_y)
            ramp_triangle_vertices = self._ramp_triangle_world_vertices(tile, origin_x, origin_y)
            triangles.extend(self._vertices_to_triangles(ramp_plane_vertices, _mix(top_fill, GRID_GLOW, 0.22)))
            triangles.extend(self._vertices_to_triangles(ramp_triangle_vertices, _mix(edge_color, CLIFF_GLOW, 0.22)))
        return triangles

    def _vertices_to_triangles(
        self,
        vertices: list[DepthVertex],
        color: tuple[int, int, int],
    ) -> list[DepthTriangle]:
        if len(vertices) < 3:
            return []
        triangles: list[DepthTriangle] = []
        for index in range(1, len(vertices) - 1):
            triangles.append(DepthTriangle(vertices[0], vertices[index], vertices[index + 1], color))
        return triangles

    def _rasterize_triangle(
        self,
        screen: pygame.Surface | None,
        depth_buffer: array,
        triangle: DepthTriangle,
        screen_width: int | None = None,
        screen_height: int | None = None,
    ) -> None:
        width, height = self._resolve_surface_size(screen, screen_width, screen_height)
        min_x = max(0, int(min(triangle.a.x, triangle.b.x, triangle.c.x)))
        max_x = min(width - 1, int(max(triangle.a.x, triangle.b.x, triangle.c.x)))
        min_y = max(0, int(min(triangle.a.y, triangle.b.y, triangle.c.y)))
        max_y = min(height - 1, int(max(triangle.a.y, triangle.b.y, triangle.c.y)))
        if min_x > max_x or min_y > max_y:
            return

        area = self._edge_function(triangle.a.x, triangle.a.y, triangle.b.x, triangle.b.y, triangle.c.x, triangle.c.y)
        if abs(area) <= 0.0001:
            return

        for pixel_y in range(min_y, max_y + 1):
            sample_y = pixel_y + 0.5
            for pixel_x in range(min_x, max_x + 1):
                sample_x = pixel_x + 0.5
                w0 = self._edge_function(triangle.b.x, triangle.b.y, triangle.c.x, triangle.c.y, sample_x, sample_y)
                w1 = self._edge_function(triangle.c.x, triangle.c.y, triangle.a.x, triangle.a.y, sample_x, sample_y)
                w2 = self._edge_function(triangle.a.x, triangle.a.y, triangle.b.x, triangle.b.y, sample_x, sample_y)
                if not self._barycentric_inside(area, w0, w1, w2):
                    continue

                inv_area = 1.0 / area
                depth = (
                    (w0 * inv_area) * triangle.a.depth
                    + (w1 * inv_area) * triangle.b.depth
                    + (w2 * inv_area) * triangle.c.depth
                )
                buffer_index = pixel_y * width + pixel_x
                if depth < depth_buffer[buffer_index]:
                    continue

                depth_buffer[buffer_index] = depth
                if screen is not None:
                    screen.set_at((pixel_x, pixel_y), triangle.color)

    def _rasterize_line(
        self,
        screen: pygame.Surface | None,
        depth_buffer: array,
        primitive: DepthLine,
        screen_width: int | None = None,
        screen_height: int | None = None,
    ) -> None:
        width, height = self._resolve_surface_size(screen, screen_width, screen_height)
        half_width = primitive.width / 2.0
        min_x = max(0, int(min(primitive.start.x, primitive.end.x) - half_width - 1))
        max_x = min(width - 1, int(max(primitive.start.x, primitive.end.x) + half_width + 1))
        min_y = max(0, int(min(primitive.start.y, primitive.end.y) - half_width - 1))
        max_y = min(height - 1, int(max(primitive.start.y, primitive.end.y) + half_width + 1))
        if min_x > max_x or min_y > max_y:
            return

        dx = primitive.end.x - primitive.start.x
        dy = primitive.end.y - primitive.start.y
        length_sq = (dx * dx) + (dy * dy)
        if length_sq <= 0.0001:
            return

        half_width_sq = half_width * half_width
        for pixel_y in range(min_y, max_y + 1):
            sample_y = pixel_y + 0.5
            for pixel_x in range(min_x, max_x + 1):
                sample_x = pixel_x + 0.5
                projection = ((sample_x - primitive.start.x) * dx + (sample_y - primitive.start.y) * dy) / length_sq
                if projection < 0.0:
                    projection = 0.0
                elif projection > 1.0:
                    projection = 1.0

                nearest_x = primitive.start.x + projection * dx
                nearest_y = primitive.start.y + projection * dy
                dist_x = sample_x - nearest_x
                dist_y = sample_y - nearest_y
                if (dist_x * dist_x) + (dist_y * dist_y) > half_width_sq:
                    continue

                depth = primitive.start.depth + projection * (primitive.end.depth - primitive.start.depth)
                buffer_index = pixel_y * width + pixel_x
                if depth < depth_buffer[buffer_index]:
                    continue
                depth_buffer[buffer_index] = depth
                if screen is not None:
                    screen.set_at((pixel_x, pixel_y), primitive.color)

    def _draw_player_depth(
        self,
        screen: pygame.Surface,
        depth_buffer: array,
        player_visual: dict[str, float],
        origin_x: float,
        origin_y: float,
    ) -> None:
        geometry = self._player_geometry(player_visual, origin_x, origin_y)
        screen.lock()
        try:
            for primitive in geometry["depth_primitives"]:
                self._rasterize_ellipse(screen, depth_buffer, primitive)
            for primitive in geometry["detail_primitives"]:
                if isinstance(primitive, DepthLine):
                    self._rasterize_line(screen, depth_buffer, primitive)
                else:
                    self._rasterize_ellipse(screen, depth_buffer, primitive)
        finally:
            screen.unlock()

    def _rasterize_ellipse(
        self,
        screen: pygame.Surface | None,
        depth_buffer: array,
        primitive: DepthEllipse,
        screen_width: int | None = None,
        screen_height: int | None = None,
    ) -> None:
        width, height = self._resolve_surface_size(screen, screen_width, screen_height)
        min_x = max(0, int(primitive.center_x - primitive.radius_x - primitive.outline_width - 1))
        max_x = min(width - 1, int(primitive.center_x + primitive.radius_x + primitive.outline_width + 1))
        min_y = max(0, int(primitive.center_y - primitive.radius_y - primitive.outline_width - 1))
        max_y = min(height - 1, int(primitive.center_y + primitive.radius_y + primitive.outline_width + 1))
        if min_x > max_x or min_y > max_y:
            return

        inner_radius_x = max(1.0, primitive.radius_x - primitive.outline_width)
        inner_radius_y = max(1.0, primitive.radius_y - primitive.outline_width)
        for pixel_y in range(min_y, max_y + 1):
            sample_y = pixel_y + 0.5
            norm_y = (sample_y - primitive.center_y) / primitive.radius_y
            for pixel_x in range(min_x, max_x + 1):
                sample_x = pixel_x + 0.5
                norm_x = (sample_x - primitive.center_x) / primitive.radius_x
                ellipse_value = (norm_x * norm_x) + (norm_y * norm_y)
                if ellipse_value > 1.0:
                    continue

                color = primitive.fill_color
                if primitive.outline_width > 0.0:
                    inner_norm_x = (sample_x - primitive.center_x) / inner_radius_x
                    inner_norm_y = (sample_y - primitive.center_y) / inner_radius_y
                    inner_value = (inner_norm_x * inner_norm_x) + (inner_norm_y * inner_norm_y)
                    if inner_value > 1.0:
                        color = primitive.outline_color
                    elif primitive.fill_color is None:
                        continue
                elif primitive.fill_color is None:
                    continue

                depth = primitive.ground_depth
                if depth is not None and primitive.ground_y is not None:
                    depth = primitive.ground_depth + (primitive.ground_y - sample_y)
                else:
                    depth = sample_y
                buffer_index = pixel_y * width + pixel_x
                if depth < depth_buffer[buffer_index]:
                    continue
                depth_buffer[buffer_index] = depth
                if screen is not None:
                    screen.set_at((pixel_x, pixel_y), color)

    def _resolve_surface_size(
        self,
        screen: pygame.Surface | None,
        screen_width: int | None,
        screen_height: int | None,
    ) -> tuple[int, int]:
        if screen is not None:
            return screen.get_width(), screen.get_height()
        if screen_width is None or screen_height is None:
            raise ValueError("screen dimensions are required when screen is None")
        return screen_width, screen_height

    def _edge_function(
        self,
        ax: float,
        ay: float,
        bx: float,
        by: float,
        px: float,
        py: float,
    ) -> float:
        return (px - ax) * (by - ay) - (py - ay) * (bx - ax)

    def _barycentric_inside(self, area: float, w0: float, w1: float, w2: float) -> bool:
        if area > 0.0:
            return w0 >= 0.0 and w1 >= 0.0 and w2 >= 0.0
        return w0 <= 0.0 and w1 <= 0.0 and w2 <= 0.0

    def _player_geometry(
        self,
        player_visual: dict[str, float],
        origin_x: float,
        origin_y: float,
    ) -> dict[str, object]:
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
        shadow_radius_world = float(player_visual.get("shadow_radius", 0.24))
        occlusion_anchor_x = float(player_visual["grid_x"]) - shadow_radius_world
        occlusion_anchor_y = float(player_visual["grid_y"]) - shadow_radius_world
        occlusion_anchor_screen_x, occlusion_anchor_screen_y = grid_to_screen(
            occlusion_anchor_x,
            occlusion_anchor_y,
            player_visual["height"],
            self.config.tile_width,
            self.config.tile_height,
            self.config.height_step,
            origin_x,
            origin_y,
        )
        base_depth = self._depth_from_world(
            occlusion_anchor_x,
            occlusion_anchor_y,
            float(player_visual["height"]),
        ) - ACTOR_DEPTH_BIAS

        base_vertex = DepthVertex(float(base_x), float(body_y - 8.0), base_depth + (occlusion_anchor_screen_y - (body_y - 8.0)))
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
        marker_y = target_y - 18.0 - jump_offset
        marker_depth = self._depth_from_world(
            float(player_visual["grid_x"] + facing_x * 0.35),
            float(player_visual["grid_y"] + facing_y * 0.35),
            float(player_visual["height"]),
        ) + (target_y - marker_y) - ACTOR_DEPTH_BIAS
        marker_vertex = DepthVertex(float(target_x), float(marker_y), marker_depth)

        torso = DepthEllipse(
            center_x=float(base_x),
            center_y=float(body_y),
            radius_x=15.0,
            radius_y=22.0,
            fill_color=PLAYER_CORE,
            outline_color=PLAYER_OUTLINE,
            outline_width=3.0,
            ground_y=float(occlusion_anchor_screen_y),
            ground_depth=base_depth,
        )
        head = DepthEllipse(
            center_x=float(base_x),
            center_y=float(body_y - 28.0),
            radius_x=12.0,
            radius_y=12.0,
            fill_color=PLAYER_CORE,
            outline_color=PLAYER_OUTLINE,
            outline_width=3.0,
            ground_y=float(occlusion_anchor_screen_y),
            ground_depth=base_depth,
        )
        aim_ring = DepthEllipse(
            center_x=float(target_x),
            center_y=float(marker_y),
            radius_x=5.0,
            radius_y=5.0,
            fill_color=None,
            outline_color=PLAYER_OUTLINE,
            outline_width=2.0,
            ground_y=float(target_y),
            ground_depth=self._depth_from_world(
                float(player_visual["grid_x"] + facing_x * 0.35),
                float(player_visual["grid_y"] + facing_y * 0.35),
                float(player_visual["height"]),
            ) - ACTOR_DEPTH_BIAS,
        )
        aim_line = DepthLine(
            start=base_vertex,
            end=marker_vertex,
            color=PLAYER_OUTLINE,
            width=3.0,
        )

        return {
            "base_x": float(base_x),
            "base_y": float(base_y),
            "body_y": float(body_y),
            "jump_offset": float(jump_offset),
            "shadow_rect": shadow_rect,
            "occlusion_anchor": (float(occlusion_anchor_screen_x), float(occlusion_anchor_screen_y)),
            "depth_primitives": [torso, head],
            "detail_primitives": [aim_line, aim_ring],
        }

    def _draw_player_shadow(
        self,
        screen: pygame.Surface,
        player_visual: dict[str, float],
        origin_x: float,
        origin_y: float,
    ) -> None:
        geometry = self._player_geometry(player_visual, origin_x, origin_y)
        shadow_rect: pygame.Rect = geometry["shadow_rect"]
        pygame.draw.ellipse(screen, (8, 12, 18), shadow_rect)
        pygame.draw.ellipse(screen, (20, 65, 75), shadow_rect, width=2)

    def _build_world_lines(
        self,
        game_map: GameMap,
        origin_x: float,
        origin_y: float,
    ) -> list[DepthLine]:
        lines: list[DepthLine] = []
        for row in game_map.tiles:
            for tile in row:
                if tile.terrain == "x":
                    continue
                lines.extend(self._build_tile_lines(game_map, tile, origin_x, origin_y))
        return lines

    def _build_tile_lines(
        self,
        game_map: GameMap,
        tile: Tile,
        origin_x: float,
        origin_y: float,
    ) -> list[DepthLine]:
        top_color = TERRAIN_INFO[tile.terrain]["top"]
        edge_color = TERRAIN_INFO[tile.terrain]["edge"]
        top_points, corner_heights = self._tile_top_points(tile, origin_x, origin_y)
        top_fill = _mix(top_color, GRID_GLOW, 0.16) if tile.ramp is not None else top_color
        lines: list[DepthLine] = []

        south_face = self._build_face_points(game_map, tile, corner_heights, top_points, "south")
        if south_face is not None:
            south_face_vertices = self._face_world_vertices(game_map, tile, corner_heights, "south", origin_x, origin_y)
            lines.extend(self._vertices_to_depth_lines(south_face_vertices, _mix(_mix(edge_color, CLIFF_GLOW, 0.18), CLIFF_GLOW, 0.65), 2.0))

        east_face = self._build_face_points(game_map, tile, corner_heights, top_points, "east")
        if east_face is not None:
            east_face_vertices = self._face_world_vertices(game_map, tile, corner_heights, "east", origin_x, origin_y)
            lines.extend(self._vertices_to_depth_lines(east_face_vertices, _mix(_mix(edge_color, GRID_GLOW, 0.12), GRID_GLOW, 0.68), 2.0))

        lines.extend(self._vertices_to_depth_lines(self._top_world_vertices(tile, corner_heights, origin_x, origin_y), _mix(top_fill, GRID_GLOW, 0.68), 2.0, closed=True))

        if tile.ramp is not None:
            ramp_plane_vertices = self._ramp_plane_world_vertices(tile, origin_x, origin_y)
            ramp_triangle_vertices = self._ramp_triangle_world_vertices(tile, origin_x, origin_y)
            lines.extend(self._vertices_to_depth_lines(ramp_plane_vertices, _mix(_mix(top_color, GRID_GLOW, 0.22), GRID_GLOW, 0.72), 2.0, closed=True))
            lines.extend(self._vertices_to_depth_lines(ramp_triangle_vertices, _mix(_mix(edge_color, CLIFF_GLOW, 0.22), CLIFF_GLOW, 0.62), 2.0, closed=True))
            lines.extend(self._build_ramp_detail_lines(ramp_plane_vertices, tile.ramp.value, top_color))

        return lines

    def _vertices_to_depth_lines(
        self,
        vertices: list[DepthVertex],
        color: tuple[int, int, int],
        width: float,
        closed: bool = False,
    ) -> list[DepthLine]:
        if len(vertices) < 2:
            return []
        lines: list[DepthLine] = []
        segment_count = len(vertices) if closed else len(vertices) - 1
        for index in range(segment_count):
            start = vertices[index]
            end = vertices[(index + 1) % len(vertices)]
            lines.append(
                DepthLine(
                    start=start,
                    end=end,
                    color=color,
                    width=width,
                )
            )
        return lines

    def _build_ramp_detail_lines(
        self,
        plane_vertices: list[DepthVertex],
        direction: str,
        top_color: tuple[int, int, int],
    ) -> list[DepthLine]:
        north, east, south, west = plane_vertices
        center_x = sum(point.x for point in plane_vertices) / 4.0
        center_y = sum(point.y for point in plane_vertices) / 4.0
        half_w = self.config.tile_width / 2.0
        half_h = self.config.tile_height / 2.0
        line_color = _mix(top_color, CLIFF_GLOW, 0.52)
        stripe_color = _mix(top_color, GRID_GLOW, 0.55)
        raw_lines: list[tuple[DepthVertex, DepthVertex, tuple[int, int, int], float]] = []

        if direction == "N":
            start = south
            end = north
            wing_left = self._screen_vertex(end.x - 10.0, end.y + 8.0, end.depth + 8.0)
            wing_right = self._screen_vertex(end.x + 10.0, end.y + 8.0, end.depth + 8.0)
        elif direction == "S":
            start = north
            end = south
            wing_left = self._screen_vertex(end.x - 10.0, end.y - 8.0, end.depth - 8.0)
            wing_right = self._screen_vertex(end.x + 10.0, end.y - 8.0, end.depth - 8.0)
        elif direction == "E":
            start = west
            end = east
            wing_left = self._screen_vertex(end.x - 12.0, end.y - 6.0, end.depth - 6.0)
            wing_right = self._screen_vertex(end.x - 12.0, end.y + 6.0, end.depth + 6.0)
        else:
            start = east
            end = west
            wing_left = self._screen_vertex(end.x + 12.0, end.y - 6.0, end.depth - 6.0)
            wing_right = self._screen_vertex(end.x + 12.0, end.y + 6.0, end.depth + 6.0)

        raw_lines.append((start, end, line_color, 3.0))
        raw_lines.append((wing_left, end, line_color, 3.0))
        raw_lines.append((wing_right, end, line_color, 3.0))

        if direction in {"N", "S"}:
            for offset in (-12, 12):
                raw_lines.append(
                    (
                        self._screen_vertex(center_x - half_w * 0.35, center_y + offset * 0.45, center_y + offset * 0.45),
                        self._screen_vertex(center_x + half_w * 0.35, center_y + offset * 0.45, center_y + offset * 0.45),
                        stripe_color,
                        2.0,
                    )
                )
        else:
            for offset in (-14, 14):
                raw_lines.append(
                    (
                        self._screen_vertex(center_x + offset * 0.45, center_y - half_h * 0.35, center_y - half_h * 0.35),
                        self._screen_vertex(center_x + offset * 0.45, center_y + half_h * 0.35, center_y + half_h * 0.35),
                        stripe_color,
                        2.0,
                    )
                )

        lines: list[DepthLine] = []
        for start_point, end_point, color, width in raw_lines:
            lines.append(
                DepthLine(
                    start=start_point,
                    end=end_point,
                    color=color,
                    width=width,
                )
            )
        return lines

    def _top_world_vertices(
        self,
        tile: Tile,
        corner_heights: dict[str, float],
        origin_x: float,
        origin_y: float,
    ) -> list[DepthVertex]:
        return [
            self._world_vertex(tile.x, tile.y, corner_heights["north"], origin_x, origin_y),
            self._world_vertex(tile.x + 1.0, tile.y, corner_heights["east"], origin_x, origin_y),
            self._world_vertex(tile.x + 1.0, tile.y + 1.0, corner_heights["south"], origin_x, origin_y),
            self._world_vertex(tile.x, tile.y + 1.0, corner_heights["west"], origin_x, origin_y),
        ]

    def _face_world_vertices(
        self,
        game_map: GameMap,
        tile: Tile,
        corner_heights: dict[str, float],
        face: str,
        origin_x: float,
        origin_y: float,
    ) -> list[DepthVertex]:
        if face == "south":
            neighbor = game_map.neighbor(tile.x, tile.y, 0, 1)
            neighbor_height = float(neighbor.height) if neighbor and neighbor.terrain != "x" else -1.0
            return [
                self._world_vertex(tile.x, tile.y + 1.0, corner_heights["west"], origin_x, origin_y),
                self._world_vertex(tile.x + 1.0, tile.y + 1.0, corner_heights["south"], origin_x, origin_y),
                self._world_vertex(tile.x + 1.0, tile.y + 1.0, neighbor_height, origin_x, origin_y),
                self._world_vertex(tile.x, tile.y + 1.0, neighbor_height, origin_x, origin_y),
            ]

        neighbor = game_map.neighbor(tile.x, tile.y, 1, 0)
        neighbor_height = float(neighbor.height) if neighbor and neighbor.terrain != "x" else -1.0
        return [
            self._world_vertex(tile.x + 1.0, tile.y + 1.0, corner_heights["south"], origin_x, origin_y),
            self._world_vertex(tile.x + 1.0, tile.y, corner_heights["east"], origin_x, origin_y),
            self._world_vertex(tile.x + 1.0, tile.y, neighbor_height, origin_x, origin_y),
            self._world_vertex(tile.x + 1.0, tile.y + 1.0, neighbor_height, origin_x, origin_y),
        ]

    def _ramp_plane_world_vertices(
        self,
        tile: Tile,
        origin_x: float,
        origin_y: float,
    ) -> list[DepthVertex]:
        corner_heights = self._ramp_corner_heights(tile)
        return self._top_world_vertices(tile, corner_heights, origin_x, origin_y)

    def _ramp_triangle_world_vertices(
        self,
        tile: Tile,
        origin_x: float,
        origin_y: float,
    ) -> list[DepthVertex]:
        corner_heights = self._ramp_corner_heights(tile)
        top_vertices = self._top_world_vertices(tile, corner_heights, origin_x, origin_y)
        north, east, south, west = top_vertices
        if tile.ramp is None:
            return []
        if tile.ramp.value == "N":
            return [east, self._world_vertex(tile.x + 1.0, tile.y, float(tile.height), origin_x, origin_y), self._world_vertex(tile.x + 1.0, tile.y + 1.0, float(tile.height), origin_x, origin_y)]
        if tile.ramp.value == "E":
            return [south, self._world_vertex(tile.x + 1.0, tile.y + 1.0, float(tile.height), origin_x, origin_y), self._world_vertex(tile.x, tile.y + 1.0, float(tile.height), origin_x, origin_y)]
        if tile.ramp.value == "S":
            return [west, self._world_vertex(tile.x, tile.y + 1.0, float(tile.height), origin_x, origin_y), self._world_vertex(tile.x, tile.y, float(tile.height), origin_x, origin_y)]
        return [north, self._world_vertex(tile.x, tile.y, float(tile.height), origin_x, origin_y), self._world_vertex(tile.x + 1.0, tile.y, float(tile.height), origin_x, origin_y)]

    def _ramp_corner_heights(self, tile: Tile) -> dict[str, float]:
        lifted = {
            "N": {"north", "east"},
            "E": {"east", "south"},
            "S": {"south", "west"},
            "W": {"west", "north"},
        }[tile.ramp.value]
        return {
            "north": float(tile.height + (1 if "north" in lifted else 0)),
            "east": float(tile.height + (1 if "east" in lifted else 0)),
            "south": float(tile.height + (1 if "south" in lifted else 0)),
            "west": float(tile.height + (1 if "west" in lifted else 0)),
        }

    def _world_vertex(
        self,
        world_x: float,
        world_y: float,
        world_z: float,
        origin_x: float,
        origin_y: float,
    ) -> DepthVertex:
        screen_x, screen_y = grid_to_screen(
            world_x,
            world_y,
            world_z,
            self.config.tile_width,
            self.config.tile_height,
            self.config.height_step,
            origin_x,
            origin_y,
        )
        return DepthVertex(float(screen_x), float(screen_y), self._depth_from_world(world_x, world_y, world_z))

    def _screen_vertex(self, screen_x: float, screen_y: float, depth: float) -> DepthVertex:
        return DepthVertex(float(screen_x), float(screen_y), float(depth))

    def _depth_from_world(self, world_x: float, world_y: float, world_z: float) -> float:
        return ((world_x + world_y) * (self.config.tile_height / 2.0)) + (world_z * self.config.height_step)
