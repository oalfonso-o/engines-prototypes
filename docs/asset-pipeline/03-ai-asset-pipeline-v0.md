# AI Asset Pipeline v0

## Goal

- Keep AI-generated assets consistent, reviewable, and traceable.
- Avoid a workflow where random prompts create one-off art that does not fit the project.

## Core Principle

- Approved game assets must be backed by metadata.
- We need to know what the asset is, how it was generated, why it was approved, and how the game uses it.

## Folder Roles

- `game-assets/sprites/`: approved runtime assets used by the game.
- `game-assets/ui/`: approved UI assets used by the game.
- `game-assets/specs/`: canonical structured asset specs grouped by category.
- `game-assets/source/prompts/generated/`: generated prompt output files.
- `game-assets/source/generated/`: raw or intermediate AI outputs that are not final runtime assets.
- `game-assets/source/manifests/`: asset production manifests.
- `game-assets/source/references/`: approved visual reference sheets.

## Two Metadata Layers

### Production Metadata

- Tracks how the asset was created.
- Required fields:
- `asset_id`
- `version`
- `source_type`
- `tool`
- `model`
- `prompt_file`
- `negative_prompt`
- `seed`
- `reference_images`
- `created_at`
- `author`
- `status`
- `notes`

### Runtime Metadata

- Tracks how the game uses the asset.
- Stored primarily in registries.
- Required fields vary by asset type.

## Approval States

- `draft`
- `approved`
- `deprecated`

## Suggested Workflow

1. Write or generate an asset spec JSON.
2. Build a prompt from the spec using the prompt generator.
3. Generate several candidate images with the chosen AI tool.
4. Review against the art bible.
5. Clean up, crop, normalize, and export the approved asset.
6. Save the final asset under `game-assets/sprites/` or `game-assets/ui/`.
7. Save the production manifest under `game-assets/source/manifests/`.
8. Link the asset into the relevant registry.

## What Goes In Git

- Approved runtime assets.
- Registries.
- Canonical prompt specs.
- Generated prompts that correspond to approved assets.
- Production manifests.
- Small reference sheets if they are important to consistency.

## What Does Not Need To Go In Git

- Large batches of rejected experiments.
- Temporary upscales.
- Work-in-progress exports.
- Prompt noise that is not tied to an approved asset.

## Review Checklist

- Fits the realistic-tactical direction.
- Reads correctly from gameplay distance.
- Matches faction and environment rules.
- Does not drift into forbidden styles.
- Has a manifest.
- Has a stable id.
