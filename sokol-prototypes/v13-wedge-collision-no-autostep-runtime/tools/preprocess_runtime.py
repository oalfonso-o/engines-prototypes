#!/usr/bin/env python3

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from settings_loader import SettingsBundle, load_settings


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SETTINGS_PATH = PROJECT_ROOT / "settings.yaml"


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
class PieceInfo:
    map_char: str
    piece_type: str
    material_key: str
    cube_solid: bool


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


@dataclass
class EmittedPiece:
    voxel_id: str
    piece_type: str
    cell: Vec3i
    material: str
    quads: list[dict[str, object]]
    triangles: list[dict[str, object]]


CUBE_FACES = (
    CubeFace("+X", Vec3i(1, 0, 0), Vec3i(0, 0, 0), Vec3i(-1, 0, 0), "x", "y", "z", 1, 1),
    CubeFace("-X", Vec3i(-1, 0, 0), Vec3i(-1, 0, 0), Vec3i(0, 0, 0), "x", "y", "z", 1, -1),
    CubeFace("+Y", Vec3i(0, 1, 0), Vec3i(0, 0, 0), Vec3i(0, -1, 0), "y", "x", "z", 1, -1),
    CubeFace("-Y", Vec3i(0, -1, 0), Vec3i(0, -1, 0), Vec3i(0, 0, 0), "y", "x", "z", 1, 1),
    CubeFace("+Z", Vec3i(0, 0, 1), Vec3i(0, 0, 0), Vec3i(0, 0, -1), "z", "x", "y", 1, 1),
    CubeFace("-Z", Vec3i(0, 0, -1), Vec3i(0, 0, -1), Vec3i(0, 0, 0), "z", "x", "y", 1, -1),
)


class VoxelMap:
    def __init__(self, size_x: int, size_y: int, size_z: int, voxel_size: float, empty_char: str, cell_types: dict[str, PieceInfo]) -> None:
        self.size_x = size_x
        self.size_y = size_y
        self.size_z = size_z
        self.voxel_size = voxel_size
        self.empty_char = empty_char
        self.cell_types = cell_types
        self.grid = bytearray((ord(empty_char),)) * (size_x * size_y * size_z)
        self.occupied_cells: list[Vec3i] = []

    def index(self, x: int, y: int, z: int) -> int:
        return x + (z * self.size_x) + (y * self.size_x * self.size_z)

    def in_bounds(self, x: int, y: int, z: int) -> bool:
        return 0 <= x < self.size_x and 0 <= y < self.size_y and 0 <= z < self.size_z

    def char(self, x: int, y: int, z: int) -> str:
        if not self.in_bounds(x, y, z):
            return self.empty_char
        return chr(self.grid[self.index(x, y, z)])

    def set_char(self, x: int, y: int, z: int, value: str) -> None:
        self.grid[self.index(x, y, z)] = ord(value)

    def piece_info(self, x: int, y: int, z: int) -> PieceInfo:
        return self.cell_types[self.char(x, y, z)]

    def piece_type(self, x: int, y: int, z: int) -> str:
        return self.piece_info(x, y, z).piece_type

    def material_key(self, x: int, y: int, z: int) -> str:
        return self.piece_info(x, y, z).material_key

    def is_cube_solid(self, x: int, y: int, z: int) -> bool:
        return self.piece_info(x, y, z).cube_solid


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


def face_origin(face: CubeFace, plane: int, start_u: int, start_v: int, size_u: int, size_v: int) -> Vec3i:
    coords = {"x": 0, "y": 0, "z": 0}
    coords[face.fixed_axis] = plane
    coords[face.scan_u_axis] = start_u + (size_u if face.u_sign < 0 else 0)
    coords[face.scan_v_axis] = start_v + (size_v if face.v_sign < 0 else 0)
    return Vec3i(coords["x"], coords["y"], coords["z"])


