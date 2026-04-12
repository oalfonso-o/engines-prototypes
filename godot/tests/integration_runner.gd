extends SceneTree

const MAIN_SCENE := preload("res://main.tscn")

var _failures: Array[String] = []
var _settings_path := ProjectSettings.globalize_path("user://runtime_settings.cfg")

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	_clear_settings_file()
	await _test_pause_menu_opens_with_escape()
	await _test_heading_locked_rotates_camera_and_disables_smoothing()
	await _test_heading_locked_perspective_debug_overlay_visibility()
	await _test_settings_persist_between_scene_boots()

	if _failures.is_empty():
		print("Godot integration tests passed")
		quit(0)
		return

	for failure in _failures:
		push_error(failure)

	quit(1)

func _test_pause_menu_opens_with_escape() -> void:
	var main := await _spawn_main()
	var overlay: Control = main.get_node("Hud/PauseMenuOverlay")
	_assert_true(not overlay.visible, "Pause menu should start hidden")

	var event := InputEventKey.new()
	event.pressed = true
	event.keycode = KEY_ESCAPE
	Input.parse_input_event(event)

	await process_frame
	await physics_frame

	_assert_true(overlay.visible, "Pause menu should become visible after ESC")
	_assert_true(main.call("GetPauseScreenId") == 1, "Pause menu state should be Pause after ESC")

	await _despawn_main(main)

func _test_heading_locked_rotates_camera_and_disables_smoothing() -> void:
	var main := await _spawn_main()
	main.call("SetViewModeById", 1)

	await process_frame
	await physics_frame

	var player: Node = main.get_node("Player")
	var camera: Camera2D = player.get_node("Camera2D")
	_assert_true(not camera.ignore_rotation, "HeadingLocked camera should respect rotation")
	_assert_true(not camera.position_smoothing_enabled, "HeadingLocked camera smoothing should be disabled")
	_assert_true(camera.position.length() > 0.001, "HeadingLocked camera should start with a forward look-ahead offset")
	_assert_true(camera.position.y > 0.0, "HeadingLocked camera should bias forward from the player origin")

	var initial_rotation := camera.rotation
	player.call("AddMouseDeltaForTesting", Vector2(20.0, 0.0))

	await process_frame
	await physics_frame

	_assert_true(absf(camera.rotation - initial_rotation) > 0.0001, "HeadingLocked mouse movement should rotate the Camera2D")
	_assert_true(camera.position.length() > 0.001, "HeadingLocked camera should remain offset away from the player origin")

	main.call("SetViewModeById", 0)
	await process_frame
	await physics_frame
	_assert_true(camera.position_smoothing_enabled, "TopDownFixed camera smoothing should be enabled")
	_assert_true(camera.position.length() < 0.001, "TopDownFixed camera should return to a centered follow position")

	await _despawn_main(main)

func _test_heading_locked_perspective_debug_overlay_visibility() -> void:
	var main := await _spawn_main()
	var overlay: Control = main.get_node("Hud/HeadingLockedPerspectiveDebugOverlay")
	var map: CanvasItem = main.get_node("Map")

	await process_frame
	await physics_frame
	_assert_true(not overlay.visible, "Perspective debug overlay should stay hidden in TopDownFixed")
	_assert_true(map.visible, "TopDownFixed should keep the top-down map visible")

	main.call("SetViewModeById", 1)
	await process_frame
	await physics_frame
	_assert_true(overlay.visible, "Perspective debug overlay should become visible in HeadingLocked")
	_assert_true(not map.visible, "HeadingLocked should hide the top-down map renderer")

	main.call("SetViewModeById", 0)
	await process_frame
	await physics_frame
	_assert_true(not overlay.visible, "Perspective debug overlay should hide again after returning to TopDownFixed")
	_assert_true(map.visible, "Returning to TopDownFixed should restore the top-down map renderer")

	await _despawn_main(main)

func _spawn_main() -> Node:
	var main := MAIN_SCENE.instantiate()
	root.add_child(main)
	await process_frame
	await physics_frame
	return main

func _despawn_main(main: Node) -> void:
	if is_instance_valid(main):
		main.queue_free()
		await process_frame
		await physics_frame

func _assert_true(condition: bool, message: String) -> void:
	if condition:
		return

	_failures.append(message)

func _test_settings_persist_between_scene_boots() -> void:
	var main := await _spawn_main()
	main.call("SetViewModeById", 1)
	main.call("SetHeadingLockedTurnSensitivity", 0.0065)
	await process_frame
	await physics_frame
	await _despawn_main(main)

	var config := ConfigFile.new()
	var load_result := config.load("user://runtime_settings.cfg")
	_assert_true(load_result == OK, "Runtime settings file should be written to user://")
	_assert_true(int(config.get_value("gameplay", "view_mode", 0)) == 1, "Saved settings should persist HeadingLocked view mode")
	_assert_true(absf(float(config.get_value("gameplay", "heading_locked_turn_sensitivity", 0.0)) - 0.0065) < 0.0001, "Saved settings should persist heading sensitivity")

	var reloaded_main := await _spawn_main()
	_assert_true(reloaded_main.call("GetCurrentViewModeId") == 1, "Main should load persisted view mode on boot")
	_assert_true(absf(float(reloaded_main.call("GetHeadingLockedTurnSensitivity")) - 0.0065) < 0.0001, "Main should load persisted heading sensitivity on boot")
	await _despawn_main(reloaded_main)

func _clear_settings_file() -> void:
	if FileAccess.file_exists("user://runtime_settings.cfg"):
		DirAccess.remove_absolute(_settings_path)
