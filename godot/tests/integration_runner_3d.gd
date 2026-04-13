extends SceneTree

const MAIN_SCENE := preload("res://main_3d.tscn")

var _failures: Array[String] = []
var _settings_path := ProjectSettings.globalize_path("user://runtime_settings.cfg")

func _initialize() -> void:
	call_deferred("_run")

func _run() -> void:
	_clear_settings_file()
	await _test_old_settings_file_is_regenerated_with_new_defaults()
	await _test_scene_boots_and_camera_tracks_player()
	await _test_player_uses_humanoid_visual_rig()
	await _test_player_body_rotates_with_camera_yaw()
	await _test_player_torso_tracks_vertical_aim_pitch()
	await _test_player_visual_rig_animates_while_moving()
	await _test_targets_rest_on_ground_and_use_peg_feet()
	await _test_damage_zones_apply_distinct_damage_values()
	await _test_shift_crouch_transition_is_gradual_and_reversible()
	await _test_ctrl_prone_priority_falls_back_to_crouch_on_release()
	await _test_prone_rotates_and_can_fire_from_head_anchor()
	await _test_low_ceiling_blocks_return_to_standing_posture()
	await _test_gravity_and_jump_force_persist_and_zoom_changes_distance()
	await _test_v_toggles_between_fps_and_last_tps_zoom()
	await _test_camera_settings_persist()
	await _test_load_defaults_restores_current_defaults()
	await _test_player_body_fades_when_zoomed_in()
	await _test_vertical_mouse_motion_changes_pitch()
	await _test_pitch_can_aim_up_into_the_sky()
	await _test_pitch_is_clamped_before_crosshair_moves_below_player_feet()
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

func _test_old_settings_file_is_regenerated_with_new_defaults() -> void:
	var config := ConfigFile.new()
	config.set_value("meta", "schema_version", 1)
	config.set_value("gameplay", "prototype_3d_gravity", 77.0)
	config.set_value("gameplay", "prototype_3d_camera_orbit_distance", 3.0)
	config.set_value("gameplay", "prototype_3d_camera_zoom_rail_pitch_degrees", 88.0)
	config.set_value("gameplay", "prototype_3d_camera_min_orbit_distance", 0.1)
	config.set_value("gameplay", "prototype_3d_camera_max_orbit_distance", 10.0)
	config.set_value("gameplay", "prototype_3d_camera_zoom_step", 9.0)
	config.set_value("gameplay", "prototype_3d_camera_look_ahead_distance", 5.0)
	config.save("user://runtime_settings.cfg")

	var main := await _spawn_main()
	_assert_true(absf(main.call("GetPrototype3DGravity") - 50.0) < 0.001, "Old settings cfg should be discarded so gravity falls back to the new default")
	_assert_true(absf(main.call("GetPrototype3DCameraOrbitDistance") - 10.0) < 0.001, "Old settings cfg should be discarded so camera distance falls back to the new default")
	_assert_true(absf(main.call("GetPrototype3DCameraZoomRailPitchDegrees") - 20.0) < 0.001, "Old settings cfg should be discarded so camera rail pitch falls back to the new default")
	_assert_true(absf(main.call("GetPrototype3DCameraMinOrbitDistance") - 0.6) < 0.001, "Old settings cfg should be discarded so camera min distance falls back to the new default")
	_assert_true(absf(main.call("GetPrototype3DCameraMaxOrbitDistance") - 10.0) < 0.001, "Old settings cfg should be discarded so camera max distance falls back to the new default")
	_assert_true(absf(main.call("GetPrototype3DCameraZoomStep") - 1.0) < 0.001, "Old settings cfg should be discarded so camera zoom step falls back to the new default")
	_assert_true(absf(main.call("GetPrototype3DCameraLookAheadDistance") - 100.0) < 0.001, "Old settings cfg should be discarded so camera look-ahead falls back to the new default")
	_assert_true(absf(main.call("GetPrototype3DCameraFov") - 40.0) < 0.001, "Old settings cfg should be discarded so camera FOV falls back to the new default")
	_assert_true(bool(main.call("GetPersistentImpactMarkersEnabled")), "Old settings cfg should be discarded so keep hit markers falls back to the new default")
	await _despawn_main(main)

	var reloaded := ConfigFile.new()
	var load_result := reloaded.load("user://runtime_settings.cfg")
	_assert_true(load_result == OK, "Discarding an old settings cfg should regenerate a new settings file")
	_assert_true(int(reloaded.get_value("meta", "schema_version", 0)) == 2, "Regenerated settings cfg should store the current schema version")

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
	_assert_true(absf(shot_origin.x - player.global_position.x) < 0.01 and absf(shot_origin.z - player.global_position.z) < 0.05, "3D standing shot origin should stay nearly centered while upright")
	_assert_true(shot_origin.y > player.global_position.y + 1.65, "3D shot origin should sit high on the head anchor so FPS view and firing both come from the upper body")

	var initial_camera_pos := camera.global_position
	var initial_zoom_rail := (initial_camera_pos - shot_origin).normalized()
	var player_screen_pos := camera.unproject_position(player.global_position + Vector3.UP * 0.9)
	var viewport_size := camera.get_viewport().get_visible_rect().size
	_assert_true(
		player_screen_pos.y >= 0.0 and player_screen_pos.y <= viewport_size.y,
		"3D camera should keep the player visible on screen in third person (y=%s viewport_height=%s)" % [
			str(player_screen_pos.y),
			str(viewport_size.y),
		])

	var rig: Node = main.get_node("CameraRig3D")
	rig.call("AdjustOrbitDistance", -1)
	await process_frame
	await physics_frame
	var zoomed_camera_pos := camera.global_position
	var zoomed_zoom_rail := (zoomed_camera_pos - shot_origin).normalized()
	_assert_true(
		initial_zoom_rail.dot(zoomed_zoom_rail) > 0.999,
		"3D zoom should move the camera along a straight rail toward the player")
	player.call("AddMouseDeltaForTesting", Vector2(32.0, 0.0))

	await process_frame
	await physics_frame
	await process_frame

	_assert_true(camera.global_position.distance_to(initial_camera_pos) > 0.01, "3D camera should respond to heading changes")

	await _despawn_main(main)

