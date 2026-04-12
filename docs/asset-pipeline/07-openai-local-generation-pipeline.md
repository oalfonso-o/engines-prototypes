# OpenAI Local Generation Pipeline

## Purpose

- The project should support a local terminal-first asset generation workflow.
- The intended flow is:
- asset spec
- prompt generation
- OpenAI image generation from Python
- manifest update
- Aseprite cleanup/export
- approved runtime asset

## Why This Approach

- It keeps the pipeline scriptable and repeatable.
- It avoids copy/paste workflows across browser tabs.
- It allows manifests, prompts, and generated outputs to stay linked.
- It works naturally from terminal, VS Code, or Codex-assisted workflows.

## Credential Rule

- Use `OPENAI_API_KEY` from the local environment.
- Do not hardcode API keys in scripts, specs, manifests, or committed files.
- Local scripts should rely on the official OpenAI Python SDK reading the environment variable.

## Pipeline Stages

1. Read a structured asset spec from `game-assets/specs/`.
2. Generate a prompt and manifest scaffold with `tools/asset_prompt_builder.py`.
3. Call OpenAI from a local Python script to generate one or more candidate images.
4. Save raw outputs under `game-assets/source/generated/images/raw/`.
5. Update or enrich the manifest with tool, model, output paths, and review notes.
6. Review the outputs against the art bible.
7. Normalize the selected result with Aseprite where sprite cleanup or packaging is needed.
8. Export the approved runtime asset into `game-assets/sprites/` or `game-assets/ui/`.

## API Usage Direction

- Use the OpenAI Python SDK from local scripts.
- Use the Responses API for prompt-building, structured text generation, or multi-step flows if useful.
- Use the Image API or image generation tool for actual image output, depending on the workflow shape.
- The pipeline should be able to run without leaving the terminal.

## Script Design Guidance

- Keep prompt generation separate from image generation.
- Keep image generation separate from Aseprite packaging.
- Keep manifests updated at each stage rather than reconstructing history later.

## Recommended Scripts

- `tools/asset_prompt_builder.py`: spec -> prompt + manifest scaffold
- `tools/generate_images.py`: prompt/spec -> raw generated images + manifest updates
- `tools/build_aseprite.py`: selected raw outputs -> normalized sprite export
- `Makefile`: convenient local commands for first-try generation runs

## Local Secret Handling

- Keep the local API key in `tools/.env`.
- Commit only `tools/.env.example`.
- `tools/.env` must stay ignored by git.

## Top-Down Character Note

- For character sprites, generation should not assume side-view animation.
- Our project target is top-down tactical gameplay with directional movement readability.
- Character generation and cleanup should therefore support visible movement for:
- up
- down
- left
- right
- diagonals
- Aseprite tagging/export should be designed around directional animation sets rather than side-view-only assumptions.

## Review Rule

- No OpenAI-generated image should go straight from raw output into runtime assets without review.
- Raw outputs belong under `game-assets/source/generated/`.
- Approved outputs belong under `game-assets/sprites/` or `game-assets/ui/`.
