extends RefCounted


func test_player_move_intent_moves_horizontally(assertions, context) -> void:
	var scene: Node3D = context.instantiate_main_scene()
	await context.settle_frames(6)

	var player = scene.get_node("GameRoot/Player")
	var start_x: float = player.global_position.x

	player.set_move_intent(Vector2.RIGHT)
	for _frame_index: int in range(18):
		await context.physics_frame()
	player.clear_move_intent()

	assertions.check(
		player.global_position.x > start_x + 0.6,
		"player should move horizontally when a move intent is queued"
	)


func test_player_jump_intent_lifts_body(assertions, context) -> void:
	var scene: Node3D = context.instantiate_main_scene()
	await context.settle_frames(6)

	var player = scene.get_node("GameRoot/Player")
	var start_y: float = player.global_position.y

	player.queue_jump_intent()
	for _frame_index: int in range(12):
		await context.physics_frame()

	assertions.check(
		player.global_position.y > start_y + 0.2,
		"player should lift off the floor when jump intent is queued"
	)
