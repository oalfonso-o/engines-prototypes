from __future__ import annotations

import math
from dataclasses import dataclass

from pyiso.map_data import CARDINAL_VECTORS, Direction, GameMap, Tile


@dataclass(frozen=True)
class WorldPosition:
    x: float
    y: float


@dataclass(frozen=True)
class CollisionResult:
    position: WorldPosition
    blocked_x: bool
    blocked_y: bool
    surface_height: float


def world_to_tile_coords(position: WorldPosition) -> tuple[int, int]:
    return math.floor(position.x), math.floor(position.y)


def get_tile_at_world(game_map: GameMap, position: WorldPosition) -> Tile | None:
    tile_x, tile_y = world_to_tile_coords(position)
    if not game_map.in_bounds(tile_x, tile_y):
        return None
    return game_map.tile_at(tile_x, tile_y)


def surface_height_at_point(game_map: GameMap, position: WorldPosition) -> float | None:
    tile = get_tile_at_world(game_map, position)
    if tile is None or not tile.is_walkable:
        return None

    local_x = position.x - tile.x
    local_y = position.y - tile.y
    height = float(tile.height)
    if tile.ramp is None:
        return height

    if tile.ramp == Direction.NORTH:
        return height + (1.0 - local_y)
    if tile.ramp == Direction.SOUTH:
        return height + local_y
    if tile.ramp == Direction.EAST:
        return height + local_x
    if tile.ramp == Direction.WEST:
        return height + (1.0 - local_x)
    return height


def is_position_valid(
    game_map: GameMap,
    position: WorldPosition,
    radius: float,
    max_step_height: float,
) -> bool:
    center_height = surface_height_at_point(game_map, position)
    if center_height is None:
        return False

    for sample in _circle_samples(position, radius):
        sample_height = surface_height_at_point(game_map, sample)
        if sample_height is None:
            return False
        if abs(sample_height - center_height) > max_step_height:
            return False
    return True


def move_with_collision(
    game_map: GameMap,
    start: WorldPosition,
    delta_x: float,
    delta_y: float,
    radius: float,
    max_step_height: float,
    collision_substep_distance: float,
) -> CollisionResult:
    steps = max(1, math.ceil(max(abs(delta_x), abs(delta_y)) / max(0.0001, collision_substep_distance)))
    step_x = delta_x / steps
    step_y = delta_y / steps
    current = start
    blocked_x = False
    blocked_y = False

    for _ in range(steps):
        candidate_x = WorldPosition(current.x + step_x, current.y)
        if not blocked_x and is_position_valid(game_map, candidate_x, radius, max_step_height):
            current = candidate_x
        else:
            blocked_x = blocked_x or abs(step_x) > 0.00001

        candidate_y = WorldPosition(current.x, current.y + step_y)
        if not blocked_y and is_position_valid(game_map, candidate_y, radius, max_step_height):
            current = candidate_y
        else:
            blocked_y = blocked_y or abs(step_y) > 0.00001

    surface_height = surface_height_at_point(game_map, current)
    if surface_height is None:
        surface_height = 0.0
    return CollisionResult(current, blocked_x, blocked_y, surface_height)


def resolve_invalid_landing_position(
    game_map: GameMap,
    position: WorldPosition,
    radius: float,
    max_step_height: float,
) -> WorldPosition | None:
    if is_position_valid(game_map, position, radius, max_step_height):
        return position

    ranked_tiles = _rank_tiles_by_shadow_overlap(game_map, position, radius)
    for tile_x, tile_y in ranked_tiles:
        tile = game_map.tile_at(tile_x, tile_y)
        if not tile.is_walkable:
            continue
        candidate = _find_valid_point_in_tile(game_map, tile_x, tile_y, position, radius, max_step_height)
        if candidate is not None:
            return candidate
    return None


def _circle_samples(position: WorldPosition, radius: float) -> list[WorldPosition]:
    offsets = [
        (0.0, 0.0),
        (radius, 0.0),
        (-radius, 0.0),
        (0.0, radius),
        (0.0, -radius),
        (radius * 0.707, radius * 0.707),
        (radius * 0.707, -radius * 0.707),
        (-radius * 0.707, radius * 0.707),
        (-radius * 0.707, -radius * 0.707),
    ]
    return [WorldPosition(position.x + dx, position.y + dy) for dx, dy in offsets]


def _rank_tiles_by_shadow_overlap(
    game_map: GameMap,
    position: WorldPosition,
    radius: float,
) -> list[tuple[int, int]]:
    overlap_counts: dict[tuple[int, int], int] = {}
    sample_resolution = 9
    for sample in _dense_circle_samples(position, radius, sample_resolution):
        tile_x, tile_y = world_to_tile_coords(sample)
        if not game_map.in_bounds(tile_x, tile_y):
            continue
        key = (tile_x, tile_y)
        overlap_counts[key] = overlap_counts.get(key, 0) + 1
    return sorted(overlap_counts.keys(), key=lambda key: (-overlap_counts[key], key[1], key[0]))


def _find_valid_point_in_tile(
    game_map: GameMap,
    tile_x: int,
    tile_y: int,
    original_position: WorldPosition,
    radius: float,
    max_step_height: float,
) -> WorldPosition | None:
    epsilon = 0.001
    min_x = tile_x + radius + epsilon
    max_x = tile_x + 1.0 - radius - epsilon
    min_y = tile_y + radius + epsilon
    max_y = tile_y + 1.0 - radius - epsilon
    if min_x > max_x or min_y > max_y:
        return None

    clamped = WorldPosition(
        min(max(original_position.x, min_x), max_x),
        min(max(original_position.y, min_y), max_y),
    )
    candidates = [clamped, WorldPosition(tile_x + 0.5, tile_y + 0.5)]
    subdivisions = 4
    for y_index in range(subdivisions + 1):
        y = min_y + ((max_y - min_y) * y_index / subdivisions)
        for x_index in range(subdivisions + 1):
            x = min_x + ((max_x - min_x) * x_index / subdivisions)
            candidates.append(WorldPosition(x, y))

    unique_candidates = list({(round(candidate.x, 5), round(candidate.y, 5)): candidate for candidate in candidates}.values())
    unique_candidates.sort(key=lambda candidate: ((candidate.x - original_position.x) ** 2) + ((candidate.y - original_position.y) ** 2))
    for candidate in unique_candidates:
        if is_position_valid(game_map, candidate, radius, max_step_height):
            return candidate
    return None


def _dense_circle_samples(position: WorldPosition, radius: float, sample_resolution: int) -> list[WorldPosition]:
    samples: list[WorldPosition] = []
    for yi in range(-sample_resolution, sample_resolution + 1):
        for xi in range(-sample_resolution, sample_resolution + 1):
            dx = (xi / sample_resolution) * radius
            dy = (yi / sample_resolution) * radius
            if (dx * dx) + (dy * dy) > (radius * radius) + 1e-9:
                continue
            samples.append(WorldPosition(position.x + dx, position.y + dy))
    return samples
