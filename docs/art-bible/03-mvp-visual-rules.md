# MVP Visual Rules

## Purpose

- This document defines the concrete visual construction rules for the current MVP.
- It is not a mood board. It is an implementation-facing guide for keeping sprites, layering, HUD, and minimap consistent.

## Character Pivot Rule

- The canonical pivot for the player body is the exact center of the head.
- The head center must stay centered in the source canvas.
- Rotation in Godot must happen around that same head-centered pivot.
- The head should visually rotate in place, not orbit around the body.

## Body Geometry Rule

- The body is intentionally abstracted into a small number of deterministic shapes.
- The MVP body grammar is:
- head
- shoulders / torso block
- feet
- The body must remain readable under rotation without requiring redrawing per aim angle.

## Offset Rule

- Offsets that define body construction must be explicit and deterministic.
- Important offsets must be stored in the character spec rather than guessed in scene setup.
- The main required offset is:
- torso/shoulders center relative to head pivot
- Runtime hurtboxes and anchors should be derived from the same offsets used by the SVG source.

## Collision And Hurtbox Rule

- Movement collision is gameplay-driven and may be simpler than the full body silhouette.
- Hurtboxes should follow the same visual pivot and offsets as the sprite construction.
- For the MVP, the expected hurtbox split is:
- head shape
- torso/shoulder shape
- Runtime collision must not depend on ad-hoc visual offsets that are missing from the asset spec.

## Layering Rule

- Character body and weapon are separate visual layers.
- The body layer defines the main character presence.
- The weapon layer is rendered on top and rotates around the same gameplay pivot.
- Weapons must not be baked into the body sprite for the MVP.
- The current visual stack is:
- body base
- weapon layer
- UI/crosshair rendered separately in screen space

## Weapon Anchor Rule

- Weapons should overlap the body from a deterministic anchor region near the upper torso / chest area.
- Weapon placement should be solved in the asset geometry first whenever reasonable.
- Scene-level offsets are allowed only as a small final adjustment, not as the main source of truth.
- Rifle, pistol, and knife should all read as right-handed/default-handed consistently unless a later feature changes that on purpose.

## Animation Rule

- Body animation should remain simple and deterministic.
- `idle` and `move` must remain clearly distinct at gameplay scale.
- Movement readability should come mainly from feet motion and overall silhouette rhythm, not from noisy detail.
- The MVP target is readability first, not anatomical realism.
- The current canonical source direction is `south`.
- The runtime rotates that canonical source instead of relying on separate SVG direction sets.
- The repo should keep only the canonical `south` body source/render/sheet set unless a documented gameplay or art requirement justifies authored per-direction assets.

## Runtime Asset Rule

- The canonical runtime outputs for the MVP are:
- `game-assets/source/generated/svg/rendered/`
- `game-assets/source/generated/svg/sheets/`
- The canonical editable sources for this branch are under:
- `game-assets/source/generated/svg/raw/`

## HUD Rule

- The HUD is screen-space UI, not world-space debug text.
- Core MVP HUD zones:
- bottom-left: player health
- bottom-right: weapon/ammo state
- top-right: minimap
- upper-right lane: kill feed
- center or near-center: round result / winner message when the round closes
- HUD should stay restrained, high-contrast, and readable under pressure.
- HUD should favor text and simple shapes over decorative art noise.

## Kill Feed Rule

- The kill feed should follow a classic tactical-shooter read order:
- killer name
- weapon icon
- victim name
- Capitalist entries should use blue as the team-identifying color.
- Communist entries should use red as the team-identifying color.
- The feed should stay visually compact and should not fight the minimap for attention.

## Weapon Slot UI Rule

- Weapon slots should communicate currently selected category clearly.
- The target MVP slot set is:
- `1` rifle
- `2` pistol
- `3` knife
- `4` utility placeholder
- `5` bomb
- The selected slot should be visually emphasized without clutter.
- The current runtime branch may temporarily expose only a subset of those slots while implementation catches up.

## Minimap Rule

- The minimap is a screen-space tactical aid, not a fully omniscient map.
- It should show orientation markers clearly.
- The player marker stays centered.
- Enemy markers should only appear if the enemy is currently validly visible to the player.
- The minimap should reuse gameplay visibility rules instead of inventing a separate arcade visibility model.

## Fog Of War Rule

- The game has three visual knowledge states:
- currently visible
- explored but not currently visible
- unexplored
- Unexplored space must not reveal meaningful map information.
- Explored but not visible space may preserve map knowledge, but should not reveal live enemy positions.

## Consistency Rule

- New visual work should not introduce a second competing construction logic.
- If a sprite, HUD element, or minimap behavior needs a new rule, document it here or in the relevant art-bible document before scaling it across the project.
