extends SceneTree

const MAIN_SCENE := preload("res://main_3d.tscn")

var _failures: Array[String] = []
var _settings_path := ProjectSettings.globalize_path("user://runtime_settings.cfg")

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	_clear_settings_file()
	await _test_scene_boots_and_camera_tracks_player()
	await _test_gravity_and_jump_force_persist_and_zoom_changes_distance()
	await _test_vertical_mouse_motion_changes_pitch()
	await _test_space_jumps_player()
	await _test_manual_reload_starts_from_partial_magazine()
	await _test_auto_reload_starts_after_emptying_magazine_and_releasing_fire()
	await _test_camera_pitch_changes_shot_direction()
	await _test_hitscan_shows_impact_feedback()
	await _test_persistent_impact_marker_setting_persists()
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
	var initial_spawn_height: float = player.call("GetHeightForTesting")

	for _i in range(120):
		await physics_frame
		if bool(player.call("GetIsOnFloorForTesting")):
			break

	_assert_true(map.get_node("Walls").get_child_count() > 0, "3D map should build wall geometry")
	_assert_true(camera.global_position.distance_to(player.global_position) > 5.0, "3D camera should sit behind/above the player")
	_assert_true(camera.global_position.y > player.global_position.y, "3D camera should be elevated above the player")
	_assert_true(initial_spawn_height >= 0.0, "3D player spawn should start at or above the floor plane")
	_assert_true(bool(player.call("GetIsOnFloorForTesting")), "3D player should settle on the floor after spawn")
	_assert_true(float(player.call("GetHeightForTesting")) >= -0.001, "3D player origin should settle at the floor plane instead of clipping through it")
	var shot_origin: Vector3 = player.call("GetFirePointPositionForTesting")
	_assert_true(absf(shot_origin.x - player.global_position.x) < 0.01 and absf(shot_origin.z - player.global_position.z) < 0.01, "3D shot origin should stay centered on the capsule, not offset forward or sideways")
	_assert_true(shot_origin.y > player.global_position.y + 1.0, "3D shot origin should come from the top-center of the capsule")

	var initial_camera_pos := camera.global_position
	var player_screen_pos := camera.unproject_position(player.global_position + Vector3.UP * 0.9)
	var viewport_size := camera.get_viewport().get_visible_rect().size
	_assert_true(player_screen_pos.y > viewport_size.y * 0.80, "3D camera should keep the player low on screen to leave room for the centered crosshair")
	player.call("AddMouseDeltaForTesting", Vector2(32.0, 0.0))

	await process_frame
	await physics_frame
	await process_frame

	_assert_true(camera.global_position.distance_to(initial_camera_pos) > 0.01, "3D camera should respond to heading changes")

	await _despawn_main(main)

func _test_gravity_and_jump_force_persist_and_zoom_changes_distance() -> void:
	var main := await _spawn_main()
	var rig: Node = main.get_node("CameraRig3D")
	var initial_distance: float = rig.call("GetOrbitDistance")

	var zoom_in := InputEventMouseButton.new()
	zoom_in.pressed = true
	zoom_in.button_index = MOUSE_BUTTON_WHEEL_UP
	Input.parse_input_event(zoom_in)
	await process_frame
	await physics_frame

	var zoomed_distance: float = rig.call("GetOrbitDistance")
	_assert_true(zoomed_distance < initial_distance, "Mouse wheel up should reduce 3D camera orbit distance")

	main.call("SetPrototype3DGravity", 41.5)
	main.call("SetPrototype3DJumpVelocity", 12.5)
	await process_frame
	await physics_frame
	await _despawn_main(main)

	var config := ConfigFile.new()
	var load_result := config.load("user://runtime_settings.cfg")
	var saved_gravity: float = config.get_value("gameplay", "prototype_3d_gravity", 0.0)
	var saved_jump_velocity: float = config.get_value("gameplay", "prototype_3d_jump_velocity", 0.0)
	_assert_true(load_result == OK, "3D runtime settings file should be written to user://")
	_assert_true(absf(saved_gravity - 41.5) < 0.001, "Saved settings should persist 3D gravity")
	_assert_true(absf(saved_jump_velocity - 12.5) < 0.001, "Saved settings should persist 3D jump force")

	var reloaded_main := await _spawn_main()
	var loaded_gravity: float = reloaded_main.call("GetPrototype3DGravity")
	var loaded_jump_velocity: float = reloaded_main.call("GetPrototype3DJumpVelocity")
	_assert_true(absf(loaded_gravity - 41.5) < 0.001, "3D main should load persisted gravity on boot")
	_assert_true(absf(loaded_jump_velocity - 12.5) < 0.001, "3D main should load persisted jump force on boot")
	await _despawn_main(reloaded_main)

