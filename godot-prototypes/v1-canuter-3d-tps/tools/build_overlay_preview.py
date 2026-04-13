#!/usr/bin/env python3

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def main() -> int:
    parser = argparse.ArgumentParser(description="Overlay a top image onto a base image and save the result.")
    parser.add_argument("base_image", help="Base PNG image.")
    parser.add_argument("overlay_image", help="Overlay PNG image.")
    parser.add_argument("output_image", help="Target composited PNG image.")
    args = parser.parse_args()

    base_path = Path(args.base_image)
    overlay_path = Path(args.overlay_image)
    output_path = Path(args.output_image)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    base = Image.open(base_path).convert("RGBA")
    overlay = Image.open(overlay_path).convert("RGBA")
    if base.size != overlay.size:
        raise SystemExit(f"Image size mismatch: {base.size} vs {overlay.size}")

    composite = Image.alpha_composite(base, overlay)
    composite.save(output_path)
    print(f"composite={output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
