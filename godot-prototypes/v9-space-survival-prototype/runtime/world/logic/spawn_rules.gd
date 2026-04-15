extends RefCounted
class_name SpawnRules

const BOOSTER_TYPES: Array[String] = ["fire_rate", "extra_shot"]
const MAX_ATTEMPTS: int = 64


static func pick_spawn_position(
	rng: RandomNumberGenerator,
	world_rect: Rect2,
	player_position: Vector2,
	ship_radius: float,
	safe_distance_multiplier: float
) -> Vector2:
	return RandomSpawnPicker.pick_position(
		rng,
		world_rect,
		player_position,
		ship_radius * safe_distance_multiplier
	)


static func pick_booster_type(rng: RandomNumberGenerator) -> String:
	return BoosterTypePicker.pick_type(rng)


class RandomSpawnPicker:
	static func pick_position(
		rng: RandomNumberGenerator,
		world_rect: Rect2,
		player_position: Vector2,
		minimum_distance: float
	) -> Vector2:
		for _attempt_index: int in range(MAX_ATTEMPTS):
			var candidate := Vector2(
				rng.randf_range(world_rect.position.x, world_rect.end.x),
				rng.randf_range(world_rect.position.y, world_rect.end.y)
			)
			if candidate.distance_to(player_position) >= minimum_distance:
				return candidate
		var fallback_direction := Vector2.RIGHT.rotated(rng.randf_range(0.0, TAU))
		var fallback_position := player_position + (fallback_direction * minimum_distance)
		return fallback_position.clamp(world_rect.position, world_rect.end)


class BoosterTypePicker:
	static func pick_type(rng: RandomNumberGenerator) -> String:
		var index: int = rng.randi_range(0, BOOSTER_TYPES.size() - 1)
		return BOOSTER_TYPES[index]
