extends "res://tests/helpers/gut_scene_test.gd"


func test_grenade_impulse_launches_nearby_enemy() -> void:
	var scene: Node3D = instantiate_main_scene()
	await settle_frames(6)

	var game_root: Node3D = scene.get_node("GameRoot") as Node3D
	var player = game_root.get_node("Player")
	var enemies_root: Node3D = game_root.get_node("Enemies") as Node3D
	var enemy = enemies_root.get_child(0)

	var target_position: Vector3 = player.global_position + Vector3(0.0, 0.0, -6.0)
	enemy.global_position = target_position + Vector3(1.0, 0.0, 0.0)
	var start_y: float = enemy.global_position.y
	var start_distance: float = enemy.global_position.distance_to(target_position)

	assert_true(player.has_method("throw_grenade_to"), "player should expose throw_grenade_to(target_position)")
	if not player.has_method("throw_grenade_to"):
		return
	player.throw_grenade_to(target_position)
	for _frame_index: int in range(90):
		await physics_frames()

	assert_true(
		enemy.global_position.y > start_y + 0.2 or enemy.global_position.distance_to(target_position) > start_distance + 0.5,
		"grenade explosion should launch the enemy away from the blast"
	)
