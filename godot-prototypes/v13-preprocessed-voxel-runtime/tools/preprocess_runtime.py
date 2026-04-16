#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


EMPTY_CHAR = "0"
VOXEL_TYPES = {
    "0": {"solid": False, "material_key": ""},
    "1": {"solid": True, "material_key": "gray"},
    "G": {"solid": True, "material_key": "green"},
    "P": {"solid": True, "material_key": "purple"},
    "=": {"solid": True, "material_key": "metal"},
}

REPO_ROOT = Path(__file__).resolve().parents[3]
SOURCE_MAP = REPO_ROOT / "godot-prototypes" / "v12-voxel-cross-corridor" / "maps" / "cross_cube_map.txt"
OUTPUT_PATH = REPO_ROOT / "godot-prototypes" / "v13-preprocessed-voxel-runtime" / "data" / "runtime_world.json"


class VoxelMap:
    def __init__(self, size_x: int, size_y: int, size_z: int, voxel_size: float) -> None:
        self.size_x = size_x
        self.size_y = size_y
        self.size_z = size_z
        self.voxel_size = voxel_size
        self.grid = bytearray((ord(EMPTY_CHAR),)) * (size_x * size_y * size_z)
        self.active_min = (0, 0, 0)
        self.active_max = (0, 0, 0)

    def index(self, x: int, y: int, z: int) -> int:
        return x + (z * self.size_x) + (y * self.size_x * self.size_z)

    def in_bounds(self, x: int, y: int, z: int) -> bool:
        return 0 <= x < self.size_x and 0 <= y < self.size_y and 0 <= z < self.size_z

    def char(self, x: int, y: int, z: int) -> str:
        if not self.in_bounds(x, y, z):
            return EMPTY_CHAR
        return chr(self.grid[self.index(x, y, z)])

    def set_char(self, x: int, y: int, z: int, value: str) -> None:
        self.grid[self.index(x, y, z)] = ord(value)

    def is_solid(self, x: int, y: int, z: int) -> bool:
        return VOXEL_TYPES.get(self.char(x, y, z), VOXEL_TYPES[EMPTY_CHAR])["solid"]

    def material_key(self, x: int, y: int, z: int) -> str:
        return VOXEL_TYPES.get(self.char(x, y, z), VOXEL_TYPES[EMPTY_CHAR])["material_key"]

    def recompute_active_bounds(self) -> None:
        min_x, min_y, min_z = self.size_x, self.size_y, self.size_z
        max_x = max_y = max_z = -1
        empty = ord(EMPTY_CHAR)
        for y in range(self.size_y):
            for z in range(self.size_z):
                row_base = self.index(0, y, z)
                for x in range(self.size_x):
                    if self.grid[row_base + x] == empty:
                        continue
                    min_x = min(min_x, x)
                    min_y = min(min_y, y)
                    min_z = min(min_z, z)
                    max_x = max(max_x, x + 1)
                    max_y = max(max_y, y + 1)
                    max_z = max(max_z, z + 1)
        if max_x < 0:
            self.active_min = (0, 0, 0)
            self.active_max = (0, 0, 0)
        else:
            self.active_min = (min_x, min_y, min_z)
            self.active_max = (max_x, max_y, max_z)


def parse_compact_map(path: Path) -> VoxelMap:
    lines = [
        line.strip()
        for line in path.read_text().splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]
    size_parts = lines[0].split()
    voxel_parts = lines[1].split()
    size_x, size_y, size_z = map(int, size_parts[1:4])
    voxel_size = float(voxel_parts[1])
    world = VoxelMap(size_x, size_y, size_z, voxel_size)
    empty_row = EMPTY_CHAR * size_x

    line_index = 2
    while line_index < len(lines):
        line = lines[line_index]
        if line.startswith("EMPTY_LAYERS "):
            line_index += 1
            continue
        if line.startswith("LAYER "):
            header_parts = line.split()
            layer_start = int(header_parts[1])
            repeat_count = int(header_parts[3]) if len(header_parts) == 4 else 1
            rows = [empty_row for _ in range(size_z)]
            line_index += 1
            while line_index < len(lines):
                current = lines[line_index]
                if current.startswith("LAYER ") or current.startswith("EMPTY_LAYERS "):
                    break
                if current.startswith("EMPTY_ROWS "):
                    line_index += 1
                    continue
                if current.startswith("ROW "):
                    _, row_index_text, encoding, payload = current.split(" ", 3)
                    row_index = int(row_index_text)
                    if encoding == "RAW":
                        rows[row_index] = payload
                    else:
                        rows[row_index] = expand_rle(payload)
                    line_index += 1
                    continue
                raise ValueError(f"Unexpected line: {current}")
            for dy in range(repeat_count):
                y = layer_start + dy
                for z, row in enumerate(rows):
                    base = world.index(0, y, z)
                    world.grid[base : base + size_x] = row.encode("ascii")
            continue
        raise ValueError(f"Unexpected directive: {line}")

    world.recompute_active_bounds()
    return world


