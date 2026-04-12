# Visual Direction

## Creative Intent

- Visual target: `realistic-tactical`.
- Core references: `SOCOM` and `Counter-Strike`.
- Camera format: top-down.
- The visual goal is not photorealism. The goal is readable tactical realism adapted to an overhead view.
- Functional clarity is allowed to take priority over strict realism.
- For the MVP, characters and weapons use a simplified, deterministic, vector-like visual language rather than detailed raster realism.

## Style Boundaries

- The project may use `pixel art` or another stylized rendering approach if it stays consistent across the whole game.
- The current preferred direction for the MVP is `minimal tactical SVG/vector-like sprites` rendered to PNG/spritesheets.
- This should feel intentional and readable, not cheap, cute, or placeholder-like.
- The game must avoid:
- childish presentation
- cartoon exaggeration
- mobile-game visual language
- anime styling
- sexualized character design
- The game is allowed to be dark or realistic in tone, but readability must remain strong.

## Readability First

- From the top-down camera, players must be able to quickly identify:
- equipped primary weapon class
- whether the player is holding a pistol, knife, or grenade
- broad armor or vest silhouette differences
- faction identity at a glance
- Exact real-world weapon model recognition is not a hard MVP requirement.
- In the MVP, it is enough that players can reliably distinguish broad categories such as `rifle`, `pistol`, `knife`, and later `utility`.

## Character Proportions

- Character proportions should still avoid chibi or arcade caricature.
- For the MVP, body construction is intentionally abstracted into simple tactical shapes that rotate cleanly around a stable pivot.
- Characters should feel grounded in tactical shooter fantasy, even if the body language is much more minimal than the final target.

## Faction Identity

- Capitalist faction visual fantasy:
- cleaner tactical military presentation
- disciplined gear profile
- stronger association with organized western-style military silhouettes
- Communist faction visual fantasy:
- rougher opposing-force silhouette
- more irregular or aggressive visual read where useful for gameplay clarity
- Visual identity should make the two sides easy to distinguish even from high-level camera framing.
- Visual differentiation should come from:
- body silhouette
- clothing shapes
- color grouping
- headgear
- stance and gear profile

## Weapon Identity

- Current visual reference direction:
- capitalist faction associated with `M4`
- communist faction associated with `AK-47`
- This is a visual identity direction, not yet a final gameplay balance rule.
- Existing gameplay notes currently say both teams start with mirrored weapons and accessories.
- That design conflict remains `TBD` and should be resolved explicitly later.
- For the MVP, weapon sprites should prioritize category readability and deterministic overlap with the player body over exact military detail.

## Environment Direction

- Initial target map themes:
- urban
- warm-toned urban combat spaces
- maps inspired by places like `Crossroads` or `Frostfire` in spirit
- Desired map atmosphere:
- grounded
- tactical
- harsh but readable
- Avoid overly clean esports-whitebox visuals in the final look.
- Avoid clutter that hides movement or makes visibility unreadable.

## Color And Palette Direction

- Global color temperature: `warm`.
- The palette should support:
- dusty streets
- sunlit concrete
- warm shadows
- military greens and browns
- muted urban surfaces
- Contrast should be controlled enough for competitive readability.
- Team readability should not rely only on red vs blue arcade coding.

## Camera And Visibility Presentation

- The game uses a top-down camera with strict visibility limits.
- Presentation of vision and occlusion should be `clean`, not overly theatrical.
- Darkened unseen areas should communicate information loss clearly without muddying the screen.
- Occlusion behind walls should be readable and consistent.
- The presentation should reinforce tactical information control, not just look cinematic.

## UI Direction

- UI target: `clean competitive`.
- Menus, HUD, minimap, and overlays should feel deliberate and serious.
- UI should not look like a military-themed mobile game.
- UI should favor:
- sharp hierarchy
- clean typography
- restrained decoration
- strong readability under pressure

## Effects Direction

- Effects should be `realistic` rather than exaggerated.
- Gunfire, impacts, smoke, and flash effects should support gameplay readability first.
- VFX should communicate weapon handling and state clearly without becoming noisy.

## Resolution Direction

- The project should target a modern level of on-screen definition.
- The MVP does not aim to prove detailed cosmetic skins yet.
- The immediate goal is clean silhouette readability, stable pivots, and deterministic layering.
- If more detailed cosmetic readability is pursued later, it should be layered on top of this stable base rather than replacing consistency with noisy detail.

## AI Asset Fit

- AI-generated art can be used as final production art if the result meets quality and consistency standards.
- The art direction must therefore be specific enough that AI-assisted generation can produce repeatable results where AI is used.
- For the MVP, character and weapon bases are primarily deterministic SVG assets, not prompt-only raster generations.

## Open Items

- Exact sprite size and base resolution.
- Exact palette values.
- Whether the post-MVP direction stays fully minimal/vector-like or evolves into a richer hybrid tactical 2D style.
- How far faction styling should go without making the two factions visually noisy or unreadable.
