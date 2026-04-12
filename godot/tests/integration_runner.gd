extends SceneTree

const MAIN_SCENE := preload("res://main.tscn")

var _failures: Array[String] = []

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	await _test_pause_menu_opens_with_escape()
	await _test_heading_locked_rotates_camera_and_disables_smoothing()

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

	var initial_rotation := camera.rotation
	player.call("AddMouseDeltaForTesting", Vector2(20.0, 0.0))

	await process_frame
	await physics_frame

	_assert_true(absf(camera.rotation - initial_rotation) > 0.0001, "HeadingLocked mouse movement should rotate the Camera2D")

	main.call("SetViewModeById", 0)
	await process_frame
	await physics_frame
	_assert_true(camera.position_smoothing_enabled, "TopDownFixed camera smoothing should be enabled")

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
