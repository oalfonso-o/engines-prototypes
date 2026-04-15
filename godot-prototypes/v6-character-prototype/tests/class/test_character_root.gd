extends RefCounted

const CharacterRootFixture := preload("res://tests/fixtures/fixtures_character_root.gd")


func test_jump_intent_lifts_character(assertions, context) -> void:
	var fixture: CharacterRootFixture.Result = await CharacterRootFixture.instantiate(context)
	var character: CharacterBody3D = fixture.character
	var start_y: float = character.global_position.y

	character.queue_jump_intent()
	for _frame_index: int in range(20):
		await context.physics_frame()

	assertions.check(
		character.global_position.y > start_y + 0.2,
		"queued jump intent should lift the character using the gameplay capsule"
	)


func test_character_settles_back_to_floor(assertions, context) -> void:
	var fixture: CharacterRootFixture.Result = await CharacterRootFixture.instantiate(context)
	var character: CharacterBody3D = fixture.character

	character.queue_jump_intent()
	for _frame_index: int in range(20):
		await context.physics_frame()

	for _frame_index: int in range(120):
		if character.is_on_floor():
			break
		await context.physics_frame()

	assertions.check(character.is_on_floor(), "character should settle back onto the floor after the jump test")
