#!/usr/bin/env python3

from __future__ import annotations

from pathlib import Path


SOURCE_PATH = Path(__file__).resolve().parent.parent / "data" / "source_world.txt"
RUNTIME_PATH = Path(__file__).resolve().parent.parent / "data" / "runtime_mesh.txt"

FACE_COLORS: dict[str, tuple[int, int, int, int]] = {
    "FRONT": (220, 64, 64, 255),
    "BACK": (64, 180, 90, 255),
    "LEFT": (64, 110, 220, 255),
    "RIGHT": (220, 200, 64, 255),
    "TOP": (200, 80, 210, 255),
    "BOTTOM": (64, 210, 210, 255),
}


class World:
    def __init__(self, size_x: int, size_y: int, size_z: int, voxel_size: float) -> None:
        self.size_x = size_x
        self.size_y = size_y
        self.size_z = size_z
        self.voxel_size = voxel_size
        self.grid: list[list[list[bool]]] = [
            [[False for _ in range(size_x)] for _ in range(size_z)]
            for _ in range(size_y)
        ]

    def set_solid(self, x: int, y: int, z: int, solid: bool) -> None:
        self.grid[y][z][x] = solid

    def is_solid(self, x: int, y: int, z: int) -> bool:
        if x < 0 or y < 0 or z < 0:
            return False
        if x >= self.size_x or y >= self.size_y or z >= self.size_z:
            return False
        return self.grid[y][z][x]

    def cube_center(self, x: int, y: int, z: int) -> tuple[float, float, float]:
        return (
            ((x + 0.5) - (self.size_x * 0.5)) * self.voxel_size,
            (y + 0.5) * self.voxel_size,
            ((z + 0.5) - (self.size_z * 0.5)) * self.voxel_size,
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

    index: int = 2
    seen_layers: set[int] = set()
    while index < len(lines):
        line: str = lines[index].strip()
        index += 1
        if not line:
            continue
        if not line.startswith("LAYER "):
            raise ValueError(f"Unexpected line: {line}")
        _, layer_text = line.split()
        y: int = int(layer_text)
        if y in seen_layers:
            raise ValueError(f"Duplicate layer: {y}")
        seen_layers.add(y)
        for z in range(world.size_z):
            if index >= len(lines):
                raise ValueError(f"Layer {y} incomplete")
            row: str = lines[index].strip()
            index += 1
            if len(row) != world.size_x:
                raise ValueError(f"Row length mismatch in layer {y}, z {z}")
            for x, char in enumerate(row):
                world.set_solid(x, y, z, char == "#")
    return world


def normalized_color(color: tuple[int, int, int, int]) -> tuple[float, float, float, float]:
    return (
        color[0] / 255.0,
        color[1] / 255.0,
        color[2] / 255.0,
        color[3] / 255.0,
    )


def append_face(
    vertices: list[tuple[float, float, float, float, float, float, float]],
    indices: list[int],
    points: list[tuple[float, float, float]],
    color: tuple[int, int, int, int],
) -> None:
    rgba = normalized_color(color)
    base = len(vertices)
    for point in points:
        vertices.append((point[0], point[1], point[2], rgba[0], rgba[1], rgba[2], rgba[3]))
    indices.extend((base + 0, base + 1, base + 2, base + 0, base + 2, base + 3))


def append_visible_faces_for_cube(
    world: World,
    x: int,
    y: int,
    z: int,
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
        append_face(vertices, indices, [p001, p011, p111, p101], FACE_COLORS["FRONT"])
    if not world.is_solid(x, y, z - 1):
        append_face(vertices, indices, [p100, p110, p010, p000], FACE_COLORS["BACK"])
    if not world.is_solid(x - 1, y, z):
        append_face(vertices, indices, [p000, p001, p011, p010], FACE_COLORS["LEFT"])
    if not world.is_solid(x + 1, y, z):
        append_face(vertices, indices, [p101, p100, p110, p111], FACE_COLORS["RIGHT"])
    if not world.is_solid(x, y + 1, z):
        append_face(vertices, indices, [p010, p011, p111, p110], FACE_COLORS["TOP"])
    if not world.is_solid(x, y - 1, z):
        append_face(vertices, indices, [p000, p100, p101, p001], FACE_COLORS["BOTTOM"])


def build_mesh(world: World) -> tuple[list[tuple[float, float, float, float, float, float, float]], list[int], int]:
    vertices: list[tuple[float, float, float, float, float, float, float]] = []
    indices: list[int] = []
    cube_count: int = 0
    for y in range(world.size_y):
        for z in range(world.size_z):
            for x in range(world.size_x):
                if not world.is_solid(x, y, z):
                    continue
                cube_count += 1
                append_visible_faces_for_cube(world, x, y, z, vertices, indices)
    return vertices, indices, cube_count


def write_runtime(
    path: Path,
    world: World,
    cube_count: int,
    vertices: list[tuple[float, float, float, float, float, float, float]],
    indices: list[int],
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        handle.write("RUNTIME_VOXEL_MESH_V1\n")
        handle.write(f"size {world.size_x} {world.size_y} {world.size_z}\n")
        handle.write(f"voxel_size {world.voxel_size:.6f}\n")
        handle.write(f"cube_count {cube_count}\n")
        handle.write(f"vertex_count {len(vertices)}\n")
        handle.write(f"index_count {len(indices)}\n")
        handle.write("vertices\n")
        for vertex in vertices:
            handle.write("%.6f %.6f %.6f %.6f %.6f %.6f %.6f\n" % vertex)
        handle.write("indices\n")
        for index in indices:
            handle.write(f"{index}\n")


def main() -> None:
    world = parse_world(SOURCE_PATH)
    vertices, indices, cube_count = build_mesh(world)
    write_runtime(RUNTIME_PATH, world, cube_count, vertices, indices)
    print(f"source: {SOURCE_PATH}")
    print(f"runtime: {RUNTIME_PATH}")
    print(f"cubes: {cube_count}")
    print(f"vertices: {len(vertices)}")
    print(f"indices: {len(indices)}")


if __name__ == "__main__":
    main()
