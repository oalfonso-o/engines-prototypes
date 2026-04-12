# AGENTS

## Project Guidance

- The source of truth for the game we are building is under `docs/`.
- Before making product, gameplay, networking, UI, map, or technical decisions, review the relevant files in `docs/`.
- Start with `docs/README.md` for the document index.
- The Godot project itself lives under `godot/`.

## Art Guidance

- Any visual work must respect the art bible in `docs/art-bible/`.
- Start with `docs/art-bible/README.md`.
- Follow the visual direction in `docs/art-bible/01-visual-direction.md`.
- Follow the asset production and consistency rules in `docs/art-bible/02-asset-production.md`.
- Use `docs/asset-pipeline/` and `game-assets/specs/` when working on asset generation or asset metadata.
- Sprite-oriented assets should follow the documented pipeline:
- structured spec
- prompt generation
- local scripted image generation
- manifest updates
- Aseprite cleanup/export
- approved runtime asset
- Character sprites are top-down, not side-view, and must support readable movement direction including diagonals.
- Never hardcode OpenAI API keys in the repository; use environment variables such as `OPENAI_API_KEY`.
- Local developer secrets belong in ignored files such as `tools/.env`; commit only templates like `tools/.env.example`.

## Working Rule

- If a request conflicts with the documented game specs or the art bible, update the documentation first or explicitly call out the conflict before implementing changes.