func _test_player_uses_humanoid_visual_rig() -> void:
	var main := await _spawn_main()
	var player: Node = main.get_node("Player")
	var shot_origin: Vector3 = player.call("GetFirePointPositionForTesting")

	_assert_true(bool(player.call("HasHumanoidRigForTesting")), "Player should build the humanoid visual rig with head, hands, and feet meshes")
	_assert_true(float(player.call("GetVisualTopForTesting")) > shot_origin.y, "Player visual rig should extend above the weapon fire point to read as a taller humanoid body")
	_assert_true(bool(player.call("FeetUsePegMeshesForTesting")), "Player feet should use peg-like box meshes instead of round spheres")
	_assert_true(absf(player.call("GetShotOriginLocalPositionForTesting").z) < 0.05, "Standing shot origin should stay centered in local forward/back space while upright")
	await _despawn_main(main)

func _test_player_body_rotates_with_camera_yaw() -> void:
	var main := await _spawn_main()
	var player: Node = main.get_node("Player")
	var initial_yaw: float = player.call("GetBodyYawRadiansForTesting")
	player.call("AddMouseDeltaForTesting", Vector2(64.0, 0.0))

	await process_frame
	await physics_frame
	await process_frame

	var updated_yaw: float = player.call("GetBodyYawRadiansForTesting")
	_assert_true(absf(updated_yaw - initial_yaw) > 0.01, "Player root should rotate with the camera yaw instead of leaving the body behind")
	await _despawn_main(main)

func _test_player_torso_tracks_vertical_aim_pitch() -> void:
	var main := await _spawn_main()
	var player: Node = main.get_node("Player")
	var initial_torso_rotation: Vector3 = player.call("GetTorsoRotationDegreesForTesting")
	player.call("AddMouseDeltaForTesting", Vector2(0.0, -48.0))

	await process_frame
	await physics_frame
	await process_frame

	var updated_torso_rotation: Vector3 = player.call("GetTorsoRotationDegreesForTesting")
	_assert_true(absf(updated_torso_rotation.x - initial_torso_rotation.x) > 0.5, "Player torso should track vertical aim so the body looks toward the crosshair")
	await _despawn_main(main)

