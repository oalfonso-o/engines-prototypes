# MVP Offline Prototype

## Goal

- The first playable milestone is an offline-only prototype.
- Its purpose is to prove the core game feel and the technical foundation before any online work starts.

## MVP Success Criteria

- The player can load into a map rendered from a text file.
- The map format is already the real direction for the project, not a throwaway hardcoded scene.
- The player can move and fight through a readable offline combat sandbox on that map.
- All actors use simple 3D placeholder geometry that makes collision, spacing, and weapon feedback understandable.
- The prototype proves:
- movement
- aiming
- shooting
- damage
- camera behavior
- wall readability
- HUD and minimap readability

## MVP Scope

- Offline only.
- No server.
- No online multiplayer.
- No client/server split required yet in runtime.
- One map is enough.
- One primary weapon is enough to prove core combat feel, but the MVP also includes a `pistol` and `knife` slot so that equipment switching is validated early.
- The required weapon set for this milestone is:
- `rifle`
- `pistol`
- `knife`
- No extra primary weapon classes in the MVP.
- No economy system in the MVP.
- No loadout system in the MVP.

## Required Gameplay Slice

- The player uses a rifle.
- The current runtime focus is movement, look, weapon handling, and spatial readability in 3D.
- Bomb flow, bots, full round resolution, and utility are deferred until the core 3D combat presentation feels right.

## AI/Bot Requirement

- Bots are not required in the current 3D cleanup phase.
- They can return once camera, movement, visibility, and combat readability are stable.

## Visual Requirement

- Primitive 3D geometry must already communicate gameplay clearly.
- It must be understandable:
- who is allied
- who is enemy
- how facing and aim direction are being represented
- where the player is relative to lanes and cover
- The prototype should already validate whether the chosen camera angle and world scale work from gameplay distance.
- The HUD should already prove the intended kill-feed placement and readability.

## Camera And Visibility Requirement

- The camera is a low-angle third-person follow camera with runtime-adjustable angle and distance.
- The player does not receive unrestricted tactical information.
- The prototype should reintroduce forward tactical visibility only after the base 3D camera and movement feel are locked.

## Map Requirement

- The map must be instantiated from text data.
- The runtime pipeline from text file to playable level is part of the MVP itself.
- The prototype should avoid a fallback where the gameplay works only on a manually authored Godot scene.

## Explicit Non-Goals

- Networking
- dedicated server runtime
- multiple weapon classes beyond the current rifle / pistol / knife slice
- buy menu or economy
- cosmetics system
- progression systems
- advanced spectating
- final matchmaking flow
- final art production
- final visibility/fog presentation

## Architecture Implication

- Even though the MVP is offline, the code should still be structured so that core combat and rules logic can later move into an authoritative multiplayer architecture without being thrown away.
