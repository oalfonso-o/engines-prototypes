extends GutTest

const SpawnRulesScript := preload("res://runtime/world/logic/spawn_rules.gd")


func test_enemy_spawn_respects_minimum_safe_distance_from_player() -> void:
	var world_rect := Rect2(Vector2.ZERO, Vector2(1600.0, 900.0))
	var player_position := Vector2(800.0, 450.0)
	var rng := RandomNumberGenerator.new()
	rng.seed = 17
	var spawn_position: Vector2 = SpawnRulesScript.pick_spawn_position(
		rng,
		world_rect,
		player_position,
		24.0,
		5.0
	)

	assert_true(
		world_rect.has_point(spawn_position),
		"spawn position should stay inside the world rect"
	)
	assert_true(
		spawn_position.distance_to(player_position) >= 120.0,
		"enemy spawns should respect the 5x ship radius safe distance"
	)


func test_booster_type_rolls_only_known_types() -> void:
	var types: Dictionary[String, bool] = {}
	var rng := RandomNumberGenerator.new()
	rng.seed = 23
	for _roll_index: int in range(40):
		var rolled_type: String = SpawnRulesScript.pick_booster_type(rng)
		types[rolled_type] = true

	assert_true(types.has("fire_rate"), "booster rolls should include fire_rate")
	assert_true(types.has("extra_shot"), "booster rolls should include extra_shot")
	assert_eq(types.size(), 2, "booster rolls should never produce unknown types")
