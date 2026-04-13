from __future__ import annotations

from dataclasses import dataclass

from pyiso.map_data import CARDINAL_VECTORS, Direction, GameMap, Tile
from pyiso.physics import WorldPosition, get_tile_at_world, is_position_valid, surface_height_at_point


@dataclass(frozen=True)
class TraversalResult:
    allowed: bool
    jump_required: bool = False
    reason: str = ""


def can_traverse(
    game_map: GameMap,
    source: tuple[int, int],
    destination: tuple[int, int],
    wants_jump: bool,
) -> TraversalResult:
    sx, sy = source
    dx, dy = destination
    if not game_map.in_bounds(dx, dy):
        return TraversalResult(False, reason="out_of_bounds")

    from_tile = game_map.tile_at(sx, sy)
    to_tile = game_map.tile_at(dx, dy)
    if not to_tile.is_walkable:
        return TraversalResult(False, reason="blocked_terrain")

    delta = (dx - sx, dy - sy)
    if abs(delta[0]) + abs(delta[1]) != 1:
        return TraversalResult(False, reason="only_cardinal")

    height_delta = to_tile.height - from_tile.height
    if height_delta == 0:
        return TraversalResult(True)

    if _edge_has_ramp(from_tile, to_tile, delta):
        return TraversalResult(True)

    if abs(height_delta) <= 1 and wants_jump:
        return TraversalResult(True, jump_required=True)

    return TraversalResult(False, reason="height_blocked")


def can_move_freely(
    game_map: GameMap,
    position: WorldPosition,
    radius: float,
    jump_active: bool,
    ground_step_height: float,
    jump_step_height: float,
) -> bool:
    max_step_height = jump_step_height if jump_active else ground_step_height
    return is_position_valid(game_map, position, radius, max_step_height)


def current_surface_height(game_map: GameMap, position: WorldPosition) -> float | None:
    return surface_height_at_point(game_map, position)


def current_tile(game_map: GameMap, position: WorldPosition) -> Tile | None:
    return get_tile_at_world(game_map, position)


def _edge_has_ramp(from_tile: Tile, to_tile: Tile, delta: tuple[int, int]) -> bool:
    for direction, vector in CARDINAL_VECTORS.items():
        if vector != delta:
            continue
        if from_tile.ramp == direction and to_tile.height == from_tile.height + 1:
            return True
        opposite = opposite_direction(direction)
        if to_tile.ramp == opposite and from_tile.height == to_tile.height + 1:
            return True
    return False


def opposite_direction(direction: Direction) -> Direction:
    return {
        Direction.NORTH: Direction.SOUTH,
        Direction.SOUTH: Direction.NORTH,
        Direction.EAST: Direction.WEST,
        Direction.WEST: Direction.EAST,
    }[direction]