def expand_rle(text: str) -> str:
    parts = []
    for run in text.split(","):
        count_text, value = run.strip().split(":", 1)
        parts.append(value * int(count_text))
    return "".join(parts)


def build_key_mask(width: int, height: int) -> list[list[str]]:
    return [["" for _ in range(height)] for _ in range(width)]


def extract_key_rectangles(mask: list[list[str]]) -> list[tuple[tuple[int, int, int, int], str]]:
    rectangles: list[tuple[tuple[int, int, int, int], str]] = []
    for u in range(len(mask)):
        for v in range(len(mask[u])):
            material_key = mask[u][v]
            if not material_key:
                continue
            width = 1
            while v + width < len(mask[u]) and mask[u][v + width] == material_key:
                width += 1
            height = 1
            can_grow = True
            while u + height < len(mask) and can_grow:
                for step in range(width):
                    if mask[u + height][v + step] != material_key:
                        can_grow = False
                        break
                if can_grow:
                    height += 1
            for clear_u in range(height):
                for clear_v in range(width):
                    mask[u + clear_u][v + clear_v] = ""
            rectangles.append(((u, v, height, width), material_key))
    return rectangles


def append_quad(quads_by_material: dict[str, list[list[int]]], material_key: str, origin: tuple[int, int, int], u_axis: tuple[int, int, int], v_axis: tuple[int, int, int], normal: tuple[int, int, int]) -> None:
    quads_by_material.setdefault(material_key, []).append([
        origin[0], origin[1], origin[2],
        u_axis[0], u_axis[1], u_axis[2],
        v_axis[0], v_axis[1], v_axis[2],
        normal[0], normal[1], normal[2],
    ])


def build_quads(world: VoxelMap) -> dict[str, list[list[int]]]:
    quads: dict[str, list[list[int]]] = {}
    min_x, min_y, min_z = world.active_min
    max_x, max_y, max_z = world.active_max

    for plane_x in range(min_x, max_x + 1):
        pos_mask = build_key_mask(max_y - min_y, max_z - min_z)
        neg_mask = build_key_mask(max_y - min_y, max_z - min_z)
        for y in range(min_y, max_y):
            for z in range(min_z, max_z):
                left_solid = world.is_solid(plane_x - 1, y, z)
                right_solid = world.is_solid(plane_x, y, z)
                if left_solid and not right_solid:
                    pos_mask[y - min_y][z - min_z] = world.material_key(plane_x - 1, y, z)
                elif right_solid and not left_solid:
                    neg_mask[y - min_y][z - min_z] = world.material_key(plane_x, y, z)
        for (u, v, h, w), material_key in extract_key_rectangles(pos_mask):
            append_quad(quads, material_key, (plane_x, min_y + u, min_z + v), (0, h, 0), (0, 0, w), (1, 0, 0))
        for (u, v, h, w), material_key in extract_key_rectangles(neg_mask):
            append_quad(quads, material_key, (plane_x, min_y + u, min_z + v + w), (0, h, 0), (0, 0, -w), (-1, 0, 0))

    for plane_y in range(min_y, max_y + 1):
        pos_mask = build_key_mask(max_x - min_x, max_z - min_z)
        neg_mask = build_key_mask(max_x - min_x, max_z - min_z)
        for x in range(min_x, max_x):
            for z in range(min_z, max_z):
                below_solid = world.is_solid(x, plane_y - 1, z)
                above_solid = world.is_solid(x, plane_y, z)
                if below_solid and not above_solid:
                    pos_mask[x - min_x][z - min_z] = world.material_key(x, plane_y - 1, z)
                elif above_solid and not below_solid:
                    neg_mask[x - min_x][z - min_z] = world.material_key(x, plane_y, z)
        for (u, v, h, w), material_key in extract_key_rectangles(pos_mask):
            append_quad(quads, material_key, (min_x + u, plane_y, min_z + v + w), (h, 0, 0), (0, 0, -w), (0, 1, 0))
        for (u, v, h, w), material_key in extract_key_rectangles(neg_mask):
            append_quad(quads, material_key, (min_x + u, plane_y, min_z + v), (h, 0, 0), (0, 0, w), (0, -1, 0))

    for plane_z in range(min_z, max_z + 1):
        pos_mask = build_key_mask(max_x - min_x, max_y - min_y)
        neg_mask = build_key_mask(max_x - min_x, max_y - min_y)
        for x in range(min_x, max_x):
            for y in range(min_y, max_y):
                back_solid = world.is_solid(x, y, plane_z - 1)
                front_solid = world.is_solid(x, y, plane_z)
                if back_solid and not front_solid:
                    pos_mask[x - min_x][y - min_y] = world.material_key(x, y, plane_z - 1)
                elif front_solid and not back_solid:
                    neg_mask[x - min_x][y - min_y] = world.material_key(x, y, plane_z)
        for (u, v, h, w), material_key in extract_key_rectangles(pos_mask):
            append_quad(quads, material_key, (min_x + u, min_y + v, plane_z), (h, 0, 0), (0, w, 0), (0, 0, 1))
        for (u, v, h, w), material_key in extract_key_rectangles(neg_mask):
            append_quad(quads, material_key, (min_x + u, min_y + v + w, plane_z), (h, 0, 0), (0, -w, 0), (0, 0, -1))

    return quads


