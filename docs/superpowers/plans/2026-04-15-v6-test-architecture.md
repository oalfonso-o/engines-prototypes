# V6 Test Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the monolithic `godot-prototypes/v6-character-prototype/tests/integration_runner.gd` with an automatically discovered test suite organized into class tests, integration tests, and fixtures, while keeping `make test-v6-character` as the single command.

**Architecture:** Add one `tests/runner.gd` entrypoint that discovers `test_*.gd` files and `test_*` methods automatically, plus a small assertions/context runtime shared by all tests. Move shared scene setup into `tests/fixtures/`, split existing checks into `tests/class/` and `tests/integration/`, then retarget the `Makefile` to the new runner and remove the old monolith once the same behavior is covered.

**Tech Stack:** Godot 4.6 GDScript, headless SceneTree-based test execution, existing `make test-v6-character` target.

---

### Task 1: Add The Test Runner Runtime

**Files:**
- Create: `godot-prototypes/v6-character-prototype/tests/runner.gd`
- Test: `godot-prototypes/v6-character-prototype/tests/runner.gd`

- [ ] **Step 1: Write the failing bootstrap test inside the new runner scaffold**

Add a minimal runner that intentionally fails until discovery is implemented:

```gdscript
extends SceneTree


func _initialize() -> void:
	push_error("runner discovery not implemented")
	quit(1)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `"/Applications/Godot_mono.app/Contents/MacOS/Godot" --headless --path "godot-prototypes/v6-character-prototype" --script "res://tests/runner.gd"`
Expected: FAIL with `runner discovery not implemented`

- [ ] **Step 3: Replace the scaffold with the real runner**

Implement `runner.gd` so it discovers files and methods automatically, supports async tests, and reports failures with `file::method`.

```gdscript
extends SceneTree

const CLASS_TESTS_DIR: String = "res://tests/class"
const INTEGRATION_TESTS_DIR: String = "res://tests/integration"
const TEST_FILE_PREFIX: String = "test_"
const FIXTURE_FILE_PREFIX: String = "fixtures_"
const TEST_METHOD_PREFIX: String = "test_"

var _assertions := Assertions.new()
var _context: TestContext


func _initialize() -> void:
	_context = TestContext.new(self)
	await _run_all_tests()
	if _assertions.is_empty():
		print("v6-character-prototype tests OK")
		quit(0)
		return

	for failure: String in _assertions.failures:
		push_error(failure)
	quit(1)


func _run_all_tests() -> void:
	for file_path: String in _discover_test_files():
		await _run_test_file(file_path)


func _discover_test_files() -> Array[String]:
	var files: Array[String] = []
	for directory_path: String in [CLASS_TESTS_DIR, INTEGRATION_TESTS_DIR]:
		var dir := DirAccess.open(directory_path)
		if dir == null:
			continue
		dir.list_dir_begin()
		while true:
			var entry := dir.get_next()
			if entry == "":
				break
			if dir.current_is_dir():
				continue
			if not entry.ends_with(".gd"):
				continue
			if not entry.begins_with(TEST_FILE_PREFIX):
				continue
			files.append("%s/%s" % [directory_path, entry])
		dir.list_dir_end()
	files.sort()
	return files


func _run_test_file(file_path: String) -> void:
	var script := load(file_path) as GDScript
	_assertions.check(script != null, "%s::load -> script failed to load" % file_path)
	if script == null:
		return

	var instance: Object = script.new()
	var methods: PackedStringArray = _discover_test_methods(instance)
	for method_name: String in methods:
		await _run_test_method(file_path, instance, method_name)


func _discover_test_methods(instance: Object) -> PackedStringArray:
	var methods: PackedStringArray = []
	for method_info: Dictionary in instance.get_method_list():
		var method_name: String = method_info.get("name", "")
		if method_name.begins_with(TEST_METHOD_PREFIX):
			methods.append(method_name)
	methods.sort()
	return methods


func _run_test_method(file_path: String, instance: Object, method_name: String) -> void:
	var failure_count_before: int = _assertions.failures.size()
	var result = instance.call(method_name, _assertions, _context)
	if result is GDScriptFunctionState:
		await result
	await _context.cleanup()
	if _assertions.failures.size() == failure_count_before:
		return
	for index: int in range(failure_count_before, _assertions.failures.size()):
		_assertions.failures[index] = "%s::%s -> %s" % [file_path, method_name, _assertions.failures[index]]


