#!/usr/bin/env python3

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
TOOLS_DIR = REPO_ROOT / "tools"
GAME_ASSETS_DIR = REPO_ROOT / "game-assets"
SOURCE_DIR = GAME_ASSETS_DIR / "source"


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")


def load_env_file(env_path: Path | None = None) -> None:
    path = env_path or (TOOLS_DIR / ".env")
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def load_json(path: Path) -> dict | list:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def prompt_file_paths(asset_id: str) -> tuple[Path, Path, Path]:
    prompts_dir = SOURCE_DIR / "prompts" / "generated"
    return (
        prompts_dir / f"{asset_id}.prompt.txt",
        prompts_dir / f"{asset_id}.plan.json",
        SOURCE_DIR / "manifests" / f"{asset_id}.json",
    )


def parse_prompt_file(path: Path) -> tuple[str, str]:
    content = path.read_text(encoding="utf-8").strip()
    marker = "\n\nNegative prompt:\n"
    if marker not in content:
        return content, ""
    prompt, negative = content.split(marker, 1)
    return prompt.strip(), negative.strip()


def merge_unique(existing: list[dict], new_item: dict, key: str = "path") -> list[dict]:
    merged = [item for item in existing if item.get(key) != new_item.get(key)]
    merged.append(new_item)
    return merged
