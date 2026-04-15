# V8 Building Comparison Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new playable FPS building-comparison scenes inside `godot-prototypes/v8-fps-prototype`, one built with direct primitives and one built with `GridMap`, both using the same three-floor layout and both safely traversable with the existing FPS controller.

**Architecture:** Keep `v8`'s current default scene unchanged. Add one shared building layout description as the single source of truth for footprint, floors, openings, stairs, balcony, and player spawn, then build that same layout through two separate scene roots: a code-first primitives builder and a `GridMap` builder. Cover both with pragmatic GUT integration tests focused on safe spawn and traversal smoke checks.

**Tech Stack:** Godot 4 GDScript, `GridMap`, `MeshLibrary`, existing `FpsPlayerController`, existing GUT test harness, Makefile scene run targets.

---

## File Structure Map

- Create: `godot-prototypes/v8-fps-prototype/BuildingPrimitivesDemo.tscn`
  - Minimal scene root for the direct-primitives comparison scene.
- Create: `godot-prototypes/v8-fps-prototype/BuildingGridMapDemo.tscn`
  - Minimal scene root for the GridMap comparison scene.
- Create: `godot-prototypes/v8-fps-prototype/runtime/logic/building_layout.gd`
  - Shared deterministic layout contract for floors, openings, stairs, balcony, and player spawn.
- Create: `godot-prototypes/v8-fps-prototype/runtime/engine/building_primitives_demo_root.gd`
  - Thin scene root that builds the comparison environment with direct meshes/collision.
- Create: `godot-prototypes/v8-fps-prototype/runtime/engine/building_gridmap_demo_root.gd`
  - Thin scene root that builds the same environment with `GridMap`.
- Create: `godot-prototypes/v8-fps-prototype/tests/classes/test_building_layout.gd`
  - Focused layout-contract tests.
- Create: `godot-prototypes/v8-fps-prototype/tests/integration/test_building_primitives_demo.gd`
  - Spawn/traversal smoke tests for the primitives variant.
- Create: `godot-prototypes/v8-fps-prototype/tests/integration/test_building_gridmap_demo.gd`
  - Spawn/traversal smoke tests for the GridMap variant.
- Modify: `godot-prototypes/v8-fps-prototype/README.md`
  - Document the two comparison run targets.
- Modify: `Makefile`
  - Add two run recipes that open the new scenes without changing `run-v8-fps`.

## Task 1: Add The Shared Building Layout Contract

**Files:**
- Create: `godot-prototypes/v8-fps-prototype/runtime/logic/building_layout.gd`
- Create: `godot-prototypes/v8-fps-prototype/tests/classes/test_building_layout.gd`

- [ ] **Step 1: Write the failing layout test**

```gdscript
extends GutTest

const BuildingLayoutScript := preload("res://runtime/logic/building_layout.gd")


func test_default_layout_defines_three_floors_stairs_and_balcony() -> void:
	var layout = BuildingLayoutScript.new()

	assert_eq(layout.floor_count(), 3, "layout should define exactly three floors")
	assert_true(layout.has_ground_stairs_on_left(), "ground floor stairs should start on the left")
	assert_true(layout.has_middle_stairs_on_right(), "middle floor stairs should continue on the right")
	assert_true(layout.top_floor_has_balcony(), "top floor should expose a balcony")
	assert_true(layout.spawn_position().y > 0.0, "spawn should be above exterior ground")


func test_default_layout_exposes_back_room_and_window_counts() -> void:
	var layout = BuildingLayoutScript.new()

	assert_eq(layout.back_room_count_for_floor(0), 2, "ground floor should define two back rooms")
	assert_eq(layout.window_count_for_floor(0), 4, "ground floor should define four windows")
	assert_eq(layout.window_count_for_floor(1), 4, "middle floor should define four windows")
	assert_eq(layout.window_count_for_floor(2), 4, "top floor should define four windows")
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
make test-v8-fps
```

Expected:

- GUT fails because `res://runtime/logic/building_layout.gd` does not exist yet.

- [ ] **Step 3: Write the minimal shared layout**

