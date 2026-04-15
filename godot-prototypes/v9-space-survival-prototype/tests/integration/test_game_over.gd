extends "res://tests/helpers/gut_scene_test.gd"


func test_enemy_collision_shows_game_over_and_space_restarts_the_run() -> void:
	var scene: Node2D = instantiate_main_scene()
	await settle_frames(5)

	var game_root = game_root_from(scene)
	var player: Area2D = player_from(scene)
	game_root.run_model.register_enemy_kill()
	game_root.run_model.register_enemy_kill()
	game_root.spawn_enemy(player.global_position)
	await settle_frames(10)

	var overlay: CanvasLayer = scene.get_node("GameOverOverlay") as CanvasLayer
	assert_true(overlay.visible, "player death should show the game over overlay")

	var space_press := InputEventAction.new()
	space_press.action = "ui_accept"
	space_press.pressed = true
	overlay._unhandled_input(space_press)
	await settle_frames(5)

	var restarted_game_root = game_root_from(scene)
	assert_false((scene.get_node("GameOverOverlay") as CanvasLayer).visible, "restart should hide the game over overlay")
	assert_eq(restarted_game_root.run_model.score, 0, "restart should reset score to zero")