class Assertions:
	var failures: Array[String] = []


	func check(condition: bool, message: String) -> void:
		if not condition:
			failures.append(message)


	func is_empty() -> bool:
		return failures.is_empty()


class TestContext:
	var _owner: SceneTree
	var _cleanup_nodes: Array[Node] = []


	func _init(owner: SceneTree) -> void:
		_owner = owner


	func instantiate_main_scene() -> Node3D:
		var scene := load("res://main.tscn").instantiate() as Node3D
		_owner.root.add_child(scene)
		_cleanup_nodes.append(scene)
		return scene


	func settle_frames(frame_count: int) -> void:
		for _frame: int in range(frame_count):
			await _owner.process_frame
			await _owner.physics_frame


	func cleanup() -> void:
		for node: Node in _cleanup_nodes:
			if is_instance_valid(node):
				node.queue_free()
		_cleanup_nodes.clear()
		await _owner.process_frame
```

- [ ] **Step 4: Run test to verify the runner compiles and fails only because there are no migrated tests yet**

Run: `"/Applications/Godot_mono.app/Contents/MacOS/Godot" --headless --path "godot-prototypes/v6-character-prototype" --script "res://tests/runner.gd"`
Expected: PASS if no tests discovered yet, or FAIL only on migrated tests. No parser errors.

- [ ] **Step 5: Commit**

```bash
git add godot-prototypes/v6-character-prototype/tests/runner.gd
git commit -m "test: add v6 automatic test runner"
```

### Task 2: Add Shared Fixtures

**Files:**
- Create: `godot-prototypes/v6-character-prototype/tests/fixtures/fixtures_sandbox.gd`
- Create: `godot-prototypes/v6-character-prototype/tests/fixtures/fixtures_character.gd`
- Test: `godot-prototypes/v6-character-prototype/tests/runner.gd`

- [ ] **Step 1: Write a failing integration test that expects a reusable sandbox fixture API**

Create a first integration test file:

```gdscript
extends RefCounted

const SandboxFixture := preload("res://tests/fixtures/fixtures_sandbox.gd")


func test_fixture_instantiates_main_scene(assertions, context) -> void:
	var scene: Node3D = await SandboxFixture.instantiate(context)
	assertions.check(scene != null, "sandbox fixture should instantiate main.tscn")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `"/Applications/Godot_mono.app/Contents/MacOS/Godot" --headless --path "godot-prototypes/v6-character-prototype" --script "res://tests/runner.gd"`
Expected: FAIL because the fixture files do not exist yet or do not implement `instantiate(...)`

- [ ] **Step 3: Implement the fixture files**

Add fixture helpers focused on setup only:

```gdscript
# tests/fixtures/fixtures_sandbox.gd
extends RefCounted


static func instantiate(context) -> Node3D:
	var scene: Node3D = context.instantiate_main_scene()
	await context.settle_frames(12)
	return scene


static func get_character(scene: Node3D):
	return scene.get_node("CharacterPrototype")


static func get_visual_rig(scene: Node3D) -> Node3D:
	return get_character(scene).get_node("VisualRig") as Node3D


static func get_debug_label(scene: Node3D) -> Label:
	return scene.get_node("DebugHud/InfoLabel") as Label
```

```gdscript
# tests/fixtures/fixtures_character.gd
extends RefCounted

const SandboxFixture := preload("res://tests/fixtures/fixtures_sandbox.gd")


static func instantiate(context) -> Dictionary:
	var scene: Node3D = await SandboxFixture.instantiate(context)
	var character = SandboxFixture.get_character(scene)
	var visual_rig: Node3D = SandboxFixture.get_visual_rig(scene)
	var skeleton: Skeleton3D = visual_rig.get_node("Skeleton3D") as Skeleton3D
	return {
		"scene": scene,
		"character": character,
		"visual_rig": visual_rig,
		"skeleton": skeleton,
	}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `"/Applications/Godot_mono.app/Contents/MacOS/Godot" --headless --path "godot-prototypes/v6-character-prototype" --script "res://tests/runner.gd"`
Expected: PASS for the migrated fixture smoke test

- [ ] **Step 5: Commit**

```bash
git add godot-prototypes/v6-character-prototype/tests/fixtures/fixtures_sandbox.gd godot-prototypes/v6-character-prototype/tests/fixtures/fixtures_character.gd godot-prototypes/v6-character-prototype/tests/integration/test_bootstrap.gd
git commit -m "test: add v6 test fixtures"
```

### Task 3: Split Class-Scoped Tests

**Files:**
- Create: `godot-prototypes/v6-character-prototype/tests/class/test_character_root.gd`
- Create: `godot-prototypes/v6-character-prototype/tests/class/test_char_visual.gd`
- Create: `godot-prototypes/v6-character-prototype/tests/class/test_debug_controller.gd`
- Test: `godot-prototypes/v6-character-prototype/tests/class/test_character_root.gd`
- Test: `godot-prototypes/v6-character-prototype/tests/class/test_char_visual.gd`
- Test: `godot-prototypes/v6-character-prototype/tests/class/test_debug_controller.gd`

- [ ] **Step 1: Write failing class tests by copying one behavior from the old monolith into each new file**

Seed each file with at least one failing `test_*` method:

```gdscript
# tests/class/test_character_root.gd
extends RefCounted

