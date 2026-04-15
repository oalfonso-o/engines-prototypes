extends "res://tests/helpers/gut_scene_test.gd"


func test_main_scene_bootstraps_game_root() -> void:
	var scene: Node3D = instantiate_main_scene()
	await process_frames()

	assert_not_null(
		scene.get_node_or_null("GameRoot"),
		"main scene should bootstrap a GameRoot child"
	)
	assert_not_null(
		scene.get_node_or_null("DebugHud"),
		"main scene should bootstrap the restored debug HUD by default"
	)
	assert_not_null(
		scene.get_node_or_null("DebugController"),
		"main scene should bootstrap the restored debug controller by default"
	)


func test_default_map_file_exists() -> void:
	assert_true(
		FileAccess.file_exists("res://maps/default_arena.txt"),
		"default arena map file should exist"
	)
