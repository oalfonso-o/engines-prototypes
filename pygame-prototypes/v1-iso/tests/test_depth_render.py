import os
import unittest
from array import array
from pathlib import Path

os.environ.setdefault("SDL_VIDEODRIVER", "dummy")

import pygame

from pyiso.config import RenderConfig
from pyiso.depth_render import DepthEllipse, DepthLine, DepthRenderer, DepthTriangle, DepthVertex
from pyiso.map_loader import load_map

MAP_DIR = Path(__file__).resolve().parents[1] / "maps" / "three_lanes"


class DepthRenderTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        pygame.init()

    @classmethod
    def tearDownClass(cls) -> None:
        pygame.quit()

    def test_depth_buffer_keeps_nearer_triangle_regardless_of_draw_order(self) -> None:
        renderer = DepthRenderer(RenderConfig(), pygame.font.SysFont("consolas", 18))
        far_triangle = DepthTriangle(
            DepthVertex(3.0, 3.0, 5.0),
            DepthVertex(15.0, 3.0, 5.0),
            DepthVertex(9.0, 15.0, 5.0),
            (10, 20, 200),
        )
        near_triangle = DepthTriangle(
            DepthVertex(3.0, 3.0, 12.0),
            DepthVertex(15.0, 3.0, 12.0),
            DepthVertex(9.0, 15.0, 12.0),
            (240, 60, 80),
        )

        for draw_order in ([far_triangle, near_triangle], [near_triangle, far_triangle]):
            surface = pygame.Surface((20, 20))
            surface.fill((0, 0, 0))
            depth_buffer = array("f", [float("-inf")]) * (20 * 20)
            surface.lock()
            try:
                for triangle in draw_order:
                    renderer._rasterize_triangle(surface, depth_buffer, triangle)
            finally:
                surface.unlock()
            self.assertEqual((240, 60, 80, 255), surface.get_at((9, 8)))

    def test_ramp_tile_emits_more_fill_geometry_than_flat_tile(self) -> None:
        renderer = DepthRenderer(RenderConfig(), pygame.font.SysFont("consolas", 18))
        game_map = load_map(MAP_DIR)
        ramp_tile = game_map.tile_at(7, 10)
        flat_tile = game_map.tile_at(8, 10)

        ramp_triangles = renderer._build_tile_triangles(game_map, ramp_tile, 0.0, 0.0)
        flat_triangles = renderer._build_tile_triangles(game_map, flat_tile, 0.0, 0.0)

        self.assertGreater(len(ramp_triangles), len(flat_triangles))

    def test_actor_ellipse_overwrites_farther_world_pixel(self) -> None:
        renderer = DepthRenderer(RenderConfig(), pygame.font.SysFont("consolas", 18))
        surface = pygame.Surface((32, 32))
        surface.fill((0, 0, 0))
        depth_buffer = array("f", [float("-inf")]) * (32 * 32)
        far_triangle = DepthTriangle(
            DepthVertex(4.0, 4.0, 10.0),
            DepthVertex(28.0, 4.0, 10.0),
            DepthVertex(16.0, 28.0, 10.0),
            (0, 0, 200),
        )
        actor = DepthEllipse(
            center_x=16.0,
            center_y=18.0,
            radius_x=6.0,
            radius_y=8.0,
            fill_color=(250, 250, 250),
            outline_color=(0, 255, 0),
            outline_width=0.0,
        )

        surface.lock()
        try:
            renderer._rasterize_triangle(surface, depth_buffer, far_triangle)
            renderer._rasterize_ellipse(surface, depth_buffer, actor)
        finally:
            surface.unlock()

        self.assertEqual((250, 250, 250, 255), surface.get_at((16, 18)))

    def test_nearer_world_pixel_hides_actor_ellipse(self) -> None:
        renderer = DepthRenderer(RenderConfig(), pygame.font.SysFont("consolas", 18))
        surface = pygame.Surface((32, 32))
        surface.fill((0, 0, 0))
        depth_buffer = array("f", [float("-inf")]) * (32 * 32)
        near_triangle = DepthTriangle(
            DepthVertex(4.0, 4.0, 30.0),
            DepthVertex(28.0, 4.0, 30.0),
            DepthVertex(16.0, 28.0, 30.0),
            (0, 200, 0),
        )
        actor = DepthEllipse(
            center_x=16.0,
            center_y=18.0,
            radius_x=6.0,
            radius_y=8.0,
            fill_color=(250, 250, 250),
            outline_color=(0, 255, 0),
            outline_width=0.0,
        )

        surface.lock()
        try:
            renderer._rasterize_triangle(surface, depth_buffer, near_triangle)
            renderer._rasterize_ellipse(surface, depth_buffer, actor)
        finally:
            surface.unlock()

        self.assertEqual((0, 200, 0, 255), surface.get_at((16, 18)))

    def test_depth_line_overwrites_farther_fill(self) -> None:
        renderer = DepthRenderer(RenderConfig(), pygame.font.SysFont("consolas", 18))
        surface = pygame.Surface((32, 32))
        surface.fill((0, 0, 0))
        depth_buffer = array("f", [float("-inf")]) * (32 * 32)
        far_triangle = DepthTriangle(
            DepthVertex(4.0, 4.0, 10.0),
            DepthVertex(28.0, 4.0, 10.0),
            DepthVertex(16.0, 28.0, 10.0),
            (0, 0, 200),
        )
        near_line = DepthLine(
            start=DepthVertex(4.0, 18.0, 18.0),
            end=DepthVertex(28.0, 18.0, 18.0),
            color=(255, 255, 0),
            width=3.0,
        )

        surface.lock()
        try:
            renderer._rasterize_triangle(surface, depth_buffer, far_triangle)
            renderer._rasterize_line(surface, depth_buffer, near_line)
        finally:
            surface.unlock()

        self.assertEqual((255, 255, 0, 255), surface.get_at((16, 18)))

    def test_world_depth_matches_projection_without_origin_offset(self) -> None:
        renderer = DepthRenderer(RenderConfig(), pygame.font.SysFont("consolas", 18))
        depth = renderer._depth_from_world(7.5, 10.5, 1.0)
        expected = ((7.5 + 10.5) * (RenderConfig().tile_height / 2.0)) + (1.0 * RenderConfig().height_step)
        self.assertAlmostEqual(expected, depth)

    def test_triangle_can_write_depth_without_surface(self) -> None:
        renderer = DepthRenderer(RenderConfig(), pygame.font.SysFont("consolas", 18))
        depth_buffer = array("f", [float("-inf")]) * (20 * 20)
        triangle = DepthTriangle(
            DepthVertex(3.0, 3.0, 7.0),
            DepthVertex(15.0, 3.0, 7.0),
            DepthVertex(9.0, 15.0, 7.0),
            (10, 20, 200),
        )
        renderer._rasterize_triangle(None, depth_buffer, triangle, 20, 20)
        self.assertEqual(7.0, depth_buffer[8 * 20 + 9])

    def test_face_world_vertices_do_not_collapse_to_zero_width(self) -> None:
        renderer = DepthRenderer(RenderConfig(), pygame.font.SysFont("consolas", 18))
        game_map = load_map(MAP_DIR)
        tile = game_map.tile_at(9, 9)
        _, corner_heights = renderer._tile_top_points(tile, 0.0, 0.0)

        south_face = renderer._face_world_vertices(game_map, tile, corner_heights, "south", 0.0, 0.0)
        east_face = renderer._face_world_vertices(game_map, tile, corner_heights, "east", 0.0, 0.0)

        self.assertGreater(max(vertex.x for vertex in south_face) - min(vertex.x for vertex in south_face), 0.0)
        self.assertGreater(max(vertex.x for vertex in east_face) - min(vertex.x for vertex in east_face), 0.0)

    def test_actor_ellipse_depth_uses_ground_height_not_raw_screen_y(self) -> None:
        renderer = DepthRenderer(RenderConfig(), pygame.font.SysFont("consolas", 18))
        primitive = DepthEllipse(
            center_x=16.0,
            center_y=18.0,
            radius_x=6.0,
            radius_y=8.0,
            fill_color=(250, 250, 250),
            outline_color=(0, 255, 0),
            outline_width=0.0,
            ground_y=24.0,
            ground_depth=100.0,
        )
        surface = pygame.Surface((32, 32))
        surface.fill((0, 0, 0))
        depth_buffer = array("f", [float("-inf")]) * (32 * 32)

        surface.lock()
        try:
            renderer._rasterize_ellipse(surface, depth_buffer, primitive)
        finally:
            surface.unlock()

        center_depth = depth_buffer[18 * 32 + 16]
        top_depth = depth_buffer[12 * 32 + 16]
        self.assertGreater(top_depth, center_depth)

    def test_player_body_uses_back_of_footprint_as_occlusion_anchor(self) -> None:
        renderer = DepthRenderer(RenderConfig(), pygame.font.SysFont("consolas", 18))
        geometry = renderer._player_geometry(
            {
                "grid_x": 8.95,
                "grid_y": 9.55,
                "height": 0.0,
                "jump_offset": 0.0,
                "facing_vector": (1.0, 0.0),
                "shadow_radius": 0.24,
            },
            0.0,
            0.0,
        )
        torso = geometry["depth_primitives"][0]
        self.assertLess(torso.ground_y, geometry["base_y"])

    def test_player_body_applies_world_favoring_depth_bias(self) -> None:
        renderer = DepthRenderer(RenderConfig(), pygame.font.SysFont("consolas", 18))
        player = {
            "grid_x": 8.95,
            "grid_y": 9.55,
            "height": 0.0,
            "jump_offset": 0.0,
            "facing_vector": (1.0, 0.0),
            "shadow_radius": 0.24,
        }
        geometry = renderer._player_geometry(player, 0.0, 0.0)
        torso = geometry["depth_primitives"][0]
        expected_world_depth = renderer._depth_from_world(
            float(player["grid_x"] - player["shadow_radius"]),
            float(player["grid_y"] - player["shadow_radius"]),
            float(player["height"]),
        )

        self.assertAlmostEqual(expected_world_depth - 0.25, torso.ground_depth)
        self.assertLess(torso.ground_depth, expected_world_depth)

    def test_higher_world_point_is_nearer_in_hidden_depth(self) -> None:
        renderer = DepthRenderer(RenderConfig(), pygame.font.SysFont("consolas", 18))
        low = renderer._depth_from_world(8.0, 9.0, 0.0)
        high = renderer._depth_from_world(8.0, 9.0, 1.0)

        self.assertGreater(high, low)


if __name__ == "__main__":
    unittest.main()