const CharacterFixture := preload("res://tests/fixtures/fixtures_character.gd")


func test_jump_intent_lifts_character(assertions, context) -> void:
	var data: Dictionary = await CharacterFixture.instantiate(context)
	var character = data["character"]
	var start_y: float = character.global_position.y
	character.queue_jump_intent()
	for _frame: int in range(20):
		await context.physics_frame()
	assertions.check(character.global_position.y > start_y + 0.2, "queued jump intent should lift the character using the gameplay capsule")
```

```gdscript
# tests/class/test_char_visual.gd
extends RefCounted

const CharacterFixture := preload("res://tests/fixtures/fixtures_character.gd")
const VisualRigScript := preload("res://runtime/char_visual.gd")


func test_required_bones_exist(assertions, context) -> void:
	var data: Dictionary = await CharacterFixture.instantiate(context)
	var skeleton: Skeleton3D = data["skeleton"]
	for bone_name: String in VisualRigScript.REQUIRED_BONES:
		assertions.check(skeleton.find_bone(bone_name) != -1, "missing expected bone: %s" % bone_name)
```

```gdscript
# tests/class/test_debug_controller.gd
extends RefCounted

const SandboxFixture := preload("res://tests/fixtures/fixtures_sandbox.gd")


func test_debug_label_mentions_controls(assertions, context) -> void:
	var scene: Node3D = await SandboxFixture.instantiate(context)
	var label: Label = SandboxFixture.get_debug_label(scene)
	assertions.check(label.text.contains("WASD move"), "debug label should describe the movement controls")
```

- [ ] **Step 2: Run test to verify the new files fail for the expected reasons**

Run: `"/Applications/Godot_mono.app/Contents/MacOS/Godot" --headless --path "godot-prototypes/v6-character-prototype" --script "res://tests/runner.gd"`
Expected: FAIL only on missing `context.physics_frame()` helper or other known missing runner/fixture helpers

- [ ] **Step 3: Extend `runner.gd` context and finish the class tests**

Add the missing context API and complete the class test coverage migrated from the old file:

```gdscript
# add into TestContext in tests/runner.gd
func process_frame() -> void:
	await _owner.process_frame


func physics_frame() -> void:
	await _owner.physics_frame
```

Then complete the class suites:

```gdscript
# add to tests/class/test_character_root.gd
func test_character_settles_back_to_floor(assertions, context) -> void:
	var data: Dictionary = await CharacterFixture.instantiate(context)
	var character = data["character"]
	character.queue_jump_intent()
	for _frame: int in range(120):
		if character.is_on_floor():
			break
		await context.physics_frame()
	assertions.check(character.is_on_floor(), "character should settle back onto the floor after the jump test")
```

```gdscript
# add to tests/class/test_char_visual.gd
func test_helper_state_avoids_trivial_accessors(assertions, _context) -> void:
	var source: String = FileAccess.get_file_as_string("res://runtime/char_visual.gd")
	assertions.check(not source.contains("func torso_radius("), "helper state should not expose trivial passthrough accessors")
```

```gdscript
# add to tests/class/test_debug_controller.gd
func test_debug_label_includes_last_explosion_field(assertions, context) -> void:
	var scene: Node3D = await SandboxFixture.instantiate(context)
	var label: Label = SandboxFixture.get_debug_label(scene)
	assertions.check(label.text.contains("Last explosion"), "debug label should show the last explosion field")
