#!/usr/bin/env python3

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def find_png_files(source_dir: Path) -> list[Path]:
    return sorted(path for path in source_dir.glob("*.png") if path.is_file())


def main() -> int:
    parser = argparse.ArgumentParser(description="Build an animated GIF preview from rendered PNG frames.")
    parser.add_argument("source_dir", help="Directory containing PNG frames.")
    parser.add_argument("output_gif", help="Target animated GIF path.")
    parser.add_argument("--duration", type=int, default=180, help="Frame duration in milliseconds.")
    parser.add_argument("--loop", type=int, default=0, help="GIF loop count. 0 means infinite.")
    parser.add_argument("--scale", type=int, default=2, help="Integer upscale factor for easier review.")
    args = parser.parse_args()

    source_dir = Path(args.source_dir)
    output_gif = Path(args.output_gif)
    output_gif.parent.mkdir(parents=True, exist_ok=True)

    png_files = find_png_files(source_dir)
    if not png_files:
        raise SystemExit(f"No PNG files found in {source_dir}")

    frames = []
    for png_path in png_files:
        image = Image.open(png_path).convert("RGBA")
        if args.scale > 1:
            image = image.resize(
                (image.width * args.scale, image.height * args.scale),
                resample=Image.Resampling.NEAREST,
            )
        frames.append(image)

    first, *rest = frames
    first.save(
        output_gif,
        save_all=True,
        append_images=rest,
        duration=args.duration,
        loop=args.loop,
        disposal=2,
    )
    print(f"preview={output_gif}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
