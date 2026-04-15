extends RefCounted
class_name ExplosionImpulseSolver


static func resolve_direction(origin: Vector3, position: Vector3, facing_direction: Vector3) -> Vector3:
	var away: Vector3 = position - origin
	away.y = 0.0
	if away.length_squared() <= 0.0001:
		away = -facing_direction
	if away.length_squared() <= 0.0001:
		away = Vector3.FORWARD
	return away.normalized()


static func scale_force(distance: float, radius: float, base_force: float) -> float:
	if radius <= 0.001:
		return base_force
	var distance_ratio: float = 1.0 - (distance / radius)
	return base_force * maxf(0.25, distance_ratio)
