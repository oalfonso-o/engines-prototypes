extends SceneTree

const MAIN_SCENE := preload("res://main.tscn")

var failures: Array[String] = []


func _initialize() -> void:
	await _run()
	if failures.is_empty():
		print("v2-iso3d integration OK")
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

	player.set_debug_aim_world_point(near_dummy.global_position + Vector3(0.0, 0.9, 0.0))
	await physics_frame

	var weapon_before: Dictionary = player.get_weapon_debug_state()
	var target_health_before: float = near_dummy.health
	player.request_debug_fire()
	for _frame: int in range(4):
		await physics_frame

	var weapon_after_shot: Dictionary = player.get_weapon_debug_state()
	var shot_debug: Dictionary = player.get_last_shot_debug()
	var hit_rays := 0
	for ray: Dictionary in shot_debug.get("rays", []):
		if str(ray["status"]) == "hit_enemy":
			hit_rays += 1

	_assert(near_dummy.health < target_health_before, "shooting must damage the near dummy target")
	_assert(weapon_after_shot["ammo_in_magazine"] == weapon_before["ammo_in_magazine"] - 1, "shooting must consume one round from the magazine")
	_assert(hit_rays > 0, "at least one ray must hit the target when aiming at it")
	_assert(float(weapon_after_shot["last_total_damage"]) > 0.0, "weapon debug state must report positive last shot damage")

	player.request_debug_reload()
	for _frame: int in range(120):
		await physics_frame

	var weapon_after_reload: Dictionary = player.get_weapon_debug_state()
	_assert(bool(weapon_after_reload["is_reloading"]) == false, "reload should finish in finite time")
	_assert(weapon_after_reload["ammo_in_magazine"] == weapon_before["ammo_in_magazine"], "reload should refill the spent round")
	_assert(hud.get_node("InfoLabel").text.find("Weapon:") != -1, "debug HUD must show weapon state")

	player.select_weapon_index(1)
	await physics_frame
	var pistol_state: Dictionary = player.get_weapon_debug_state()
	_assert(str(pistol_state["weapon_name"]) == "Pistol", "weapon switching must select the pistol")

	scene.queue_free()
	await process_frame


func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
