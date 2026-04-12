# Prompt Generator Spec v0

## Goal

- Prompts should be built from a controlled vocabulary, not improvised each time.
- The generator exists to keep asset generation aligned with the art bible.

## Input

- A JSON asset spec with fields such as:
- `category`
- `theme`
- `subject`
- `materials`
- `palette`
- `camera`
- `style`
- `readability`
- `forbidden_traits`
- Asset specs should live under category folders such as:
- `game-assets/specs/characters/`
- `game-assets/specs/weapons/`
- `game-assets/specs/props/`
- `game-assets/specs/environment/`

## Output

- Stable `asset_id`
- positive prompt
- negative prompt
- production manifest scaffold
- recommended destination paths

## Prompt Structure

- Base project style clause
- category clause
- subject clause
- material clause
- readability clause
- palette clause
- framing/background clause
- forbidden traits clause

## Example Prompt Skeleton

```txt
top-down tactical shooter [category] sprite, realistic-tactical style, warm urban palette,
clean readable silhouette, grounded materials, consistent with SOCOM and Counter-Strike inspired
overhead combat, [subject], [materials], [readability clause], transparent background
```

## Example Negative Prompt Skeleton

```txt
cartoon, anime, childish, mobile game style, sexualized, exaggerated proportions,
cute, toy-like, glossy fantasy, low readability
```

## Script Responsibility

- Validate required fields.
- Normalize ids and filenames.
- Apply project defaults from the art bible.
- Merge explicit forbidden traits with default forbidden traits.
- Write prompt and manifest files to predictable locations.

## v0 Constraint

- The first script can be simple and file-based.
- It does not need to call an image API yet.
- Its job is consistency, not generation transport.
