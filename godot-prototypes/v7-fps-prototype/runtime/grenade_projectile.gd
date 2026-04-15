extends Node3D
class_name GrenadeProjectile3D

const BLAST_HEIGHT_OFFSET: float = 0.35

var _elapsed: float = 0.0
var _exploded: bool = false
var _start_position: Vector3 = Vector3.ZERO
var _target_position: Vector3 = Vector3.ZERO
var _travel_duration: float = 0.8
var _arc_height: float = 2.0
var _world_root: Node3D
var _explosion_force: float = 8.0
var _explosion_radius: float = 6.0


func _ready() -> void:
	var mesh := MeshInstance3D.new()
	var sphere := SphereMesh.new()
	sphere.radius = 0.18
	sphere.height = 0.36
	mesh.mesh = sphere
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.albedo_color = Color("ffd469")
	material.emission_enabled = true
	material.emission = Color("ffd469")
	material.emission_energy_multiplier = 1.0
	mesh.material_override = material
	add_child(mesh)


func _physics_process(delta: float) -> void:
	if _exploded:
		return

	_elapsed += delta
	var progress: float = minf(1.0, _elapsed / _travel_duration)
	var arc_y: float = sin(progress * PI) * _arc_height
	global_position = _start_position.lerp(_target_position, progress) + Vector3(0.0, arc_y, 0.0)

	if progress >= 1.0:
		_exploded = true
		if _world_root != null:
			_world_root.apply_explosion(_target_position + Vector3(0.0, BLAST_HEIGHT_OFFSET, 0.0), _explosion_radius, _explosion_force)
		queue_free()


func setup(
	start_position: Vector3,
	target_position: Vector3,
	travel_speed: float,
	arc_height: float,
	explosion_radius: float,
	explosion_force: float,
	world_root: Node3D
) -> void:
	_start_position = start_position
	_target_position = target_position
	_arc_height = arc_height
	_explosion_radius = explosion_radius
	_explosion_force = explosion_force
	_world_root = world_root
	global_position = start_position
	_travel_duration = max(0.12, start_position.distance_to(target_position) / max(0.01, travel_speed))
