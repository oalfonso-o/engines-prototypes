# Aseprite Integration Note

## Purpose

- Aseprite is an approved cleanup and packaging step for 2D sprite work.
- It should sit between AI generation and final in-game runtime assets whenever the source image needs normalization, slicing, or animation cleanup.

## Why Use It

- AI generation is good at concept and base-image creation.
- It is not reliable enough by itself for consistent production-ready sprite animation and packaging.
- Aseprite gives us a controlled place to:
- clean pixels
- unify framing
- align pivots
- adjust palette use
- split frames
- tag animations
- export spritesheets consistently

## Recommended Use Cases

- Character directions and animation frames.
- Weapon sprites that need cleanup or silhouette tightening.
- Prop cleanup after AI generation.
- Environment tiles that need framing consistency.
- Exporting final spritesheets and frame metadata.

## Workflow Position

1. Generate candidate art from prompt-driven specs.
2. Review against the art bible.
3. Bring the selected candidate into Aseprite if cleanup or packaging is needed.
4. Normalize:
- canvas size
- alignment
- palette discipline
- transparency edges
- silhouette clarity
5. Slice or organize frames.
6. Tag animation sequences where applicable.
7. Export the approved result to `game-assets/sprites/`.
8. Keep the production manifest linked to the final asset.

## Export Guidance

- Final runtime assets should export to stable engine-ready formats.
- For sprite animation, prefer:
- PNG spritesheet
- accompanying JSON metadata if useful
- stable frame naming
- consistent origin and framing rules

## Project Rule

- Aseprite is a production normalization tool, not the source of design direction.
- The art bible and asset specs still define what the asset should be.

## Practical Constraint

- Not every asset needs Aseprite.
- Backgrounds, menu illustrations, or large standalone images may bypass it if they are already final-quality and game-ready.
- Sprite-oriented assets should assume Aseprite cleanup unless there is a good reason not to.
