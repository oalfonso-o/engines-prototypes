extends RefCounted

const CharacterFixture := preload("res://tests/fixtures/fixtures_character.gd")
const DebugControllerScript := preload("res://debug/debug_controller.gd")


func test_explosion_pushes_and_recovers(assertions, context) -> void:
	var fixture: CharacterFixture.Result = await CharacterFixture.instantiate(context)
	var character: CharacterBody3D = fixture.character
	var visual_rig: Node3D = fixture.visual_rig
	var left_hand_attachment: BoneAttachment3D = visual_rig.get_node("LeftHandAttachment") as BoneAttachment3D
	var torso_attachment: BoneAttachment3D = visual_rig.get_node("TorsoAttachment") as BoneAttachment3D
	var start_y: float = character.global_position.y
	var initial_left_hand_position: Vector3 = left_hand_attachment.position
	var initial_torso_rotation: Vector3 = torso_attachment.rotation
	var explosion_origin: Vector3 = character.global_position + (
		character.facing_direction * -DebugControllerScript.EXPLOSION_DISTANCE
	) + DebugControllerScript.EXPLOSION_OFFSET

	character.apply_explosion_impulse(explosion_origin, DebugControllerScript.EXPLOSION_FORCE)
	for _frame_index: int in range(6):
		await context.physics_frame()

	var horizontal_velocity: Vector3 = Vector3(character.velocity.x, 0.0, character.velocity.z)
	var away_direction: Vector3 = character.global_position - explosion_origin
	away_direction.y = 0.0
	away_direction = away_direction.normalized()

	assertions.check(
		left_hand_attachment.position.distance_to(initial_left_hand_position) > 0.05,
		"explosion should visibly move the hand away from its default pose"
	)
	assertions.check(
		torso_attachment.rotation.distance_to(initial_torso_rotation) > 0.08,
		"explosion should visibly tilt the torso"
	)
	assertions.check(
		character.velocity.y > 0.0 or character.global_position.y > start_y,
		"explosion should add upward impulse"
	)
	assertions.check(
		horizontal_velocity.dot(away_direction) > 0.1,
		"explosion should push the character away from the origin"
	)

	for _frame_index: int in range(150):
		await context.physics_frame()

	assertions.check(
		left_hand_attachment.position.distance_to(initial_left_hand_position) < 0.04,
		"hand pose should recover smoothly back toward idle"
	)
	assertions.check(
		torso_attachment.rotation.distance_to(initial_torso_rotation) < 0.08,
		"torso pose should recover smoothly back toward idle"
	)
