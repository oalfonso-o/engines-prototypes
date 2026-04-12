# Technical Decisions

## Engine

- Engine: `Godot`.
- Current project renderer mode: `Compatibility`.
- The Godot project lives under `godot/` instead of the repository root.
- Reason: keep the repository root clean for docs, tooling, backend-adjacent code, and asset pipeline work.

## Language

- Main development language: `C#`.
- Reason: more robust testing ecosystem and stronger long-term maintainability for an ambitious multiplayer project.

## Testing Direction

- We want to work with a TDD mindset where it is practical.
- Godot does not provide a complete first-party gameplay test framework comparable to mainstream backend or web ecosystems.
- For project-level gameplay testing, the plan is to lean on `C#` and a robust test setup around domain logic.
- The key architectural implication is that important gameplay rules must live in testable, non-visual code.

## Localization

- The game should be authored in English.
- The game must support translations/localization.

## Documentation Practice

- Design decisions are being documented under `docs/`.
- These notes are expected to evolve as the design is refined.

## Early Implementation Principles

- Prefer clean separation between:
- domain logic
- rendering/presentation
- networking
- input
- Keep repository structure clean and scalable:
- `godot/` for the game project
- `docs/` for versioned design and technical specifications
- `game-assets/` for approved assets, registries, specs, and source metadata
- `maps/` for text-first map definitions
- `tools/` for pipeline scripts
- Keep systems testable by default.
- Avoid coupling core game rules to scene-only behavior where possible.
- Build with Steam release quality expectations in mind from the start.
