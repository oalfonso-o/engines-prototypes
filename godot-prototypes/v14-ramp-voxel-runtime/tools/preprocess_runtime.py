#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path


EMPTY_CHAR = "0"
REPO_ROOT = Path(__file__).resolve().parents[3]
SOURCE_MAP = REPO_ROOT / "godot-prototypes" / "v14-ramp-voxel-runtime" / "maps" / "cross_cube_map.txt"
OUTPUT_PATH = REPO_ROOT / "godot-prototypes" / "v14-ramp-voxel-runtime" / "data" / "runtime_world.json"
RAMP_COLLISION_SLICES = 4

VOXEL_TYPES = {
    "0": {"solid": False, "kind": "empty", "material_key": "", "collision_kind": "none"},
    "1": {"solid": True, "kind": "cube", "material_key": "gray", "collision_kind": "box"},
    "G": {"solid": True, "kind": "cube", "material_key": "green", "collision_kind": "box"},
    "P": {"solid": True, "kind": "cube", "material_key": "purple", "collision_kind": "box"},
    "=": {"solid": True, "kind": "cube", "material_key": "metal", "collision_kind": "box"},
    "A": {"solid": True, "kind": "ramp", "orientation": "floor_pos_x", "material_key": "gray", "collision_kind": "ramp_floor_pos_x"},
    "B": {"solid": True, "kind": "ramp", "orientation": "floor_neg_x", "material_key": "gray", "collision_kind": "ramp_floor_neg_x"},
    "C": {"solid": True, "kind": "ramp", "orientation": "floor_pos_z", "material_key": "gray", "collision_kind": "ramp_floor_pos_z"},
    "D": {"solid": True, "kind": "ramp", "orientation": "floor_neg_z", "material_key": "gray", "collision_kind": "ramp_floor_neg_z"},
    "U": {"solid": True, "kind": "ramp", "orientation": "ceil_pos_x", "material_key": "gray", "collision_kind": "ramp_ceil_pos_x"},
    "V": {"solid": True, "kind": "ramp", "orientation": "ceil_neg_x", "material_key": "gray", "collision_kind": "ramp_ceil_neg_x"},
    "W": {"solid": True, "kind": "ramp", "orientation": "ceil_pos_z", "material_key": "gray", "collision_kind": "ramp_ceil_pos_z"},
    "X": {"solid": True, "kind": "ramp", "orientation": "ceil_neg_z", "material_key": "gray", "collision_kind": "ramp_ceil_neg_z"},
}

