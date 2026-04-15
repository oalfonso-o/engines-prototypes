extends GutTest

const RunModelScript := preload("res://runtime/shared/logic/run_model.gd")


func test_score_increments_when_enemy_is_killed() -> void:
	var run_model = RunModelScript.new()

	assert_eq(run_model.score, 0, "score should start at zero")
	run_model.register_enemy_kill()
	run_model.register_enemy_kill()
	assert_eq(run_model.score, 2, "score should track enemies killed")


func test_game_over_latches_final_score() -> void:
	var run_model = RunModelScript.new()
	run_model.register_enemy_kill()
	run_model.register_enemy_kill()

	run_model.mark_player_dead()
	assert_true(run_model.is_game_over, "player death should mark the run as game over")
	assert_eq(run_model.final_score, 2, "game over should latch the achieved score")
