#!/usr/bin/env python3

from __future__ import annotations

from pathlib import Path


SOURCE_PATH = Path(__file__).resolve().parent.parent / "data" / "source_world.txt"
RUNTIME_PATH = Path(__file__).resolve().parent.parent / "data" / "runtime_world.txt"

VOXEL_COLORS: dict[str, tuple[float, float, float, float]] = {
    "#": (0.58, 0.60, 0.64, 1.0),
    "G": (0.42, 0.72, 0.48, 1.0),
    "B": (0.40, 0.56, 0.86, 1.0),
    "Y": (0.88, 0.77, 0.34, 1.0),
    "M": (0.80, 0.48, 0.86, 1.0),
}

FACE_SHADE: dict[str, float] = {
    "FRONT": 0.96,
    "BACK": 0.70,
    "LEFT": 0.82,
    "RIGHT": 0.88,
    "TOP": 1.00,
    "BOTTOM": 0.58,
}


class World:
    def __init__(self, size_x: int, size_y: int, size_z: int, voxel_size: float) -> None:
        self.size_x = size_x
        self.size_y = size_y
        self.size_z = size_z
        self.voxel_size = voxel_size
        self.grid: list[list[list[str]]] = [
            [["." for _ in range(size_x)] for _ in range(size_z)]
            for _ in range(size_y)
        ]

    def set_char(self, x: int, y: int, z: int, char: str) -> None:
        self.grid[y][z][x] = char

    def char_at(self, x: int, y: int, z: int) -> str:
        if x < 0 or y < 0 or z < 0:
            return "."
        if x >= self.size_x or y >= self.size_y or z >= self.size_z:
            return "."
        return self.grid[y][z][x]

    def is_solid(self, x: int, y: int, z: int) -> bool:
        return self.char_at(x, y, z) != "."

    def cube_center(self, x: int, y: int, z: int) -> tuple[float, float, float]:
        return (
            ((x + 0.5) - (self.size_x * 0.5)) * self.voxel_size,
            (y + 0.5) * self.voxel_size,
            ((z + 0.5) - (self.size_z * 0.5)) * self.voxel_size,
        )

    def box_min(self, x: int, y: int, z: int) -> tuple[float, float, float]:
        return (
            (x - (self.size_x * 0.5)) * self.voxel_size,
            y * self.voxel_size,
            (z - (self.size_z * 0.5)) * self.voxel_size,
        )


def parse_world(path: Path) -> World:
    lines: list[str] = [line.rstrip("\n") for line in path.read_text().splitlines()]
    if not lines or not lines[0].startswith("SIZE "):
        raise ValueError("Missing SIZE header")
    if len(lines) < 2 or not lines[1].startswith("VOXEL "):
        raise ValueError("Missing VOXEL header")

    _, sx_text, sy_text, sz_text = lines[0].split()
    _, voxel_text = lines[1].split()
    world = World(int(sx_text), int(sy_text), int(sz_text), float(voxel_text))

    index = 2
    seen_layers: set[int] = set()
    while index < len(lines):
        line = lines[index].strip()
        index += 1
        if not line:
            continue
        if not line.startswith("LAYER "):
            raise ValueError(f"Unexpected line: {line}")
        _, layer_text = line.split()
        layer = int(layer_text)
        if layer in seen_layers:
            raise ValueError(f"Duplicate layer: {layer}")
        seen_layers.add(layer)
        for z in range(world.size_z):
            if index >= len(lines):
                raise ValueError(f"Layer {layer} incomplete")
            row = lines[index].strip()
            index += 1
            if len(row) != world.size_x:
                raise ValueError(f"Row length mismatch in layer {layer}, z {z}")
            for x, char in enumerate(row):
                world.set_char(x, layer, z, char)
    return world


def face_color(char: str, face_name: str) -> tuple[float, float, float, float]:
    base = VOXEL_COLORS[char]
    shade = FACE_SHADE[face_name]
    return (
        base[0] * shade,
        base[1] * shade,
        base[2] * shade,
        base[3],
    )


def append_face(
    vertices: list[tuple[float, float, float, float, float, float, float]],
    indices: list[int],
    points: list[tuple[float, float, float]],
    color: tuple[float, float, float, float],
) -> None:
    base = len(vertices)
    for point in points:
        vertices.append((point[0], point[1], point[2], color[0], color[1], color[2], color[3]))
    indices.extend((base + 0, base + 1, base + 2, base + 0, base + 2, base + 3))


def append_visible_faces_for_cube(
    world: World,
    x: int,
    y: int,
    z: int,
    char: str,
    vertices: list[tuple[float, float, float, float, float, float, float]],
    indices: list[int],
) -> None:
    cx, cy, cz = world.cube_center(x, y, z)
    half = world.voxel_size * 0.5
    minp = (cx - half, cy - half, cz - half)
    maxp = (cx + half, cy + half, cz + half)

    p000 = (minp[0], minp[1], minp[2])
    p001 = (minp[0], minp[1], maxp[2])
    p010 = (minp[0], maxp[1], minp[2])
    p011 = (minp[0], maxp[1], maxp[2])
    p100 = (maxp[0], minp[1], minp[2])
    p101 = (maxp[0], minp[1], maxp[2])
    p110 = (maxp[0], maxp[1], minp[2])
    p111 = (maxp[0], maxp[1], maxp[2])

    if not world.is_solid(x, y, z + 1):
        append_face(vertices, indices, [p001, p011, p111, p101], face_color(char, "FRONT"))
    if not world.is_solid(x, y, z - 1):
        append_face(vertices, indices, [p100, p110, p010, p000], face_color(char, "BACK"))
    if not world.is_solid(x - 1, y, z):
        append_face(vertices, indices, [p000, p001, p011, p010], face_color(char, "LEFT"))
    if not world.is_solid(x + 1, y, z):
        append_face(vertices, indices, [p101, p100, p110, p111], face_color(char, "RIGHT"))
    if not world.is_solid(x, y + 1, z):
        append_face(vertices, indices, [p010, p011, p111, p110], face_color(char, "TOP"))
    if not world.is_solid(x, y - 1, z):
        append_face(vertices, indices, [p000, p100, p101, p001], face_color(char, "BOTTOM"))


