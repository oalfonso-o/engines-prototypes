#!/usr/bin/env python3

from __future__ import annotations

import json
import os
from dataclasses import dataclass
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
DEFAULT_SETTINGS_PATH = Path("./settings.json")


@dataclass(frozen=True)
class Vec3i:
    x: int
    y: int
    z: int


@dataclass(frozen=True)
class CubeFace:
    name: str
    normal: Vec3i
    neighbor_offset: Vec3i
    solid_offset: Vec3i
    fixed_axis: str
    scan_u_axis: str
    scan_v_axis: str
    u_sign: int
    v_sign: int


CUBE_FACES = (
    CubeFace("+X", Vec3i(1, 0, 0), Vec3i(0, 0, 0), Vec3i(-1, 0, 0), "x", "y", "z", 1, 1),
    CubeFace("-X", Vec3i(-1, 0, 0), Vec3i(-1, 0, 0), Vec3i(0, 0, 0), "x", "y", "z", 1, -1),
    CubeFace("+Y", Vec3i(0, 1, 0), Vec3i(0, 0, 0), Vec3i(0, -1, 0), "y", "x", "z", 1, -1),
    CubeFace("-Y", Vec3i(0, -1, 0), Vec3i(0, -1, 0), Vec3i(0, 0, 0), "y", "x", "z", 1, 1),
    CubeFace("+Z", Vec3i(0, 0, 1), Vec3i(0, 0, 0), Vec3i(0, 0, -1), "z", "x", "y", 1, 1),
    CubeFace("-Z", Vec3i(0, 0, -1), Vec3i(0, 0, -1), Vec3i(0, 0, 0), "z", "x", "y", 1, -1),
)


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

    def is_solid(self, x: int, y: int, z: int) -> bool:
        return VOXEL_TYPES.get(self.char(x, y, z), VOXEL_TYPES[EMPTY_CHAR])["solid"]

    def material_key(self, x: int, y: int, z: int) -> str:
        return VOXEL_TYPES.get(self.char(x, y, z), VOXEL_TYPES[EMPTY_CHAR])["material_key"]

    def recompute_active_bounds(self) -> None:
        min_x = self.size_x
        min_y = self.size_y
        min_z = self.size_z
        max_x = -1
        max_y = -1
        max_z = -1
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


def axis_value(vec: Vec3i, axis: str) -> int:
    if axis == "x":
        return vec.x
    if axis == "y":
        return vec.y
    return vec.z


def vec3i_cross(a: Vec3i, b: Vec3i) -> Vec3i:
    return Vec3i(
        (a.y * b.z) - (a.z * b.y),
        (a.z * b.x) - (a.x * b.z),
        (a.x * b.y) - (a.y * b.x),
    )


def unit_axis(axis: str, sign: int) -> Vec3i:
    if axis == "x":
        return Vec3i(sign, 0, 0)
    if axis == "y":
        return Vec3i(0, sign, 0)
    return Vec3i(0, 0, sign)


def validate_cube_face_table() -> None:
    for face in CUBE_FACES:
        expected = vec3i_cross(unit_axis(face.scan_u_axis, face.u_sign), unit_axis(face.scan_v_axis, face.v_sign))
        if expected != face.normal:
            raise ValueError(
                f"Face contract broken for {face.name}: cross(u, v)={expected} but normal={face.normal}"
            )
        if Vec3i(face.solid_offset.x + face.normal.x, face.solid_offset.y + face.normal.y, face.solid_offset.z + face.normal.z) != face.neighbor_offset:
            raise ValueError(
                f"Neighbor contract broken for {face.name}: solid_offset + normal must equal neighbor_offset"
            )


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
        if not line.startswith("LAYER "):
            raise ValueError(f"Unexpected directive: {line}")

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
                elif encoding == "RLE":
                    rows[row_index] = expand_rle(payload)
                else:
                    raise ValueError(f"Unexpected row encoding: {encoding}")
                line_index += 1
                continue
            raise ValueError(f"Unexpected line: {current}")

        for dy in range(repeat_count):
            y = layer_start + dy
            for z, row in enumerate(rows):
                base = world.index(0, y, z)
                world.grid[base : base + size_x] = row.encode("ascii")

    world.recompute_active_bounds()
    return world


def expand_rle(text: str) -> str:
    parts: list[str] = []
    for run in text.split(","):
        count_text, value = run.strip().split(":", 1)
        parts.append(value * int(count_text))
    return "".join(parts)


def load_settings() -> dict:
    settings_path = Path(os.environ.get("SETTINGS_PATH", DEFAULT_SETTINGS_PATH))
    return json.loads(settings_path.read_text())


def project_path(path_text: str) -> Path:
    return Path(path_text)


