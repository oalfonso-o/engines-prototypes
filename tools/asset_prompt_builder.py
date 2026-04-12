#!/usr/bin/env python3

from __future__ import annotations

import argparse
from datetime import date
from pathlib import Path

from pipeline_common import load_json, slugify, write_json

DEFAULT_NEGATIVE = [
    "cartoon",
    "anime",
    "childish",
    "mobile game style",
    "sexualized",
    "exaggerated proportions",
    "cute",
    "toy-like",
    "glossy fantasy",
    "low readability",
]


def load_spec(path: Path) -> dict:
    payload = load_json(path)
    if not isinstance(payload, dict):
        raise SystemExit(f"Expected an object in spec file: {path}")
    return payload


def build_asset_id(spec: dict) -> str:
    explicit_id = spec.get("asset_id")
    if explicit_id:
        return explicit_id
    category = slugify(spec["category"])
    subject = slugify(spec["subject"])
    theme = slugify(spec.get("theme", "default"))
    return f"{category}_{subject}_{theme}_01"


def build_prompt(spec: dict) -> str:
    category = spec["category"]
    style = spec.get("style", "realistic_tactical").replace("_", "-")
    palette = spec.get("palette", "warm urban")
    subject = spec.get("base_description", spec["subject"])
    materials = ", ".join(spec.get("materials", []))
    readability = spec.get("readability", "high")
    camera = spec.get("camera", "top_down").replace("_", "-")
    background = "transparent background" if spec.get("transparent_background", True) else "neutral background"
    faction = spec.get("faction")
    equipment = ", ".join(spec.get("equipment", []))
    silhouette = spec.get("silhouette", "clear faction silhouette and readable held weapon")

    parts = [
        f"{camera} tactical shooter {category} sprite",
        f"{style} style",
        f"{palette} palette",
        "clean readable silhouette",
        "grounded materials",
        "consistent with SOCOM and Counter-Strike inspired overhead combat",
        subject,
    ]

    if faction:
        parts.append(f"{faction} faction identity")

    if materials:
        parts.append(materials)

    if equipment:
        parts.append(equipment)

    parts.append(silhouette)
    parts.append(f"{readability} readability from gameplay distance")
    parts.append(background)
    return ", ".join(parts)


def build_negative_prompt(spec: dict) -> str:
    forbidden = spec.get("forbidden_traits", [])
    merged = []
    for trait in DEFAULT_NEGATIVE + forbidden:
        if trait not in merged:
            merged.append(trait)
    return ", ".join(merged)


def build_direction_clause(direction: str) -> str:
    direction_map = {
        "north": "top-down view, facing and moving north, back mostly visible",
        "northeast": "top-down view, facing and moving northeast, readable up-right diagonal stride",
        "east": "top-down view, facing and moving east, readable rightward motion",
        "southeast": "top-down view, facing and moving southeast, readable down-right diagonal stride",
        "south": "top-down view, facing and moving south, front torso more visible",
        "southwest": "top-down view, facing and moving southwest, readable down-left diagonal stride",
        "west": "top-down view, facing and moving west, readable leftward motion",
        "northwest": "top-down view, facing and moving northwest, readable up-left diagonal stride",
    }
    return direction_map.get(direction, f"top-down view, readable {direction} movement direction")


def build_animation_clause(name: str, definition: dict, frame_index: int) -> str:
    frames = int(definition.get("frames", 1))
    description = definition.get("description")
    if description:
        return f"{name} animation, {description}, frame {frame_index + 1} of {frames}"
    return f"{name} animation, frame {frame_index + 1} of {frames}"


