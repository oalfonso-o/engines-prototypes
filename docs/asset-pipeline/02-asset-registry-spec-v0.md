# Asset Registry Spec v0

## Goal

- Registries decouple gameplay/map semantics from concrete asset files.
- The game should look up ids such as `wall_concrete` or `prop_bench`, not raw file paths scattered across maps and scripts.

## Registry Types

- `theme registry`: chooses which concrete tile and entity registries a map uses.
- `tile registry`: defines grid-based content.
- `entity registry`: defines explicitly placed objects and markers.

## Theme Registry

- A map selects one theme id in `[meta]`.
- The theme registry maps that theme id to:
- tile registry path
- entity registry path
- palette id
- optional minimap profile

## Tile Registry Responsibilities

- Define how grid cells behave and render.
- Typical tile categories:
- floor
- wall
- spawn
- cover
- decorative tile

## Entity Registry Responsibilities

- Define how explicit map objects behave and render.
- Typical entity categories:
- prop
- marker
- interactive object
- spawn helper
- future objective object

## Runtime Fields

- `id`
- `kind`
- `category`
- `sprite` or `sprite_set`
- `blocks_movement`
- `blocks_vision`
- `blocks_projectiles`
- `render_layer`
- `minimap_color` or `minimap_icon`
- `tags`

## Production Fields

- `asset_id`
- `version`
- `source_manifest`
- `status`

## Example Tile Definition

```json
{
  "id": "wall_concrete",
  "kind": "tile",
  "category": "wall",
  "sprite_set": "game-assets/sprites/environment/urban_warm/wall_concrete_a",
  "blocks_movement": true,
  "blocks_vision": true,
  "blocks_projectiles": true,
  "render_layer": "walls",
  "minimap_color": "#7A6758",
  "tags": ["urban", "warm", "structural"]
}
```

## Example Entity Definition

```json
{
  "id": "prop_bench",
  "kind": "entity",
  "category": "prop",
  "sprite": "game-assets/sprites/props/urban_warm/prop_bench_urban_01.png",
  "footprint": [2, 1],
  "anchor": "bottom_left",
  "blocks_movement": false,
  "blocks_vision": false,
  "blocks_projectiles": false,
  "render_layer": "props",
  "minimap_icon": null,
  "tags": ["urban", "street", "bench"]
}
```

## File Organization

- `game-assets/registries/themes/`
- `game-assets/registries/tiles/`
- `game-assets/registries/entities/`

## Rules

- Registry ids are stable and code-facing.
- Sprite paths may evolve over time, but ids should not churn unless semantics change.
- Runtime behavior flags belong in registries, not inside map files.
- Production metadata belongs in manifests, not inside gameplay maps.

## v0 Decision

- JSON is acceptable for registries because it is explicit, easy to validate, and easy to parse from tooling.
