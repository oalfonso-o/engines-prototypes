# MVP Offline Prototype

## Goal

- The first playable milestone is an offline-only prototype.
- Its purpose is to prove the core game feel and the technical foundation before any online work starts.

## MVP Success Criteria

- The player can load into a map rendered from a text file.
- The map format is already the real direction for the project, not a throwaway hardcoded scene.
- The player can play a complete offline round on that map.
- The round includes:
- the local player
- `4` allied bots
- `5` enemy bots
- All actors use readable final-style or near-final placeholder sprites that make roles and weapon state understandable.
- The prototype proves:
- movement
- aiming
- shooting
- damage
- death
- camera behavior
- vision cone / forward visibility presentation
- wall-based line-of-sight blocking

## MVP Scope

- Offline only.
- No server.
- No online multiplayer.
- No client/server split required yet in runtime.
- One map is enough.
- One primary weapon is enough to prove core combat feel, but the MVP also includes a `pistol` and `knife` slot so that equipment switching and layered weapon rendering are validated early.
- The required weapon set for this milestone is:
- `rifle`
- `pistol`
- `knife`
- No extra primary weapon classes in the MVP.
- No economy system in the MVP.
- No loadout system in the MVP.

## Required Gameplay Slice

- The player uses a rifle.
- The prototype validates the default bomb-run mode rather than an elimination-only round.
- The map includes:
- a `Capitalist` base
- a `Communist` base
- fixed spawn positions for each side
- a central bomb spawn
- The player can:
- pick up the bomb by walking over it
- equip the bomb on slot `5`
- plant at the enemy base with `E`
- drop valid weapons or the bomb with `G`
- swap with weapons on the ground through the action key
- Bots can move, perceive, and fight well enough to complete a round.
- Players and bots can damage and kill each other.
- The round supports bomb carrying, planting, and defusing.
- A planted bomb explosion kills players close enough to the blast.
- Bomb detonation should show the winner first and close the round `5` seconds later.
- If the round timer expires, the result is a draw.

## AI/Bot Requirement

- Bots only need to be good enough to validate the gameplay loop.
- They do not need final tactical behavior yet.
- They do need enough functionality to:
- navigate the map
- identify enemies they can validly perceive
- shoot
- die
- participate in round resolution

## Visual Requirement

- Sprites must already communicate gameplay clearly.
- It must be understandable:
- who is allied
- who is enemy
- who is holding the rifle
- how facing and aim direction are being represented
- The prototype should already validate whether the art style works from gameplay distance.
- The HUD should already prove the intended kill-feed placement and readability.

## Camera And Visibility Requirement

- The camera remains top-down and centered on the player.
- The player does not receive unrestricted top-down information.
- The prototype must prove the intended forward-vision presentation.
- It must also prove that walls correctly block visibility.

## Map Requirement

- The map must be instantiated from text data.
- The runtime pipeline from text file to playable level is part of the MVP itself.
- The prototype should avoid a fallback where the gameplay works only on a manually authored Godot scene.

## Explicit Non-Goals

- Networking
- dedicated server runtime
- multiple weapon classes
- buy menu or economy
- cosmetics system
- progression systems
- advanced spectating
- final matchmaking flow

## Architecture Implication

- Even though the MVP is offline, the code should still be structured so that core combat and rules logic can later move into an authoritative multiplayer architecture without being thrown away.
