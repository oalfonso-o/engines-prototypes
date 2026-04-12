extends SceneTree

const MAIN_SCENE := preload("res://main_3d.tscn")

var _failures: Array[String] = []
var _settings_path := ProjectSettings.globalize_path("user://runtime_settings.cfg")

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	_clear_settings_file()
	await _test_scene_boots_and_camera_tracks_player()
	await _test_camera_angle_persists_and_zoom_changes_distance()
	await _test_pause_menu_opens_with_escape()

	if _failures.is_empty():
		print("Godot 3D integration tests passed")
		quit(0)
		return

	for failure in _failures:
		push_error(failure)

	quit(1)

func _test_scene_boots_and_camera_tracks_player() -> void:
	var main := await _spawn_main()
	var player: Node3D = main.get_node("Player")
	var camera: Camera3D = main.get_node("CameraRig3D/Camera3D")
	var map: Node3D = main.get_node("Map")

	_assert_true(map.get_node("Walls").get_child_count() > 0, "3D map should build wall geometry")
	_assert_true(camera.global_position.distance_to(player.global_position) > 5.0, "3D camera should sit behind/above the player")
	_assert_true(camera.global_position.y > player.global_position.y, "3D camera should be elevated above the player")

	var initial_camera_pos := camera.global_position
	player.call("AddMouseDeltaForTesting", Vector2(32.0, 0.0))

	await process_frame
	await physics_frame
	await process_frame

	_assert_true(camera.global_position.distance_to(initial_camera_pos) > 0.01, "3D camera should respond to heading changes")

	await _despawn_main(main)

func _test_camera_angle_persists_and_zoom_changes_distance() -> void:
	var main := await _spawn_main()
	var rig: Node = main.get_node("CameraRig3D")
	var initial_distance: float = rig.call("GetOrbitDistance")

	main.call("SetPrototype3DCameraPitchDegrees", 40.0)
	await process_frame
	await physics_frame

	var zoom_in := InputEventMouseButton.new()
	zoom_in.pressed = true
	zoom_in.button_index = MOUSE_BUTTON_WHEEL_UP
	Input.parse_input_event(zoom_in)
	await process_frame
	await physics_frame

	var zoomed_distance: float = rig.call("GetOrbitDistance")
	_assert_true(zoomed_distance < initial_distance, "Mouse wheel up should reduce 3D camera orbit distance")

	main.call("SetPrototype3DCameraPitchDegrees", 55.0)
	await process_frame
	await physics_frame
	await _despawn_main(main)

	var config := ConfigFile.new()
	var load_result := config.load("user://runtime_settings.cfg")
	var saved_pitch: float = config.get_value("gameplay", "prototype_3d_camera_pitch_degrees", 0.0)
	_assert_true(load_result == OK, "3D runtime settings file should be written to user://")
	_assert_true(absf(saved_pitch - 55.0) < 0.001, "Saved settings should persist 3D camera angle")

	var reloaded_main := await _spawn_main()
	var loaded_pitch: float = reloaded_main.call("GetPrototype3DCameraPitchDegrees")
	_assert_true(absf(loaded_pitch - 55.0) < 0.001, "3D main should load persisted camera angle on boot")
	await _despawn_main(reloaded_main)

func _test_pause_menu_opens_with_escape() -> void:
	var main := await _spawn_main()
	var overlay: Control = main.get_node("Hud/PauseMenuOverlay")
	_assert_true(not overlay.visible, "3D pause menu should start hidden")

	var event := InputEventKey.new()
	event.pressed = true
	event.keycode = KEY_ESCAPE
	Input.parse_input_event(event)

	await process_frame
	await physics_frame

	_assert_true(overlay.visible, "3D pause menu should become visible after ESC")

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

func _clear_settings_file() -> void:
	if FileAccess.file_exists("user://runtime_settings.cfg"):
		DirAccess.remove_absolute(_settings_path)