def build_prompt_plan(asset_id: str, spec: dict, base_prompt: str) -> list[dict]:
    animation_plan = spec.get("animation_plan", {})
    directions = animation_plan.get("directions", [])
    animations = animation_plan.get("animations", {})
    if not directions or not animations:
        return []

    prompt_items: list[dict] = []
    for animation_name, definition in animations.items():
        frames = int(definition.get("frames", 1))
        for direction in directions:
            direction_slug = slugify(direction)
            for frame_index in range(frames):
                prompt_items.append(
                    {
                        "asset_id": asset_id,
                        "animation": animation_name,
                        "direction": direction_slug,
                        "frame_index": frame_index,
                        "filename": f"{animation_name}/{direction_slug}/frame_{frame_index:03d}.png",
                        "prompt": ", ".join(
                            [
                                base_prompt,
                                build_direction_clause(direction_slug),
                                build_animation_clause(animation_name, definition, frame_index),
                                "same character design as previous frames",
                                "no background elements",
                                "transparent background",
                            ]
                        ),
                    }
                )
    return prompt_items


def build_manifest(asset_id: str, spec_path: Path, prompt_path: Path, plan_path: Path, negative_prompt: str) -> dict:
    return {
        "asset_id": asset_id,
        "version": 1,
        "source_type": "ai_generated",
        "tool": "tbd",
        "model": "tbd",
        "spec_file": str(spec_path).replace("\\", "/"),
        "prompt_file": str(prompt_path).replace("\\", "/"),
        "prompt_plan_file": str(plan_path).replace("\\", "/"),
        "negative_prompt": negative_prompt,
        "seed": None,
        "reference_images": [],
        "created_at": str(date.today()),
        "author": "tbd",
        "status": "draft",
        "generated_outputs": [],
        "aseprite_exports": [],
        "notes": "Generated by tools/asset_prompt_builder.py",
    }


def merge_manifest(existing: dict | None, generated: dict) -> dict:
    if not existing:
        return generated

    merged = dict(existing)
    for key, value in generated.items():
        if key in {"generated_outputs", "aseprite_exports"}:
            merged[key] = existing.get(key, value)
        elif key in {"tool", "model", "author", "status", "notes"}:
            merged[key] = existing.get(key, value)
        else:
            merged[key] = value
    return merged


def main() -> int:
    parser = argparse.ArgumentParser(description="Build a consistent asset prompt and manifest from a JSON spec.")
    parser.add_argument("spec", help="Path to the asset spec JSON file.")
    parser.add_argument(
        "--output-root",
        default="game-assets/source",
        help="Base output folder for prompts and manifests.",
    )
    args = parser.parse_args()

    spec_path = Path(args.spec)
    output_root = Path(args.output_root)
    prompts_dir = output_root / "prompts" / "generated"
    manifests_dir = output_root / "manifests"
    prompts_dir.mkdir(parents=True, exist_ok=True)
    manifests_dir.mkdir(parents=True, exist_ok=True)

    spec = load_spec(spec_path)
    for required_key in ("category", "subject"):
        if required_key not in spec:
            raise SystemExit(f"Missing required field: {required_key}")

    asset_id = build_asset_id(spec)
    prompt = build_prompt(spec)
    negative_prompt = build_negative_prompt(spec)

    prompt_path = prompts_dir / f"{asset_id}.prompt.txt"
    plan_path = prompts_dir / f"{asset_id}.plan.json"
    manifest_path = manifests_dir / f"{asset_id}.json"

    prompt_path.write_text(
        f"{prompt}\n\nNegative prompt:\n{negative_prompt}\n",
        encoding="utf-8",
    )
    prompt_plan = build_prompt_plan(asset_id, spec, prompt)
    write_json(plan_path, prompt_plan)
    existing_manifest = None
    if manifest_path.exists():
        existing_payload = load_json(manifest_path)
        if isinstance(existing_payload, dict):
            existing_manifest = existing_payload
    manifest = merge_manifest(
        existing_manifest,
        build_manifest(asset_id, spec_path, prompt_path, plan_path, negative_prompt),
    )
    write_json(manifest_path, manifest)

    print(f"asset_id={asset_id}")
    print(f"prompt={prompt_path}")
    print(f"plan={plan_path}")
    print(f"manifest={manifest_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
