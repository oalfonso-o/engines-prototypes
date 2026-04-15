extends "res://tests/helpers/gut_scene_test.gd"


func test_game_root_builds_player_and_enemy_nodes_from_map() -> void:
	var scene: Node3D = instantiate_main_scene()
	await process_frames()

	var game_root: Node3D = scene.get_node_or_null("GameRoot") as Node3D
	assert_not_null(game_root, "main scene should create GameRoot")
	if game_root == null:
		return

	assert_not_null(game_root.get_node_or_null("Player"), "game root should create the player from the map")
	var enemies_root: Node3D = game_root.get_node_or_null("Enemies") as Node3D
	assert_not_null(enemies_root, "game root should create an Enemies container")
	if enemies_root == null:
		return

	assert_eq(enemies_root.get_child_count(), 4, "game root should spawn four enemies from the default map")