func _test_player_visual_rig_animates_while_moving() -> void:
	var main := await _spawn_main()
	var player: Node = main.get_node("Player")
	var initial_left_foot: Vector3 = player.call("GetLeftFootPositionForTesting")
	var initial_right_hand: Vector3 = player.call("GetRightHandPositionForTesting")
	Input.action_press("move_up")

	for _i in range(24):
		await physics_frame

	Input.action_release("move_up")
	var moved_left_foot: Vector3 = player.call("GetLeftFootPositionForTesting")
	var moved_right_hand: Vector3 = player.call("GetRightHandPositionForTesting")
	_assert_true(moved_left_foot.distance_to(initial_left_foot) > 0.02, "Walking should animate the peg feet instead of leaving them rigid")
	_assert_true(moved_right_hand.distance_to(initial_right_hand) > 0.015, "Walking should animate the weapon-hold hands instead of leaving them rigid")
	await _despawn_main(main)

func _test_targets_rest_on_ground_and_use_peg_feet() -> void:
	var main := await _spawn_main()
	var target_root: Node = main.get_node("Map/Targets")
	var target: Node = target_root.get_child(0)
	_assert_true(absf(float(target.call("GetVisualBottomForTesting"))) < 0.001, "Dummy targets should rest on the ground plane instead of floating above it")
	_assert_true(bool(target.call("FeetUsePegMeshesForTesting")), "Dummy targets should use peg-like feet instead of spheres")
	await _despawn_main(main)

func _test_damage_zones_apply_distinct_damage_values() -> void:
	var main := await _spawn_main()
	var target_root: Node = main.get_node("Map/Targets")
	var target: Node = target_root.get_child(0)

	target.call("SetHealthForTesting", 100)
	target.call("ApplyZoneDamageForTesting", "head", 20)
	_assert_true(int(target.call("GetHealthForTesting")) == 60, "Head damage zone should apply a higher damage multiplier than torso")

	target.call("SetHealthForTesting", 100)
	target.call("ApplyZoneDamageForTesting", "left_foot", 20)
	_assert_true(int(target.call("GetHealthForTesting")) == 86, "Foot damage zone should apply a lower damage multiplier than torso")
	await _despawn_main(main)

func _test_shift_crouch_transition_is_gradual_and_reversible() -> void:
	var main := await _spawn_main()
	var player: Node = main.get_node("Player")
	Input.action_press("crouch_posture")

	for _i in range(15):
		await physics_frame

	var half_posture: float = player.call("GetCurrentPostureValueForTesting")
	_assert_true(int(player.call("GetRequestedPostureIdForTesting")) == 1, "Holding Shift should request crouch posture")
	_assert_true(half_posture > 0.15 and half_posture < 0.35, "Crouch posture should animate gradually instead of snapping instantly")
	_assert_true(absf(player.call("GetEffectiveMoveSpeedForTesting") - 11.0) < 0.001, "Crouch speed penalty should apply immediately while the pose is still transitioning")

	for _i in range(20):
		await physics_frame

	_assert_true(absf(player.call("GetCurrentPostureValueForTesting") - 0.5) < 0.05, "Holding Shift for half a second should reach crouch posture")

	Input.action_release("crouch_posture")
	await physics_frame
	_assert_true(absf(player.call("GetEffectiveMoveSpeedForTesting") - 20.0) < 0.001, "Releasing Shift should restore standing move speed immediately")

	for _i in range(35):
		await physics_frame

	_assert_true(absf(player.call("GetCurrentPostureValueForTesting")) < 0.05, "Releasing Shift should animate the player back to standing")
	await _despawn_main(main)