FLOOR_RAMP_FACES = {
    "floor_pos_x": [
        {"kind": "quad", "cull": "up", "points": [(0, 0, 0), (0, 0, 1), (1, 1, 1), (1, 1, 0)]},
        {"kind": "quad", "cull": "down", "points": [(0, 0, 0), (1, 0, 0), (1, 0, 1), (0, 0, 1)]},
        {"kind": "quad", "cull": "pos_x", "points": [(1, 0, 0), (1, 1, 0), (1, 1, 1), (1, 0, 1)]},
        {"kind": "tri", "cull": "neg_z", "points": [(0, 0, 0), (1, 1, 0), (1, 0, 0)]},
        {"kind": "tri", "cull": "pos_z", "points": [(0, 0, 1), (1, 0, 1), (1, 1, 1)]},
    ],
    "floor_neg_x": [
        {"kind": "quad", "cull": "up", "points": [(1, 0, 0), (0, 1, 0), (0, 1, 1), (1, 0, 1)]},
        {"kind": "quad", "cull": "down", "points": [(0, 0, 0), (1, 0, 0), (1, 0, 1), (0, 0, 1)]},
        {"kind": "quad", "cull": "neg_x", "points": [(0, 0, 0), (0, 1, 0), (0, 1, 1), (0, 0, 1)]},
        {"kind": "tri", "cull": "neg_z", "points": [(1, 0, 0), (0, 0, 0), (0, 1, 0)]},
        {"kind": "tri", "cull": "pos_z", "points": [(1, 0, 1), (0, 1, 1), (0, 0, 1)]},
    ],
    "floor_pos_z": [
        {"kind": "quad", "cull": "up", "points": [(0, 0, 0), (0, 1, 1), (1, 1, 1), (1, 0, 0)]},
        {"kind": "quad", "cull": "down", "points": [(0, 0, 0), (1, 0, 0), (1, 0, 1), (0, 0, 1)]},
        {"kind": "quad", "cull": "pos_z", "points": [(0, 0, 1), (1, 0, 1), (1, 1, 1), (0, 1, 1)]},
        {"kind": "tri", "cull": "neg_x", "points": [(0, 0, 0), (0, 0, 1), (0, 1, 1)]},
        {"kind": "tri", "cull": "pos_x", "points": [(1, 0, 0), (1, 1, 1), (1, 0, 1)]},
    ],
    "floor_neg_z": [
        {"kind": "quad", "cull": "up", "points": [(0, 0, 1), (1, 0, 1), (1, 1, 0), (0, 1, 0)]},
        {"kind": "quad", "cull": "down", "points": [(0, 0, 0), (1, 0, 0), (1, 0, 1), (0, 0, 1)]},
        {"kind": "quad", "cull": "neg_z", "points": [(0, 0, 0), (0, 1, 0), (1, 1, 0), (1, 0, 0)]},
        {"kind": "tri", "cull": "neg_x", "points": [(0, 0, 1), (0, 1, 0), (0, 0, 0)]},
        {"kind": "tri", "cull": "pos_x", "points": [(1, 0, 1), (1, 0, 0), (1, 1, 0)]},
    ],
}


def mirror_face_y(face: dict) -> dict:
    mirrored = [(x, 1 - y, z) for x, y, z in face["points"]]
    if len(mirrored) == 4:
        mirrored = [mirrored[0], mirrored[3], mirrored[2], mirrored[1]]
    else:
        mirrored = [mirrored[0], mirrored[2], mirrored[1]]
    cull = face["cull"]
    if cull == "up":
        cull = "down"
    elif cull == "down":
        cull = "up"
    return {"kind": face["kind"], "cull": cull, "points": mirrored}


RAMP_FACES = {
    **FLOOR_RAMP_FACES,
    "ceil_pos_x": [mirror_face_y(face) for face in FLOOR_RAMP_FACES["floor_pos_x"]],
    "ceil_neg_x": [mirror_face_y(face) for face in FLOOR_RAMP_FACES["floor_neg_x"]],
    "ceil_pos_z": [mirror_face_y(face) for face in FLOOR_RAMP_FACES["floor_pos_z"]],
    "ceil_neg_z": [mirror_face_y(face) for face in FLOOR_RAMP_FACES["floor_neg_z"]],
}


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

    def type_info(self, x: int, y: int, z: int) -> dict:
        return VOXEL_TYPES.get(self.char(x, y, z), VOXEL_TYPES[EMPTY_CHAR])

    def is_filled(self, x: int, y: int, z: int) -> bool:
        return self.type_info(x, y, z)["solid"]

    def is_cube(self, x: int, y: int, z: int) -> bool:
        return self.type_info(x, y, z)["kind"] == "cube"

    def is_ramp(self, x: int, y: int, z: int) -> bool:
        return self.type_info(x, y, z)["kind"] == "ramp"

    def material_key(self, x: int, y: int, z: int) -> str:
        return self.type_info(x, y, z)["material_key"]

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
    lines = [line.strip() for line in path.read_text().splitlines() if line.strip() and not line.strip().startswith("#")]
    sx, sy, sz = map(int, lines[0].split()[1:4])
    voxel_size = float(lines[1].split()[1])
    world = VoxelMap(sx, sy, sz, voxel_size)
    empty_row = EMPTY_CHAR * sx

    line_index = 2
    while line_index < len(lines):
        line = lines[line_index]
        if line.startswith("EMPTY_LAYERS "):
            line_index += 1
            continue
        if line.startswith("LAYER "):
            parts = line.split()
            layer_start = int(parts[1])
            repeat_count = int(parts[3]) if len(parts) == 4 else 1
            rows = [empty_row for _ in range(sz)]
            line_index += 1
            while line_index < len(lines):
                current = lines[line_index]
                if current.startswith("LAYER ") or current.startswith("EMPTY_LAYERS "):
                    break
                if current.startswith("EMPTY_ROWS "):
                    line_index += 1
                    continue
                _, row_index_text, encoding, payload = current.split(" ", 3)
                row_index = int(row_index_text)
                rows[row_index] = payload if encoding == "RAW" else expand_rle(payload)
                line_index += 1
            for dy in range(repeat_count):
                y = layer_start + dy
                for z, row in enumerate(rows):
                    base = world.index(0, y, z)
                    world.grid[base : base + sx] = row.encode("ascii")
            continue
        raise ValueError(f"Unexpected directive: {line}")

    world.recompute_active_bounds()
    return world


