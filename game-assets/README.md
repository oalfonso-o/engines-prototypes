# Game Assets

This folder stores approved runtime assets and their supporting specs and source metadata.

Structure:

- `specs/`: structured asset specs grouped by category.
- `source/generated/svg/raw/`: canonical SVG source for the current MVP character and weapon branch.
- `source/generated/svg/rendered/`: rendered PNG frames from the SVG branch.
- `source/generated/svg/sheets/`: spritesheets and JSON metadata from the SVG branch.
- `source/generated/`: other generated or intermediate outputs that are not part of the current runtime path.

Rule:

- Maps and code should reference stable ids.
- For the current MVP character and weapon branch, runtime assets are loaded from the deterministic SVG outputs under `source/generated/svg/rendered/` and `source/generated/svg/sheets/`.
- For the current MVP body pipeline, only the canonical `south` character direction is stored; the remaining facing directions are produced by runtime rotation in Godot.
