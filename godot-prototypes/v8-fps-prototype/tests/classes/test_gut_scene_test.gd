extends GutTest


func test_gut_scene_helper_stays_generic_and_does_not_touch_player_internals() -> void:
	var source_file := FileAccess.open("res://tests/helpers/gut_scene_test.gd", FileAccess.READ)
	assert_not_null(source_file, "gut scene helper source should be readable")
	if source_file == null:
		return

	var source_text: String = source_file.get_as_text()
	assert_false(
		source_text.contains("._input_state"),
		"gut scene helper should not reach into player _input_state internals"
	)
	assert_false(
		source_text.contains("._camera_rig"),
		"gut scene helper should not reach into player _camera_rig internals"
	)
