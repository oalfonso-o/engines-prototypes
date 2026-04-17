#!/usr/bin/env python3

from __future__ import annotations

from pathlib import Path


SOURCE_PATH = Path(__file__).resolve().parent.parent / "data" / "source_world.txt"
RUNTIME_PATH = Path(__file__).resolve().parent.parent / "data" / "runtime_mesh.txt"


class CubeDefinition:
    def __init__(
        self,
        center: tuple[float, float, float],
        size: tuple[float, float, float],
        colors: dict[str, tuple[int, int, int, int]],
    ) -> None:
        self.center = center
        self.size = size
        self.colors = colors


def parse_source(path: Path) -> list[CubeDefinition]:
    cubes: list[CubeDefinition] = []
    current_center: tuple[float, float, float] | None = None
    current_size: tuple[float, float, float] | None = None
    current_colors: dict[str, tuple[int, int, int, int]] = {}

    def flush_cube() -> None:
        nonlocal current_center
        nonlocal current_size
        nonlocal current_colors
        if current_center is None and current_size is None and not current_colors:
            return
        if current_center is None or current_size is None:
            raise ValueError("Each CUBE block needs CENTER and SIZE")
        cubes.append(CubeDefinition(current_center, current_size, dict(current_colors)))
        current_center = None
        current_size = None
        current_colors = {}

    lines = [line.strip() for line in path.read_text().splitlines() if line.strip()]
    for line in lines:
        parts = line.split()
        key = parts[0]
        if key == "CUBE":
            flush_cube()
        elif key == "CENTER":
            current_center = (float(parts[1]), float(parts[2]), float(parts[3]))
        elif key == "SIZE":
            current_size = (float(parts[1]), float(parts[2]), float(parts[3]))
        elif key.startswith("COLOR_"):
            current_colors[key.removeprefix("COLOR_")] = (
                int(parts[1]),
                int(parts[2]),
                int(parts[3]),
                int(parts[4]),
            )
        else:
            raise ValueError(f"Unknown line: {line}")
    flush_cube()
    if not cubes:
        raise ValueError("source_world.txt must contain at least one CUBE block")
    return cubes


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


def append_cube_from_v1_template(
    vertices: list[tuple[float, float, float, float, float, float, float]],
    indices: list[int],
    center: tuple[float, float, float],
    size: tuple[float, float, float],
    colors: dict[str, tuple[int, int, int, int]],
) -> None:
    cx, cy, cz = center
    sx, sy, sz = size
    hx = sx * 0.5
    hy = sy * 0.5
    hz = sz * 0.5

    minp = (cx - hx, cy - hy, cz - hz)
    maxp = (cx + hx, cy + hy, cz + hz)

    p000 = (minp[0], minp[1], minp[2])
    p001 = (minp[0], minp[1], maxp[2])
    p010 = (minp[0], maxp[1], minp[2])
    p011 = (minp[0], maxp[1], maxp[2])
    p100 = (maxp[0], minp[1], minp[2])
    p101 = (maxp[0], minp[1], maxp[2])
    p110 = (maxp[0], maxp[1], minp[2])
    p111 = (maxp[0], maxp[1], maxp[2])

    # This is the same per-face point order that worked visually in v1/v2.
    append_face(vertices, indices, [p001, p011, p111, p101], colors["FRONT"])
    append_face(vertices, indices, [p100, p110, p010, p000], colors["BACK"])
    append_face(vertices, indices, [p000, p001, p011, p010], colors["LEFT"])
    append_face(vertices, indices, [p101, p100, p110, p111], colors["RIGHT"])
    append_face(vertices, indices, [p010, p011, p111, p110], colors["TOP"])
    append_face(vertices, indices, [p000, p100, p101, p001], colors["BOTTOM"])


def build_mesh(cubes: list[CubeDefinition]) -> tuple[list[tuple[float, float, float, float, float, float, float]], list[int]]:
    vertices: list[tuple[float, float, float, float, float, float, float]] = []
    indices: list[int] = []
    for cube in cubes:
        append_cube_from_v1_template(vertices, indices, cube.center, cube.size, cube.colors)
    return vertices, indices


def write_runtime(
    path: Path,
    cubes: list[CubeDefinition],
    vertices: list[tuple[float, float, float, float, float, float, float]],
    indices: list[int],
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        handle.write("RUNTIME_CUBE_V1\n")
        handle.write(f"cube_count {len(cubes)}\n")
        handle.write(f"vertex_count {len(vertices)}\n")
        handle.write(f"index_count {len(indices)}\n")
        handle.write("vertices\n")
        for vertex in vertices:
            handle.write("%.6f %.6f %.6f %.6f %.6f %.6f %.6f\n" % vertex)
        handle.write("indices\n")
        for index in indices:
            handle.write(f"{index}\n")


def main() -> None:
    cubes = parse_source(SOURCE_PATH)
    vertices, indices = build_mesh(cubes)
    write_runtime(RUNTIME_PATH, cubes, vertices, indices)
    print(f"source: {SOURCE_PATH}")
    print(f"runtime: {RUNTIME_PATH}")
    print(f"cubes: {len(cubes)}")
    print(f"vertices: {len(vertices)}")
    print(f"indices: {len(indices)}")


if __name__ == "__main__":
    main()
