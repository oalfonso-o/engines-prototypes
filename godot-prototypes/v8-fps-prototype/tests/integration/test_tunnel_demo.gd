extends "res://tests/helpers/gut_scene_test.gd"

const PlayerTestDriverScript := preload("res://tests/helpers/player_test_driver.gd")


func test_tunnel_demo_scene_builds_camera_and_procedural_geometry() -> void:
	var packed_scene: PackedScene = load("res://TunnelDemo.tscn") as PackedScene
	assert_not_null(packed_scene, "tunnel demo scene should exist")
	if packed_scene == null:
		return

	var scene: Node3D = packed_scene.instantiate() as Node3D
	add_scene_root(scene)
	await process_frames()

	assert_not_null(scene.get_node_or_null("Camera3D"), "tunnel demo should create a camera")
	assert_not_null(scene.get_node_or_null("WorldEnvironment"), "tunnel demo should create a world environment")
	assert_not_null(scene.get_node_or_null("Floor"), "tunnel demo should create a continuous floor")
	assert_not_null(scene.get_node_or_null("Track"), "tunnel demo should create a central track")
	assert_not_null(scene.get_node_or_null("RailLeft"), "tunnel demo should create the left rail")
	assert_not_null(scene.get_node_or_null("RailRight"), "tunnel demo should create the right rail")

	var tunnel_root: Node3D = scene.get_node_or_null("TunnelRoot") as Node3D
	assert_not_null(tunnel_root, "tunnel demo should create tunnel geometry")
	if tunnel_root == null:
		return

	assert_true(
		tunnel_root.get_child_count() >= 24,
		"tunnel demo should generate many repeated tunnel segments"
	)

	var floor_body: StaticBody3D = scene.get_node_or_null("Floor") as StaticBody3D
	assert_not_null(floor_body, "tunnel demo should create a floor body")
	if floor_body == null:
		return

	var floor_collision: CollisionShape3D = floor_body.get_node_or_null("CollisionShape3D") as CollisionShape3D
	assert_not_null(floor_collision, "tunnel floor should expose collision")
	if floor_collision == null:
		return

	var floor_shape: BoxShape3D = floor_collision.shape as BoxShape3D
	assert_not_null(floor_shape, "tunnel floor should use a box collider")
	if floor_shape == null:
		return

	assert_true(
		floor_shape.size.x >= 5.8,
		"tunnel floor should cover the corridor width instead of leaving a fall gap"
	)


func test_tunnel_demo_spawns_fps_player_and_allows_forward_motion() -> void:
	var packed_scene: PackedScene = load("res://TunnelDemo.tscn") as PackedScene
	assert_not_null(packed_scene, "tunnel demo scene should exist")
	if packed_scene == null:
		return

	var scene: Node3D = packed_scene.instantiate() as Node3D
	add_scene_root(scene)
	await settle_frames(6)

	var player = scene.get_node_or_null("Player")
	assert_not_null(player, "tunnel demo should spawn a FPS player")
	if player == null:
		return

	var start_z: float = player.global_position.z

	PlayerTestDriverScript.set_move_intent(player, Vector2(0.0, -1.0))
	for _frame_index: int in range(18):
		await physics_frames()
	PlayerTestDriverScript.clear_move_intent(player)

	assert_true(
		player.global_position.z < start_z - 0.6,
		"tunnel player should move forward through the corridor"
	)


func test_tunnel_demo_player_stays_grounded_after_spawn() -> void:
	var packed_scene: PackedScene = load("res://TunnelDemo.tscn") as PackedScene
	assert_not_null(packed_scene, "tunnel demo scene should exist")
	if packed_scene == null:
		return

	var scene: Node3D = packed_scene.instantiate() as Node3D
	add_scene_root(scene)
	await settle_frames(6)

	var player = scene.get_node_or_null("Player")
	assert_not_null(player, "tunnel demo should spawn a FPS player")
	if player == null:
		return

	var start_y: float = player.global_position.y

	for _frame_index: int in range(18):
		await physics_frames()

	assert_true(
		player.is_on_floor(),
		"tunnel player should remain grounded after spawning"
	)
	assert_true(
		player.global_position.y >= start_y - 0.08,
		"tunnel player should not fall through the tunnel floor on spawn"
	)
