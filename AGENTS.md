# AGENTS

## Project Guidance

- The source of truth for the game we are building is under `docs/`.
- Before making product, gameplay, networking, UI, map, or technical decisions, review the relevant files in `docs/`.
- Start with `docs/README.md` for the document index.
- The Godot project itself lives under `godot/`.
- For gameplay/runtime behavior in the current prototype branch, use `docs/07-mvp-runtime-rules.md` as the implementation contract.

## Art Guidance

- Any visual work must respect the art bible in `docs/art-bible/`.
- Start with `docs/art-bible/README.md`.
- Follow the visual direction in `docs/art-bible/01-visual-direction.md`.
- Follow the asset production and consistency rules in `docs/art-bible/02-asset-production.md`.
- Follow the concrete MVP construction rules in `docs/art-bible/03-mvp-visual-rules.md`.
- Use `docs/asset-pipeline/` and `game-assets/specs/` when working on asset generation or asset metadata.
- The current MVP default for character and weapon gameplay assets is:
- structured spec
- deterministic SVG authoring
- scripted SVG -> PNG render
- scripted spritesheet/JSON export
- approved runtime use from the SVG branch outputs
- Character sprites are top-down, not side-view.
- For the current MVP body pipeline, keep only the canonical `south` source/render/sheet set and rely on runtime rotation for the remaining facing directions unless docs explicitly say otherwise.
- Keep pivots, offsets, body/weapon layering, HUD layout, minimap behavior, and fog-of-war presentation consistent with the documented MVP visual rules.

## Working Rule

- If a request conflicts with the documented game specs or the art bible, update the documentation first or explicitly call out the conflict before implementing changes.
- If runtime gameplay behavior changes in the MVP branch, update `docs/07-mvp-runtime-rules.md` in the same change unless the change is clearly experimental and temporary.

## Agent History Rule

- If the user asks to "guardar el historial del agent" in docs, write or update a file under `docs/agents-history/`.
- Use one file per day named with the current local date in ISO format, for example `docs/agents-history/2026-04-12.md`.
- Treat it as an upsert with append:
- create the file if it does not exist
- append a new timestamped entry if it already exists
- Each entry should contain enough information for a later agent to resume work without reconstructing context from scratch.
- Include at least:
- current objective
- relevant decisions taken
- files touched
- important runtime/documentation assumptions
- open issues or next steps
- Keep entries concise but operational.
