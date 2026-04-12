# SVG Validation Preview

## Purpose

- SVG character bases need a lightweight validation loop before they are integrated into Godot.
- The first validation step should be:
- render SVG frames to PNG
- build an animated preview
- review motion, silhouette, and readability
- The current MVP branch validates and stores the canonical `south` source set only, because runtime rotation handles the remaining facing directions.

## Validation Stages

1. Static SVG review in the editor.
2. Rasterized PNG review at target gameplay size.
3. Animated GIF preview for motion readability.
4. In-engine validation inside Godot after the silhouette passes the first three checks.

## Scripts

- `tools/render_svg_sequence.py`: render a directory of SVG frames to PNG
- `tools/build_svg_preview.py`: turn rendered PNG frames into an animated GIF
- `tools/build_png_spritesheet.py`: pack rendered PNG frames into a spritesheet plus JSON metadata

## Canonical Direction Rule

- Character body animation sources are kept only for the canonical `south` direction in the current MVP branch.
- The runtime rotates that canonical body set instead of maintaining duplicated SVG, PNG, and sheet outputs for every compass direction.
- If we later need authored direction-specific motion, that should be added intentionally rather than reintroducing generated duplicates by default.

## Output Types

- Animated GIF preview for motion review.
- PNG spritesheet plus JSON metadata for game-facing validation.

## Current Review Questions

- Does `idle` read clearly at gameplay size?
- Does `move` feel distinct from `idle`?
- Are the feet doing enough work to sell motion?
- Is the direction still readable after scaling down?
- Does the silhouette remain consistent across frames?