```gdscript
extends RefCounted
class_name BuildingLayout

const EXTERIOR_GROUND_SIZE: Vector2 = Vector2(72.0, 72.0)
const FLOOR_HEIGHT: float = 3.0
const FLOOR_THICKNESS: float = 0.2
const FOOTPRINT: Vector2 = Vector2(14.0, 10.0)
const SPAWN_OFFSET: Vector3 = Vector3(0.0, 1.1, 18.0)


func floor_count() -> int:
	return 3


func has_ground_stairs_on_left() -> bool:
	return true


func has_middle_stairs_on_right() -> bool:
	return true


func top_floor_has_balcony() -> bool:
	return true


func back_room_count_for_floor(_floor_index: int) -> int:
	return 2


func window_count_for_floor(_floor_index: int) -> int:
	return 4


func spawn_position() -> Vector3:
	return SPAWN_OFFSET
```

- [ ] **Step 4: Run tests to verify the layout contract passes**

Run:

```bash
make test-v8-fps
```

Expected:

- The new class tests pass.
- Existing `v8` tests still pass.

- [ ] **Step 5: Commit**

```bash
git add \
  godot-prototypes/v8-fps-prototype/runtime/logic/building_layout.gd \
  godot-prototypes/v8-fps-prototype/tests/classes/test_building_layout.gd
git commit -m "feat: add shared building layout contract"
```

## Task 2: Build The Direct-Primitives Comparison Scene

**Files:**
- Create: `godot-prototypes/v8-fps-prototype/BuildingPrimitivesDemo.tscn`
- Create: `godot-prototypes/v8-fps-prototype/runtime/engine/building_primitives_demo_root.gd`
- Create: `godot-prototypes/v8-fps-prototype/tests/integration/test_building_primitives_demo.gd`

- [ ] **Step 1: Write the failing primitives-scene integration test**

```gdscript
extends "res://tests/helpers/gut_scene_test.gd"

const PlayerTestDriverScript := preload("res://tests/helpers/player_test_driver.gd")


func test_primitives_demo_spawns_grounded_player_and_building() -> void:
	var packed_scene: PackedScene = load("res://BuildingPrimitivesDemo.tscn") as PackedScene
	assert_not_null(packed_scene, "primitives demo scene should exist")
	if packed_scene == null:
		return

	var scene: Node3D = packed_scene.instantiate() as Node3D
	add_scene_root(scene)
	await settle_frames(6)

	var player = scene.get_node_or_null("Player")
	assert_not_null(player, "primitives demo should spawn a player")
	assert_not_null(scene.get_node_or_null("Ground"), "primitives demo should build exterior ground")
	assert_not_null(scene.get_node_or_null("BuildingRoot"), "primitives demo should build the comparison building")
	assert_true(player.is_on_floor(), "player should be grounded after spawn")


func test_primitives_demo_allows_forward_progress_toward_building() -> void:
	var packed_scene: PackedScene = load("res://BuildingPrimitivesDemo.tscn") as PackedScene
	var scene: Node3D = packed_scene.instantiate() as Node3D
	add_scene_root(scene)
	await settle_frames(6)

	var player = scene.get_node_or_null("Player")
	var start_z: float = player.global_position.z
	PlayerTestDriverScript.set_move_intent(player, Vector2(0.0, -1.0))
	for _frame_index: int in range(24):
		await physics_frames()
	PlayerTestDriverScript.clear_move_intent(player)

	assert_true(player.global_position.z < start_z - 1.0, "player should be able to approach the building")
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
make test-v8-fps
```

Expected:

- GUT fails because `BuildingPrimitivesDemo.tscn` and its root script do not exist yet.

- [ ] **Step 3: Add the primitives scene and minimal builder**

```tscn
[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://runtime/engine/building_primitives_demo_root.gd" id="1_root"]

[node name="BuildingPrimitivesDemo" type="Node3D"]
script = ExtResource("1_root")
```

```gdscript
extends Node3D

const BuildingLayoutScript := preload("res://runtime/logic/building_layout.gd")
const FpsPlayerScript := preload("res://runtime/engine/fps_player.gd")


func _ready() -> void:
	SceneBuilder.new(self, BuildingLayoutScript.new()).build()


class SceneBuilder:
	var _layout
	var _owner: Node3D


	func _init(owner: Node3D, layout) -> void:
		_owner = owner
		_layout = layout


	func build() -> void:
		_owner.add_child(GroundBuilder.build(_layout))
		_owner.add_child(BuildingBuilder.build(_layout))
		_owner.add_child(PlayerBuilder.build(_layout, _owner))
```

