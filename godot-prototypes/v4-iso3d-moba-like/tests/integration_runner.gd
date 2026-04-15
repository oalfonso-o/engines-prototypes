extends SceneTree

const MAIN_SCENE := preload("res://main.tscn")
const LinearSkillshotScript = preload("res://scripts/linear_skillshot.gd")
const AbilityConfigScript = preload("res://scripts/ability_config.gd")
const IsoTargetScript = preload("res://scripts/iso_target.gd")

var failures: Array[String] = []


func _initialize() -> void:
	await _run()
	if failures.is_empty():
		print("v4-iso3d-moba-like integration OK")
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
	var center_spot_light: SpotLight3D = scene.get_node("CenterSpotLight")
	var player = scene.get_node("Player")
	var iso_map: Node3D = scene.get_node("IsoMap")
	var hud: CanvasLayer = scene.get_node("DebugHud")
	var dummy_a: Node3D = scene.get_target("NearDummyA")
	var dummy_b: Node3D = scene.get_target("NearDummyB")

	_assert(camera.projection == Camera3D.PROJECTION_ORTHOGONAL, "camera must stay orthographic")
	_assert(center_spot_light.shadow_enabled, "center spotlight should cast shadows")
	_assert(center_spot_light.global_position.y > iso_map.map_center.y + 10.0, "center spotlight should stay above the map")
	_assert(iso_map.tile_count > 0, "map must build tiles")
	_assert(iso_map.ramp_count > 0, "map must build ramps")
	_assert(player.global_position.y > -1.0, "player must not fall through the floating platforms")
	_assert(player.has_node("BlobShadow"), "player should have a blob shadow")
	_assert(hud.get_node("InfoLabel").text.find("Selected:") != -1, "debug HUD must show selected ability")
	_assert(player.get_selected_ability_id() == "wide", "v4 should start with wide beam selected")

	var start_position: Vector3 = player.global_position
	var start_camera_position: Vector3 = camera.global_position
	player.set_debug_move_input(Vector2(0.0, 1.0))
	for _frame: int in range(18):
		await physics_frame
	player.clear_debug_input()
	_assert(player.global_position.distance_to(start_position) > 0.35, "player must move with debug input")
	_assert(camera.global_position.distance_to(start_camera_position) > 0.35, "camera must follow the player movement")

	var ground_y: float = player.global_position.y
	var shadow: MeshInstance3D = player.get_node("BlobShadow")
	var shadow_y_before_jump: float = shadow.global_position.y
	player.request_debug_jump()
	var apex: float = ground_y
	for _frame: int in range(18):
		await physics_frame
		apex = max(apex, player.global_position.y)
	_assert(apex > ground_y + 0.25, "player jump should lift the body above the platform")
	_assert(absf(shadow.global_position.y - shadow_y_before_jump) < 0.25, "blob shadow should stay near the ground while the player jumps")

	player.global_position = iso_map.player_spawn_world + Vector3(0.0, 0.12, 0.0)
	player.reset_motion()
	player.snap_to_floor()
	for _frame: int in range(4):
		await physics_frame

	player.select_ability("wide")
	player.set_debug_aim_world_point(dummy_a.global_position)
	await physics_frame
	var expected_aim_direction: Vector3 = dummy_a.global_position - player.global_position
	expected_aim_direction.y = 0.0
	expected_aim_direction = expected_aim_direction.normalized()
	_assert(player.get_visual_facing_direction().dot(expected_aim_direction) > 0.92, "player visual must face the current beam aim direction")
	var wide_health_before: float = dummy_a.health
	player.request_debug_cast()
	for _frame: int in range(20):
		await physics_frame
	_assert(dummy_a.health < wide_health_before, "wide beam should damage the near dummy")
	_assert(player.get_last_cast_debug()["ability_id"] == "wide", "wide cast should report correct ability id")

	player.select_ability("narrow")
	player.set_debug_aim_world_point(dummy_a.global_position)
	for _frame: int in range(12):
		await physics_frame
	var narrow_health_before: float = dummy_a.health
	player.request_debug_cast()
	for _frame: int in range(20):
		await physics_frame
	_assert(dummy_a.health < narrow_health_before, "narrow beam should damage the near dummy")
	_assert(player.get_last_cast_debug()["ability_id"] == "narrow", "narrow cast should report correct ability id")

	player.select_ability("grenade")
	player.set_debug_aim_world_point((dummy_a.global_position + dummy_b.global_position) * 0.5)
	for _frame: int in range(12):
		await physics_frame
	var grenade_a_before: float = dummy_a.health
	var grenade_b_before: float = dummy_b.health
	player.request_debug_cast()
	for _frame: int in range(24):
		await physics_frame
	_assert(dummy_a.health < grenade_a_before, "grenade should damage dummy A inside the explosion radius")
	_assert(dummy_b.health < grenade_b_before, "grenade should damage dummy B inside the explosion radius")
	_assert(player.get_last_cast_debug()["ability_id"] == "grenade", "grenade cast should report correct ability id")

	await _assert_linear_beam_ignores_back_and_side_world_collisions(scene)

	scene.queue_free()
	await process_frame


func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)


func _assert_linear_beam_ignores_back_and_side_world_collisions(scene: Node) -> void:
	var sandbox := Node3D.new()
	sandbox.name = "BeamSandbox"
	scene.add_child(sandbox)

	var owner := StaticBody3D.new()
	var owner_shape := CollisionShape3D.new()
	var owner_capsule := CapsuleShape3D.new()
	owner_capsule.radius = 0.25
	owner_capsule.height = 1.0
	owner_shape.shape = owner_capsule
	owner.add_child(owner_shape)
	owner.collision_layer = 2
	owner.collision_mask = 0
	sandbox.add_child(owner)

	var target := IsoTargetScript.new()
	target.name = "BeamSandboxTarget"
	target.position = Vector3(0.0, 0.0, -4.0)
	sandbox.add_child(target)
	target.setup_palette(Color("ffb45d"))

	var back_wall := _make_world_wall(Vector3(0.0, 0.9, 0.55), Vector3(1.2, 1.8, 0.2))
	sandbox.add_child(back_wall)
	var side_wall := _make_world_wall(Vector3(0.45, 0.9, -2.0), Vector3(0.2, 1.8, 5.0))
	sandbox.add_child(side_wall)

	var config := AbilityConfigScript.new()
	config.ability_id = "test-linear"
	config.display_name = "Test Linear"
	config.preview_mode = "linear"
	config.damage = 40.0
	config.cooldown = 0.1
	config.range = 8.0
	config.width = 1.2
	config.projectile_height = 1.1
	config.travel_time = 0.2
	config.projectile_color = Color("55d9ff")

	var projectile := LinearSkillshotScript.new()
	sandbox.add_child(projectile)
	projectile.configure(config, Vector3.ZERO, Vector3.FORWARD, owner)

	var target_health_before: float = target.health
	for _frame: int in range(30):
		await physics_frame

	_assert(target.health < target_health_before, "linear beam should ignore wall behind and side wall when center line is clear")
	_assert(is_instance_valid(projectile) == false or projectile.world_blocked == false, "linear beam should not report world block from back or parallel walls")

	sandbox.queue_free()
	await process_frame


func _make_world_wall(position: Vector3, size: Vector3) -> StaticBody3D:
	var wall := StaticBody3D.new()
	wall.position = position
	wall.collision_layer = 1
	wall.collision_mask = 0
	var shape_node := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = size
	shape_node.shape = box
	wall.add_child(shape_node)
	return wall
