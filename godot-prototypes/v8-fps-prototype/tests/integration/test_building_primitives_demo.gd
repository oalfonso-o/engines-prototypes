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

	var player: CharacterBody3D = scene.get_node_or_null("Player") as CharacterBody3D
	assert_not_null(player, "primitives demo should spawn a player")
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
