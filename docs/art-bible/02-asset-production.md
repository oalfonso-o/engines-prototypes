# Asset Production Rules

## Purpose

- This document defines how visual assets should be generated, reviewed, and normalized.
- The goal is to keep AI-assisted production usable for a real game instead of accumulating inconsistent one-off images.

## Production Principle

- AI generation is allowed to produce final assets.
- AI output is not automatically accepted.
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
- If generated character art cannot maintain consistency across directions or animations, it should be used as a paintover/reference source rather than directly shipped.
- Top-down character sprites are expected to support directional movement readability.
- The player should be able to tell whether a character is moving:
- up
- down
- left
- right
- diagonally
- Directional animation is a real production requirement, not optional polish.
- The exact directional set may start smaller in prototypes, but the target visual language should support diagonals cleanly.

## Weapon Sprite Rules

- Weapon silhouettes must prioritize gameplay recognition.
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

## AI Workflow

- Start from text prompts using an approved style vocabulary.
- Iterate until the image is close to target direction.
- Use cleanup and packaging steps after generation rather than assuming the first AI output is game-ready.
- Normalize the result for in-game use:
- crop
- clean up
- re-light if needed
- palette-correct if needed
- scale and frame consistently
- convert into final engine-ready asset format
- For sprite-oriented work, Aseprite is an approved cleanup and spritesheet packaging step.

## Prompting Guidance

- Prompts should describe:
- role of the asset
- camera angle
- material language
- realism level
- palette intent
- silhouette intent
- forbidden traits
- Prompts should explicitly exclude:
- cartoon
- anime
- mobile-game UI style
- childish proportions
- sexualized designs

## Consistency Strategy

- Reuse stable prompt structures across asset families.
- Maintain reference sheets for factions, weapons, and environments.
- Keep approved examples for:
- good faction soldier
- bad faction fighter
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

- Approved generation tools for image production.
- File naming and source manifest format.
- Whether we store raw prompts inside the repo or in `no-commit/`.
- Animation workflow for AI-derived sprites.

## Required References

- Follow `docs/asset-pipeline/05-aseprite-integration-note.md` for sprite cleanup and export.
- Follow `docs/asset-pipeline/06-asset-manifest-policy.md` for mandatory metadata and traceability.
- Follow `docs/asset-pipeline/07-openai-local-generation-pipeline.md` for local scripted image generation and packaging flow.