```

- [ ] **Step 4: Run test to verify all class tests pass**

Run: `"/Applications/Godot_mono.app/Contents/MacOS/Godot" --headless --path "godot-prototypes/v6-character-prototype" --script "res://tests/runner.gd"`
Expected: PASS for all migrated class tests

- [ ] **Step 5: Commit**

```bash
git add godot-prototypes/v6-character-prototype/tests/class/test_character_root.gd godot-prototypes/v6-character-prototype/tests/class/test_char_visual.gd godot-prototypes/v6-character-prototype/tests/class/test_debug_controller.gd godot-prototypes/v6-character-prototype/tests/runner.gd
git commit -m "test: split v6 class-scoped tests"
```

### Task 4: Split Integration Tests And Remove The Old Monolith

**Files:**
- Create: `godot-prototypes/v6-character-prototype/tests/integration/test_bootstrap.gd`
- Create: `godot-prototypes/v6-character-prototype/tests/integration/test_movement.gd`
- Create: `godot-prototypes/v6-character-prototype/tests/integration/test_explosion.gd`
- Create: `godot-prototypes/v6-character-prototype/tests/integration/test_visual_layout.gd`
- Delete: `godot-prototypes/v6-character-prototype/tests/integration_runner.gd`
- Test: `godot-prototypes/v6-character-prototype/tests/integration/test_bootstrap.gd`
- Test: `godot-prototypes/v6-character-prototype/tests/integration/test_movement.gd`
- Test: `godot-prototypes/v6-character-prototype/tests/integration/test_explosion.gd`
- Test: `godot-prototypes/v6-character-prototype/tests/integration/test_visual_layout.gd`

- [ ] **Step 1: Copy the old integration checks into the new files as failing tests**

Use one behavior-focused file per concern:

```gdscript
# tests/integration/test_bootstrap.gd
extends RefCounted


func test_main_scene_is_minimal_code_first_bootstrap(assertions, _context) -> void:
	var main_scene_source: String = FileAccess.get_file_as_string("res://main.tscn")
	assertions.check(main_scene_source.contains("[node name=\"CharacterSandbox\" type=\"Node3D\"]"), "main.tscn should keep only the root sandbox node")
	assertions.check(not FileAccess.file_exists("res://CharacterPrototype.tscn"), "code-first bootstrap should not keep a separate CharacterPrototype.tscn scene")
```

```gdscript
# tests/integration/test_visual_layout.gd
extends RefCounted

const CharacterFixture := preload("res://tests/fixtures/fixtures_character.gd")
const TestSupport := preload("res://tests/support/test_support.gd")


func test_visual_body_stays_above_floor(assertions, context) -> void:
	var data: Dictionary = await CharacterFixture.instantiate(context)
	var visual_rig: Node3D = data["visual_rig"]
	var visual_lowest_point_y: float = TestSupport.get_visual_lowest_point_y(visual_rig)
	assertions.check(visual_lowest_point_y >= -0.02, "visual body should stay above the floor instead of sinking into it, lowest_y=%.4f" % visual_lowest_point_y)
```

```gdscript
# tests/integration/test_movement.gd
extends RefCounted

const CharacterFixture := preload("res://tests/fixtures/fixtures_character.gd")


func test_jump_and_settle_cycle(assertions, context) -> void:
	var data: Dictionary = await CharacterFixture.instantiate(context)
	var character = data["character"]
	var start_y: float = character.global_position.y
	character.queue_jump_intent()
	for _frame: int in range(20):
		await context.physics_frame()
	assertions.check(character.global_position.y > start_y + 0.2, "queued jump intent should lift the character using the gameplay capsule")
	for _frame: int in range(120):
		if character.is_on_floor():
			break
		await context.physics_frame()
	assertions.check(character.is_on_floor(), "character should settle back onto the floor after the jump test")
```

```gdscript
# tests/integration/test_explosion.gd
extends RefCounted

const CharacterFixture := preload("res://tests/fixtures/fixtures_character.gd")

const TEST_EXPLOSION_DISTANCE: float = 1.8
const TEST_EXPLOSION_FORCE: float = 8.6
const TEST_EXPLOSION_OFFSET: Vector3 = Vector3(0.35, 0.0, 0.45)