- [ ] **Step 4: Flesh out the primitives builder to satisfy traversal requirements**

```gdscript
class BuildingBuilder:
	static func build(layout) -> Node3D:
		var root := Node3D.new()
		root.name = "BuildingRoot"
		root.add_child(FloorBuilder.build_floor_slab("Floor0", 0.0, layout))
		root.add_child(FloorBuilder.build_floor_slab("Floor1", layout.floor_base_y(1), layout))
		root.add_child(FloorBuilder.build_floor_slab("Floor2", layout.floor_base_y(2), layout))
		root.add_child(WallBuilder.build_exterior_walls(layout))
		root.add_child(RoomBuilder.build_back_rooms(layout))
		root.add_child(StairBuilder.build_ground_left_stairs(layout))
		root.add_child(StairBuilder.build_middle_right_stairs(layout))
		root.add_child(BalconyBuilder.build(layout))
		root.add_child(RoofBuilder.build(layout))
		return root
```

Implementation notes for this step:

- Use simple `StaticBody3D` + `CollisionShape3D` + `MeshInstance3D`.
- Build a wide exterior `Ground`.
- Build shallow stair steps or short step stacks sized for the existing `FpsPlayerController`.
- Keep the balcony as a simple exterior platform aligned to one top-floor window.
- Spawn the player from `layout.spawn_position()` over the exterior ground, not inside the building.

- [ ] **Step 5: Run tests to verify the primitives variant passes**

Run:

```bash
make test-v8-fps
```

Expected:

- New primitives integration tests pass.
- Existing `v8` tests continue to pass.

- [ ] **Step 6: Commit**

```bash
git add \
  godot-prototypes/v8-fps-prototype/BuildingPrimitivesDemo.tscn \
  godot-prototypes/v8-fps-prototype/runtime/engine/building_primitives_demo_root.gd \
  godot-prototypes/v8-fps-prototype/tests/integration/test_building_primitives_demo.gd
git commit -m "feat: add primitives-based building comparison scene"
```

## Task 3: Build The GridMap Comparison Scene

**Files:**
- Create: `godot-prototypes/v8-fps-prototype/BuildingGridMapDemo.tscn`
- Create: `godot-prototypes/v8-fps-prototype/runtime/engine/building_gridmap_demo_root.gd`
- Create: `godot-prototypes/v8-fps-prototype/tests/integration/test_building_gridmap_demo.gd`

- [ ] **Step 1: Write the failing GridMap-scene integration test**

```gdscript
extends "res://tests/helpers/gut_scene_test.gd"


func test_gridmap_demo_spawns_grounded_player_and_gridmap() -> void:
	var packed_scene: PackedScene = load("res://BuildingGridMapDemo.tscn") as PackedScene
	assert_not_null(packed_scene, "gridmap demo scene should exist")
	if packed_scene == null:
		return

	var scene: Node3D = packed_scene.instantiate() as Node3D
	add_scene_root(scene)
	await settle_frames(6)

	var player = scene.get_node_or_null("Player")
	assert_not_null(player, "gridmap demo should spawn a player")
	assert_not_null(scene.get_node_or_null("Ground"), "gridmap demo should build exterior ground")
	assert_not_null(scene.get_node_or_null("BuildingGridMap"), "gridmap demo should create a GridMap")
	assert_true(player.is_on_floor(), "gridmap player should be grounded after spawn")
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
make test-v8-fps
```

Expected:

- GUT fails because `BuildingGridMapDemo.tscn` and its root script do not exist yet.

- [ ] **Step 3: Add the GridMap scene and minimal builder**

```tscn
[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://runtime/engine/building_gridmap_demo_root.gd" id="1_root"]

[node name="BuildingGridMapDemo" type="Node3D"]
script = ExtResource("1_root")
```

