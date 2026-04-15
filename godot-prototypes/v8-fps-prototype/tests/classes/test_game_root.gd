extends GutTest


func test_game_root_does_not_keep_unused_debug_export() -> void:
	var source_file := FileAccess.open("res://runtime/engine/game_root.gd", FileAccess.READ)
	assert_not_null(source_file, "game_root source should be readable")
	if source_file == null:
		return

	var source_text: String = source_file.get_as_text()
	assert_false(
		source_text.contains("explosion_debug_flash_time"),
		"game_root should not keep the unused explosion_debug_flash_time export"
	)