def face_axis(axis: str, magnitude: int) -> Vec3i:
    if axis == "x":
        return Vec3i(magnitude, 0, 0)
    if axis == "y":
        return Vec3i(0, magnitude, 0)
    return Vec3i(0, 0, magnitude)


def vec_dict(vec: Vec3i) -> dict[str, int]:
    return {"x": vec.x, "y": vec.y, "z": vec.z}


def vec_list(vec: Vec3i) -> list[int]:
    return [vec.x, vec.y, vec.z]


def expand_rle(text: str) -> str:
    parts: list[str] = []
    for run in text.split(","):
        count_text, value = run.strip().split(":", 1)
        parts.append(value * int(count_text))
    return "".join(parts)


def load_piece_types(settings: SettingsBundle) -> tuple[str, dict[str, PieceInfo], dict[str, PieceInfo]]:
    canonical = settings.canonical
    empty_char = str(canonical["empty_char"])
    cell_types: dict[str, PieceInfo] = {
        empty_char: PieceInfo(map_char=empty_char, piece_type="empty", material_key="", cube_solid=False)
    }
    pieces_by_type: dict[str, PieceInfo] = {}
    seen_chars: set[str] = {empty_char}

    for definition in canonical["piece_types"].values():
        piece_type = str(definition["piece_type"])
        material_key = str(definition["material_key"])
        cube_solid = bool(definition["cube_solid"])
        for map_char in definition["map_chars"]:
            char = str(map_char)
            if char in seen_chars:
                raise ValueError(f"duplicate map char in settings: {char}")
            info = PieceInfo(map_char=char, piece_type=piece_type, material_key=material_key, cube_solid=cube_solid)
            cell_types[char] = info
            pieces_by_type[piece_type] = info
            seen_chars.add(char)

    return empty_char, cell_types, pieces_by_type


def load_wedge_templates(settings: SettingsBundle) -> dict[str, WedgeTemplate]:
    templates: dict[str, WedgeTemplate] = {}
    geometry = settings.canonical["geometry"]["wedges"]
    for piece_type, definition in geometry.items():
        quads = tuple(
            WedgeQuadTemplate(
                face=str(item["face"]),
                origin=Vec3i(*item["origin"]),
                u_axis=Vec3i(*item["u_axis"]),
                v_axis=Vec3i(*item["v_axis"]),
                normal=Vec3i(*item["normal"]),
            )
            for item in definition["quads"]
        )
        triangles = tuple(
            WedgeTriangleTemplate(
                face=str(item["face"]),
                p0=Vec3i(*item["p0"]),
                p1=Vec3i(*item["p1"]),
                p2=Vec3i(*item["p2"]),
                normal=Vec3i(*item["normal"]),
            )
            for item in definition["triangles"]
        )
        templates[piece_type] = WedgeTemplate(piece_type=piece_type, quads=quads, triangles=triangles)
    return templates


