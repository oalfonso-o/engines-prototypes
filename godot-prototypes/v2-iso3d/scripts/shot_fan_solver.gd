extends RefCounted
class_name ShotFanSolver


static func resolve_shot(
	space_state: PhysicsDirectSpaceState3D,
	origin: Vector3,
	horizontal_direction: Vector3,
	weapon: Resource,
	excluded_rids: Array,
	collision_mask: int
) -> Dictionary:
	var rays: Array = []
	var damage_by_id: Dictionary = {}
	var rays_count: int = max(1, weapon.projectile_rays_count)
	var directions: Array = build_ray_directions(
		horizontal_direction,
		rays_count,
		weapon.vertical_span_degrees,
		weapon.ray_spacing_mode
	)

	for direction: Vector3 in directions:
		var end: Vector3 = origin + (direction * weapon.max_range)
		var query: PhysicsRayQueryParameters3D = PhysicsRayQueryParameters3D.create(origin, end, collision_mask, excluded_rids)
		query.collide_with_areas = false
		query.collide_with_bodies = true
		var hit: Dictionary = space_state.intersect_ray(query)
		var ray_result: Dictionary = {
			"start": origin,
			"end": end,
			"status": "miss",
			"hit_position": end,
			"collider": null,
		}
		if not hit.is_empty():
			var collider: Variant = hit["collider"]
			var hit_position: Vector3 = hit["position"]
			ray_result["hit_position"] = hit_position
			ray_result["collider"] = collider
			var damageable: Node = _find_damageable(collider)
			if damageable != null:
				ray_result["status"] = "hit_enemy"
				ray_result["end"] = hit_position
				var instance_id: int = damageable.get_instance_id()
				var record: Dictionary = damage_by_id.get(instance_id, {
					"target": damageable,
					"damage": 0.0,
					"hit_count": 0,
					"hit_points": [],
				})
				record["damage"] += weapon.damage_per_ray
				record["hit_count"] += 1
				record["hit_points"].append(hit_position)
				damage_by_id[instance_id] = record
			else:
				ray_result["status"] = "blocked"
				ray_result["end"] = hit_position
		rays.append(ray_result)

	return {
		"rays": rays,
		"damage_records": damage_by_id.values(),
	}


static func build_ray_directions(
	horizontal_direction: Vector3,
	rays_count: int,
	vertical_span_degrees: float,
	spacing_mode: String
) -> Array:
	var result: Array = []
	var flat_direction := Vector3(horizontal_direction.x, 0.0, horizontal_direction.z).normalized()
	if flat_direction.length_squared() <= 0.0001:
		flat_direction = Vector3.FORWARD
	var right_axis := flat_direction.cross(Vector3.UP).normalized()
	if right_axis.length_squared() <= 0.0001:
		right_axis = Vector3.RIGHT

	if rays_count <= 1:
		result.append(flat_direction)
		return result

	var half_span: float = vertical_span_degrees * 0.5
	for index in range(rays_count):
		var factor: float = float(index) / float(rays_count - 1)
		var angle_degrees: float = lerp(-half_span, half_span, _remap_spacing(factor, spacing_mode))
		var rotated: Vector3 = flat_direction.rotated(right_axis, deg_to_rad(-angle_degrees)).normalized()
		result.append(rotated)
	return result


static func _remap_spacing(factor: float, spacing_mode: String) -> float:
	if spacing_mode == "centered":
		var centered: float = (factor * 2.0) - 1.0
		return (sign(centered) * abs(centered) * abs(centered) + 1.0) * 0.5
	return factor


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
