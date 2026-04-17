#!/usr/bin/env python3

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


EMPTY_CHAR = "0"
PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_MAP = PROJECT_ROOT / "data" / "source_world.txt"
SETTINGS_PATH = PROJECT_ROOT / "settings.yaml"
OUTPUT_PATH = PROJECT_ROOT / "data" / "runtime_world.json"
DEBUG_OUTPUT_PATH = PROJECT_ROOT / "data" / "runtime_world.debug.json"

CELL_TYPES = {
    "0": {"piece_type": "empty", "material_key": "", "cube_solid": False},
    "1": {"piece_type": "cube", "material_key": "gray", "cube_solid": True},
    "G": {"piece_type": "cube", "material_key": "green", "cube_solid": True},
    "P": {"piece_type": "cube", "material_key": "purple", "cube_solid": True},
    "=": {"piece_type": "cube", "material_key": "metal", "cube_solid": True},
    "A": {"piece_type": "wedge_pz", "material_key": "gray", "cube_solid": False},
    "B": {"piece_type": "wedge_px", "material_key": "gray", "cube_solid": False},
    "C": {"piece_type": "wedge_nz", "material_key": "gray", "cube_solid": False},
    "D": {"piece_type": "wedge_nx", "material_key": "gray", "cube_solid": False},
}


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


@dataclass(frozen=True)
class WedgeQuadTemplate:
    face: str
    origin: Vec3i
    u_axis: Vec3i
    v_axis: Vec3i
    normal: Vec3i


@dataclass(frozen=True)
class WedgeTriangleTemplate:
    face: str
    p0: Vec3i
    p1: Vec3i
    p2: Vec3i
    normal: Vec3i


@dataclass(frozen=True)
class WedgeTemplate:
    piece_type: str
    quads: tuple[WedgeQuadTemplate, ...]
    triangles: tuple[WedgeTriangleTemplate, ...]


CUBE_FACES = (
    CubeFace("+X", Vec3i(1, 0, 0), Vec3i(0, 0, 0), Vec3i(-1, 0, 0), "x", "y", "z", 1, 1),
    CubeFace("-X", Vec3i(-1, 0, 0), Vec3i(-1, 0, 0), Vec3i(0, 0, 0), "x", "y", "z", 1, -1),
    CubeFace("+Y", Vec3i(0, 1, 0), Vec3i(0, 0, 0), Vec3i(0, -1, 0), "y", "x", "z", 1, -1),
    CubeFace("-Y", Vec3i(0, -1, 0), Vec3i(0, -1, 0), Vec3i(0, 0, 0), "y", "x", "z", 1, 1),
    CubeFace("+Z", Vec3i(0, 0, 1), Vec3i(0, 0, 0), Vec3i(0, 0, -1), "z", "x", "y", 1, 1),
    CubeFace("-Z", Vec3i(0, 0, -1), Vec3i(0, 0, -1), Vec3i(0, 0, 0), "z", "x", "y", 1, -1),
)

