extends RefCounted


func test_main_scene_bootstraps_game_root(assertions, context) -> void:
	var scene: Node3D = context.instantiate_main_scene()
	await context.process_frame()

	assertions.check(
		scene.get_node_or_null("GameRoot") != null,
		"main scene should bootstrap a GameRoot child"
	)


func test_default_map_file_exists(assertions, _context) -> void:
	assertions.check(
		FileAccess.file_exists("res://maps/default_arena.txt"),
		"default arena map file should exist"
	)
