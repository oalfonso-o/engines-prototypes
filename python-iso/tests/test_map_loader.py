import unittest
from pathlib import Path

from pyiso.map_data import CARDINAL_VECTORS
from pyiso.map_loader import load_map


MAP_DIR = Path(__file__).resolve().parents[1] / "maps" / "three_lanes"


class MapLoaderTests(unittest.TestCase):
    def test_load_map_reads_expected_dimensions(self) -> None:
        game_map = load_map(MAP_DIR)
        self.assertEqual(21, game_map.width)
        self.assertEqual(21, game_map.height)

    def test_load_map_finds_player_spawn(self) -> None:
        game_map = load_map(MAP_DIR)
        self.assertEqual((1, 19), game_map.player_spawn)

    def test_load_map_keeps_ramp_metadata(self) -> None:
        game_map = load_map(MAP_DIR)
        self.assertIsNotNone(game_map.tile_at(7, 10).ramp)

    def test_all_ramps_have_walkable_low_and_high_access(self) -> None:
        game_map = load_map(MAP_DIR)
        for row in game_map.tiles:
            for tile in row:
                if tile.ramp is None:
                    continue
                dx, dy = CARDINAL_VECTORS[tile.ramp]
                low_tile = game_map.neighbor(tile.x, tile.y, -dx, -dy)
                high_tile = game_map.neighbor(tile.x, tile.y, dx, dy)
                self.assertIsNotNone(low_tile)
                self.assertIsNotNone(high_tile)
                self.assertTrue(low_tile.is_walkable)
                self.assertTrue(high_tile.is_walkable)
                self.assertEqual(tile.height, low_tile.height)
                self.assertEqual(tile.height + 1, high_tile.height)


if __name__ == "__main__":
    unittest.main()
