# Asset Production Rules

## Purpose

- This document defines how visual assets should be generated, reviewed, and normalized.
- The goal is to keep the current SVG-first gameplay asset pipeline consistent and readable.

## Production Principle

- The MVP character and weapon runtime assets are built through a deterministic SVG pipeline.
- Every accepted asset must pass style, gameplay readability, and consistency review.

## Asset Categories

- Character sprites
- weapon sprites
- equipment and utility icons
- environment tiles and props
- menu backgrounds
- UI illustrations
- promotional key art

## Acceptance Criteria

- The asset matches the realistic-tactical direction.
- The asset does not drift into cartoon, anime, mobile, or childish styling.
- The asset is readable from gameplay camera distance.
- The asset is consistent with faction, environment, and palette rules.
- The asset does not introduce accidental sexualization or tone drift.

## Character Sprite Rules

- Character sprites must preserve readable:
- stance
- facing direction
- held item category
- faction identity
- Body and gear detail should be simplified only as much as needed for gameplay readability.
- For the MVP, character bodies are intentionally minimal and built around a stable head-centered pivot and deterministic shape offsets.
- If generated character art cannot maintain consistency across directions or animations, it should be used as a paintover/reference source rather than directly shipped.
- Top-down character sprites are expected to support directional movement readability.
- The player should be able to tell whether a character is moving even when the runtime is rotating a canonical source sprite instead of swapping per-direction art.
- Directional animation is a real production requirement, not optional polish.
- For the current MVP branch, the canonical source direction is `south` and runtime rotation provides the remaining facing directions.

## Weapon Sprite Rules

- Weapon silhouettes must prioritize gameplay recognition.
- For the MVP, weapon sprites should be separate layers that overlap the body cleanly and rotate around the same gameplay pivot.
- We should bias toward strong shape language for:
- M4-family rifles
- AK-family rifles
- pistols
- shotguns
- sniper rifles
- knives
- grenades
- Cosmetic skins are allowed, but they must not break silhouette readability.

## Environment Rules

- Environment art must support line-of-sight clarity.
- Walls, doors, corners, windows, and blocking props must be easy to parse from the gameplay view.
- Decorative detail must not overwhelm route readability.
- Warm palette does not mean low contrast between navigable and blocked space.

## UI Art Rules

- UI art should remain clean and restrained.
- Background illustration can carry atmosphere.
- Interactive elements must stay crisp, contrast-safe, and readable at a glance.

## Current Gameplay Asset Workflow

- The approved branch for current gameplay-critical assets is the deterministic SVG branch.
- It should prioritize:
- stable pivots
- reusable geometry
- explicit offsets documented in specs
- scripted render/export to PNG and spritesheet data

## Consistency Strategy

- Maintain stable shape grammar across asset families.
- Maintain reference sheets for factions, weapons, and environments.
- Keep approved examples for:
- capitalist faction soldier
- communist faction fighter
- M4-family weapon
- AK-family weapon
- smoke grenade
- flashbang
- knife
- urban wall set
- urban floor set

## Review Checklist

- Can the player read it quickly from gameplay distance?
- Does it fit the realistic-tactical target?
- Does it match the rest of the asset set?
- Does it create any silhouette confusion with another item?
- Does it create unintended cultural or tonal problems?

## Open Items

- File naming and source metadata format.
- Post-MVP relationship between the SVG gameplay base and any richer visual overlays.
