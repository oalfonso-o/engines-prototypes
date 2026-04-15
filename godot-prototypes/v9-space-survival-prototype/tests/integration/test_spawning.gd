extends "res://tests/helpers/gut_scene_test.gd"


func test_enemy_spawns_after_two_seconds_of_runtime() -> void:
	var scene: Node2D = instantiate_main_scene()
	await settle_frames(140)

	var enemies_root: Node2D = scene.get_node("GameRoot/Enemies") as Node2D
	assert_true(enemies_root.get_child_count() >= 1, "enemy spawner should create enemies over time")


func test_booster_pickup_updates_weapon_progression() -> void:
	var scene: Node2D = instantiate_main_scene()
	await settle_frames(5)

	var game_root = game_root_from(scene)
	var player: Area2D = player_from(scene)
	var booster = game_root.spawn_booster(player.global_position, "extra_shot")

	assert_not_null(booster, "game root should spawn boosters on demand")
	await settle_frames(5)

	assert_eq(game_root.weapon_progression.shot_count, 2, "collecting an extra shot booster should increase shot count")
	assert_eq(
		(scene.get_node("GameRoot/Boosters") as Node2D).get_child_count(),
		0,
		"collected boosters should be removed from the world"
	)
