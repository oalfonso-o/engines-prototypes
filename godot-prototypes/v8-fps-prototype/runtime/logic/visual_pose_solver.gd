extends RefCounted
class_name CharacterVisualPoseSolver


static func solve(local_reaction: Vector3, reaction_strength: float, config) -> Dictionary:
	var torso_roll: float = -local_reaction.x * config.torso_tilt_strength * reaction_strength
	var torso_pitch: float = local_reaction.z * config.torso_tilt_strength * reaction_strength
	return {
		"torso_rotation": Vector3(torso_pitch, 0.0, torso_roll),
		"left_hand_position": config.hand_offset(-1.0) + Vector3(
			-config.hand_outward_strength * reaction_strength,
			config.hand_lift_strength * reaction_strength,
			config.hand_back_strength * reaction_strength
		),
		"right_hand_position": config.hand_offset(1.0) + Vector3(
			config.hand_outward_strength * reaction_strength,
			config.hand_lift_strength * reaction_strength,
			config.hand_back_strength * reaction_strength
		),
		"left_foot_position": config.foot_offset(-1.0) + Vector3(
			-config.foot_outward_strength * reaction_strength,
			0.0,
			config.foot_tuck_strength * reaction_strength
		),
		"right_foot_position": config.foot_offset(1.0) + Vector3(
			config.foot_outward_strength * reaction_strength,
			0.0,
			config.foot_tuck_strength * reaction_strength
		),
		"head_target_rotation": Vector3(
			-torso_pitch * config.head_follow_ratio,
			0.0,
			-torso_roll * config.head_follow_ratio
		),
	}
