from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class Direction(str, Enum):
    NORTH = "N"
    EAST = "E"
    SOUTH = "S"
    WEST = "W"


CARDINAL_VECTORS = {
    Direction.NORTH: (0, -1),
    Direction.EAST: (1, 0),
    Direction.SOUTH: (0, 1),
    Direction.WEST: (-1, 0),
}


TERRAIN_INFO = {
    "x": {"walkable": False, "label": "void", "top": (16, 18, 24), "edge": (9, 10, 16)},
    "g": {"walkable": True, "label": "ground", "top": (26, 38, 56), "edge": (12, 20, 34)},
    "p": {"walkable": True, "label": "path", "top": (38, 56, 88), "edge": (18, 28, 46)},
    "j": {"walkable": True, "label": "jungle", "top": (23, 64, 68), "edge": (9, 28, 33)},
    "a": {"walkable": True, "label": "base_a", "top": (42, 112, 228), "edge": (18, 46, 102)},
    "b": {"walkable": True, "label": "base_b", "top": (231, 66, 128), "edge": (108, 26, 62)},
}


@dataclass(frozen=True)
class Tile:
    x: int
    y: int
    height: int
    terrain: str
    ramp: Direction | None = None
    meta: str = "."

    @property
    def is_walkable(self) -> bool:
        return bool(TERRAIN_INFO[self.terrain]["walkable"])

    @property
    def surface_height(self) -> int:
        return self.height


@dataclass(frozen=True)
class GameMap:
    width: int
    height: int
    tiles: tuple[tuple[Tile, ...], ...]
    player_spawn: tuple[int, int]

    def in_bounds(self, x: int, y: int) -> bool:
        return 0 <= x < self.width and 0 <= y < self.height

    def tile_at(self, x: int, y: int) -> Tile:
        return self.tiles[y][x]

    def neighbor(self, x: int, y: int, dx: int, dy: int) -> Tile | None:
        nx, ny = x + dx, y + dy
        if not self.in_bounds(nx, ny):
            return None
        return self.tile_at(nx, ny)