func _test_ctrl_prone_priority_falls_back_to_crouch_on_release() -> void:
	var main := await _spawn_main()
	var player: Node = main.get_node("Player")
	Input.action_press("crouch_posture")
	Input.action_press("prone_posture")

	for _i in range(35):
		await physics_frame

	_assert_true(int(player.call("GetRequestedPostureIdForTesting")) == 2, "Ctrl should take priority over Shift and request prone")
	_assert_true(absf(player.call("GetCurrentPostureValueForTesting") - 1.0) < 0.05, "Holding Ctrl for half a second should reach prone posture")
	_assert_true(absf(player.call("GetEffectiveMoveSpeedForTesting") - 5.0) < 0.001, "Prone speed penalty should apply immediately")

	Input.action_release("prone_posture")
	await physics_frame
	_assert_true(int(player.call("GetRequestedPostureIdForTesting")) == 1, "Releasing Ctrl while Shift stays held should fall back to crouch")
	_assert_true(absf(player.call("GetEffectiveMoveSpeedForTesting") - 11.0) < 0.001, "Falling back to crouch should restore crouch move speed immediately")

	for _i in range(35):
		await physics_frame

	_assert_true(absf(player.call("GetCurrentPostureValueForTesting") - 0.5) < 0.05, "After releasing Ctrl, the pose should settle into crouch when Shift remains held")

	Input.action_release("crouch_posture")
	await _despawn_main(main)

func _test_prone_rotates_and_can_fire_from_head_anchor() -> void:
	var main := await _spawn_main()
	var player: Node = main.get_node("Player")
	Input.action_press("prone_posture")

	for _i in range(35):
		await physics_frame

	player.call("SetPitchDegrees", 0.0)
	await process_frame
	await physics_frame
	await process_frame

	var initial_yaw: float = player.call("GetBodyYawRadiansForTesting")
	player.call("AddMouseDeltaForTesting", Vector2(64.0, 0.0))
	await process_frame
	await physics_frame
	await process_frame

	var rotated_yaw: float = player.call("GetBodyYawRadiansForTesting")
	var prone_shot_origin: Vector3 = player.call("GetShotOriginLocalPositionForTesting")
	_assert_true(absf(rotated_yaw - initial_yaw) > 0.01, "Prone body should keep rotating with camera yaw instead of freezing after stretching")
	_assert_true(prone_shot_origin.z > 0.95 and prone_shot_origin.y > 0.5, "Prone shot origin should move toward the forward head anchor so the player can shoot while stretched")

	var target_root: Node = main.get_node("Map/Targets")
	var target: Node3D = target_root.get_child(0)
	target.global_position = player.call("GetFirePointPositionForTesting") + player.call("GetCurrentAimForward3DForTesting") * 8.0 + Vector3(0.0, -0.6, 0.0)
	await process_frame
	await physics_frame
	var health_before: int = target.call("GetHealthForTesting")

	player.call("FireEquippedWeaponForTesting")
	await process_frame
	await physics_frame
	_assert_true(bool(player.call("GetImpactMarkerVisibleForTesting")), "Prone player should still be able to fire from the stretched posture")
	_assert_true(int(target.call("GetHealthForTesting")) < health_before, "Prone player should still be able to damage a target directly in front of the crosshair")

	Input.action_release("prone_posture")
	await _despawn_main(main)

func _test_low_ceiling_blocks_return_to_standing_posture() -> void:
	var main := await _spawn_main()
	var player: Node3D = main.get_node("Player")
	var blocker := _create_box_body(
		Vector3(player.global_position.x, 1.45, player.global_position.z),
		Vector3(2.0, 0.18, 2.0))
	main.add_child(blocker)
	await process_frame
	await physics_frame

	Input.action_press("crouch_posture")
	for _i in range(35):
		await physics_frame

	Input.action_release("crouch_posture")
	for _i in range(90):
		await physics_frame

	var blocked_posture := float(player.call("GetCurrentPostureValueForTesting"))
	var blocked_top := float(player.call("GetMovementColliderTopForTesting"))
	_assert_true(blocked_posture > 0.35, "If there is not enough headroom, releasing crouch should not force the collider back to standing (posture=%s)" % [str(blocked_posture)])
	_assert_true(blocked_top < 1.45, "Standing up under a low ceiling should keep the movement collider below the blocker (top=%s)" % [str(blocked_top)])
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

	main.call("SetPrototype3DGravity", 50.0)
	main.call("SetPrototype3DJumpVelocity", 12.5)
	await process_frame
	await physics_frame
	await _despawn_main(main)

	var config := ConfigFile.new()
	var load_result := config.load("user://runtime_settings.cfg")
	var saved_gravity: float = config.get_value("gameplay", "prototype_3d_gravity", 0.0)
	var saved_jump_velocity: float = config.get_value("gameplay", "prototype_3d_jump_velocity", 0.0)
	_assert_true(load_result == OK, "3D runtime settings file should be written to user://")
	_assert_true(absf(saved_gravity - 50.0) < 0.001, "Saved settings should persist 3D gravity")
	_assert_true(absf(saved_jump_velocity - 12.5) < 0.001, "Saved settings should persist 3D jump force")

	var reloaded_main := await _spawn_main()
	var loaded_gravity: float = reloaded_main.call("GetPrototype3DGravity")
	var loaded_jump_velocity: float = reloaded_main.call("GetPrototype3DJumpVelocity")
	_assert_true(absf(loaded_gravity - 50.0) < 0.001, "3D main should load persisted gravity on boot")
	_assert_true(absf(loaded_jump_velocity - 12.5) < 0.001, "3D main should load persisted jump force on boot")
	await _despawn_main(reloaded_main)

