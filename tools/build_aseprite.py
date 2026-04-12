#!/usr/bin/env python3

from __future__ import annotations

import argparse
import shutil
import subprocess
from pathlib import Path

from asset_prompt_builder import build_asset_id, load_spec
from pipeline_common import GAME_ASSETS_DIR, SOURCE_DIR, load_json, merge_unique, write_json


RAW_IMAGE_ROOT = SOURCE_DIR / "generated" / "images" / "raw"
SELECTED_IMAGE_ROOT = SOURCE_DIR / "generated" / "images" / "selected"


def find_png_files(directory: Path) -> list[Path]:
    return sorted(path for path in directory.glob("*.png") if path.is_file())


def update_manifest(manifest_path: Path, export_record: dict) -> None:
    manifest = load_json(manifest_path)
    if not isinstance(manifest, dict):
        raise SystemExit(f"Expected manifest object: {manifest_path}")
    manifest.setdefault("aseprite_exports", [])
    manifest["aseprite_exports"] = merge_unique(manifest["aseprite_exports"], export_record)
    write_json(manifest_path, manifest)


def main() -> int:
    parser = argparse.ArgumentParser(description="Build an Aseprite spritesheet export from generated PNG frames.")
    parser.add_argument("spec", help="Path to the asset spec JSON file.")
    parser.add_argument("--animation", required=True, help="Animation name to export.")
    parser.add_argument("--direction", required=True, help="Direction name to export.")
    parser.add_argument("--input-dir", help="Override source directory.")
    parser.add_argument("--output-dir", help="Override export directory.")
    parser.add_argument("--sheet-type", default="rows", help="Aseprite sheet type.")
    parser.add_argument("--dry-run", action="store_true", help="Print the resolved command without running it.")
    args = parser.parse_args()

    spec = load_spec(Path(args.spec))
    asset_id = build_asset_id(spec)
    manifest_path = SOURCE_DIR / "manifests" / f"{asset_id}.json"

    source_dir = Path(args.input_dir) if args.input_dir else RAW_IMAGE_ROOT / asset_id / args.animation / args.direction
    output_dir = Path(args.output_dir) if args.output_dir else SELECTED_IMAGE_ROOT / asset_id / args.animation / args.direction

    output_dir.mkdir(parents=True, exist_ok=True)
    sheet_path = output_dir / f"{asset_id}_{args.animation}_{args.direction}.png"
    data_path = output_dir / f"{asset_id}_{args.animation}_{args.direction}.json"
    png_files = find_png_files(source_dir)

    command = [
        "aseprite",
        "-b",
        *[str(path) for path in png_files],
        "--sheet",
        str(sheet_path),
        "--data",
        str(data_path),
        "--format",
        "json-array",
        "--sheet-type",
        args.sheet_type,
        "--filename-format",
        "{title}",
    ]

    if args.dry_run:
        print(" ".join(command))
        return 0

    if not png_files:
        raise SystemExit(f"No PNG files found in {source_dir}")

    if shutil.which("aseprite") is None:
        raise SystemExit("Aseprite CLI is not installed or not in PATH.")

    subprocess.run(command, check=True)
    export_record = {
        "path": str(sheet_path.relative_to(GAME_ASSETS_DIR.parent)).replace("\\", "/"),
        "data_path": str(data_path.relative_to(GAME_ASSETS_DIR.parent)).replace("\\", "/"),
        "animation": args.animation,
        "direction": args.direction,
        "sheet_type": args.sheet_type,
    }
    update_manifest(manifest_path, export_record)
    print(f"sheet={sheet_path}")
    print(f"data={data_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