def expand_rle(text: str) -> str:
    result: list[str] = []
    for run in text.split(","):
        count_text, value = run.strip().split(":", 1)
        result.append(value * int(count_text))
    return "".join(result)


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


def append_quad(quads_by_material: dict[str, list[list[float]]], material_key: str, origin: tuple[float, float, float], u_axis: tuple[float, float, float], v_axis: tuple[float, float, float], normal: tuple[float, float, float]) -> None:
    quads_by_material.setdefault(material_key, []).append([
        origin[0], origin[1], origin[2],
        u_axis[0], u_axis[1], u_axis[2],
        v_axis[0], v_axis[1], v_axis[2],
        normal[0], normal[1], normal[2],
    ])


def append_triangle(tris_by_material: dict[str, list[list[float]]], material_key: str, a: tuple[float, float, float], b: tuple[float, float, float], c: tuple[float, float, float], normal: tuple[float, float, float]) -> None:
    tris_by_material.setdefault(material_key, []).append([
        a[0], a[1], a[2],
        b[0], b[1], b[2],
        c[0], c[1], c[2],
        normal[0], normal[1], normal[2],
    ])


def subtract(a: tuple[float, float, float], b: tuple[float, float, float]) -> tuple[float, float, float]:
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def cross(a: tuple[float, float, float], b: tuple[float, float, float]) -> tuple[float, float, float]:
    return (
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    )


def normalize(v: tuple[float, float, float]) -> tuple[float, float, float]:
    length = math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
    if length == 0:
        return (0.0, 1.0, 0.0)
    return (v[0] / length, v[1] / length, v[2] / length)


def points_normal(points: list[tuple[float, float, float]]) -> tuple[float, float, float]:
    return normalize(cross(subtract(points[1], points[0]), subtract(points[2], points[0])))


def cull_direction_offset(cull: str) -> tuple[int, int, int]:
    return {
        "up": (0, 1, 0),
        "down": (0, -1, 0),
        "pos_x": (1, 0, 0),
        "neg_x": (-1, 0, 0),
        "pos_z": (0, 0, 1),
        "neg_z": (0, 0, -1),
    }[cull]


def add_local(point: tuple[float, float, float], cell: tuple[int, int, int]) -> tuple[float, float, float]:
    return (point[0] + cell[0], point[1] + cell[1], point[2] + cell[2])


