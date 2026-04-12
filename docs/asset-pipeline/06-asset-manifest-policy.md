# Asset Manifest Policy

## Rule

- Every AI-assisted asset that is accepted for project use must have a manifest.
- This applies even if the asset is only an approved prototype placeholder.

## Purpose

- Preserve traceability.
- Make Steam/legal disclosure easier later.
- Keep asset generation reproducible.
- Avoid losing the origin and intent of assets after they enter the repo.

## Mandatory Cases

- Final approved runtime asset.
- Approved placeholder asset used in gameplay.
- AI-generated concept that becomes the basis for manual cleanup.
- AI-generated source used to build a spritesheet or derived asset.

## Required Manifest Fields

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

## Recommended Extra Fields

- `approved_by`
- `review_date`
- `source_asset_paths`
- `final_asset_paths`
- `license_notes`
- `theme`
- `category`

## Status Rules

- `draft`: generated or in review, not yet accepted as stable.
- `approved`: accepted for project use.
- `deprecated`: no longer active, retained for history.

## Repository Policy

- Manifests for approved assets belong in version control.
- Prompts tied to approved assets belong in version control.
- Large failed generations do not need to be versioned, but the approved asset must still keep enough traceability.

## Design Rule

- No runtime asset should appear in `game-assets/sprites/` or `game-assets/ui/` without a matching manifest.

## Relationship To Registries

- Registries describe how the game uses an asset.
- Manifests describe how the asset was created and approved.
- These concerns must stay separate.