func _test_v_toggles_between_fps_and_last_tps_zoom() -> void:
	var main := await _spawn_main()
	main.call("SetPrototype3DCameraOrbitDistance", 7.4)

	await process_frame
	await physics_frame

	var toggle_event := InputEventKey.new()
	toggle_event.pressed = true
	toggle_event.keycode = KEY_V
	Input.parse_input_event(toggle_event)

	await process_frame
	await physics_frame

	_assert_true(absf(main.call("GetPrototype3DCameraOrbitDistance") - 0.6) < 0.001, "Pressing V from TPS should switch to FPS at minimum orbit distance")

	var toggle_back_event := InputEventKey.new()
	toggle_back_event.pressed = true
	toggle_back_event.keycode = KEY_V
	Input.parse_input_event(toggle_back_event)

	await process_frame
	await physics_frame

	_assert_true(absf(main.call("GetPrototype3DCameraOrbitDistance") - 7.4) < 0.001, "Pressing V again from FPS should restore the previous TPS zoom distance")
	await _despawn_main(main)

func _test_camera_settings_persist() -> void:
	var main := await _spawn_main()
	main.call("SetPrototype3DCameraMaxOrbitDistance", 34.0)
	main.call("SetPrototype3DCameraMinOrbitDistance", 0.5)
	main.call("SetPrototype3DCameraOrbitDistance", 14.5)
	main.call("SetPrototype3DCameraZoomRailPitchDegrees", 72.0)
	main.call("SetPrototype3DCameraZoomStep", 2.25)
	main.call("SetPrototype3DCameraLookAheadDistance", 24.0)
	main.call("SetPrototype3DCameraFov", 48.0)
	await process_frame
	await physics_frame
	await _despawn_main(main)

	var config := ConfigFile.new()
	var load_result := config.load("user://runtime_settings.cfg")
	_assert_true(load_result == OK, "3D runtime settings file should be written to user:// for camera settings")
	_assert_true(absf(config.get_value("gameplay", "prototype_3d_camera_orbit_distance", 0.0) - 14.5) < 0.001, "Saved settings should persist camera distance")
	_assert_true(absf(config.get_value("gameplay", "prototype_3d_camera_zoom_rail_pitch_degrees", 0.0) - 72.0) < 0.001, "Saved settings should persist camera rail pitch")
	_assert_true(absf(config.get_value("gameplay", "prototype_3d_camera_min_orbit_distance", 0.0) - 0.5) < 0.001, "Saved settings should persist camera min distance")
	_assert_true(absf(config.get_value("gameplay", "prototype_3d_camera_max_orbit_distance", 0.0) - 34.0) < 0.001, "Saved settings should persist camera max distance")
	_assert_true(absf(config.get_value("gameplay", "prototype_3d_camera_zoom_step", 0.0) - 2.25) < 0.001, "Saved settings should persist camera zoom step")
	_assert_true(absf(config.get_value("gameplay", "prototype_3d_camera_look_ahead_distance", 0.0) - 24.0) < 0.001, "Saved settings should persist camera look-ahead")
	_assert_true(absf(config.get_value("gameplay", "prototype_3d_camera_fov", 0.0) - 48.0) < 0.001, "Saved settings should persist camera FOV")

	var reloaded_main := await _spawn_main()
	_assert_true(absf(reloaded_main.call("GetPrototype3DCameraOrbitDistance") - 14.5) < 0.001, "3D main should load persisted camera distance on boot")
	_assert_true(absf(reloaded_main.call("GetPrototype3DCameraZoomRailPitchDegrees") - 72.0) < 0.001, "3D main should load persisted camera rail pitch on boot")
	_assert_true(absf(reloaded_main.call("GetPrototype3DCameraMinOrbitDistance") - 0.5) < 0.001, "3D main should load persisted camera min distance on boot")
	_assert_true(absf(reloaded_main.call("GetPrototype3DCameraMaxOrbitDistance") - 34.0) < 0.001, "3D main should load persisted camera max distance on boot")
	_assert_true(absf(reloaded_main.call("GetPrototype3DCameraZoomStep") - 2.25) < 0.001, "3D main should load persisted camera zoom step on boot")
	_assert_true(absf(reloaded_main.call("GetPrototype3DCameraLookAheadDistance") - 24.0) < 0.001, "3D main should load persisted camera look-ahead on boot")
	_assert_true(absf(reloaded_main.call("GetPrototype3DCameraFov") - 48.0) < 0.001, "3D main should load persisted camera FOV on boot")

	var rig: Node = reloaded_main.get_node("CameraRig3D")
	var camera: Camera3D = reloaded_main.get_node("CameraRig3D/Camera3D")
	_assert_true(absf(rig.call("GetOrbitDistance") - 14.5) < 0.001, "Camera rig should apply persisted camera distance")
	_assert_true(absf(rig.call("GetZoomRailPitchDegrees") - 72.0) < 0.001, "Camera rig should apply persisted camera rail pitch")
	_assert_true(absf(rig.call("GetMinOrbitDistance") - 0.5) < 0.001, "Camera rig should apply persisted camera min distance")
	_assert_true(absf(rig.call("GetMaxOrbitDistance") - 34.0) < 0.001, "Camera rig should apply persisted camera max distance")
	_assert_true(absf(rig.call("GetZoomStep") - 2.25) < 0.001, "Camera rig should apply persisted camera zoom step")
	_assert_true(absf(rig.call("GetLookAheadDistance") - 24.0) < 0.001, "Camera rig should apply persisted camera look-ahead")
	_assert_true(absf(camera.fov - 48.0) < 0.001, "Camera node should apply persisted camera FOV")
	await _despawn_main(reloaded_main)

