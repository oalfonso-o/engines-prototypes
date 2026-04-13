import unittest
from pathlib import Path

from pyiso.config import PlayerConfig
from pyiso.map_loader import load_map
from pyiso.movement import can_move_freely, can_traverse, current_surface_height
from pyiso.physics import WorldPosition, is_position_valid, move_with_collision, resolve_invalid_landing_position


MAP_DIR = Path(__file__).resolve().parents[1] / "maps" / "three_lanes"


class MovementTests(unittest.TestCase):
    def test_same_height_walk_is_allowed(self) -> None:
        game_map = load_map(MAP_DIR)
        result = can_traverse(game_map, (3, 16), (4, 16), wants_jump=False)
        self.assertTrue(result.allowed)
        self.assertFalse(result.jump_required)

    def test_height_step_without_ramp_or_jump_is_blocked(self) -> None:
        game_map = load_map(MAP_DIR)
        result = can_traverse(game_map, (9, 8), (10, 8), wants_jump=False)
        self.assertFalse(result.allowed)
        self.assertEqual("height_blocked", result.reason)

    def test_jump_allows_simple_step_of_one_level(self) -> None:
        game_map = load_map(MAP_DIR)
        result = can_traverse(game_map, (9, 8), (10, 8), wants_jump=True)
        self.assertTrue(result.allowed)
        self.assertTrue(result.jump_required)

    def test_ramp_allows_level_transition_without_jump(self) -> None:
        game_map = load_map(MAP_DIR)
        result = can_traverse(game_map, (7, 10), (8, 10), wants_jump=False)
        self.assertTrue(result.allowed)
        self.assertFalse(result.jump_required)

    def test_ramp_surface_height_interpolates_continuously(self) -> None:
        game_map = load_map(MAP_DIR)
        lower = current_surface_height(game_map, WorldPosition(7.05, 10.5))
        higher = current_surface_height(game_map, WorldPosition(7.95, 10.5))
        self.assertIsNotNone(lower)
        self.assertIsNotNone(higher)
        self.assertLess(lower, higher)
        self.assertGreater(higher, 0.8)

    def test_free_position_inside_tile_is_valid(self) -> None:
        game_map = load_map(MAP_DIR)
        self.assertTrue(can_move_freely(game_map, WorldPosition(4.23, 16.71), 0.18, False, 0.34, 1.05))

    def test_void_tile_blocks_continuous_position(self) -> None:
        game_map = load_map(MAP_DIR)
        self.assertFalse(can_move_freely(game_map, WorldPosition(6.2, 0.4), 0.18, False, 0.34, 1.05))

    def test_continuous_collision_slides_on_blocked_axis(self) -> None:
        game_map = load_map(MAP_DIR)
        start = WorldPosition(4.2, 5.5)
        result = move_with_collision(game_map, start, 0.8, -0.8, 0.18, 0.34, 0.12)
        self.assertGreaterEqual(result.position.x, start.x - 0.01)
        self.assertLess(result.position.y, start.y)
        self.assertTrue(result.blocked_x)

    def test_shadow_collision_stops_before_higher_plateau_wall(self) -> None:
        game_map = load_map(MAP_DIR)
        radius = PlayerConfig().collision_radius_tiles
        start = WorldPosition(9.5, 8.5)
        result = move_with_collision(game_map, start, 0.8, 0.0, radius, 0.34, 0.12)
        self.assertTrue(result.blocked_x)
        self.assertAlmostEqual(10.0 - radius, result.position.x, delta=0.04)

    def test_shadow_collision_stops_before_plateau_corner_drop(self) -> None:
        game_map = load_map(MAP_DIR)
        radius = PlayerConfig().collision_radius_tiles
        start = WorldPosition(11.5, 11.5)
        result = move_with_collision(game_map, start, 0.7, 0.7, radius, 0.34, 0.12)
        self.assertTrue(result.blocked_x)
        self.assertTrue(result.blocked_y)
        self.assertAlmostEqual(12.0 - radius, result.position.x, delta=0.03)
        self.assertAlmostEqual(12.0 - radius, result.position.y, delta=0.03)

    def test_invalid_landing_resolves_to_tile_with_most_shadow_overlap(self) -> None:
        game_map = load_map(MAP_DIR)
        radius = PlayerConfig().collision_radius_tiles
        stuck = WorldPosition(9.8, 8.2)
        self.assertFalse(is_position_valid(game_map, stuck, radius, 0.34))
        self.assertTrue(is_position_valid(game_map, stuck, radius, 1.05))

        resolved = resolve_invalid_landing_position(game_map, stuck, radius, 0.34)
        self.assertIsNotNone(resolved)
        self.assertEqual((9, 8), (int(resolved.x), int(resolved.y)))
        self.assertTrue(is_position_valid(game_map, resolved, radius, 0.34))


if __name__ == "__main__":
    unittest.main()
