# Engines Prototypes

This repository archives playable and technical prototypes grouped by engine.

Each engine folder owns its own conventions, build entrypoints, docs, and prototype snapshots:

- `godot-prototypes/`
- `phaser-prototypes/`
- `pygame-prototypes/`
- `sokol-prototypes/`
- `unity-prototypes/`

The root `Makefile` stays thin and only forwards to engine-specific workflows when a prototype needs a shared entrypoint.

Prototype-specific documentation should live next to the prototype it describes. Root-level docs are only for indexes, historical context, or repo-wide coordination notes.