def path_for_payload(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


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


def axis_span(active_min: tuple[int, int, int], active_max: tuple[int, int, int], axis: str) -> tuple[int, int]:
    index = {"x": 0, "y": 1, "z": 2}[axis]
    return active_min[index], active_max[index]


def face_origin(face: CubeFace, plane: int, start_u: int, start_v: int, size_u: int, size_v: int) -> tuple[int, int, int]:
    coords = {"x": 0, "y": 0, "z": 0}
    coords[face.fixed_axis] = plane
    coords[face.scan_u_axis] = start_u + (size_u if face.u_sign < 0 else 0)
    coords[face.scan_v_axis] = start_v + (size_v if face.v_sign < 0 else 0)
    return coords["x"], coords["y"], coords["z"]


def face_axis(axis: str, magnitude: int) -> tuple[int, int, int]:
    if axis == "x":
        return magnitude, 0, 0
    if axis == "y":
        return 0, magnitude, 0
    return 0, 0, magnitude


def append_quad(
    quads_by_material: dict[str, list[list[int]]],
    material_key: str,
    origin: tuple[int, int, int],
    u_axis: tuple[int, int, int],
    v_axis: tuple[int, int, int],
    normal: tuple[int, int, int],
) -> None:
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

    for face in CUBE_FACES:
        fixed_min, fixed_max = axis_span(world.active_min, world.active_max, face.fixed_axis)
        scan_u_min, scan_u_max = axis_span(world.active_min, world.active_max, face.scan_u_axis)
        scan_v_min, scan_v_max = axis_span(world.active_min, world.active_max, face.scan_v_axis)

        for plane in range(fixed_min, fixed_max + 1):
            mask = build_key_mask(scan_u_max - scan_u_min, scan_v_max - scan_v_min)
            for u in range(scan_u_min, scan_u_max):
                for v in range(scan_v_min, scan_v_max):
                    plane_coords = {"x": 0, "y": 0, "z": 0}
                    plane_coords[face.fixed_axis] = plane
                    plane_coords[face.scan_u_axis] = u
                    plane_coords[face.scan_v_axis] = v

                    solid_x = plane_coords["x"] + face.solid_offset.x
                    solid_y = plane_coords["y"] + face.solid_offset.y
                    solid_z = plane_coords["z"] + face.solid_offset.z
                    if not world.is_solid(solid_x, solid_y, solid_z):
                        continue

                    neighbor_x = plane_coords["x"] + face.neighbor_offset.x
                    neighbor_y = plane_coords["y"] + face.neighbor_offset.y
                    neighbor_z = plane_coords["z"] + face.neighbor_offset.z
                    if world.is_solid(neighbor_x, neighbor_y, neighbor_z):
                        continue

                    mask[u - scan_u_min][v - scan_v_min] = world.material_key(solid_x, solid_y, solid_z)

            for (mask_u, mask_v, size_u, size_v), material_key in extract_key_rectangles(mask):
                origin = face_origin(face, plane, scan_u_min + mask_u, scan_v_min + mask_v, size_u, size_v)
                u_axis = face_axis(face.scan_u_axis, size_u * face.u_sign)
                v_axis = face_axis(face.scan_v_axis, size_v * face.v_sign)
                append_quad(
                    quads,
                    material_key,
                    origin,
                    u_axis,
                    v_axis,
                    (face.normal.x, face.normal.y, face.normal.z),
                )

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


def write_runtime(
    world: VoxelMap,
    quads_by_material: dict[str, list[list[int]]],
    boxes: list[list[int]],
    source_map: Path,
    output_path: Path,
    spawn: list[float],
    world_y_offset: float,
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "version": 4,
        "source_map": path_for_payload(source_map),
        "geometry_contract": "cube_faces_ccw_from_outside_cross_u_v_outward",
        "dimensions": [world.size_x, world.size_y, world.size_z],
        "voxel_size": world.voxel_size,
        "world_y_offset": world_y_offset,
        "spawn": spawn,
        "materials": sorted(quads_by_material.keys()),
        "quads": quads_by_material,
        "boxes": boxes,
    }
    output_path.write_text(json.dumps(payload, separators=(",", ":")))


def main() -> None:
    settings = load_settings()
    source_map = project_path(settings["paths"]["source_map"])
    output_path = project_path(settings["paths"]["runtime_artifact"])
    world_y_offset = float(settings["world"]["world_y_offset"])
    spawn = [float(value) for value in settings["world"]["spawn"]]

    validate_cube_face_table()
    world = parse_compact_map(source_map)
    quads_by_material = build_quads(world)
    boxes = build_collision_boxes(world)
    write_runtime(world, quads_by_material, boxes, source_map, output_path, spawn, world_y_offset)
    print(f"source: {source_map}")
    print(f"runtime: {output_path}")
    print(f"materials: {sorted(quads_by_material.keys())}")
    print(f"quads: {sum(len(value) for value in quads_by_material.values())}")
    print(f"collision_boxes: {len(boxes)}")


if __name__ == "__main__":
    main()
