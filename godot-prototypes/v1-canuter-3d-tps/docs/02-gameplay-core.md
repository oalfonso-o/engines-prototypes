# Gameplay Core

## Match Structure

- Default mode at the start of development: `5v5`.
- The default mode, and the only planned mode for now, is a bomb-run objective mode.
- Initial match structure: `10` scheduled rounds total.
- Round duration: `2 minutes`.
- Side switch after `5` rounds.
- Each team plays `5` rounds on each side of the map.
- Each map has two faction bases placed on opposite sides of the map:
- one `Capitalist` base
- one `Communist` base
- Each base has `5` fixed spawn positions.
- At the start of each round, each player is assigned randomly to one of that faction's spawn positions.
- Each faction plants the bomb only in the enemy base, never in its own base.
- A shared bomb spawns in the map center or equivalent contested mid-map location.
- The bomb can be picked up, carried, dropped, equipped, planted, and defused.
- The round objective is not elimination-only.
- The primary objective flow is:
- take control of the central bomb
- carry it to the enemy base
- plant it there
- defend it until detonation
- Planting the bomb starts a `5` second channel.
- Once planted, the bomb explodes after `30` seconds unless defused.
- Defusing the bomb also requires a `5` second channel.
- Planting and defusing both require holding the action key and remaining stationary.
- If the player moves, the channel is interrupted and must be restarted from the beginning.
- A successful bomb detonation wins the round for the planting team.
- When the bomb explodes, players close enough to the blast die.
- A planted bomb may be defused by the defending team.
- After the bomb explodes, a winner message is shown first and the round ends `5` seconds later.
- If the round timer expires, the round ends in a draw.
- Additional round-resolution edge cases around full team wipes before detonation are still `TBD` for the design layer and should be resolved explicitly before multiplayer production.
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
- `Capitalists`: the good side.
- `Communists`: the bad side.
- These names should be used in English throughout design and implementation-facing docs unless a later rebrand changes them intentionally.

## Equipment Model

- At launch, both teams will use the same weapons and the same attachments/accessories.
- Equipment slots:
- Primary weapon: one of `SMG`, `shotgun`, `rifle`, `sniper`.
- Secondary weapon: `pistol`.
- Melee weapon: `knife`.
- Utility: `frag grenade`, `flashbang`, `smoke grenade`.
- Objective item: `bomb`.
- The bomb is carried as an equippable gameplay item rather than as a passive flag.

## Pickup, Replacement, And Drop Rules

- The bomb is picked up automatically by walking over it.
- Weapons on the ground are picked up automatically when the player walks over them if the corresponding slot is empty.
- If the slot is already occupied, the player may aim at the ground weapon and press the action key to swap:
- the currently held slot weapon is dropped to the ground
- the ground weapon is picked up into that slot
- Dropped weapons should be projected slightly forward rather than falling straight down.
- This is an intentional gameplay rule so players can throw a weapon a short distance toward a teammate.
- All weapons except the knife can be dropped with `G`.
- The bomb can also be dropped with `G`.

## Health And Damage

- Player health: `100`.
- Weapons deal fixed damage.
- The current 3D prototype distinguishes hit zones:
- head
- torso
- hands
- feet
- Head hits deal more damage than torso hits.
- Hand and foot hits deal less damage than torso hits.
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

## Kill Feed

- The game should include a kill feed in the top-right area of the HUD.
- Each kill entry should be structured like:
- killer name on the left
- weapon icon in the middle
- victim name on the right
- Kill-feed faction color coding:
- `Capitalists`: blue
- `Communists`: red
- The kill feed should read similarly to a classic `Counter-Strike` style feed.

## Controls

- Movement: `WASD`.
- Aim: centered crosshair driven by mouse look.
- Crouch / kneel hold: `Shift`.
- Prone / stretched hold: `Ctrl`.
- Slow walk hold: `Cmd` on macOS or `Alt` on Windows.
- Primary slot: `1`.
- Secondary slot: `2`.
- Knife: `3`.
- Grenade: `4`.
- Bomb: `5`.
- Previous weapon: `Q`.
- Action / interact / plant / defuse / contextual pickup replace: `E`.
- Drop current weapon or bomb: `G`.
- Reload: `R`.
- Flashbang: `F`.
- Smoke: `C`.
- Fire: left mouse click.
- Secondary weapon action: right mouse click.
- Example: sniper zoom.
- Jump: `Space`.
- Jump has no finalized gameplay purpose yet, but it is part of the current control plan.

## MVP Constraints

- The long-term design includes multiple weapons, utility slots, bomb handling, and interaction rules.
- The first playable MVP does not include the full equipment model yet.
- See `06-mvp-offline-prototype.md` for the explicitly reduced initial scope.

## Input Rebinding

- All player gameplay inputs must be rebindable in local player settings.

## Camera

- Camera style: low-angle third-person tactical follow camera.
- The camera rotates with the player heading.
- Mouse look and the centered crosshair define the live camera angle.
- The controlled player stays low on screen in third person rather than centered.
- Camera zoom should move the camera in a straight line toward the upper-center aim anchor of the player.
- That zoom line is separate from the aim line used by the centered crosshair.
- At minimum zoom, the framing should converge toward an FPS-like view from that same aim line.
- Camera distance should remain zoomable in runtime.

## Vision Model

- Vision is not full omniscience.
- The intended tactical rule remains asymmetric:
- `180` degrees in front of the player: constrained by wall occlusion and tactical visibility rules
- `180` degrees behind the player: broadly readable for navigation and planning
- Areas behind walls in the forward hemisphere should remain known but visually darkened rather than treated as currently visible.
- Enemies behind walls must not be visible as live targets.

## Occlusion

- Wall blocking should be implemented through line-of-sight checks and occlusion logic.
- The practical implementation will likely use raycasts or visibility sampling rather than hardware ray tracing.
