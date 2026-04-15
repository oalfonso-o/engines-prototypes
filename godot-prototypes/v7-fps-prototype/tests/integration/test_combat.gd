extends RefCounted


func test_player_hitscan_damages_enemy_and_updates_health_display(assertions, context) -> void:
	var scene: Node3D = context.instantiate_main_scene()
	await context.settle_frames(6)

	var game_root: Node3D = scene.get_node("GameRoot") as Node3D
	var player = game_root.get_node("Player")
	var enemies_root: Node3D = game_root.get_node("Enemies") as Node3D
	var enemy = enemies_root.get_child(0)

	enemy.global_position = player.global_position + Vector3(8.0, 0.0, -4.0)
	enemy.velocity = Vector3.ZERO
	assertions.check(player.has_method("aim_at_world_point"), "player should expose aim_at_world_point(target_position)")
	if not player.has_method("aim_at_world_point"):
		return
	player.aim_at_world_point(enemy.global_position + Vector3(0.0, 1.2, 0.0))
	await context.physics_frame()
	assertions.check(player.has_method("fire_hitscan"), "player should expose fire_hitscan()")
	if not player.has_method("fire_hitscan"):
		return
	player.fire_hitscan()
	await context.process_frame()

	assertions.check(enemy.current_health == 80, "hitscan shot should deal 20 damage")
	assertions.check(
		enemy.get_node("HealthDisplay").text.contains("80 / 100"),
		"enemy health display should update after taking damage"
	)


func test_enemy_dies_after_five_hits(assertions, context) -> void:
	var scene: Node3D = context.instantiate_main_scene()
	await context.settle_frames(6)

	var game_root: Node3D = scene.get_node("GameRoot") as Node3D
	var player = game_root.get_node("Player")
	var enemies_root: Node3D = game_root.get_node("Enemies") as Node3D
	var enemy = enemies_root.get_child(0)

	enemy.global_position = player.global_position + Vector3(8.0, 0.0, -4.0)
	assertions.check(player.has_method("aim_at_world_point"), "player should expose aim_at_world_point(target_position)")
	if not player.has_method("aim_at_world_point"):
		return
	player.aim_at_world_point(enemy.global_position + Vector3(0.0, 1.2, 0.0))
	await context.physics_frame()
	assertions.check(player.has_method("fire_hitscan"), "player should expose fire_hitscan()")
	if not player.has_method("fire_hitscan"):
		return
	for _shot_index: int in range(5):
		player.fire_hitscan()
		await context.process_frame()

	assertions.check(not is_instance_valid(enemy) or enemy.is_dead, "enemy should die after five shots")
