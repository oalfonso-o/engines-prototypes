extends RefCounted
class_name PlayerTestDriver


static func queue_jump_intent(player) -> void:
	player._input_state.queue_jump()


static func set_move_intent(player, input_vector: Vector2) -> void:
	player._input_state.set_move_intent(input_vector)


static func clear_move_intent(player) -> void:
	player._input_state.clear_move_intent()


static func aim_at_world_point(player, target_position: Vector3) -> void:
	player._camera_rig.aim_at_world_point(player, target_position, player.camera_pitch_limit)