```gdscript
extends Node3D

const BuildingLayoutScript := preload("res://runtime/logic/building_layout.gd")
const FpsPlayerScript := preload("res://runtime/engine/fps_player.gd")


func _ready() -> void:
	SceneBuilder.new(self, BuildingLayoutScript.new()).build()
```

- [ ] **Step 4: Implement the GridMap builder from the shared layout**

```gdscript
class GridMapBuilder:
	static func build(layout) -> GridMap:
		var grid_map := GridMap.new()
		grid_map.name = "BuildingGridMap"
		grid_map.cell_size = Vector3.ONE
		grid_map.mesh_library = MeshLibraryBuilder.build()

		for cell: Vector3i in layout.floor_cells():
			grid_map.set_cell_item(cell, MeshLibraryBuilder.FLOOR_TILE)
		for cell: Vector3i in layout.wall_cells():
			grid_map.set_cell_item(cell, MeshLibraryBuilder.WALL_TILE)
		for cell: Vector3i in layout.roof_cells():
			grid_map.set_cell_item(cell, MeshLibraryBuilder.ROOF_TILE)
		for cell: Vector3i in layout.stair_cells():
			grid_map.set_cell_item(cell, MeshLibraryBuilder.STAIR_TILE)
		for cell: Vector3i in layout.balcony_cells():
			grid_map.set_cell_item(cell, MeshLibraryBuilder.BALCONY_TILE)

		return grid_map
```

Implementation notes for this step:

- Build a small `MeshLibrary` in code with only the required tiles.
- Use omitted cells to express the main doorway, room doorways, and windows.
- Keep stair tiles shallow enough for the current player controller.
- Reuse the same spawn and exterior ground strategy as the primitives variant.

- [ ] **Step 5: Add traversal smoke checks for the GridMap variant**

Extend `test_building_gridmap_demo.gd` with:

```gdscript
func test_gridmap_demo_supports_vertical_progression_smoke_check() -> void:
	var packed_scene: PackedScene = load("res://BuildingGridMapDemo.tscn") as PackedScene
	var scene: Node3D = packed_scene.instantiate() as Node3D
	add_scene_root(scene)
	await settle_frames(6)

	var player = scene.get_node_or_null("Player")
	assert_not_null(player, "gridmap demo should spawn a player")
	assert_true(scene.get_node_or_null("BuildingGridMap") is GridMap, "gridmap demo should expose a GridMap root")

	var building_gridmap: GridMap = scene.get_node_or_null("BuildingGridMap") as GridMap
	assert_true(building_gridmap.get_used_cells().size() > 0, "gridmap should be populated")
```

- [ ] **Step 6: Run tests to verify the GridMap variant passes**

Run:

```bash
make test-v8-fps
```

Expected:

- New GridMap integration tests pass.
- The primitives comparison tests still pass.
- Existing `v8` tests still pass.

- [ ] **Step 7: Commit**

```bash
git add \
  godot-prototypes/v8-fps-prototype/BuildingGridMapDemo.tscn \
  godot-prototypes/v8-fps-prototype/runtime/engine/building_gridmap_demo_root.gd \
  godot-prototypes/v8-fps-prototype/tests/integration/test_building_gridmap_demo.gd
git commit -m "feat: add gridmap-based building comparison scene"
```

## Task 4: Add Comparable Traversal Checks And Run Targets

**Files:**
- Modify: `godot-prototypes/v8-fps-prototype/tests/integration/test_building_primitives_demo.gd`
- Modify: `godot-prototypes/v8-fps-prototype/tests/integration/test_building_gridmap_demo.gd`
- Modify: `godot-prototypes/v8-fps-prototype/README.md`
- Modify: `Makefile`

- [ ] **Step 1: Extend both integration tests with layout-comparison assertions**

Add assertions such as:

```gdscript
assert_not_null(scene.get_node_or_null("Ground"), "scene should expose exterior ground")
assert_not_null(scene.get_node_or_null("Player"), "scene should expose player")
assert_true(player.is_on_floor(), "player should remain grounded after spawn")
assert_true(player.global_position.y >= 0.9, "player should not fall through the world")
```

For the primitives scene, also assert:

```gdscript
assert_not_null(scene.get_node_or_null("BuildingRoot"), "primitives scene should expose its building root")
```