def parse_source_map(path: Path, empty_char: str, cell_types: dict[str, PieceInfo]) -> tuple[VoxelMap, list[float], float]:
    lines = [line.strip() for line in path.read_text().splitlines() if line.strip() and not line.strip().startswith("#")]
    size_x, size_y, size_z = map(int, lines[0].split()[1:4])
    voxel_size = float(lines[1].split()[1])
    world = VoxelMap(size_x, size_y, size_z, voxel_size, empty_char, cell_types)
    map_spawn: list[float] | None = None
    world_y_offset = 0.02
    empty_row = empty_char * size_x

    line_index = 2
    while line_index < len(lines):
        line = lines[line_index]
        if line.startswith("SPAWN "):
            if map_spawn is not None:
                raise ValueError("source map must define exactly one SPAWN")
            map_spawn = [float(value) for value in line.split()[1:4]]
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
            raise ValueError(f"unexpected directive: {line}")

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
            if current.startswith("FILL_ROWS "):
                _, start_text, end_text, fill_char = current.split()
                start_row = int(start_text)
                end_row = int(end_text)
                if fill_char not in cell_types:
                    raise ValueError(f"unexpected fill char '{fill_char}' in FILL_ROWS")
                for row_index in range(start_row, end_row + 1):
                    rows[row_index] = fill_char * size_x
                line_index += 1
                continue
            if not current.startswith("ROW "):
                raise ValueError(f"unexpected line: {current}")
            _, row_index_text, encoding, payload = current.split(" ", 3)
            row_index = int(row_index_text)
            rows[row_index] = payload if encoding == "RAW" else expand_rle(payload)
            line_index += 1

        for dy in range(repeat_count):
            y = layer_y + dy
            for z, row in enumerate(rows):
                if len(row) != size_x:
                    raise ValueError(f"layer {y} row {z} has wrong width")
                for x, char in enumerate(row):
                    if char not in cell_types:
                        raise ValueError(f"unexpected map char '{char}' at ({x},{y},{z})")
                    world.set_char(x, y, z, char)
                    if char != empty_char:
                        world.occupied_cells.append(Vec3i(x, y, z))

    if map_spawn is None:
        raise ValueError("source map must define exactly one SPAWN")
    return world, map_spawn, world_y_offset


def validate_cube_face_table() -> None:
    for face in CUBE_FACES:
        expected = vec3i_cross(unit_axis(face.scan_u_axis, face.u_sign), unit_axis(face.scan_v_axis, face.v_sign))
        if expected != face.normal:
            raise ValueError(f"cube face contract broken for {face.name}")
        if vec_add(face.solid_offset, face.normal) != face.neighbor_offset:
            raise ValueError(f"cube neighbor contract broken for {face.name}")


def validate_wedge_templates(templates: dict[str, WedgeTemplate]) -> None:
    for piece_type, template in templates.items():
        for quad in template.quads:
            if vec3i_cross(quad.u_axis, quad.v_axis) != quad.normal:
                raise ValueError(f"wedge {piece_type} quad {quad.face} has invalid cross(u,v)")
            p0 = quad.origin
            p1 = vec_add(quad.origin, quad.u_axis)
            p2 = vec_add(vec_add(quad.origin, quad.u_axis), quad.v_axis)
            p3 = vec_add(quad.origin, quad.v_axis)
            if vec3i_cross(vec_sub(p1, p0), vec_sub(p2, p0)) != quad.normal:
                raise ValueError(f"wedge {piece_type} quad {quad.face} triangle 0 invalid")
            if vec3i_cross(vec_sub(p2, p0), vec_sub(p3, p0)) != quad.normal:
                raise ValueError(f"wedge {piece_type} quad {quad.face} triangle 1 invalid")
        for triangle in template.triangles:
            if vec3i_cross(vec_sub(triangle.p1, triangle.p0), vec_sub(triangle.p2, triangle.p0)) != triangle.normal:
                raise ValueError(f"wedge {piece_type} triangle {triangle.face} invalid")


def validate_collision_settings(settings: SettingsBundle, pieces_by_type: dict[str, PieceInfo], templates: dict[str, WedgeTemplate]) -> None:
    material_keys = set(settings.materials.keys())
    for piece in pieces_by_type.values():
        if piece.material_key and piece.material_key not in material_keys:
            raise ValueError(f"unknown material key: {piece.material_key}")

    wedge_ids = settings.collision["wedge_type_ids"]
    if set(wedge_ids.keys()) != set(templates.keys()):
        raise ValueError("wedge_type_ids must cover exactly all canonical wedge types")

    expected_height_functions = {
        "wedge_pz": "local_z",
        "wedge_px": "local_x",
        "wedge_nz": "one_minus_local_z",
        "wedge_nx": "one_minus_local_x",
    }
    for piece_type, expected in expected_height_functions.items():
        actual = settings.collision["wedge_types"][piece_type]["height_function"]
        if actual != expected:
            raise ValueError(f"collision height function mismatch for {piece_type}: {actual} != {expected}")

    spawn = settings.spawn
    if not isinstance(spawn["override_enabled"], bool):
        raise ValueError("spawn.override_enabled must be bool")
    if len(spawn["override_position"]) != 3:
        raise ValueError("spawn.override_position must have 3 values")
    if float(spawn["ground_search_distance"]) <= 0.0:
        raise ValueError("spawn.ground_search_distance must be positive")


