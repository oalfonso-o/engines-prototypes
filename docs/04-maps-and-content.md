# Maps And Content

## User-Created Maps

- The project should support maps that are created from text files.
- The game must be able to parse a text file and render the map from it.
- This is a hard product direction, not just a prototype idea.

## Map Authoring

- Users must be able to create maps themselves.
- They may need an external editor to do it.
- A web-based map editor is an acceptable direction.
- The important requirement is that the final source of truth is a text file format the game understands.

## Format Direction

- The format should be:
- human-readable
- versionable in git
- easy to validate
- safe to parse on server and client
- expressive enough to define layout, collision, spawns, and gameplay-relevant entities

## Early Map Format Requirements

- The format should eventually be able to represent at least:
- walls and blocking geometry
- walkable space
- faction spawn points
- capitalist base zone
- communist base zone
- bomb spawn point
- plantable base zones
- line-of-sight relevant geometry
- minimap-relevant geometry
- gameplay props if they affect collision or visibility

## Technical Implication

- The renderer and gameplay systems should not assume that maps are authored only through native Godot scenes.
- We should design a map loading pipeline that can build runtime content from text definitions.

## Implementation Reference

- The live prototype currently loads a text map and extrudes it directly into simple 3D floor and wall geometry at runtime.
