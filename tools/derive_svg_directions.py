#!/usr/bin/env python3

from __future__ import annotations

import argparse
import re
from pathlib import Path


ANGLE_BY_DIRECTION = {
    "south": 0,
    "southwest": 45,
    "west": 90,
    "northwest": 135,
    "north": 180,
    "northeast": 225,
    "east": 270,
    "southeast": 315,
}


def find_svg_files(source_dir: Path) -> list[Path]:
    return sorted(path for path in source_dir.glob("*.svg") if path.is_file())


def apply_rotation(svg_text: str, angle: int) -> str:
    if angle == 0:
        return svg_text

    pattern = re.compile(r"(<g\b[^>]*\bid=\"[^\"]+\"[^>]*?)(\stransform=\"[^\"]*\")?([^>]*>)", re.MULTILINE)

    def repl(match: re.Match[str]) -> str:
        before = match.group(1)
        after = match.group(3)
        return f'{before} transform="rotate({angle} 128 128)"{after}'

    updated, count = pattern.subn(repl, svg_text, count=1)
    if count != 1:
        raise SystemExit("Failed to find the root <g> element to rotate.")
    return updated


def build_direction_variant(svg_text: str, source_direction: str, target_direction: str) -> str:
    updated = svg_text.replace(source_direction, target_direction)
    return apply_rotation(updated, ANGLE_BY_DIRECTION[target_direction])


def main() -> int:
    parser = argparse.ArgumentParser(description="Derive all 8 SVG directions from a canonical source direction.")
    parser.add_argument("animation_root", help="Directory that contains per-direction subdirectories for one animation.")
    parser.add_argument("source_direction", help="Canonical direction directory to derive from, e.g. south.")
    args = parser.parse_args()

    animation_root = Path(args.animation_root)
    source_direction = args.source_direction
    source_dir = animation_root / source_direction
    if not source_dir.is_dir():
        raise SystemExit(f"Missing source directory: {source_dir}")

    source_files = find_svg_files(source_dir)
    if not source_files:
        raise SystemExit(f"No SVG files found in {source_dir}")

    for target_direction in ANGLE_BY_DIRECTION:
        target_dir = animation_root / target_direction
        target_dir.mkdir(parents=True, exist_ok=True)

        for source_path in source_files:
            target_path = target_dir / source_path.name
            if target_direction == source_direction:
                content = source_path.read_text(encoding="utf-8")
            else:
                content = build_direction_variant(
                    source_path.read_text(encoding="utf-8"),
                    source_direction=source_direction,
                    target_direction=target_direction,
                )
            target_path.write_text(content, encoding="utf-8")
            print(f"derived={target_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