func _test_manual_reload_starts_from_partial_magazine() -> void:
	var main := await _spawn_main()
	var player: Node = main.get_node("Player")
	player.call("SetEquippedAmmoForTesting", 5, 90)

	var reload_event := InputEventKey.new()
	reload_event.pressed = true
	reload_event.keycode = KEY_R
	Input.parse_input_event(reload_event)

	await process_frame
	await physics_frame

	_assert_true(bool(player.call("GetIsReloadingForTesting")), "Pressing R should start reload when the magazine is not full")
	await _despawn_main(main)

func _test_auto_reload_starts_after_emptying_magazine_and_releasing_fire() -> void:
	var main := await _spawn_main()
	var player: Node = main.get_node("Player")
	player.call("SetEquippedAmmoForTesting", 1, 90)

	var press_event := InputEventMouseButton.new()
	press_event.pressed = true
	press_event.button_index = MOUSE_BUTTON_LEFT
	Input.parse_input_event(press_event)

	await process_frame
	await physics_frame

	_assert_true(int(player.call("GetEquippedAmmoInMagazineForTesting")) == 0, "Firing the last round should empty the magazine")

	var release_event := InputEventMouseButton.new()
	release_event.pressed = false
	release_event.button_index = MOUSE_BUTTON_LEFT
	Input.parse_input_event(release_event)

	await process_frame
	await physics_frame

	_assert_true(bool(player.call("GetIsReloadingForTesting")), "Releasing fire on an empty magazine should trigger auto reload")
	await _despawn_main(main)

func _test_vertical_mouse_motion_changes_pitch() -> void:
	var main := await _spawn_main()
	var player: Node = main.get_node("Player")
	var initial_pitch: float = player.call("GetCurrentPitchDegreesForTesting")

	player.call("AddMouseDeltaForTesting", Vector2(0.0, -48.0))

	await process_frame
	await physics_frame

	var updated_pitch: float = player.call("GetCurrentPitchDegreesForTesting")
	_assert_true(updated_pitch < initial_pitch, "Moving the mouse up should lower camera pitch in TPS aim mode")
	await _despawn_main(main)

func _test_space_jumps_player() -> void:
	var main := await _spawn_main()
	var player: Node = main.get_node("Player")

	for _i in range(120):
		await physics_frame
		if bool(player.call("GetIsOnFloorForTesting")):
			break

	var initial_height: float = player.call("GetHeightForTesting")

	player.call("RequestJumpForTesting")

	await physics_frame
	var vertical_velocity: float = player.call("GetVerticalVelocityForTesting")

	for _i in range(6):
		await physics_frame

	var jumped_height: float = player.call("GetHeightForTesting")
	_assert_true(vertical_velocity > 0.1, "Pressing Space should give the player upward velocity")
	_assert_true(jumped_height > initial_height + 0.05, "Pressing Space should make the player jump")
	await _despawn_main(main)

func _test_camera_pitch_changes_shot_direction() -> void:
	var main := await _spawn_main()
	var player: Node = main.get_node("Player")

	player.call("SetPitchDegrees", 0.0)
	await process_frame
	await physics_frame
	await process_frame

	var shallow_aim: Vector3 = player.call("GetCurrentAimForward3DForTesting")
	player.call("SetPitchDegrees", 50.0)
	await process_frame
	await physics_frame
	await process_frame

	var steep_aim: Vector3 = player.call("GetCurrentAimForward3DForTesting")
	_assert_true(
		steep_aim.distance_to(shallow_aim) > 0.05 and absf(steep_aim.y - shallow_aim.y) > 0.02,
		"Changing camera pitch should change the centered crosshair aim direction")
	await _despawn_main(main)

func _test_hitscan_shows_impact_feedback() -> void:
	var main := await _spawn_main()
	var player: Node = main.get_node("Player")

	for _i in range(120):
		await physics_frame
		if bool(player.call("GetIsOnFloorForTesting")):
			break

	player.call("FireEquippedWeaponForTesting")
	await process_frame
	await physics_frame

	_assert_true(bool(player.call("GetImpactMarkerVisibleForTesting")), "Hitscan fire should show an impact marker at the hit point")
	await _despawn_main(main)

func _test_persistent_impact_marker_setting_persists() -> void:
	var main := await _spawn_main()
	main.call("SetPersistentImpactMarkersEnabled", true)
	await process_frame
	await physics_frame
	await _despawn_main(main)

	var config := ConfigFile.new()
	var load_result := config.load("user://runtime_settings.cfg")
	var saved_enabled: bool = config.get_value("gameplay", "persistent_impact_markers_enabled", false)
	_assert_true(load_result == OK, "3D runtime settings file should be written to user://")
	_assert_true(saved_enabled, "Persistent impact marker setting should persist to user://")

	var reloaded_main := await _spawn_main()
	_assert_true(bool(reloaded_main.call("GetPersistentImpactMarkersEnabled")), "3D main should load persisted impact-marker setting on boot")
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
