# Product Vision

## Project

- Working title: `canuter`.
- Genre target: 3D multiplayer tactical shooter.
- Camera style: low-angle third-person tactical camera with the player framed near the bottom of the screen.
- Commercial target: release on Steam.
- Project ambition: high. The project should be built with long-term maintainability in mind.

## Core Pillars

- Competitive round-based team shooter.
- Objective-driven bomb-run mode built around a shared central bomb and enemy-base planting.
- Authoritative multiplayer architecture.
- Strong testing discipline from the beginning.
- Player-created maps supported through a text-based map format.
- English as the base game language, with localization support.

## Design Reference

- The intended feel is closer to `Counter-Strike`, `SOCOM`, or a restrained third-person tactical shooter than to an arcade shooter.
- The camera should preserve tactical readability without giving the player unrestricted omniscience.
- The runtime should feel like a hybrid between an FPS and a third-person shooter:
- movement relative to facing
- centered crosshair
- hitscan weapons
- a strong sense of lanes, cover, and exposure

## Open Questions

- How the project transitions from the offline prototype to the first server-backed multiplayer slice.
