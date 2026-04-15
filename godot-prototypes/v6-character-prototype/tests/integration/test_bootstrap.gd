extends RefCounted


func test_main_scene_is_minimal_code_first_bootstrap(assertions, _context) -> void:
	var main_scene_source: String = FileAccess.get_file_as_string("res://main.tscn")

	assertions.check(
		FileAccess.file_exists("res://main.tscn"),
		"main.tscn should exist as the bootstrap entrypoint"
	)
	assertions.check(
		main_scene_source.contains("[node name=\"CharacterSandbox\" type=\"Node3D\"]"),
		"main.tscn should keep only the root sandbox node"
	)
	assertions.check(
		not FileAccess.file_exists("res://CharacterPrototype.tscn"),
		"code-first bootstrap should not keep a separate CharacterPrototype.tscn scene"
	)
	assertions.check(
		not main_scene_source.contains("[node name=\"WorldEnvironment\""),
		"main.tscn should not predeclare world nodes when bootstrap is code-first"
	)
	assertions.check(
		not main_scene_source.contains("CharacterPrototype.tscn"),
		"main.tscn should not instance the character scene when bootstrap is code-first"
	)
	assertions.check(
		not main_scene_source.contains("debug/sandbox_debug.gd"),
		"main.tscn should not wire the debug controller directly when bootstrap is code-first"
	)
