extends "res://tests/helpers/gut_scene_test.gd"

const PlayerTestDriverScript := preload("res://tests/helpers/player_test_driver.gd")


func test_player_move_intent_moves_horizontally() -> void:
	var scene: Node3D = instantiate_main_scene()
	await settle_frames(6)

	var player = scene.get_node("GameRoot/Player")
	var start_x: float = player.global_position.x

	PlayerTestDriverScript.set_move_intent(player, Vector2.RIGHT)
	for _frame_index: int in range(18):
		await physics_frames()
	PlayerTestDriverScript.clear_move_intent(player)

	assert_true(
		player.global_position.x > start_x + 0.6,
		"player should move horizontally when a move intent is queued"
	)


func test_player_jump_intent_lifts_body() -> void:
	var scene: Node3D = instantiate_main_scene()
	await settle_frames(6)

	var player = scene.get_node("GameRoot/Player")
	var start_y: float = player.global_position.y

	PlayerTestDriverScript.queue_jump_intent(player)
	for _frame_index: int in range(12):
		await physics_frames()

	assert_true(
		player.global_position.y > start_y + 0.2,
		"player should lift off the floor when jump intent is queued"
	)
