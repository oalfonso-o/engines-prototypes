extends SceneTree

const MAIN_SCENE := preload("res://main.tscn")

var failures: Array[String] = []


func _initialize() -> void:
	await _run()
	if failures.is_empty():
		print("v2-iso3d integration OK")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)


func _run() -> void:
	var scene := MAIN_SCENE.instantiate()
	root.add_child(scene)

	for _frame in range(18):
		await process_frame
		await physics_frame

	var camera: Camera3D = scene.get_node("IsoCamera")
	var player = scene.get_node("Player")
	var iso_map = scene.get_node("IsoMap")
	var hud = scene.get_node("DebugHud")

	_assert(camera.projection == Camera3D.PROJECTION_ORTHOGONAL, "camera must stay orthographic")
	_assert(iso_map.tile_count > 0, "map must build tiles")
	_assert(iso_map.ramp_count > 0, "map must build ramps")
	_assert(player.global_position.y > -1.0, "player must not fall through the floating platforms")
	_assert(hud.get_node("InfoLabel").text.find("FPS:") != -1, "debug HUD must show FPS")

	var start_position: Vector3 = player.global_position
	var start_camera_position: Vector3 = camera.global_position
	player.set_debug_move_input(Vector2(0.0, 1.0))
	for _frame in range(18):
		await physics_frame
	player.clear_debug_input()
	_assert(player.global_position.distance_to(start_position) > 0.35, "player must move with debug input")
	_assert(camera.global_position.distance_to(start_camera_position) > 0.35, "camera must follow the player movement")

	var ground_y: float = player.global_position.y
	player.request_debug_jump()
	var apex: float = ground_y
	for _frame in range(18):
		await physics_frame
		apex = max(apex, player.global_position.y)
	_assert(apex > ground_y + 0.25, "player jump should lift the body above the platform")

	scene.queue_free()
	await process_frame


func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
