from __future__ import annotations

from pathlib import Path

from pyiso.map_data import CARDINAL_VECTORS, Direction, GameMap, TERRAIN_INFO, Tile


def _read_grid(path: Path) -> list[list[str]]:
    lines: list[list[str]] = []
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        lines.append(line.split())
    if not lines:
        raise ValueError(f"{path} is empty")
    width = len(lines[0])
    if any(len(row) != width for row in lines):
        raise ValueError(f"{path} has inconsistent row widths")
    return lines


def load_map(map_dir: str | Path) -> GameMap:
    root = Path(map_dir)
    heights_raw = _read_grid(root / "heights.txt")
    terrain_raw = _read_grid(root / "terrain.txt")
    ramps_raw = _read_grid(root / "ramps.txt")
    meta_raw = _read_grid(root / "meta.txt")

    height = len(heights_raw)
    width = len(heights_raw[0])
    for layer_name, layer in (
        ("terrain", terrain_raw),
        ("ramps", ramps_raw),
        ("meta", meta_raw),
    ):
        if len(layer) != height or len(layer[0]) != width:
            raise ValueError(f"{layer_name} dimensions do not match heights")

    spawn: tuple[int, int] | None = None
    rows: list[tuple[Tile, ...]] = []
    for y in range(height):
        row: list[Tile] = []
        for x in range(width):
            terrain = terrain_raw[y][x]
            if terrain not in TERRAIN_INFO:
                raise ValueError(f"Unknown terrain token {terrain!r} at {x},{y}")
            ramp_token = ramps_raw[y][x]
            ramp = None if ramp_token == "." else Direction(ramp_token)
            meta = meta_raw[y][x]
            tile = Tile(
                x=x,
                y=y,
                height=int(heights_raw[y][x]),
                terrain=terrain,
                ramp=ramp,
                meta=meta,
            )
            if meta == "P":
                spawn = (x, y)
            row.append(tile)
        rows.append(tuple(row))

    game_map = GameMap(width=width, height=height, tiles=tuple(rows), player_spawn=spawn or (0, 0))
    _validate_ramps(game_map)
    if spawn is None:
        raise ValueError("meta.txt must contain one player spawn marked with P")
    return game_map


def _validate_ramps(game_map: GameMap) -> None:
    for row in game_map.tiles:
        for tile in row:
            if tile.ramp is None:
                continue
            dx, dy = CARDINAL_VECTORS[tile.ramp]
            neighbor = game_map.neighbor(tile.x, tile.y, dx, dy)
            if neighbor is None:
                raise ValueError(f"Ramp at {tile.x},{tile.y} points out of bounds")
            expected_height = tile.height + 1
            if neighbor.height != expected_height:
                raise ValueError(
                    f"Ramp at {tile.x},{tile.y} expects height {expected_height} on {tile.ramp.value}, got {neighbor.height}"
                )
            if not neighbor.is_walkable:
                raise ValueError(f"Ramp at {tile.x},{tile.y} must reach a walkable high tile")

            low_neighbor = game_map.neighbor(tile.x, tile.y, -dx, -dy)
            if low_neighbor is None:
                raise ValueError(f"Ramp at {tile.x},{tile.y} is missing a low-side access tile")
            if not low_neighbor.is_walkable:
                raise ValueError(f"Ramp at {tile.x},{tile.y} must have a walkable low-side access tile")
            if low_neighbor.height != tile.height:
                raise ValueError(
                    f"Ramp at {tile.x},{tile.y} expects low-side height {tile.height}, got {low_neighbor.height}"
                )