func _test_load_defaults_restores_current_defaults() -> void:
	var main := await _spawn_main()
	main.call("SetPrototype3DGravity", 77.0)
	main.call("SetPrototype3DCameraOrbitDistance", 5.0)
	main.call("SetPrototype3DCameraZoomRailPitchDegrees", 60.0)
	main.call("SetPersistentImpactMarkersEnabled", false)

	await process_frame
	await physics_frame

	main.call("ResetRuntimeSettingsToDefaults")

	await process_frame
	await physics_frame

	_assert_true(absf(main.call("GetPrototype3DGravity") - 50.0) < 0.001, "Load defaults should restore gravity")
	_assert_true(absf(main.call("GetPrototype3DCameraOrbitDistance") - 10.0) < 0.001, "Load defaults should restore camera distance")
	_assert_true(absf(main.call("GetPrototype3DCameraZoomRailPitchDegrees") - 20.0) < 0.001, "Load defaults should restore camera rail pitch")
	_assert_true(absf(main.call("GetPrototype3DCameraMaxOrbitDistance") - 10.0) < 0.001, "Load defaults should restore camera max distance")
	_assert_true(absf(main.call("GetPrototype3DCameraZoomStep") - 1.0) < 0.001, "Load defaults should restore camera zoom step")
	_assert_true(absf(main.call("GetPrototype3DCameraFov") - 40.0) < 0.001, "Load defaults should restore camera FOV")
	_assert_true(bool(main.call("GetPersistentImpactMarkersEnabled")), "Load defaults should restore persistent hit markers to enabled")

	var config := ConfigFile.new()
	var load_result := config.load("user://runtime_settings.cfg")
	_assert_true(load_result == OK, "Load defaults should persist the regenerated cfg")
	_assert_true(absf(config.get_value("gameplay", "prototype_3d_gravity", 0.0) - 50.0) < 0.001, "Load defaults should persist default gravity")
	_assert_true(absf(config.get_value("gameplay", "prototype_3d_camera_orbit_distance", 0.0) - 10.0) < 0.001, "Load defaults should persist default camera distance")
	_assert_true(absf(config.get_value("gameplay", "prototype_3d_camera_max_orbit_distance", 0.0) - 10.0) < 0.001, "Load defaults should persist default camera max distance")
	_assert_true(absf(config.get_value("gameplay", "prototype_3d_camera_zoom_step", 0.0) - 1.0) < 0.001, "Load defaults should persist default camera zoom step")
	_assert_true(absf(config.get_value("gameplay", "prototype_3d_camera_fov", 0.0) - 40.0) < 0.001, "Load defaults should persist default camera FOV")
	_assert_true(bool(config.get_value("gameplay", "persistent_impact_markers_enabled", false)), "Load defaults should persist keep hit markers enabled")
	await _despawn_main(main)

