extends "res://tests/helpers/gut_scene_test.gd"

const BuildingLayoutScript := preload("res://runtime/logic/building_layout.gd")
const PlayerTestDriverScript := preload("res://tests/helpers/player_test_driver.gd")


func test_primitives_demo_spawns_grounded_player_and_building() -> void:
	var packed_scene: PackedScene = load("res://BuildingPrimitivesDemo.tscn") as PackedScene
	assert_not_null(packed_scene, "primitives demo scene should exist")
	if packed_scene == null:
		return

	var scene: Node3D = packed_scene.instantiate() as Node3D
	add_scene_root(scene)
	await settle_frames(6)

	var player: CharacterBody3D = scene.get_node_or_null("Player") as CharacterBody3D
	assert_not_null(player, "primitives demo should spawn a player")
	if player == null:
		return
	assert_not_null(scene.get_node_or_null("Ground"), "primitives demo should build exterior ground")
	assert_not_null(scene.get_node_or_null("BuildingRoot"), "primitives demo should build the comparison building")
	assert_true(player.is_on_floor(), "player should be grounded after spawn")


func test_primitives_demo_allows_forward_progress_toward_building() -> void:
	var packed_scene: PackedScene = load("res://BuildingPrimitivesDemo.tscn") as PackedScene
	assert_not_null(packed_scene, "primitives demo scene should exist")
	if packed_scene == null:
		return

	var scene: Node3D = packed_scene.instantiate() as Node3D
	add_scene_root(scene)
	await settle_frames(6)

	var player: CharacterBody3D = scene.get_node_or_null("Player") as CharacterBody3D
	assert_not_null(player, "primitives demo should spawn a player")
	if player == null:
		return

	var start_z: float = player.global_position.z
	PlayerTestDriverScript.set_move_intent(player, Vector2(0.0, -1.0))
	for _frame_index: int in range(24):
		await physics_frames()
	PlayerTestDriverScript.clear_move_intent(player)

	assert_true(player.global_position.z < start_z - 1.0, "player should be able to approach the building")


func test_primitives_demo_allows_player_to_enter_through_front_opening() -> void:
	var scene: Node3D = await _instantiate_primitives_scene()
	if scene == null:
		return

	var player: CharacterBody3D = scene.get_node_or_null("Player") as CharacterBody3D
	assert_not_null(player, "primitives demo should spawn a player")
	if player == null:
		return

	var reached_entrance: bool = await _move_player_to(player, Vector3(0.0, 0.0, 2.0), 240)

	assert_true(reached_entrance, "player should be able to reach the entrance lane")
	assert_true(player.global_position.z < 3.0, "player should move inside the building through the front entrance")
	assert_true(absf(player.global_position.x) < 1.5, "entrance path should keep the player near the central doorway")
	assert_true(player.is_on_floor(), "player should remain grounded while entering the building")


func test_primitives_demo_supports_upward_progression_on_ground_left_stairs() -> void:
	var scene: Node3D = await _instantiate_primitives_scene()
	if scene == null:
		return

	var player: CharacterBody3D = scene.get_node_or_null("Player") as CharacterBody3D
	assert_not_null(player, "primitives demo should spawn a player")
	if player == null:
		return

	var reached_entrance: bool = await _move_player_to(player, Vector3(0.0, 0.0, 2.0), 240)
	var reached_stair_base: bool = await _move_player_to(player, Vector3(-3.8, 0.0, 2.2), 160)
	var reached_mid_stair: bool = await _move_player_to(player, Vector3(-3.8, 1.6, 0.4), 220)
	var reached_upper_target: bool = await _move_player_to(player, Vector3(-3.8, BuildingLayoutScript.FLOOR_HEIGHT + 0.2, -1.7), 320)

	assert_true(reached_entrance, "player should be able to reach the interior entrance before climbing")
	assert_true(reached_stair_base, "player should be able to reach the left stair base")
	assert_true(reached_mid_stair, "player should be able to progress up the left stair run")
	assert_true(reached_upper_target, "player should be able to complete the left stair climb")
	assert_true(player.global_position.y > 2.2, "player should be able to reach a higher level via the left stair route")
	assert_true(player.global_position.x < -2.2, "upward route should use the left-side stair path")
	assert_true(player.global_position.z < -1.0, "left stair climb should progress into the interior circulation zone ahead of the back-room divider")
	assert_true(player.is_on_floor(), "player should remain grounded after climbing the stairs")


func _instantiate_primitives_scene() -> Node3D:
	var packed_scene: PackedScene = load("res://BuildingPrimitivesDemo.tscn") as PackedScene
	assert_not_null(packed_scene, "primitives demo scene should exist")
	if packed_scene == null:
		return null

	var scene: Node3D = packed_scene.instantiate() as Node3D
	add_scene_root(scene)
	await settle_frames(6)
	return scene


func _move_player_to(player: CharacterBody3D, target_position: Vector3, frame_budget: int) -> bool:
	for _frame_index: int in range(frame_budget):
		PlayerTestDriverScript.aim_at_world_point(player, target_position)
		PlayerTestDriverScript.set_move_intent(player, Vector2(0.0, -1.0))
		await physics_frames()
		if _is_player_near_target(player, target_position):
			PlayerTestDriverScript.clear_move_intent(player)
			return true
	PlayerTestDriverScript.clear_move_intent(player)
	return _is_player_near_target(player, target_position)


func _is_player_near_target(player: CharacterBody3D, target_position: Vector3) -> bool:
	var horizontal_delta: Vector2 = Vector2(
		player.global_position.x - target_position.x,
		player.global_position.z - target_position.z
	)
	return horizontal_delta.length() <= 0.9 and absf(player.global_position.y - target_position.y) <= 1.2
