extends Node3D
class_name GrenadeProjectile3D

const BLAST_HEIGHT_OFFSET: float = 0.35
const GrenadeArcSolverScript := preload("res://runtime/logic/grenade_arc_solver.gd")

var _start_position: Vector3 = Vector3.ZERO
var _target_position: Vector3 = Vector3.ZERO
var _travel_duration: float = 0.8
var _arc_height: float = 2.0
var _world_root: Node3D
var _explosion_force: float = 8.0
var _explosion_radius: float = 6.0
var _travel_state: TravelState


func _ready() -> void:
	ProjectileVisualBuilder.build(self)
	_travel_state = TravelState.new()


func _physics_process(delta: float) -> void:
	if _travel_state.is_complete():
		return

	var progress: float = _travel_state.advance(delta, _travel_duration)
	global_position = GrenadeArcSolverScript.compute_position(_start_position, _target_position, progress, _arc_height)

	if progress >= 1.0:
		_travel_state.finish()
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
	_travel_duration = GrenadeArcSolverScript.compute_duration(start_position, target_position, travel_speed)


class ProjectileVisualBuilder:
	static func build(owner: Node3D) -> void:
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
		owner.add_child(mesh)


class TravelState:
	var _elapsed: float = 0.0
	var _exploded: bool = false


	func advance(delta: float, travel_duration: float) -> float:
		_elapsed += delta
		return minf(1.0, _elapsed / travel_duration)


	func finish() -> void:
		_exploded = true


	func is_complete() -> bool:
		return _exploded
