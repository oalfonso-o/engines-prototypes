extends RefCounted
class_name TargetDetector


static func detect_target(
	camera: Camera3D,
	screen_position: Vector2,
	space_state: PhysicsDirectSpaceState3D,
	excluded_rids: Array,
	collision_mask: int,
	max_distance: float = 400.0
) -> Dictionary:
	var ray_origin: Vector3 = camera.project_ray_origin(screen_position)
	var ray_direction: Vector3 = camera.project_ray_normal(screen_position)
	var ray_end: Vector3 = ray_origin + (ray_direction * max_distance)
	var query: PhysicsRayQueryParameters3D = PhysicsRayQueryParameters3D.create(ray_origin, ray_end, collision_mask, excluded_rids)
	query.collide_with_areas = false
	query.collide_with_bodies = true

	var hit: Dictionary = space_state.intersect_ray(query)
	var result: Dictionary = {
		"screen_position": screen_position,
		"ray_origin": ray_origin,
		"ray_end": ray_end,
		"hovered_target": null,
		"hovered_target_name": "",
		"target_point": Vector3.ZERO,
		"cursor_hit_position": ray_end,
		"cursor_hit_collider": null,
	}

	if hit.is_empty():
		return result

	var collider: Variant = hit["collider"]
	var hit_position: Vector3 = hit["position"]
	result["cursor_hit_position"] = hit_position
	result["cursor_hit_collider"] = collider

	var damageable: Node = _find_damageable(collider)
	if damageable != null:
		result["hovered_target"] = damageable
		result["hovered_target_name"] = damageable.name
		if damageable.has_method("get_target_point"):
			result["target_point"] = damageable.get_target_point()
		else:
			result["target_point"] = damageable.global_position

	return result


static func _find_damageable(collider: Variant) -> Node:
	var current: Variant = collider
	while current != null:
		if current is Node and current.has_method("apply_shot_damage"):
			return current
		if current is Node:
			current = current.get_parent()
		else:
			return null
	return null
