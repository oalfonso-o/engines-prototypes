extends "res://tests/helpers/gut_scene_test.gd"

const PlayerTestDriverScript := preload("res://tests/helpers/player_test_driver.gd")


func test_player_hitscan_damages_enemy_and_updates_health_display() -> void:
	var scene: Node3D = instantiate_main_scene()
	await settle_frames(6)

	var game_root: Node3D = scene.get_node("GameRoot") as Node3D
	var player = game_root.get_node("Player")
	var enemies_root: Node3D = game_root.get_node("Enemies") as Node3D
	var enemy = enemies_root.get_child(0)

	enemy.global_position = player.global_position + Vector3(8.0, 0.0, -4.0)
	enemy.velocity = Vector3.ZERO
	PlayerTestDriverScript.aim_at_world_point(player, enemy.global_position + Vector3(0.0, 1.2, 0.0))
	await physics_frames()
	assert_true(player.has_method("fire_hitscan"), "player should expose fire_hitscan()")
	if not player.has_method("fire_hitscan"):
		return
	player.fire_hitscan()
	await process_frames()

	assert_eq(enemy.health.current_health, 80, "hitscan shot should deal 20 damage")
	assert_true(
		enemy.get_node("HealthDisplay").text.contains("80 / 100"),
		"enemy health display should update after taking damage"
	)


func test_enemy_dies_after_five_hits() -> void:
	var scene: Node3D = instantiate_main_scene()
	await settle_frames(6)

	var game_root: Node3D = scene.get_node("GameRoot") as Node3D
	var player = game_root.get_node("Player")
	var enemies_root: Node3D = game_root.get_node("Enemies") as Node3D
	var enemy = enemies_root.get_child(0)

	enemy.global_position = player.global_position + Vector3(8.0, 0.0, -4.0)
	PlayerTestDriverScript.aim_at_world_point(player, enemy.global_position + Vector3(0.0, 1.2, 0.0))
	await physics_frames()
	assert_true(player.has_method("fire_hitscan"), "player should expose fire_hitscan()")
	if not player.has_method("fire_hitscan"):
		return
	for _shot_index: int in range(5):
		player.fire_hitscan()
		await process_frames()

	assert_true(not is_instance_valid(enemy) or enemy.is_dead, "enemy should die after five shots")
