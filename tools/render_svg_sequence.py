#!/usr/bin/env python3

from __future__ import annotations

import argparse
from pathlib import Path

from cairosvg import svg2png


def find_svg_files(source_dir: Path) -> list[Path]:
    return sorted(path for path in source_dir.glob("*.svg") if path.is_file())


def main() -> int:
    parser = argparse.ArgumentParser(description="Render a sequence of SVG files to PNG.")
    parser.add_argument("source_dir", help="Directory containing SVG frames.")
    parser.add_argument("output_dir", help="Directory where PNG frames will be written.")
    parser.add_argument("--width", type=int, default=256, help="Output width in pixels.")
    parser.add_argument("--height", type=int, default=256, help="Output height in pixels.")
    args = parser.parse_args()

    source_dir = Path(args.source_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    svg_files = find_svg_files(source_dir)
    if not svg_files:
        raise SystemExit(f"No SVG files found in {source_dir}")

    for svg_path in svg_files:
        output_path = output_dir / f"{svg_path.stem}.png"
        svg2png(
            url=str(svg_path),
            write_to=str(output_path),
            output_width=args.width,
            output_height=args.height,
        )
        print(f"rendered={output_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
