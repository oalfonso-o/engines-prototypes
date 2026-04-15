extends SceneTree

const MAIN_SCENE := preload("res://main.tscn")

var failures: Array[String] = []


func _initialize() -> void:
	await _run()
	if failures.is_empty():
		print("v3-iso3d-targeting integration OK")
		quit(0)
	else:
		for failure: String in failures:
			push_error(failure)
		quit(1)


func _run() -> void:
	var scene := MAIN_SCENE.instantiate()
	root.add_child(scene)

	for _frame: int in range(18):
		await process_frame
		await physics_frame

	var camera: Camera3D = scene.get_node("IsoCamera")
	var player: CharacterBody3D = scene.get_node("Player")
	var iso_map: Node3D = scene.get_node("IsoMap")
	var hud: CanvasLayer = scene.get_node("DebugHud")
	var near_dummy: Node3D = scene.get_target("NearDummy")

	_assert(camera.projection == Camera3D.PROJECTION_ORTHOGONAL, "camera must stay orthographic")
	_assert(iso_map.tile_count > 0, "map must build tiles")
	_assert(iso_map.ramp_count > 0, "map must build ramps")
	_assert(player.global_position.y > -1.0, "player must not fall through the floating platforms")
	_assert(hud.get_node("InfoLabel").text.find("FPS:") != -1, "debug HUD must show FPS")
	_assert(hud.get_node("CrosshairLabel") != null, "debug HUD must show a crosshair")
	_assert(near_dummy != null, "scene must spawn a deterministic near dummy target")

	var start_position: Vector3 = player.global_position
	var start_camera_position: Vector3 = camera.global_position
	player.set_debug_move_input(Vector2(0.0, 1.0))
	for _frame: int in range(18):
		await physics_frame
	player.clear_debug_input()
	_assert(player.global_position.distance_to(start_position) > 0.35, "player must move with debug input")
	_assert(camera.global_position.distance_to(start_camera_position) > 0.35, "camera must follow the player movement")

	var ground_y: float = player.global_position.y
	player.request_debug_jump()
	var apex: float = ground_y
	for _frame: int in range(18):
		await physics_frame
		apex = max(apex, player.global_position.y)
	_assert(apex > ground_y + 0.25, "player jump should lift the body above the platform")

	player.global_position = iso_map.player_spawn_world + Vector3(0.0, 0.12, 0.0)
	player.reset_motion()
	player.snap_to_floor()
	for _frame: int in range(4):
		await physics_frame

	player.set_debug_target_lock(near_dummy)
	await physics_frame
	var targeting_state: Dictionary = player.get_targeting_debug_state()
	_assert(bool(targeting_state["is_targeting"]) == true, "debug target lock must force targeting mode")
	_assert(str(targeting_state["hovered_target_name"]) == near_dummy.name, "targeting must identify the locked dummy")

	var weapon_before: Dictionary = player.get_weapon_debug_state()
	var target_health_before: float = near_dummy.health
	player.request_debug_fire()
	for _frame: int in range(4):
		await physics_frame

	var weapon_after_targeted_shot: Dictionary = player.get_weapon_debug_state()
	var targeted_shot: Dictionary = player.get_last_shot_debug()
	_assert(str(targeted_shot["mode"]) == "targeting", "clicking a valid target must resolve in targeting mode")
	_assert(str(targeted_shot["status"]) == "hit_enemy", "targeted shot should hit when there is no cover")
	_assert(near_dummy.health < target_health_before, "targeted shot must damage the near dummy")
	_assert(weapon_after_targeted_shot["ammo_in_magazine"] == weapon_before["ammo_in_magazine"] - 1, "targeted shot must consume one round")
	_assert(float(targeted_shot["damage"]) > 0.0, "targeted shot must carry fixed damage")

	player.clear_debug_target_lock()
	player.set_debug_aim_world_point(player.global_position + Vector3(0.0, 0.0, -20.0))
	for _frame: int in range(8):
		await physics_frame
	await physics_frame
	player.request_debug_fire()
	for _frame: int in range(4):
		await physics_frame

	var free_shot: Dictionary = player.get_last_shot_debug()
	_assert(str(free_shot["mode"]) == "free", "clicking without a target must use free shot mode")
	_assert(str(free_shot["status"]) != "idle", "free shot mode must resolve to miss, block, or hit")

	player.request_debug_reload()
	for _frame: int in range(120):
		await physics_frame

	var weapon_after_reload: Dictionary = player.get_weapon_debug_state()
	_assert(bool(weapon_after_reload["is_reloading"]) == false, "reload should finish in finite time")
	_assert(weapon_after_reload["ammo_in_magazine"] == weapon_before["ammo_in_magazine"], "reload should refill the spent rounds")

	player.select_weapon_index(1)
	await physics_frame
	var pistol_state: Dictionary = player.get_weapon_debug_state()
	_assert(str(pistol_state["weapon_name"]) == "Pistol", "weapon switching must select the pistol")

	scene.queue_free()
	await process_frame


func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