func _test_player_body_fades_when_zoomed_in() -> void:
	var main := await _spawn_main()
	main.call("SetPrototype3DCameraOrbitDistance", 10.0)

	await process_frame
	await physics_frame

	var player: Node = main.get_node("Player")
	_assert_true(absf(player.call("GetBodyOpacityForTesting") - 1.0) < 0.001, "Player body should stay opaque when camera is not in the close zoom band")

	main.call("SetPrototype3DCameraOrbitDistance", 0.6)

	await process_frame
	await physics_frame

	_assert_true(absf(player.call("GetBodyOpacityForTesting") - 0.2) < 0.01, "Player body should fade to twenty percent opacity at minimum zoom distance")
	await _despawn_main(main)

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

func _test_pitch_can_aim_up_into_the_sky() -> void:
	var main := await _spawn_main()
	var player: Node = main.get_node("Player")
	player.call("SetPitchDegrees", -60.0)

	await process_frame
	await physics_frame
	await process_frame

	var updated_pitch: float = player.call("GetCurrentPitchDegreesForTesting")
	var aim_forward: Vector3 = player.call("GetCurrentAimForward3DForTesting")
	_assert_true(updated_pitch <= -59.0, "TPS aim should allow pitching above the horizon toward the sky")
	_assert_true(aim_forward.y > 0.5, "Negative pitch should tilt the centered crosshair aim upward")
	await _despawn_main(main)

func _test_pitch_is_clamped_before_crosshair_moves_below_player_feet() -> void:
	var main := await _spawn_main()
	var player: Node = main.get_node("Player")
	var camera: Camera3D = main.get_node("CameraRig3D/Camera3D")
	player.call("SetPitchDegrees", 89.0)

	await process_frame
	await physics_frame
	await process_frame

	var constrained_pitch: float = player.call("GetCurrentPitchDegreesForTesting")
	var lowest_point_screen_pos := camera.unproject_position(player.call("GetLowestBodyPointForTesting"))
	var shot_origin_screen_pos := camera.unproject_position(player.call("GetFirePointPositionForTesting"))
	var viewport_center_y := camera.get_viewport().get_visible_rect().size.y * 0.5
	_assert_true(constrained_pitch < 89.0, "TPS camera should clamp pitch before the centered crosshair drops below the player feet anchor")
	_assert_true(lowest_point_screen_pos.y >= viewport_center_y - 0.5, "TPS camera should keep the player feet anchor at or below the centered crosshair")
	_assert_true(shot_origin_screen_pos.y < viewport_center_y - 0.5, "TPS camera should allow aiming below the shot origin as long as the player feet stay below the centered crosshair")
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

func _create_box_body(world_position: Vector3, size: Vector3) -> StaticBody3D:
	var body := StaticBody3D.new()
	body.position = world_position
	body.collision_layer = 1
	body.collision_mask = 1
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	collision.shape = shape
	body.add_child(collision)
	return body
