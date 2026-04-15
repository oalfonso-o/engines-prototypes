extends RefCounted

const CharacterFixture := preload("res://tests/fixtures/fixtures_character.gd")


func test_move_intent_drives_horizontal_motion(assertions, context) -> void:
	var fixture: CharacterFixture.Result = await CharacterFixture.instantiate(context)
	var character: CharacterBody3D = fixture.character
	var start_x: float = character.global_position.x

	character.set_move_intent(Vector2.RIGHT)
	for _frame_index: int in range(12):
		await context.physics_frame()
	character.clear_move_intent()

	assertions.check(
		character.global_position.x > start_x + 0.2,
		"move intent should drive clear horizontal motion"
	)
	assertions.check(
		character.facing_direction.dot(Vector3.RIGHT) > 0.9,
		"move intent should update the character facing direction"
	)


func test_jump_intent_lifts_character(assertions, context) -> void:
	var fixture: CharacterFixture.Result = await CharacterFixture.instantiate(context)
	var character: Node3D = fixture.character
	var start_y: float = character.global_position.y

	character.queue_jump_intent()
	for _frame_index: int in range(20):
		await context.physics_frame()

	assertions.check(
		character.global_position.y > start_y + 0.2,
		"queued jump intent should lift the character using the gameplay capsule"
	)


func test_character_settles_back_to_floor(assertions, context) -> void:
	var fixture: CharacterFixture.Result = await CharacterFixture.instantiate(context)
	var character: CharacterBody3D = fixture.character

	character.queue_jump_intent()
	for _frame_index: int in range(20):
		await context.physics_frame()

	for _frame_index: int in range(120):
		if character.is_on_floor():
			break
		await context.physics_frame()

	assertions.check(
		character.is_on_floor(),
		"character should settle back onto the floor after the jump test"
	)
