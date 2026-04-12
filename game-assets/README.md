# Game Assets

This folder stores approved runtime assets and their supporting registries and source metadata.

Structure:

- `registries/`: theme, tile, and entity registries used at runtime.
- `specs/`: structured asset specs grouped by category.
- `sprites/`: approved in-game sprites.
- `ui/`: approved interface assets.
- `source/prompts/generated/`: generated prompts tied to asset ids.
- `source/generated/`: raw or intermediate AI outputs, separated from approved runtime assets.
- `source/manifests/`: production metadata for approved or draft assets.
- `source/references/`: style references used to maintain consistency.

Rule:

- Maps and code should reference stable ids.
- Registries resolve ids to concrete asset files and behavior.
- Approved runtime assets live under `sprites/` and `ui/`, not under `source/generated/`.
