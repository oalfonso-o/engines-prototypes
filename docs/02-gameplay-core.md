# Gameplay Core

## Match Structure

- Default mode at the start of development: `5v5`.
- Initial match structure: `10` scheduled rounds total.
- Round duration: `2 minutes`.
- Side switch after `5` rounds.
- Each team plays `5` rounds on each side of the map.
- A round is won by eliminating the entire opposing team.
- If the round timer expires, the round ends in a draw.
- If the match reaches `5-5`, it is resolved with a tiebreaker round:
- knife-only combat
- every player also receives `1 smoke` and `1 flashbang`
- no other weapons in the tiebreaker round

## Death And Spectating

- On death, the local player should see a fadeout.
- After the fadeout, the camera should switch to another alive teammate.
- The exact teammate selection rule is still `TBD`.

## Factions

- Two factions:
- `Good side`: NATO-aligned military force.
- `Bad side`: terrorists.
- The exact presentation is still `TBD`.
- For the military side, we may use something abstract instead of a real country-linked unit.
- For the terrorist side, real-world identity and national/ethnic framing are not decided and should be handled carefully.
- Current reference is "Counter-Strike style" opposing teams, not a final lore commitment.

## Equipment Model

- At launch, both teams will use the same weapons and the same attachments/accessories.
- Equipment slots:
- Primary weapon: one of `SMG`, `shotgun`, `rifle`, `sniper`.
- Secondary weapon: `pistol`.
- Melee weapon: `knife`.
- Utility: `frag grenade`, `flashbang`, `smoke grenade`.

## Health And Damage

- Player health: `100`.
- Weapons deal fixed damage.
- No headshots.
- Frag grenades:
- Damage falls off by distance.
- Damage only applies with direct line of sight.
- Walls block explosion damage.
- Flashbangs:
- Blindness strength depends on distance.
- Blindness also depends on direct line of sight.
- Walls block flash effect.
- Smoke grenades:
- Smoke blocks vision but does not block movement.
- The central `50%` of the smoke area should provide full visual denial.
- From that `50%` outward, visibility should gradually recover.
- Outside the smoke area, visibility returns to `100%`.

## Minimap

- The game should include a minimap.
- The minimap must show allies.
- The minimap must show enemies only when they are inside the player's current valid vision state.

## Controls

- Movement: `WASD`.
- Aim: mouse position.
- Primary slot: `1`.
- Secondary slot: `2`.
- Knife: `3`.
- Grenade: `4`.
- Previous weapon: `Q`.
- Reload: `R`.
- Flashbang: `F`.
- Smoke: `C`.
- Fire: left mouse click.
- Secondary weapon action: right mouse click.
- Example: sniper zoom.
- Jump: `Space`.
- Jump has no finalized gameplay purpose yet, but it is part of the current control plan.

## MVP Constraints

- The long-term design includes multiple weapons and utility slots.
- The first playable MVP does not include the full equipment model yet.
- See `06-mvp-offline-prototype.md` for the explicitly reduced initial scope.

## Input Rebinding

- All player gameplay inputs must be rebindable in local player settings.

## Camera

- Camera style: top-down, fixed orientation, similar in broad framing to `GTA 2`.
- The camera does not rotate for now.
- The controlled player stays centered on screen.

## Vision Model

- Vision is not full top-down omniscience.
- The player aims with the mouse.
- The visible forward area should be constrained to the `180` degrees in front of the character.
- The player should not gain free information from the overhead perspective about what is behind or to the far sides of the character.
- If the player is aiming at a wall, they should effectively see only what they could reasonably perceive in that direction.
- Areas outside the valid forward vision should be darkened.
- Areas blocked by walls should also be darkened.
- Enemies behind walls must not be visible.

## Occlusion

- Wall blocking should be implemented through line-of-sight checks and occlusion logic.
- This is conceptually similar to "ray tracing" from a design perspective, but the practical implementation will likely use raycasts or visibility sampling rather than hardware ray tracing.
