#!/usr/bin/env python3

from __future__ import annotations

from pathlib import Path


SOURCE_PATH = Path(__file__).resolve().parent.parent / "data" / "source_world.txt"
RUNTIME_PATH = Path(__file__).resolve().parent.parent / "data" / "runtime_mesh.txt"
STRUCTURE_COLOR = (0.82, 0.84, 0.88, 1.0)


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


def voxel_bounds(world: World, x: int, y: int, z: int) -> tuple[float, float, float, float, float, float]:
    vx: float = world.voxel_size
    x0: float = (x - (world.size_x * 0.5)) * vx
    y0: float = y * vx
    z0: float = (z - (world.size_z * 0.5)) * vx
    return (x0, y0, z0, x0 + vx, y0 + vx, z0 + vx)


def emit_face(
    vertices: list[tuple[float, float, float, float, float, float, float]],
    indices: list[int],
    points: list[tuple[float, float, float]],
) -> None:
    base: int = len(vertices)
    for point in points:
        vertices.append((*point, *STRUCTURE_COLOR))
    indices.extend((base, base + 1, base + 2, base, base + 2, base + 3))


def build_mesh(world: World) -> tuple[list[tuple[float, float, float, float, float, float, float]], list[int]]:
    vertices: list[tuple[float, float, float, float, float, float, float]] = []
    indices: list[int] = []
    for y in range(world.size_y):
        for z in range(world.size_z):
            for x in range(world.size_x):
                if not world.is_solid(x, y, z):
                    continue
                x0, y0, z0, x1, y1, z1 = voxel_bounds(world, x, y, z)
                if not world.is_solid(x, y, z + 1):
                    emit_face(vertices, indices, [(x0, y0, z1), (x0, y1, z1), (x1, y1, z1), (x1, y0, z1)])
                if not world.is_solid(x, y, z - 1):
                    emit_face(vertices, indices, [(x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, z0)])
                if not world.is_solid(x - 1, y, z):
                    emit_face(vertices, indices, [(x0, y0, z0), (x0, y0, z1), (x0, y1, z1), (x0, y1, z0)])
                if not world.is_solid(x + 1, y, z):
                    emit_face(vertices, indices, [(x1, y0, z1), (x1, y0, z0), (x1, y1, z0), (x1, y1, z1)])
                if not world.is_solid(x, y + 1, z):
                    emit_face(vertices, indices, [(x0, y1, z0), (x0, y1, z1), (x1, y1, z1), (x1, y1, z0)])
                if not world.is_solid(x, y - 1, z):
                    emit_face(vertices, indices, [(x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1)])
    return vertices, indices


def write_runtime(path: Path, world: World, vertices: list[tuple[float, float, float, float, float, float, float]], indices: list[int]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        handle.write("RUNTIME_MESH_V1\n")
        handle.write(f"size {world.size_x} {world.size_y} {world.size_z}\n")
        handle.write(f"voxel_size {world.voxel_size:.6f}\n")
        handle.write(f"vertex_count {len(vertices)}\n")
        handle.write(f"index_count {len(indices)}\n")
        handle.write("vertices\n")
        for vertex in vertices:
            handle.write(
                "%.6f %.6f %.6f %.6f %.6f %.6f %.6f\n"
                % vertex
            )
        handle.write("indices\n")
        for index in indices:
            handle.write(f"{index}\n")


def main() -> None:
    world: World = parse_world(SOURCE_PATH)
    vertices, indices = build_mesh(world)
    write_runtime(RUNTIME_PATH, world, vertices, indices)
    print(f"source: {SOURCE_PATH}")
    print(f"runtime: {RUNTIME_PATH}")
    print(f"vertices: {len(vertices)}")
    print(f"indices: {len(indices)}")


if __name__ == "__main__":
    main()