For the GridMap scene, also assert:

```gdscript
assert_not_null(scene.get_node_or_null("BuildingGridMap"), "gridmap scene should expose the gridmap root")
```

- [ ] **Step 2: Add the new Makefile run targets**

Add these targets:

```make
run-v8-building-primitives:
	"$(GODOT)" --path "$(V8_FPS_PATH)" --scene "res://BuildingPrimitivesDemo.tscn"

run-v8-building-gridmap:
	"$(GODOT)" --path "$(V8_FPS_PATH)" --scene "res://BuildingGridMapDemo.tscn"
```

- [ ] **Step 3: Update the v8 README with both comparison entrypoints**

Add a section like:

```md
## Building Comparison Scenes

- `make run-v8-building-primitives`
- `make run-v8-building-gridmap`

These scenes compare the same three-floor FPS building layout built with two techniques:

1. direct primitives / code-first geometry
2. GridMap
```

- [ ] **Step 4: Run the full suite and smoke-run both entrypoints**

Run:

```bash
make test-v8-fps
make run-v8-building-primitives
make run-v8-building-gridmap
```

Expected:

- Tests pass.
- Both scenes open.
- Player spawns safely in both.

- [ ] **Step 5: Commit**

```bash
git add Makefile \
  godot-prototypes/v8-fps-prototype/README.md \
  godot-prototypes/v8-fps-prototype/tests/integration/test_building_primitives_demo.gd \
  godot-prototypes/v8-fps-prototype/tests/integration/test_building_gridmap_demo.gd
git commit -m "feat: add v8 building comparison entrypoints"
```

## Task 5: Manual Traversal Validation And Closeout

**Files:**
- Modify if needed: `godot-prototypes/v8-fps-prototype/runtime/engine/building_primitives_demo_root.gd`
- Modify if needed: `godot-prototypes/v8-fps-prototype/runtime/engine/building_gridmap_demo_root.gd`
- Modify if needed: `godot-prototypes/v8-fps-prototype/tests/integration/test_building_primitives_demo.gd`
- Modify if needed: `godot-prototypes/v8-fps-prototype/tests/integration/test_building_gridmap_demo.gd`

- [ ] **Step 1: Manually validate the primitives variant**

Run:

```bash
make run-v8-building-primitives
```

Check all of these:

- spawn is stable
- exterior ground traversal works
- player can enter the building
- player can climb to floor 1
- player can climb to floor 3
- balcony is reachable
- player can jump from balcony and land on ground

- [ ] **Step 2: Manually validate the GridMap variant**

Run:

```bash
make run-v8-building-gridmap
```

Check the same traversal list as above.

- [ ] **Step 3: If manual validation reveals collision issues, add the smallest regression test possible**

Example:

```gdscript
assert_true(player.is_on_floor(), "player should still be on stable collision after descending from upper floors")
```

- [ ] **Step 4: Run final verification**

Run:

```bash
make test-v8-fps
```

Expected:

- Full suite passes with the new comparison scenes included.

- [ ] **Step 5: Commit**

```bash
git add \
  godot-prototypes/v8-fps-prototype/runtime/engine/building_primitives_demo_root.gd \
  godot-prototypes/v8-fps-prototype/runtime/engine/building_gridmap_demo_root.gd \
  godot-prototypes/v8-fps-prototype/tests/integration/test_building_primitives_demo.gd \
  godot-prototypes/v8-fps-prototype/tests/integration/test_building_gridmap_demo.gd
git commit -m "fix: stabilize v8 building comparison traversal"
```

## Self-Review

- Spec coverage:
  - shared layout: Task 1
  - primitives scene: Task 2
  - GridMap scene: Task 3
  - run entrypoints: Task 4
  - safe spawn and traversal validation: Tasks 2, 3, 4, 5
- Placeholder scan:
  - no `TODO`, `TBD`, or deferred implementation markers remain
- Type consistency:
  - `BuildingLayout`, `BuildingPrimitivesDemo`, `BuildingGridMapDemo`, `BuildingRoot`, `BuildingGridMap`, `Ground`, and `Player` are referenced consistently throughout the plan
