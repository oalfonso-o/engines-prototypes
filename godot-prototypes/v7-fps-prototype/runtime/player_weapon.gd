extends RefCounted
class_name PlayerWeaponSystem


func fire(camera: Camera3D, shooter: CollisionObject3D, damage: int, fire_range: float) -> Dictionary:
	var origin: Vector3 = camera.global_position
	var direction: Vector3 = -camera.global_basis.z
	var query := PhysicsRayQueryParameters3D.create(origin, origin + (direction * fire_range))
	query.collide_with_areas = false
	query.hit_from_inside = false
	query.exclude = [shooter]

	var hit: Dictionary = camera.get_world_3d().direct_space_state.intersect_ray(query)
	var collider: Object = hit.get("collider", null)
	if collider != null and collider.has_method("apply_damage"):
		collider.apply_damage(damage)
	return hit
