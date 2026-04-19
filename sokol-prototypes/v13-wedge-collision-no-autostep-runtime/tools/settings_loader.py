from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REQUIRED_TOP_LEVEL_KEYS = (
    "contract",
    "preprocessing",
    "paths",
    "spawn",
    "app",
    "camera",
    "player",
    "materials",
    "render",
    "canonical",
    "collision",
)


@dataclass(frozen=True)
class SettingsBundle:
    root: dict[str, Any]

    @property
    def contract(self) -> dict[str, Any]:
        return self.root["contract"]

    @property
    def preprocessing(self) -> dict[str, Any]:
        return self.root["preprocessing"]

    @property
    def paths(self) -> dict[str, Any]:
        return self.root["paths"]

    @property
    def spawn(self) -> dict[str, Any]:
        return self.root["spawn"]

    @property
    def app(self) -> dict[str, Any]:
        return self.root["app"]

    @property
    def camera(self) -> dict[str, Any]:
        return self.root["camera"]

    @property
    def player(self) -> dict[str, Any]:
        return self.root["player"]

    @property
    def materials(self) -> dict[str, Any]:
        return self.root["materials"]

    @property
    def render(self) -> dict[str, Any]:
        return self.root["render"]

    @property
    def canonical(self) -> dict[str, Any]:
        return self.root["canonical"]

    @property
    def collision(self) -> dict[str, Any]:
        return self.root["collision"]


def load_settings(path: Path) -> SettingsBundle:
    payload = json.loads(path.read_text())
    if not isinstance(payload, dict):
        raise ValueError("settings root must be an object")
    for key in REQUIRED_TOP_LEVEL_KEYS:
        if key not in payload:
            raise ValueError(f"missing settings section: {key}")
    return SettingsBundle(root=payload)