def emit_cube_piece(world: VoxelMap, cell: Vec3i) -> EmittedPiece:
    piece = EmittedPiece(
        voxel_id=f"voxel_{cell.x}_{cell.y}_{cell.z}",
        piece_type="cube",
        cell=cell,
        material=world.material_key(cell.x, cell.y, cell.z),
        quads=[],
        triangles=[],
    )
    for face in CUBE_FACES:
        neighbor = vec_add(cell, face.normal)
        if world.is_cube_solid(neighbor.x, neighbor.y, neighbor.z):
            continue
        plane_coords = vec_sub(cell, face.solid_offset)
        origin = face_origin(
            face,
            getattr(plane_coords, face.fixed_axis),
            getattr(plane_coords, face.scan_u_axis),
            getattr(plane_coords, face.scan_v_axis),
            1,
            1,
        )
        piece.quads.append(
            {
                "face": face.name,
                "origin": origin,
                "u_axis": face_axis(face.scan_u_axis, face.u_sign),
                "v_axis": face_axis(face.scan_v_axis, face.v_sign),
                "normal": face.normal,
            }
        )
    return piece


def emit_wedge_piece(world: VoxelMap, cell: Vec3i, template: WedgeTemplate) -> EmittedPiece:
    piece = EmittedPiece(
        voxel_id=f"voxel_{cell.x}_{cell.y}_{cell.z}",
        piece_type=template.piece_type,
        cell=cell,
        material=world.material_key(cell.x, cell.y, cell.z),
        quads=[],
        triangles=[],
    )
    for quad in template.quads:
        piece.quads.append(
            {
                "face": quad.face,
                "origin": vec_translate(cell, quad.origin),
                "u_axis": quad.u_axis,
                "v_axis": quad.v_axis,
                "normal": quad.normal,
            }
        )
    for triangle in template.triangles:
        piece.triangles.append(
            {
                "face": triangle.face,
                "p0": vec_translate(cell, triangle.p0),
                "p1": vec_translate(cell, triangle.p1),
                "p2": vec_translate(cell, triangle.p2),
                "normal": triangle.normal,
            }
        )
    return piece


def build_emitted_pieces(world: VoxelMap, wedge_templates: dict[str, WedgeTemplate]) -> list[EmittedPiece]:
    pieces: list[EmittedPiece] = []
    for cell in world.occupied_cells:
        piece_type = world.piece_type(cell.x, cell.y, cell.z)
        if piece_type == "cube":
            pieces.append(emit_cube_piece(world, cell))
        else:
            pieces.append(emit_wedge_piece(world, cell, wedge_templates[piece_type]))
    return pieces


def build_runtime_geometry(pieces: list[EmittedPiece]) -> tuple[dict[str, list[list[int]]], dict[str, list[list[int]]]]:
    quads_by_material: dict[str, list[list[int]]] = {}
    triangles_by_material: dict[str, list[list[int]]] = {}
    for piece in pieces:
        quads_by_material.setdefault(piece.material, [])
        triangles_by_material.setdefault(piece.material, [])
        for quad in piece.quads:
            origin = quad["origin"]
            u_axis = quad["u_axis"]
            v_axis = quad["v_axis"]
            normal = quad["normal"]
            quads_by_material[piece.material].append(vec_list(origin) + vec_list(u_axis) + vec_list(v_axis) + vec_list(normal))
        for triangle in piece.triangles:
            p0 = triangle["p0"]
            p1 = triangle["p1"]
            p2 = triangle["p2"]
            normal = triangle["normal"]
            triangles_by_material[piece.material].append(vec_list(p0) + vec_list(p1) + vec_list(p2) + vec_list(normal))
    quads_by_material = {key: value for key, value in quads_by_material.items() if value}
    triangles_by_material = {key: value for key, value in triangles_by_material.items() if value}
    return quads_by_material, triangles_by_material