func test_explosion_pushes_and_recovers(assertions, context) -> void:
	var data: Dictionary = await CharacterFixture.instantiate(context)
	var character = data["character"]
	var visual_rig: Node3D = data["visual_rig"]
	var left_hand_attachment: BoneAttachment3D = visual_rig.get_node("LeftHandAttachment") as BoneAttachment3D
	var torso_attachment: BoneAttachment3D = visual_rig.get_node("TorsoAttachment") as BoneAttachment3D
	var initial_left_hand_position: Vector3 = left_hand_attachment.position
	var initial_torso_rotation: Vector3 = torso_attachment.rotation
	var explosion_origin: Vector3 = character.global_position + (character.facing_direction * -TEST_EXPLOSION_DISTANCE) + TEST_EXPLOSION_OFFSET
	character.apply_explosion_impulse(explosion_origin, TEST_EXPLOSION_FORCE)
	for _frame: int in range(6):
		await context.physics_frame()
	assertions.check(left_hand_attachment.position.distance_to(initial_left_hand_position) > 0.05, "explosion should visibly move the hand away from its default pose")
	assertions.check(torso_attachment.rotation.distance_to(initial_torso_rotation) > 0.08, "explosion should visibly tilt the torso")
```

- [ ] **Step 2: Run test to verify the migrated integration files fail only because shared support is missing**

Run: `"/Applications/Godot_mono.app/Contents/MacOS/Godot" --headless --path "godot-prototypes/v6-character-prototype" --script "res://tests/runner.gd"`
Expected: FAIL on missing shared support helpers such as `tests/support/test_support.gd`

- [ ] **Step 3: Add shared support helpers and finish the integration coverage**

Create one shared support file extracted from the old monolith:

```gdscript
# tests/support/test_support.gd
extends RefCounted


static func get_capsule_mesh_radius(attachment: BoneAttachment3D) -> float:
	var mesh_instance: MeshInstance3D = _get_first_mesh_child(attachment)
	var mesh: CapsuleMesh = mesh_instance.mesh as CapsuleMesh
	return mesh.radius


static func get_collider_bottom_y(character) -> float:
	var collision_shape: CollisionShape3D = character.get_node("CollisionShape3D") as CollisionShape3D
	var capsule: CapsuleShape3D = collision_shape.shape as CapsuleShape3D
	return collision_shape.global_position.y - (capsule.height * 0.5)


static func get_visual_lowest_point_y(visual_rig: Node3D) -> float:
	var lowest_y: float = INF
	for attachment_name: String in ["TorsoAttachment", "HeadAttachment", "LeftHandAttachment", "RightHandAttachment", "LeftFootAttachment", "RightFootAttachment"]:
		var attachment: Node3D = visual_rig.get_node(attachment_name) as Node3D
		lowest_y = minf(lowest_y, get_mesh_lowest_point_y(attachment))
	return lowest_y
```

Then finish the remaining assertions in the integration files, including the explosion recovery and full visual layout checks migrated from the old monolith.

- [ ] **Step 4: Update the Makefile and remove the old runner**

Change the v6 target:

```make
V6_CHARACTER_TEST := res://tests/runner.gd
```

Delete `godot-prototypes/v6-character-prototype/tests/integration_runner.gd` only after the new suite passes.

- [ ] **Step 5: Run test to verify the full suite passes through the new runner**

Run: `make test-v6-character`
Expected: PASS with `v6-character-prototype tests OK`

- [ ] **Step 6: Commit**

```bash
git add Makefile godot-prototypes/v6-character-prototype/tests
git commit -m "test: split v6 integration suite"
```

### Task 5: Final Verification And Cleanup

**Files:**
- Modify: `godot-prototypes/v6-character-prototype/README.md`
- Test: `godot-prototypes/v6-character-prototype/tests/runner.gd`

- [ ] **Step 1: Update README test wording to match the new runner entrypoint**

Adjust the test section if it references the old monolithic integration runner.

```md
## Test

```bash
cd /Users/oalfonso/pipprojects/canuter
make test-v6-character
```

This runs `res://tests/runner.gd`, which discovers all class and integration tests automatically.
```

- [ ] **Step 2: Run the final verification commands**

Run: `make test-v6-character`
Expected: PASS with `v6-character-prototype tests OK`

Run: `rg -n "integration_runner\\.gd" godot-prototypes/v6-character-prototype`
Expected: no matches

Run: `find godot-prototypes/v6-character-prototype/tests -maxdepth 2 -type f | sort`
Expected: shows `runner.gd`, `class/`, `integration/`, `fixtures/`, and any support files

- [ ] **Step 3: Commit**

```bash
git add godot-prototypes/v6-character-prototype/README.md
git commit -m "docs: describe v6 automatic test suite"
```
