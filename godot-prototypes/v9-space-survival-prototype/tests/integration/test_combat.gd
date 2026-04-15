extends "res://tests/helpers/gut_scene_test.gd"


func test_player_auto_fires_projectiles_over_time() -> void:
	var scene: Node2D = instantiate_main_scene()
	await settle_frames(40)

	var projectiles_root: Node2D = scene.get_node("GameRoot/Projectiles") as Node2D
	assert_true(projectiles_root.get_child_count() > 0, "player should auto-fire projectiles constantly")


func test_projectile_hit_kills_enemy_and_increments_score() -> void:
	var scene: Node2D = instantiate_main_scene()
	await settle_frames(10)

	var game_root = game_root_from(scene)
	var player: Area2D = player_from(scene)
	var enemy = game_root.spawn_enemy(player.global_position + Vector2(160.0, 0.0))

	assert_not_null(enemy, "game root should spawn an enemy on demand")
	for _frame_index: int in range(90):
		await settle_frames(1)
		if not is_instance_valid(enemy):
			break

	assert_true(not is_instance_valid(enemy), "enemy should die from one projectile hit")
	assert_eq(game_root.run_model.score, 1, "enemy death should increment the score")
