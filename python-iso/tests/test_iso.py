import unittest

import os
from pathlib import Path

os.environ.setdefault("SDL_VIDEODRIVER", "dummy")

import pygame

from pyiso.config import PlayerConfig, RenderConfig
from pyiso.game import screen_input_to_world_vector
from pyiso.iso import diamond_points, grid_to_screen, origin_for_focus
from pyiso.map_loader import load_map
from pyiso.render import IsoRenderer

MAP_DIR = Path(__file__).resolve().parents[1] / "maps" / "three_lanes"


class IsoTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        pygame.init()

    @classmethod
    def tearDownClass(cls) -> None:
        pygame.quit()

    def test_grid_to_screen_origin_projection(self) -> None:
        x, y = grid_to_screen(0, 0, 0, 96, 48, 28, 100, 200)
        self.assertEqual(100, x)
        self.assertEqual(200, y)

    def test_grid_to_screen_moves_height_upwards(self) -> None:
        _, y0 = grid_to_screen(3, 2, 0, 96, 48, 28, 0, 0)
        _, y1 = grid_to_screen(3, 2, 2, 96, 48, 28, 0, 0)
        self.assertEqual(y0 - 56, y1)

    def test_diamond_points_are_clockwise_iso_shape(self) -> None:
        points = diamond_points(100, 200, 96, 48)
        self.assertEqual([(100, 176), (148, 200), (100, 224), (52, 200)], points)

    def test_origin_for_focus_projects_focus_to_target_screen_point(self) -> None:
        origin_x, origin_y = origin_for_focus(7.5, 10.5, 1.0, 96, 48, 28, 640, 400)
        x, y = grid_to_screen(7.5, 10.5, 1.0, 96, 48, 28, origin_x, origin_y)
        self.assertAlmostEqual(640.0, x)
        self.assertAlmostEqual(400.0, y)

    def test_w_input_moves_straight_up_on_screen(self) -> None:
        world_x, world_y = screen_input_to_world_vector(0.0, -1.0)
        screen_x, screen_y = grid_to_screen(world_x, world_y, 0.0, 96, 48, 28, 0.0, 0.0)
        self.assertAlmostEqual(0.0, screen_x, delta=0.0001)
        self.assertLess(screen_y, 0.0)

    def test_renderer_camera_keeps_player_body_centered(self) -> None:
        renderer = IsoRenderer(RenderConfig(), pygame.font.SysFont("consolas", 18))
        player_visual = {
            "grid_x": 5.5,
            "grid_y": 12.5,
            "height": 0.0,
            "jump_offset": 0.0,
            "facing_vector": (0.0, -1.0),
            "shadow_radius": PlayerConfig().collision_radius_tiles,
        }
        origin_x, origin_y = renderer.compute_origin(player_visual)
        base_x, base_y = grid_to_screen(
            player_visual["grid_x"],
            player_visual["grid_y"],
            player_visual["height"],
            renderer.config.tile_width,
            renderer.config.tile_height,
            renderer.config.height_step,
            origin_x,
            origin_y,
        )
        self.assertAlmostEqual(renderer.config.screen_width / 2.0, base_x)
        self.assertAlmostEqual(renderer.config.screen_height / 2.0, base_y - 26.0)

    def test_ramp_tile_top_remains_flat(self) -> None:
        renderer = IsoRenderer(RenderConfig(), pygame.font.SysFont("consolas", 18))
        game_map = load_map(MAP_DIR)
        ramp_tile = game_map.tile_at(7, 10)
        ramp_points, _ = renderer._tile_top_points(ramp_tile, 0.0, 0.0)
        center_x = sum(point[0] for point in ramp_points) / 4.0
        center_y = sum(point[1] for point in ramp_points) / 4.0
        expected = [(-0.0, -24.0), (48.0, 0.0), (0.0, 24.0), (-48.0, 0.0)]
        actual = [(point[0] - center_x, point[1] - center_y) for point in ramp_points]
        self.assertEqual(expected, actual)

    def test_shadow_uses_collision_radius_projection(self) -> None:
        radius = PlayerConfig().collision_radius_tiles
        width = round(RenderConfig().tile_width * (2**0.5) * radius)
        height = round(RenderConfig().tile_height * (2**0.5) * radius)
        self.assertEqual(33, width)
        self.assertEqual(16, height)


if __name__ == "__main__":
    unittest.main()
