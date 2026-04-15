extends Node3D
class_name GrenadeProjectile3D

const TARGET_GROUP := "damageable_targets"

var config: Resource
var start_point: Vector3 = Vector3.ZERO
var target_point: Vector3 = Vector3.ZERO
var elapsed: float = 0.0
var visual_mesh: MeshInstance3D


func configure(ability_config: Resource, origin: Vector3, destination: Vector3) -> void:
	config = ability_config
	top_level = true
	start_point = origin
	target_point = destination
	global_position = origin
	_setup_visual()


func _physics_process(delta: float) -> void:
	if config == null:
		return
	elapsed = minf(config.travel_time, elapsed + delta)
	var t: float = elapsed / maxf(0.01, config.travel_time)
	var horizontal: Vector3 = start_point.lerp(target_point, t)
	var arc_height: float = maxf(2.4, start_point.distance_to(target_point) * 0.14)
	var arc_y: float = sin(t * PI) * arc_height
	global_position = Vector3(horizontal.x, horizontal.y + arc_y, horizontal.z)

	if elapsed >= config.travel_time:
		_explode()
		queue_free()


func _setup_visual() -> void:
	visual_mesh = MeshInstance3D.new()
	visual_mesh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var mesh := SphereMesh.new()
	mesh.radius = 0.22
	mesh.height = 0.44
	visual_mesh.mesh = mesh
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.albedo_color = config.projectile_color
	material.emission_enabled = true
	material.emission = config.projectile_color
	material.emission_energy_multiplier = 1.4
	visual_mesh.material_override = material
	add_child(visual_mesh)


func _explode() -> void:
	for node: Node in get_tree().get_nodes_in_group(TARGET_GROUP):
		var target: Node3D = node as Node3D
		if target == null or not target.is_inside_tree():
			continue
		if target.global_position.distance_to(target_point) <= config.explosion_radius:
			target.apply_shot_damage(config.damage, [target_point])

	var explosion := MeshInstance3D.new()
	explosion.top_level = true
	explosion.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var mesh := SphereMesh.new()
	mesh.radius = config.explosion_radius
	mesh.height = config.explosion_radius * 2.0
	explosion.mesh = mesh
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material.albedo_color = Color(config.projectile_color.r, config.projectile_color.g, config.projectile_color.b, 0.28)
	material.emission_enabled = true
	material.emission = config.projectile_color.lightened(0.2)
	material.emission_energy_multiplier = 1.3
	explosion.material_override = material
	var host: Node = get_parent() if get_parent() != null else get_tree().root
	host.add_child(explosion)
	explosion.global_position = target_point
	var timer := get_tree().create_timer(0.16)
	timer.timeout.connect(func() -> void:
		if is_instance_valid(explosion):
			explosion.queue_free()
	)
