extends RefCounted
class_name HybridShotResolver


static func resolve_targeted_shot(
	space_state: PhysicsDirectSpaceState3D,
	origin: Vector3,
	target: Node3D,
	target_point: Vector3,
	damage_per_shot: float,
	excluded_rids: Array,
	world_collision_mask: int
) -> Dictionary:
	var direction: Vector3 = target_point - origin
	var distance_to_target: float = direction.length()
	if distance_to_target <= 0.001:
		direction = Vector3.FORWARD
		distance_to_target = 0.001
	else:
		direction = direction / distance_to_target

	var world_query: PhysicsRayQueryParameters3D = PhysicsRayQueryParameters3D.create(
		origin,
		target_point,
		world_collision_mask,
		excluded_rids
	)
	world_query.collide_with_areas = false
	world_query.collide_with_bodies = true
	var world_hit: Dictionary = space_state.intersect_ray(world_query)

	var result: Dictionary = {
		"mode": "targeting",
		"target": target,
		"target_name": target.name,
		"target_point": target_point,
		"aim_direction": direction,
		"status": "hit_enemy",
		"line_blocked": false,
		"impact_position": target_point,
		"impact_collider": target,
		"damage": damage_per_shot,
		"debug_color": Color("7dff6f"),
		"debug_label": "TARGET CLEAR",
	}

	if not world_hit.is_empty():
		result["status"] = "blocked"
		result["line_blocked"] = true
		result["impact_position"] = world_hit["position"]
		result["impact_collider"] = world_hit["collider"]
		result["damage"] = 0.0
		result["debug_color"] = Color("ff4bc6")
		result["debug_label"] = "TARGET BLOCKED"

	return result


static func resolve_free_shot(
	space_state: PhysicsDirectSpaceState3D,
	origin: Vector3,
	direction: Vector3,
	damage_per_shot: float,
	max_range: float,
	excluded_rids: Array,
	collision_mask: int
) -> Dictionary:
	var final_direction: Vector3 = direction.normalized()
	if final_direction.length_squared() <= 0.0001:
		final_direction = Vector3.FORWARD
	var end: Vector3 = origin + (final_direction * max_range)

	var query: PhysicsRayQueryParameters3D = PhysicsRayQueryParameters3D.create(origin, end, collision_mask, excluded_rids)
	query.collide_with_areas = false
	query.collide_with_bodies = true
	var hit: Dictionary = space_state.intersect_ray(query)

	var result: Dictionary = {
		"mode": "free",
		"target": null,
		"target_name": "",
		"target_point": Vector3.ZERO,
		"aim_direction": final_direction,
		"status": "miss",
		"line_blocked": false,
		"impact_position": end,
		"impact_collider": null,
		"damage": 0.0,
		"debug_color": Color("48d8ff"),
		"debug_label": "FREE MISS",
	}

	if hit.is_empty():
		return result

	var collider: Variant = hit["collider"]
	var hit_position: Vector3 = hit["position"]
	result["impact_position"] = hit_position
	result["impact_collider"] = collider

	var damageable: Node = _find_damageable(collider)
	if damageable != null:
		result["status"] = "hit_enemy"
		result["target"] = damageable
		result["target_name"] = damageable.name
		result["damage"] = damage_per_shot
		result["debug_color"] = Color("7dff6f")
		result["debug_label"] = "FREE HIT"
	else:
		result["status"] = "blocked"
		result["line_blocked"] = true
		result["debug_color"] = Color("ff4bc6")
		result["debug_label"] = "FREE BLOCKED"

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
