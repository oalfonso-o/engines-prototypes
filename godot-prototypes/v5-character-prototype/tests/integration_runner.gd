extends SceneTree

const MAIN_SCENE := preload("res://main.tscn")

const EXPECTED_BONES: PackedStringArray = [
	"root",
	"torso",
	"head",
	"left_hand",
	"right_hand",
	"left_foot",
	"right_foot",
]

var failures: Array[String] = []


func _initialize() -> void:
	await _run()
	if failures.is_empty():
		print("v5-character-prototype integration OK")
		quit(0)
	else:
		for failure: String in failures:
			push_error(failure)
		quit(1)


func _run() -> void:
	var scene: Node3D = MAIN_SCENE.instantiate()
	root.add_child(scene)

	for _frame: int in range(12):
		await process_frame
		await physics_frame

	var sandbox = scene
	var character = sandbox.get_character()
	var skeleton: Skeleton3D = character.get_node("VisualRoot/Skeleton3D")
	var floor: StaticBody3D = scene.get_node("Floor")

	_assert(floor != null, "sandbox should contain a test floor")
	_assert(skeleton != null, "character should contain a Skeleton3D")
	_assert(character.has_vertical_capsule_collider(), "character must use one vertical capsule collider as the gameplay body")
	var collider_bottom_y: float = character.get_collider_bottom_y()
	_assert(absf(collider_bottom_y) <= 0.12, "capsule bottom should stay very close to floor level, got %.3f" % collider_bottom_y)
	_assert(character.get_visual_lowest_point_y() >= -0.02, "visual body should stay above the floor instead of sinking into it")
	for bone_name: String in EXPECTED_BONES:
		_assert(skeleton.find_bone(bone_name) != -1, "missing expected bone: %s" % bone_name)

	_assert(skeleton.has_node("TorsoAttachment"), "torso attachment should exist")
	_assert(skeleton.has_node("HeadAttachment"), "head attachment should exist")
	_assert(skeleton.has_node("LeftHandAttachment"), "left hand attachment should exist")
	_assert(skeleton.has_node("RightHandAttachment"), "right hand attachment should exist")
	_assert(skeleton.has_node("LeftFootAttachment"), "left foot attachment should exist")
	_assert(skeleton.has_node("RightFootAttachment"), "right foot attachment should exist")

	var start_y: float = character.global_position.y
	sandbox.trigger_test_explosion()
	for _frame: int in range(6):
		await physics_frame

	var reaction_state: Dictionary = character.get_reaction_debug_state()
	var explosion_origin: Vector3 = sandbox.get_last_explosion_origin()
	var horizontal_velocity: Vector3 = Vector3(character.velocity.x, 0.0, character.velocity.z)
	var away_direction: Vector3 = character.global_position - explosion_origin
	away_direction.y = 0.0
	away_direction = away_direction.normalized()

	_assert(reaction_state["strength"] > 0.2, "explosion should trigger a visible reaction state")
	_assert(character.velocity.y > 0.0 or character.global_position.y > start_y, "explosion should add upward impulse")
	_assert(horizontal_velocity.dot(away_direction) > 0.1, "explosion should push the character away from the origin")

	for _frame: int in range(150):
		await physics_frame

	reaction_state = character.get_reaction_debug_state()
	_assert(reaction_state["strength"] < 0.05, "reaction state should recover smoothly back to idle")

	scene.queue_free()
	await process_frame


func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