def build_cube_quads(world: VoxelMap) -> dict[str, list[list[float]]]:
    quads: dict[str, list[list[float]]] = {}
    min_x, min_y, min_z = world.active_min
    max_x, max_y, max_z = world.active_max

    for plane_x in range(min_x, max_x + 1):
        pos_mask = build_key_mask(max_y - min_y, max_z - min_z)
        neg_mask = build_key_mask(max_y - min_y, max_z - min_z)
        for y in range(min_y, max_y):
            for z in range(min_z, max_z):
                left_cube = world.is_cube(plane_x - 1, y, z)
                right_cube = world.is_cube(plane_x, y, z)
                left_filled = world.is_filled(plane_x - 1, y, z)
                right_filled = world.is_filled(plane_x, y, z)
                if left_cube and not right_filled:
                    pos_mask[y - min_y][z - min_z] = world.material_key(plane_x - 1, y, z)
                elif right_cube and not left_filled:
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
                below_cube = world.is_cube(x, plane_y - 1, z)
                above_cube = world.is_cube(x, plane_y, z)
                below_filled = world.is_filled(x, plane_y - 1, z)
                above_filled = world.is_filled(x, plane_y, z)
                if below_cube and not above_filled:
                    pos_mask[x - min_x][z - min_z] = world.material_key(x, plane_y - 1, z)
                elif above_cube and not below_filled:
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
                back_cube = world.is_cube(x, y, plane_z - 1)
                front_cube = world.is_cube(x, y, plane_z)
                back_filled = world.is_filled(x, y, plane_z - 1)
                front_filled = world.is_filled(x, y, plane_z)
                if back_cube and not front_filled:
                    pos_mask[x - min_x][y - min_y] = world.material_key(x, y, plane_z - 1)
                elif front_cube and not back_filled:
                    neg_mask[x - min_x][y - min_y] = world.material_key(x, y, plane_z)
        for (u, v, h, w), material_key in extract_key_rectangles(pos_mask):
            append_quad(quads, material_key, (min_x + u, min_y + v, plane_z), (h, 0, 0), (0, w, 0), (0, 0, 1))
        for (u, v, h, w), material_key in extract_key_rectangles(neg_mask):
            append_quad(quads, material_key, (min_x + u, min_y + v + w, plane_z), (h, 0, 0), (0, -w, 0), (0, 0, -1))

    return quads


def build_ramp_geometry(world: VoxelMap) -> tuple[dict[str, list[list[float]]], dict[str, list[list[float]]]]:
    quads: dict[str, list[list[float]]] = {}
    tris: dict[str, list[list[float]]] = {}
    min_x, min_y, min_z = world.active_min
    max_x, max_y, max_z = world.active_max
    for y in range(min_y, max_y):
        for z in range(min_z, max_z):
            for x in range(min_x, max_x):
                if not world.is_ramp(x, y, z):
                    continue
                info = world.type_info(x, y, z)
                material_key = info["material_key"]
                orientation = info["orientation"]
                for face in RAMP_FACES[orientation]:
                    dx, dy, dz = cull_direction_offset(face["cull"])
                    if world.is_filled(x + dx, y + dy, z + dz):
                        continue
                    world_points = [add_local(point, (x, y, z)) for point in face["points"]]
                    normal = points_normal(world_points)
                    if face["kind"] == "quad":
                        a, b, c, d = world_points
                        append_quad(quads, material_key, a, (b[0] - a[0], b[1] - a[1], b[2] - a[2]), (d[0] - a[0], d[1] - a[1], d[2] - a[2]), normal)
                    else:
                        a, b, c = world_points
                        append_triangle(tris, material_key, a, b, c, normal)
    return quads, tris


def build_cube_collision_boxes(world: VoxelMap) -> list[list[float]]:
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

    boxes: list[list[float]] = []
    for y in range(min_y, max_y):
        for z in range(min_z, max_z):
            for x in range(min_x, max_x):
                if not world.is_cube(x, y, z):
                    continue
                local_index = active_index(x, y, z)
                if visited[local_index] == 1:
                    continue

                width = 1
                while x + width < max_x and world.is_cube(x + width, y, z) and visited[active_index(x + width, y, z)] == 0:
                    width += 1

                depth = 1
                while z + depth < max_z:
                    can_expand = True
                    for dx in range(width):
                        if not world.is_cube(x + dx, y, z + depth) or visited[active_index(x + dx, y, z + depth)] == 1:
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
                            if not world.is_cube(x + dx, y + height, z + dz) or visited[active_index(x + dx, y + height, z + dz)] == 1:
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


def build_ramp_collision_boxes(world: VoxelMap) -> list[list[float]]:
    boxes: list[list[float]] = []
    for y in range(world.active_min[1], world.active_max[1]):
        for z in range(world.active_min[2], world.active_max[2]):
            for x in range(world.active_min[0], world.active_max[0]):
                if not world.is_ramp(x, y, z):
                    continue
                info = world.type_info(x, y, z)
                boxes.extend(ramp_collision_boxes(x, y, z, info["orientation"]))
    return boxes


