extends Node3D
class_name LinearSkillshot3D

const WORLD_COLLISION_MASK := 1
const TARGET_COLLISION_MASK := 4
const TARGET_GROUP := "damageable_targets"

var config: Resource
var owner_rid: RID
var direction: Vector3 = Vector3.FORWARD
var speed: float = 0.0
var max_distance: float = 0.0
var distance_travelled: float = 0.0
var hit_targets: Dictionary = {}
var collision_shape: ShapeCast3D
var visual_mesh: MeshInstance3D
var world_blocked := false
var world_impact_point: Vector3 = Vector3.ZERO


func configure(ability_config: Resource, origin: Vector3, cast_direction: Vector3, owner_body: CollisionObject3D) -> void:
	config = ability_config
	top_level = true
	global_position = origin
	direction = cast_direction.normalized()
	if direction.length_squared() <= 0.0001:
		direction = Vector3.FORWARD
	speed = config.range / maxf(0.01, config.travel_time)
	owner_rid = owner_body.get_rid()
	_resolve_world_block(origin)
	_setup_visual()
	_setup_shape_cast()


func _physics_process(delta: float) -> void:
	if config == null:
		return

	var step_distance: float = speed * delta
	var remaining_distance: float = max_distance - distance_travelled
	if remaining_distance <= 0.0:
		queue_free()
		return
	step_distance = min(step_distance, remaining_distance)
	collision_shape.target_position = direction * step_distance
	collision_shape.force_shapecast_update()

	if collision_shape.is_colliding():
		var ordered_hits := _collect_collisions(global_position)
		for hit: Dictionary in ordered_hits:
			var collider: Variant = hit["collider"]
			var hit_point: Vector3 = hit["point"]
			if collider is Node and collider.is_in_group(TARGET_GROUP):
				var target_id: int = collider.get_instance_id()
				if not hit_targets.has(target_id):
					hit_targets[target_id] = true
					collider.apply_shot_damage(config.damage, [hit_point])

	global_position += direction * step_distance
	distance_travelled += step_distance
	if distance_travelled >= max_distance:
		if world_blocked:
			_spawn_impact(world_impact_point, Color("ff4bc6"), 0.28)
		queue_free()


func _setup_visual() -> void:
	visual_mesh = MeshInstance3D.new()
	visual_mesh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var mesh := BoxMesh.new()
	mesh.size = Vector3(config.width, config.projectile_height, maxf(0.7, config.width * 1.3))
	visual_mesh.mesh = mesh
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.albedo_color = config.projectile_color
	material.emission_enabled = true
	material.emission = config.projectile_color
	material.emission_energy_multiplier = 1.4
	visual_mesh.material_override = material
	add_child(visual_mesh)
	look_at(global_position + direction, Vector3.UP, true)
	rotate_object_local(Vector3.UP, PI)


func _setup_shape_cast() -> void:
	collision_shape = ShapeCast3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(config.width, config.projectile_height, maxf(0.7, config.width * 1.3))
	collision_shape.shape = shape
	collision_shape.collision_mask = TARGET_COLLISION_MASK
	collision_shape.exclude_parent = false
	collision_shape.add_exception_rid(owner_rid)
	add_child(collision_shape)


func _collect_collisions(origin: Vector3) -> Array:
	var collisions: Array = []
	for index in range(collision_shape.get_collision_count()):
		collisions.append({
			"collider": collision_shape.get_collider(index),
			"point": collision_shape.get_collision_point(index),
			"distance": origin.distance_to(collision_shape.get_collision_point(index)),
		})
	collisions.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		return a["distance"] < b["distance"]
	)
	return collisions


func _resolve_world_block(origin: Vector3) -> void:
	max_distance = config.range
	world_blocked = false
	world_impact_point = origin + (direction * config.range)
	var space_state := get_world_3d().direct_space_state
	var query := PhysicsRayQueryParameters3D.create(
		origin,
		origin + (direction * config.range),
		WORLD_COLLISION_MASK,
		[owner_rid]
	)
	query.collide_with_areas = false
	query.collide_with_bodies = true
	var hit: Dictionary = space_state.intersect_ray(query)
	if hit.is_empty():
		return
	world_blocked = true
	world_impact_point = hit["position"]
	max_distance = origin.distance_to(world_impact_point)


func _spawn_impact(point: Vector3, color: Color, size: float) -> void:
	var marker := MeshInstance3D.new()
	marker.top_level = true
	marker.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var mesh := SphereMesh.new()
	mesh.radius = size
	mesh.height = size * 2.0
	marker.mesh = mesh
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.albedo_color = color
	material.emission_enabled = true
	material.emission = color
	material.emission_energy_multiplier = 1.1
	marker.material_override = material
	var host: Node = get_parent() if get_parent() != null else get_tree().root
	host.add_child(marker)
	marker.global_position = point
	var timer := get_tree().create_timer(0.12)
	timer.timeout.connect(func() -> void:
		if is_instance_valid(marker):
			marker.queue_free()
	)