WEDGE_TEMPLATES = {
    "A": WedgeTemplate(
        piece_type="wedge_pz",
        quads=(
            WedgeQuadTemplate("base", Vec3i(0, 0, 0), Vec3i(1, 0, 0), Vec3i(0, 0, 1), Vec3i(0, -1, 0)),
            WedgeQuadTemplate("back", Vec3i(0, 0, 1), Vec3i(1, 0, 0), Vec3i(0, 1, 0), Vec3i(0, 0, 1)),
            WedgeQuadTemplate("slope", Vec3i(0, 0, 0), Vec3i(0, 1, 1), Vec3i(1, 0, 0), Vec3i(0, 1, -1)),
        ),
        triangles=(
            WedgeTriangleTemplate("left_triangle", Vec3i(0, 0, 0), Vec3i(0, 0, 1), Vec3i(0, 1, 1), Vec3i(-1, 0, 0)),
            WedgeTriangleTemplate("right_triangle", Vec3i(1, 0, 0), Vec3i(1, 1, 1), Vec3i(1, 0, 1), Vec3i(1, 0, 0)),
        ),
    ),
    "B": WedgeTemplate(
        piece_type="wedge_px",
        quads=(
            WedgeQuadTemplate("base", Vec3i(0, 0, 0), Vec3i(1, 0, 0), Vec3i(0, 0, 1), Vec3i(0, -1, 0)),
            WedgeQuadTemplate("right", Vec3i(1, 0, 0), Vec3i(0, 1, 0), Vec3i(0, 0, 1), Vec3i(1, 0, 0)),
            WedgeQuadTemplate("slope", Vec3i(0, 0, 0), Vec3i(0, 0, 1), Vec3i(1, 1, 0), Vec3i(-1, 1, 0)),
        ),
        triangles=(
            WedgeTriangleTemplate("front_triangle", Vec3i(0, 0, 0), Vec3i(1, 1, 0), Vec3i(1, 0, 0), Vec3i(0, 0, -1)),
            WedgeTriangleTemplate("back_triangle", Vec3i(0, 0, 1), Vec3i(1, 0, 1), Vec3i(1, 1, 1), Vec3i(0, 0, 1)),
        ),
    ),
    "C": WedgeTemplate(
        piece_type="wedge_nz",
        quads=(
            WedgeQuadTemplate("base", Vec3i(0, 0, 0), Vec3i(1, 0, 0), Vec3i(0, 0, 1), Vec3i(0, -1, 0)),
            WedgeQuadTemplate("front", Vec3i(1, 0, 0), Vec3i(-1, 0, 0), Vec3i(-1, 1, 0), Vec3i(0, 0, -1)),
            WedgeQuadTemplate("slope", Vec3i(0, 1, 0), Vec3i(0, -1, 1), Vec3i(1, 0, 0), Vec3i(0, 1, 1)),
        ),
        triangles=(
            WedgeTriangleTemplate("left_triangle", Vec3i(0, 0, 0), Vec3i(0, 0, 1), Vec3i(0, 1, 0), Vec3i(-1, 0, 0)),
            WedgeTriangleTemplate("right_triangle", Vec3i(1, 0, 0), Vec3i(1, 1, 0), Vec3i(1, 0, 1), Vec3i(1, 0, 0)),
        ),
    ),
    "D": WedgeTemplate(
        piece_type="wedge_nx",
        quads=(
            WedgeQuadTemplate("base", Vec3i(0, 0, 0), Vec3i(1, 0, 0), Vec3i(0, 0, 1), Vec3i(0, -1, 0)),
            WedgeQuadTemplate("left", Vec3i(0, 0, 0), Vec3i(0, 0, 1), Vec3i(0, 1, 0), Vec3i(-1, 0, 0)),
            WedgeQuadTemplate("slope", Vec3i(0, 1, 0), Vec3i(0, 0, 1), Vec3i(1, -1, 0), Vec3i(1, 1, 0)),
        ),
        triangles=(
            WedgeTriangleTemplate("front_triangle", Vec3i(0, 0, 0), Vec3i(0, 1, 0), Vec3i(1, 0, 0), Vec3i(0, 0, -1)),
            WedgeTriangleTemplate("back_triangle", Vec3i(0, 0, 1), Vec3i(1, 0, 1), Vec3i(0, 1, 1), Vec3i(0, 0, 1)),
        ),
    ),
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

    def set_char(self, x: int, y: int, z: int, value: str) -> None:
        self.grid[self.index(x, y, z)] = ord(value)

    def cell_info(self, x: int, y: int, z: int) -> dict[str, object]:
        return CELL_TYPES.get(self.char(x, y, z), CELL_TYPES[EMPTY_CHAR])

    def is_cube_solid(self, x: int, y: int, z: int) -> bool:
        return bool(self.cell_info(x, y, z)["cube_solid"])

    def material_key(self, x: int, y: int, z: int) -> str:
        return str(self.cell_info(x, y, z)["material_key"])

    def piece_type(self, x: int, y: int, z: int) -> str:
        return str(self.cell_info(x, y, z)["piece_type"])

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


def vec_add(a: Vec3i, b: Vec3i) -> Vec3i:
    return Vec3i(a.x + b.x, a.y + b.y, a.z + b.z)


def vec_sub(a: Vec3i, b: Vec3i) -> Vec3i:
    return Vec3i(a.x - b.x, a.y - b.y, a.z - b.z)


def vec_translate(base: Vec3i, offset: Vec3i) -> Vec3i:
    return Vec3i(base.x + offset.x, base.y + offset.y, base.z + offset.z)


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


def parse_scalar(value: str) -> object:
    normalized = value.strip()
    if normalized == "true":
        return True
    if normalized == "false":
        return False
    try:
        return int(normalized)
    except ValueError:
        pass
    try:
        return float(normalized)
    except ValueError:
        pass
    return normalized


def parse_settings_yaml(path: Path) -> dict[str, dict[str, object]]:
    result: dict[str, dict[str, object]] = {}
    current_section = ""
    for raw_line in path.read_text().splitlines():
        if not raw_line.strip() or raw_line.lstrip().startswith("#"):
            continue
        if not raw_line.startswith(" "):
            key = raw_line.rstrip(":").strip()
            result[key] = {}
            current_section = key
            continue
        if current_section == "":
            raise ValueError(f"Unexpected settings line outside section: {raw_line}")
        key_text, value_text = raw_line.strip().split(":", 1)
        result[current_section][key_text.strip()] = parse_scalar(value_text)
    return result


def expand_rle(text: str) -> str:
    parts: list[str] = []
    for run in text.split(","):
        count_text, value = run.strip().split(":", 1)
        parts.append(value * int(count_text))
    return "".join(parts)


def parse_source_map(path: Path) -> tuple[VoxelMap, list[float], float]:
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
    spawn = [0.0, 0.0, -20.0]
    world_y_offset = 0.02
    empty_row = EMPTY_CHAR * size_x

    line_index = 2
    while line_index < len(lines):
        line = lines[line_index]
        if line.startswith("SPAWN "):
            spawn = [float(value) for value in line.split()[1:4]]
            line_index += 1
            continue
        if line.startswith("WORLD_Y_OFFSET "):
            world_y_offset = float(line.split()[1])
            line_index += 1
            continue
        if line.startswith("EMPTY_LAYERS "):
            line_index += 1
            continue
        if not line.startswith("LAYER "):
            raise ValueError(f"Unexpected directive: {line}")

        header_parts = line.split()
        layer_y = int(header_parts[1])
        repeat_count = int(header_parts[3]) if len(header_parts) == 4 else 1
        line_index += 1
        rows = [empty_row for _ in range(size_z)]

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
            y = layer_y + dy
            for z, row in enumerate(rows):
                if len(row) != size_x:
                    raise ValueError(f"Layer {y} row {z} has wrong width")
                for x, char in enumerate(row):
                    if char not in CELL_TYPES:
                        raise ValueError(f"Unexpected map char '{char}' at ({x},{y},{z})")
                base = world.index(0, y, z)
                world.grid[base : base + size_x] = row.encode("ascii")

    world.recompute_active_bounds()
    return world, spawn, world_y_offset


def validate_cube_face_table() -> None:
    for face in CUBE_FACES:
        expected = vec3i_cross(unit_axis(face.scan_u_axis, face.u_sign), unit_axis(face.scan_v_axis, face.v_sign))
        if expected != face.normal:
            raise ValueError(f"Cube face contract broken for {face.name}: {expected} != {face.normal}")
        if vec_add(face.solid_offset, face.normal) != face.neighbor_offset:
            raise ValueError(f"Cube neighbor contract broken for {face.name}")


def validate_wedge_templates() -> None:
    for key, template in WEDGE_TEMPLATES.items():
        for quad in template.quads:
            if vec3i_cross(quad.u_axis, quad.v_axis) != quad.normal:
                raise ValueError(f"Wedge {key} quad {quad.face} has invalid cross(u,v)")
            p0 = quad.origin
            p1 = vec_add(quad.origin, quad.u_axis)
            p2 = vec_add(vec_add(quad.origin, quad.u_axis), quad.v_axis)
            p3 = vec_add(quad.origin, quad.v_axis)
            if vec3i_cross(vec_sub(p1, p0), vec_sub(p2, p0)) != quad.normal:
                raise ValueError(f"Wedge {key} quad {quad.face} triangle 0 invalid")
            if vec3i_cross(vec_sub(p2, p0), vec_sub(p3, p0)) != quad.normal:
                raise ValueError(f"Wedge {key} quad {quad.face} triangle 1 invalid")
        for triangle in template.triangles:
            if vec3i_cross(vec_sub(triangle.p1, triangle.p0), vec_sub(triangle.p2, triangle.p0)) != triangle.normal:
                raise ValueError(f"Wedge {key} triangle {triangle.face} invalid")


def append_quad(
    quads_by_material: dict[str, list[list[int]]],
    material_key: str,
    origin: Vec3i,
    u_axis: Vec3i,
    v_axis: Vec3i,
    normal: Vec3i,
) -> None:
    quads_by_material.setdefault(material_key, []).append(
        [
            origin.x, origin.y, origin.z,
            u_axis.x, u_axis.y, u_axis.z,
            v_axis.x, v_axis.y, v_axis.z,
            normal.x, normal.y, normal.z,
        ]
    )


def append_triangle(
    triangles_by_material: dict[str, list[list[int]]],
    material_key: str,
    p0: Vec3i,
    p1: Vec3i,
    p2: Vec3i,
    normal: Vec3i,
) -> None:
    triangles_by_material.setdefault(material_key, []).append(
        [
            p0.x, p0.y, p0.z,
            p1.x, p1.y, p1.z,
            p2.x, p2.y, p2.z,
            normal.x, normal.y, normal.z,
        ]
    )


def build_cube_runtime_quads(world: VoxelMap) -> dict[str, list[list[int]]]:
    quads: dict[str, list[list[int]]] = {}
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
                    if not world.is_cube_solid(solid_x, solid_y, solid_z):
                        continue

                    neighbor_x = plane_coords["x"] + face.neighbor_offset.x
                    neighbor_y = plane_coords["y"] + face.neighbor_offset.y
                    neighbor_z = plane_coords["z"] + face.neighbor_offset.z
                    if world.is_cube_solid(neighbor_x, neighbor_y, neighbor_z):
                        continue

                    mask[u - scan_u_min][v - scan_v_min] = world.material_key(solid_x, solid_y, solid_z)

            for (mask_u, mask_v, size_u, size_v), material_key in extract_key_rectangles(mask):
                origin = Vec3i(*face_origin(face, plane, scan_u_min + mask_u, scan_v_min + mask_v, size_u, size_v))
                u_axis = Vec3i(*face_axis(face.scan_u_axis, size_u * face.u_sign))
                v_axis = Vec3i(*face_axis(face.scan_v_axis, size_v * face.v_sign))
                append_quad(quads, material_key, origin, u_axis, v_axis, face.normal)
    return quads


def build_cube_debug_pieces(world: VoxelMap) -> list[dict[str, object]]:
    pieces: list[dict[str, object]] = []
    for y in range(world.size_y):
        for z in range(world.size_z):
            for x in range(world.size_x):
                if world.piece_type(x, y, z) != "cube":
                    continue
                cell = Vec3i(x, y, z)
                piece = {
                    "voxel_id": f"voxel_{x}_{y}_{z}",
                    "piece_type": "cube",
                    "cell": vec_dict(cell),
                    "material": world.material_key(x, y, z),
                    "quads": [],
                    "triangles": [],
                }
                for face in CUBE_FACES:
                    plane_coords = vec_sub(cell, face.solid_offset)
                    neighbor = vec_add(cell, face.normal)
                    if world.is_cube_solid(neighbor.x, neighbor.y, neighbor.z):
                        continue
                    origin = Vec3i(
                        *face_origin(
                            face,
                            getattr(plane_coords, face.fixed_axis),
                            getattr(plane_coords, face.scan_u_axis),
                            getattr(plane_coords, face.scan_v_axis),
                            1,
                            1,
                        )
                    )
                    u_axis = Vec3i(*face_axis(face.scan_u_axis, face.u_sign))
                    v_axis = Vec3i(*face_axis(face.scan_v_axis, face.v_sign))
                    piece["quads"].append(
                        {
                            "face": face.name,
                            "origin": vec_dict(origin),
                            "u_axis": vec_dict(u_axis),
                            "v_axis": vec_dict(v_axis),
                            "normal": vec_dict(face.normal),
                        }
                    )
                pieces.append(piece)
    return pieces


def build_wedge_geometry(world: VoxelMap) -> tuple[dict[str, list[list[int]]], dict[str, list[list[int]]], list[dict[str, object]]]:
    quads: dict[str, list[list[int]]] = {}
    triangles: dict[str, list[list[int]]] = {}
    debug_pieces: list[dict[str, object]] = []

    for y in range(world.size_y):
        for z in range(world.size_z):
            for x in range(world.size_x):
                char = world.char(x, y, z)
                if char not in WEDGE_TEMPLATES:
                    continue
                template = WEDGE_TEMPLATES[char]
                base = Vec3i(x, y, z)
                material_key = world.material_key(x, y, z)
                piece = {
                    "voxel_id": f"voxel_{x}_{y}_{z}",
                    "piece_type": template.piece_type,
                    "cell": vec_dict(base),
                    "material": material_key,
                    "quads": [],
                    "triangles": [],
                }

                for quad in template.quads:
                    origin = vec_translate(base, quad.origin)
                    append_quad(quads, material_key, origin, quad.u_axis, quad.v_axis, quad.normal)
                    piece["quads"].append(
                        {
                            "face": quad.face,
                            "origin": vec_dict(origin),
                            "u_axis": vec_dict(quad.u_axis),
                            "v_axis": vec_dict(quad.v_axis),
                            "normal": vec_dict(quad.normal),
                        }
                    )

                for triangle in template.triangles:
                    p0 = vec_translate(base, triangle.p0)
                    p1 = vec_translate(base, triangle.p1)
                    p2 = vec_translate(base, triangle.p2)
                    append_triangle(triangles, material_key, p0, p1, p2, triangle.normal)
                    piece["triangles"].append(
                        {
                            "face": triangle.face,
                            "p0": vec_dict(p0),
                            "p1": vec_dict(p1),
                            "p2": vec_dict(p2),
                            "normal": vec_dict(triangle.normal),
                        }
                    )

                debug_pieces.append(piece)

    return quads, triangles, debug_pieces


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
                if not world.is_cube_solid(x, y, z):
                    continue
                local_index = active_index(x, y, z)
                if visited[local_index] == 1:
                    continue

                width = 1
                while x + width < max_x and world.is_cube_solid(x + width, y, z) and visited[active_index(x + width, y, z)] == 0:
                    width += 1

                depth = 1
                while z + depth < max_z:
                    can_expand = True
                    for dx in range(width):
                        if not world.is_cube_solid(x + dx, y, z + depth) or visited[active_index(x + dx, y, z + depth)] == 1:
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
                            if not world.is_cube_solid(x + dx, y + height, z + dz) or visited[active_index(x + dx, y + height, z + dz)] == 1:
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


def vec_dict(vec: Vec3i) -> dict[str, int]:
    return {"x": vec.x, "y": vec.y, "z": vec.z}


def write_runtime(
    world: VoxelMap,
    spawn: list[float],
    world_y_offset: float,
    quads_by_material: dict[str, list[list[int]]],
    triangles_by_material: dict[str, list[list[int]]],
    boxes: list[list[int]],
) -> None:
    materials = sorted(set(quads_by_material.keys()) | set(triangles_by_material.keys()))
    payload = {
        "version": 11,
        "source_map": str(SOURCE_MAP.relative_to(PROJECT_ROOT)),
        "dimensions": [world.size_x, world.size_y, world.size_z],
        "voxel_size": world.voxel_size,
        "world_y_offset": world_y_offset,
        "spawn": spawn,
        "materials": materials,
        "quads": quads_by_material,
        "triangles": triangles_by_material,
        "boxes": boxes,
    }
    OUTPUT_PATH.write_text(json.dumps(payload, separators=(",", ":")))


def write_debug_artifact(
    world: VoxelMap,
    spawn: list[float],
    world_y_offset: float,
    cube_pieces: list[dict[str, object]],
    wedge_pieces: list[dict[str, object]],
) -> None:
    payload = {
        "version": 11,
        "source_map": str(SOURCE_MAP.relative_to(PROJECT_ROOT)),
        "dimensions": {"x": world.size_x, "y": world.size_y, "z": world.size_z},
        "voxel_size": world.voxel_size,
        "world_y_offset": world_y_offset,
        "spawn": {"x": spawn[0], "y": spawn[1], "z": spawn[2]},
        "pieces": cube_pieces + wedge_pieces,
    }
    DEBUG_OUTPUT_PATH.write_text(json.dumps(payload, indent=2))


def main() -> None:
    validate_cube_face_table()
    validate_wedge_templates()
    settings = parse_settings_yaml(SETTINGS_PATH)
    world, spawn, world_y_offset = parse_source_map(SOURCE_MAP)

    cube_quads = build_cube_runtime_quads(world)
    wedge_quads, wedge_triangles, wedge_debug_pieces = build_wedge_geometry(world)
    cube_debug_pieces = build_cube_debug_pieces(world)
    boxes = build_collision_boxes(world)

    runtime_quads = dict(cube_quads)
    for material_key, values in wedge_quads.items():
        runtime_quads.setdefault(material_key, []).extend(values)

    write_runtime(world, spawn, world_y_offset, runtime_quads, wedge_triangles, boxes)

    if bool(settings.get("preprocessing", {}).get("debug", False)):
        write_debug_artifact(world, spawn, world_y_offset, cube_debug_pieces, wedge_debug_pieces)
    elif DEBUG_OUTPUT_PATH.exists():
        DEBUG_OUTPUT_PATH.unlink()

    print(f"settings: {SETTINGS_PATH}")
    print(f"source: {SOURCE_MAP}")
    print(f"runtime: {OUTPUT_PATH}")
    if DEBUG_OUTPUT_PATH.exists():
        print(f"debug: {DEBUG_OUTPUT_PATH}")
    print(f"materials: {sorted(set(runtime_quads.keys()) | set(wedge_triangles.keys()))}")
    print(f"quads: {sum(len(value) for value in runtime_quads.values())}")
    print(f"triangles: {sum(len(value) for value in wedge_triangles.values())}")
    print(f"collision_boxes: {len(boxes)}")


if __name__ == "__main__":
    main()
