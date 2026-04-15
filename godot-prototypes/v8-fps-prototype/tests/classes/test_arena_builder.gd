extends GutTest


func test_arena_builder_keeps_geometry_construction_out_of_root_private_methods() -> void:
	var source_file := FileAccess.open("res://runtime/engine/arena_builder.gd", FileAccess.READ)
	assert_not_null(source_file, "arena_builder source should be readable")
	if source_file == null:
		return

	var source_text: String = source_file.get_as_text()
	assert_false(
		source_text.contains("func _build_floor"),
		"arena_builder root should not keep a private _build_floor helper"
	)
	assert_false(
		source_text.contains("func _build_block"),
		"arena_builder root should not keep a private _build_block helper"
	)