def build_collision_boxes(world: VoxelMap) -> list[list[int]]:
    min_x, min_y, min_z = world.active_min
    max_x, max_y, max_z = world.active_max
    size_x = max_x - min_x
    size_y = max_y - min_y
    size_z = max_z - min_z
    visited = bytearray(size_x * size_y * size_z)

    def active_index(x: int, y: int, z: int) -> int:
        lx = x - min_x
        ly = y - min_y
        lz = z - min_z
        return lx + (lz * size_x) + (ly * size_x * size_z)

    boxes: list[list[int]] = []
    for y in range(min_y, max_y):
        for z in range(min_z, max_z):
            for x in range(min_x, max_x):
                if not world.is_solid(x, y, z):
                    continue
                local_index = active_index(x, y, z)
                if visited[local_index] == 1:
                    continue

                width = 1
                while x + width < max_x and world.is_solid(x + width, y, z) and visited[active_index(x + width, y, z)] == 0:
                    width += 1

                depth = 1
                while z + depth < max_z:
                    can_expand = True
                    for dx in range(width):
                        if not world.is_solid(x + dx, y, z + depth) or visited[active_index(x + dx, y, z + depth)] == 1:
                            can_expand = False
                            break
                    if not can_expand:
                        break
                    depth += 1

                height = 1
                while y + height < max_y:
                    can_expand = True
                    for dz in range(depth):
                        for dx in range(width):
                            if not world.is_solid(x + dx, y + height, z + dz) or visited[active_index(x + dx, y + height, z + dz)] == 1:
                                can_expand = False
                                break
                        if not can_expand:
                            break
                    if not can_expand:
                        break
                    height += 1

                for dy in range(height):
                    for dz in range(depth):
                        for dx in range(width):
                            visited[active_index(x + dx, y + dy, z + dz)] = 1

                boxes.append([x, y, z, width, height, depth])
    return boxes


def main() -> None:
    world = parse_compact_map(SOURCE_MAP)
    quads_by_material = build_quads(world)
    boxes = build_collision_boxes(world)
    materials = sorted(quads_by_material.keys())
    artifact = {
        "version": 1,
        "source_map": str(SOURCE_MAP.relative_to(REPO_ROOT)),
        "dimensions": [world.size_x, world.size_y, world.size_z],
        "voxel_size": world.voxel_size,
        "world_y_offset": 0.02,
        "materials": materials,
        "quads": quads_by_material,
        "collision_boxes": boxes,
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(artifact, separators=(",", ":")))
    print(f"Wrote runtime artifact: {OUTPUT_PATH}")
    print(f"Materials: {len(materials)}  Quads: {sum(len(v) for v in quads_by_material.values())}  Collision boxes: {len(boxes)}")


if __name__ == "__main__":
    main()
