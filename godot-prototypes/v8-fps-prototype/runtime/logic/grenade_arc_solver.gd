extends RefCounted
class_name GrenadeArcSolver


static func compute_duration(start_position: Vector3, target_position: Vector3, travel_speed: float) -> float:
	return max(0.12, start_position.distance_to(target_position) / max(0.01, travel_speed))


static func compute_position(
	start_position: Vector3,
	target_position: Vector3,
	progress: float,
	arc_height: float
) -> Vector3:
	var arc_y: float = sin(progress * PI) * arc_height
	return start_position.lerp(target_position, progress) + Vector3(0.0, arc_y, 0.0)