def build_collision_boxes(world: VoxelMap) -> list[list[int]]:
    visited: set[tuple[int, int, int]] = set()
    cube_cells = sorted(
        (cell for cell in world.occupied_cells if world.is_cube_solid(cell.x, cell.y, cell.z)),
        key=lambda cell: (cell.y, cell.z, cell.x),
    )

    boxes: list[list[int]] = []
    for cell in cube_cells:
        x = cell.x
        y = cell.y
        z = cell.z
        if (x, y, z) in visited:
            continue

        width = 1
        while x + width < world.size_x and world.is_cube_solid(x + width, y, z) and (x + width, y, z) not in visited:
            width += 1

        depth = 1
        while z + depth < world.size_z:
            can_expand = True
            for dx in range(width):
                if not world.is_cube_solid(x + dx, y, z + depth) or (x + dx, y, z + depth) in visited:
                    can_expand = False
                    break
            if not can_expand:
                break
            depth += 1

        height = 1
        while y + height < world.size_y:
            can_expand = True
            for dz in range(depth):
                for dx in range(width):
                    if not world.is_cube_solid(x + dx, y + height, z + dz) or (x + dx, y + height, z + dz) in visited:
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
                    visited.add((x + dx, y + dy, z + dz))

        boxes.append([x, y, z, width, height, depth])
    return boxes


def build_collision_wedges(world: VoxelMap, wedge_ids: dict[str, int]) -> list[list[int]]:
    wedges: list[list[int]] = []
    for cell in world.occupied_cells:
        piece_type = world.piece_type(cell.x, cell.y, cell.z)
        if piece_type in wedge_ids:
            wedges.append([cell.x, cell.y, cell.z, int(wedge_ids[piece_type])])
    return wedges


def validate_runtime_payload(payload: dict[str, object], wedge_ids: dict[str, int]) -> None:
    collision_shapes = payload["collision_shapes"]
    for box in collision_shapes["boxes"]:
        if len(box) != 6:
            raise ValueError("collision box must have 6 numeric values")
    valid_wedge_ids = set(wedge_ids.values())
    for wedge in collision_shapes["wedges"]:
        if len(wedge) != 4:
            raise ValueError("collision wedge must have 4 numeric values")
        if wedge[3] not in valid_wedge_ids:
            raise ValueError(f"invalid wedge type id in artifact: {wedge[3]}")


def write_runtime(
    settings: SettingsBundle,
    world: VoxelMap,
    map_spawn: list[float],
    world_y_offset: float,
    quads_by_material: dict[str, list[list[int]]],
    triangles_by_material: dict[str, list[list[int]]],
    boxes: list[list[int]],
    wedges: list[list[int]],
) -> Path:
    runtime_path = PROJECT_ROOT / settings.paths["runtime_artifact"]
    payload = {
        "version": 12,
        "source_map": settings.paths["source_map"],
        "dimensions": [world.size_x, world.size_y, world.size_z],
        "voxel_size": world.voxel_size,
        "world_y_offset": world_y_offset,
        "spawn": {
            "map_default": map_spawn,
            "override_enabled": settings.spawn["override_enabled"],
            "override_position": settings.spawn["override_position"],
        },
        "materials": sorted(set(quads_by_material.keys()) | set(triangles_by_material.keys())),
        "quads": quads_by_material,
        "triangles": triangles_by_material,
        "collision_shapes": {
            settings.collision["runtime_boxes_key"]: boxes,
            settings.collision["runtime_wedges_key"]: wedges,
        },
    }
    validate_runtime_payload(payload, settings.collision["wedge_type_ids"])
    runtime_path.write_text(json.dumps(payload, separators=(",", ":")))
    return runtime_path


