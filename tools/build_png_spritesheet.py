#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


def find_png_files(source_dir: Path) -> list[Path]:
    return sorted(path for path in source_dir.glob("*.png") if path.is_file())


def main() -> int:
    parser = argparse.ArgumentParser(description="Build a horizontal spritesheet and JSON metadata from PNG frames.")
    parser.add_argument("source_dir", help="Directory containing PNG frames.")
    parser.add_argument("output_png", help="Target spritesheet PNG path.")
    parser.add_argument("output_json", help="Target spritesheet JSON metadata path.")
    parser.add_argument("--fps", type=int, default=6, help="Suggested playback FPS.")
    parser.add_argument("--columns", type=int, help="Optional fixed number of columns. Defaults to one row.")
    args = parser.parse_args()

    source_dir = Path(args.source_dir)
    output_png = Path(args.output_png)
    output_json = Path(args.output_json)
    output_png.parent.mkdir(parents=True, exist_ok=True)
    output_json.parent.mkdir(parents=True, exist_ok=True)

    png_files = find_png_files(source_dir)
    if not png_files:
        raise SystemExit(f"No PNG files found in {source_dir}")

    images = [Image.open(path).convert("RGBA") for path in png_files]
    frame_width = images[0].width
    frame_height = images[0].height

    for image, path in zip(images, png_files, strict=True):
        if image.width != frame_width or image.height != frame_height:
            raise SystemExit(f"Frame size mismatch in {path}")

    columns = args.columns or len(images)
    rows = (len(images) + columns - 1) // columns
    sheet = Image.new("RGBA", (frame_width * columns, frame_height * rows), (0, 0, 0, 0))

    frames_meta = []
    for index, (image, path) in enumerate(zip(images, png_files, strict=True)):
        col = index % columns
        row = index // columns
        x = col * frame_width
        y = row * frame_height
        sheet.paste(image, (x, y))
        frames_meta.append(
            {
                "index": index,
                "file": path.name,
                "frame": {"x": x, "y": y, "w": frame_width, "h": frame_height},
            }
        )

    sheet.save(output_png)

    payload = {
        "meta": {
            "image": output_png.name,
            "frame_width": frame_width,
            "frame_height": frame_height,
            "frame_count": len(images),
            "columns": columns,
            "rows": rows,
            "fps": args.fps,
        },
        "frames": frames_meta,
    }
    output_json.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    print(f"sheet={output_png}")
    print(f"data={output_json}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