def build_mesh(
    world: World,
) -> tuple[list[tuple[float, float, float, float, float, float, float]], list[int], int]:
    vertices: list[tuple[float, float, float, float, float, float, float]] = []
    indices: list[int] = []
    solid_count = 0
    for y in range(world.size_y):
        for z in range(world.size_z):
            for x in range(world.size_x):
                char = world.char_at(x, y, z)
                if char == ".":
                    continue
                solid_count += 1
                append_visible_faces_for_cube(world, x, y, z, char, vertices, indices)
    return vertices, indices, solid_count


def can_expand_z(world: World, visited: list[list[list[bool]]], x0: int, x1: int, y: int, z: int) -> bool:
    if z >= world.size_z:
        return False
    for x in range(x0, x1 + 1):
        if not world.is_solid(x, y, z) or visited[y][z][x]:
            return False
    return True


def can_expand_y(
    world: World,
    visited: list[list[list[bool]]],
    x0: int,
    x1: int,
    y: int,
    z0: int,
    z1: int,
) -> bool:
    if y >= world.size_y:
        return False
    for z in range(z0, z1 + 1):
        for x in range(x0, x1 + 1):
            if not world.is_solid(x, y, z) or visited[y][z][x]:
                return False
    return True


def build_collision_boxes(world: World) -> list[tuple[float, float, float, float, float, float]]:
    visited: list[list[list[bool]]] = [
        [[False for _ in range(world.size_x)] for _ in range(world.size_z)]
        for _ in range(world.size_y)
    ]
    boxes: list[tuple[float, float, float, float, float, float]] = []

    for y in range(world.size_y):
        for z in range(world.size_z):
            for x in range(world.size_x):
                if not world.is_solid(x, y, z) or visited[y][z][x]:
                    continue

                end_x = x
                while end_x + 1 < world.size_x and world.is_solid(end_x + 1, y, z) and not visited[y][z][end_x + 1]:
                    end_x += 1

                end_z = z
                while can_expand_z(world, visited, x, end_x, y, end_z + 1):
                    end_z += 1

                end_y = y
                while can_expand_y(world, visited, x, end_x, end_y + 1, z, end_z):
                    end_y += 1

                for fill_y in range(y, end_y + 1):
                    for fill_z in range(z, end_z + 1):
                        for fill_x in range(x, end_x + 1):
                            visited[fill_y][fill_z][fill_x] = True

                min_x, min_y, min_z = world.box_min(x, y, z)
                size_x = (end_x - x + 1) * world.voxel_size
                size_y = (end_y - y + 1) * world.voxel_size
                size_z = (end_z - z + 1) * world.voxel_size
                boxes.append((min_x, min_y, min_z, size_x, size_y, size_z))
    return boxes


def write_runtime(
    world: World,
    vertices: list[tuple[float, float, float, float, float, float, float]],
    indices: list[int],
    boxes: list[tuple[float, float, float, float, float, float]],
) -> None:
    RUNTIME_PATH.parent.mkdir(parents=True, exist_ok=True)
    with RUNTIME_PATH.open("w", encoding="utf-8") as handle:
        handle.write("RUNTIME_VOXEL_WORLD_V1\n")
        handle.write(f"size {world.size_x} {world.size_y} {world.size_z}\n")
        handle.write(f"voxel_size {world.voxel_size:.6f}\n")
        handle.write(f"vertex_count {len(vertices)}\n")
        handle.write(f"index_count {len(indices)}\n")
        handle.write(f"box_count {len(boxes)}\n")
        handle.write("vertices\n")
        for vertex in vertices:
            handle.write("%.6f %.6f %.6f %.6f %.6f %.6f %.6f\n" % vertex)
        handle.write("indices\n")
        for index in indices:
            handle.write(f"{index}\n")
        handle.write("boxes\n")
        for box in boxes:
            handle.write("%.6f %.6f %.6f %.6f %.6f %.6f\n" % box)


def main() -> None:
    world = parse_world(SOURCE_PATH)
    vertices, indices, solid_count = build_mesh(world)
    boxes = build_collision_boxes(world)
    write_runtime(world, vertices, indices, boxes)
    print(f"source: {SOURCE_PATH}")
    print(f"runtime: {RUNTIME_PATH}")
    print(f"solid_voxels: {solid_count}")
    print(f"vertices: {len(vertices)}")
    print(f"indices: {len(indices)}")
    print(f"collision_boxes: {len(boxes)}")


if __name__ == "__main__":
    main()