def write_debug_artifact(settings: SettingsBundle, world: VoxelMap, map_spawn: list[float], world_y_offset: float, pieces: list[EmittedPiece]) -> Path:
    debug_path = PROJECT_ROOT / settings.paths["debug_artifact"]
    payload = {
        "version": 12,
        "source_map": settings.paths["source_map"],
        "dimensions": {"x": world.size_x, "y": world.size_y, "z": world.size_z},
        "voxel_size": world.voxel_size,
        "world_y_offset": world_y_offset,
        "spawn": {
            "map_default": {"x": map_spawn[0], "y": map_spawn[1], "z": map_spawn[2]},
            "override_enabled": settings.spawn["override_enabled"],
            "override_position": {
                "x": settings.spawn["override_position"][0],
                "y": settings.spawn["override_position"][1],
                "z": settings.spawn["override_position"][2],
            },
        },
        "collision_wedge_types": settings.collision["wedge_types"],
        "pieces": [
            {
                "voxel_id": piece.voxel_id,
                "piece_type": piece.piece_type,
                "cell": vec_dict(piece.cell),
                "material": piece.material,
                "quads": [
                    {
                        "face": quad["face"],
                        "origin": vec_dict(quad["origin"]),
                        "u_axis": vec_dict(quad["u_axis"]),
                        "v_axis": vec_dict(quad["v_axis"]),
                        "normal": vec_dict(quad["normal"]),
                    }
                    for quad in piece.quads
                ],
                "triangles": [
                    {
                        "face": triangle["face"],
                        "p0": vec_dict(triangle["p0"]),
                        "p1": vec_dict(triangle["p1"]),
                        "p2": vec_dict(triangle["p2"]),
                        "normal": vec_dict(triangle["normal"]),
                    }
                    for triangle in piece.triangles
                ],
            }
            for piece in pieces
        ],
    }
    debug_path.write_text(json.dumps(payload, indent=2))
    return debug_path


def main() -> None:
    settings = load_settings(SETTINGS_PATH)
    empty_char, cell_types, pieces_by_type = load_piece_types(settings)
    wedge_templates = load_wedge_templates(settings)
    validate_cube_face_table()
    validate_wedge_templates(wedge_templates)
    validate_collision_settings(settings, pieces_by_type, wedge_templates)

    source_map_path = PROJECT_ROOT / settings.paths["source_map"]
    world, map_spawn, world_y_offset = parse_source_map(source_map_path, empty_char, cell_types)
    pieces = build_emitted_pieces(world, wedge_templates)
    quads_by_material, triangles_by_material = build_runtime_geometry(pieces)
    boxes = build_collision_boxes(world)
    wedges = build_collision_wedges(world, settings.collision["wedge_type_ids"])

    runtime_path = write_runtime(settings, world, map_spawn, world_y_offset, quads_by_material, triangles_by_material, boxes, wedges)
    debug_path = PROJECT_ROOT / settings.paths["debug_artifact"]
    if bool(settings.preprocessing["debug"]):
        write_debug_artifact(settings, world, map_spawn, world_y_offset, pieces)
    elif debug_path.exists():
        debug_path.unlink()

    print(f"settings: {SETTINGS_PATH}")
    print(f"source: {source_map_path}")
    print(f"runtime: {runtime_path}")
    if debug_path.exists():
        print(f"debug: {debug_path}")
    print(f"materials: {sorted(set(quads_by_material.keys()) | set(triangles_by_material.keys()))}")
    print(f"pieces: {len(pieces)}")
    print(f"quads: {sum(len(value) for value in quads_by_material.values())}")
    print(f"triangles: {sum(len(value) for value in triangles_by_material.values())}")
    print(f"collision_boxes: {len(boxes)}")
    print(f"collision_wedges: {len(wedges)}")


if __name__ == "__main__":
    main()