def ramp_collision_boxes(x: int, y: int, z: int, orientation: str) -> list[list[float]]:
    boxes: list[list[float]] = []
    s = RAMP_COLLISION_SLICES
    if orientation == "floor_pos_x":
        for i in range(s):
            x0 = i / s
            x1 = (i + 1) / s
            boxes.append([x + x0, y, z, x1 - x0, (i + 1) / s, 1.0])
    elif orientation == "floor_neg_x":
        for i in range(s):
            x0 = i / s
            x1 = (i + 1) / s
            boxes.append([x + x0, y, z, x1 - x0, 1.0 - (i / s), 1.0])
    elif orientation == "floor_pos_z":
        for i in range(s):
            z0 = i / s
            z1 = (i + 1) / s
            boxes.append([x, y, z + z0, 1.0, (i + 1) / s, z1 - z0])
    elif orientation == "floor_neg_z":
        for i in range(s):
            z0 = i / s
            z1 = (i + 1) / s
            boxes.append([x, y, z + z0, 1.0, 1.0 - (i / s), z1 - z0])
    elif orientation == "ceil_pos_x":
        for i in range(s):
            x0 = i / s
            x1 = (i + 1) / s
            boxes.append([x + x0, y + x0, z, x1 - x0, 1.0 - x0, 1.0])
    elif orientation == "ceil_neg_x":
        for i in range(s):
            x0 = i / s
            x1 = (i + 1) / s
            low = 1.0 - x1
            boxes.append([x + x0, y + low, z, x1 - x0, 1.0 - low, 1.0])
    elif orientation == "ceil_pos_z":
        for i in range(s):
            z0 = i / s
            z1 = (i + 1) / s
            boxes.append([x, y + z0, z + z0, 1.0, 1.0 - z0, z1 - z0])
    elif orientation == "ceil_neg_z":
        for i in range(s):
            z0 = i / s
            z1 = (i + 1) / s
            low = 1.0 - z1
            boxes.append([x, y + low, z + z0, 1.0, 1.0 - low, z1 - z0])
    return boxes


def merge_dict_lists(base: dict[str, list[list[float]]], extra: dict[str, list[list[float]]]) -> dict[str, list[list[float]]]:
    out = {k: list(v) for k, v in base.items()}
    for key, value in extra.items():
        out.setdefault(key, []).extend(value)
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=SOURCE_MAP)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    args = parser.parse_args()

    input_path = args.input.resolve()
    output_path = args.output.resolve()

    world = parse_compact_map(input_path)
    cube_quads = build_cube_quads(world)
    ramp_quads, ramp_tris = build_ramp_geometry(world)
    quads = merge_dict_lists(cube_quads, ramp_quads)
    tris = ramp_tris
    collision_boxes = build_cube_collision_boxes(world) + build_ramp_collision_boxes(world)
    materials = sorted(set(quads.keys()) | set(tris.keys()))
    artifact = {
        "version": 2,
        "source_map": str(input_path.relative_to(REPO_ROOT)),
        "dimensions": [world.size_x, world.size_y, world.size_z],
        "voxel_size": world.voxel_size,
        "world_y_offset": 0.02,
        "materials": materials,
        "quads": quads,
        "triangles": tris,
        "collision_boxes": collision_boxes,
        "ramp_chars": {
            "A": "floor +X",
            "B": "floor -X",
            "C": "floor +Z",
            "D": "floor -Z",
            "U": "ceil +X",
            "V": "ceil -X",
            "W": "ceil +Z",
            "X": "ceil -Z",
        },
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(artifact, separators=(",", ":")))
    print(f"Wrote runtime artifact: {output_path}")
    print(f"Materials: {len(materials)}  Quads: {sum(len(v) for v in quads.values())}  Triangles: {sum(len(v) for v in tris.values())}  Collision boxes: {len(collision_boxes)}")


if __name__ == "__main__":
    main()
