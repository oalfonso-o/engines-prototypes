extends CharacterBody3D
class_name LaunchableCharacterActor3D

const MIN_COLLIDER_HEIGHT: float = 0.45
const CharacterVisualScript := preload("res://runtime/engine/character_visual.gd")
const ExplosionImpulseSolverScript := preload("res://runtime/logic/explosion_impulse_solver.gd")

@export var collider_height: float = 1.72
@export var collider_radius: float = 0.34
@export var gravity_force: float = 20.0
@export var jump_velocity: float = 6.4
@export var move_speed: float = 5.2
@export var explosion_reaction_gain: float = 0.09
@export var explosion_upward_ratio: float = 0.48
@export var impulse_damping: float = 14.0

var facing_direction: Vector3 = Vector3.FORWARD
var visual_rig: PrototypeCharacterVisual3D

var _motion: MotionState
var _runtime_nodes: RuntimeNodes


func _ready() -> void:
	floor_snap_length = 0.3
	add_to_group("launchable_character")
	_motion = MotionState.new()
	_runtime_nodes = RuntimeNodes.new()
	_runtime_nodes.build(self, CharacterVisualScript)
	_runtime_nodes.apply_capsule(collider_radius, collider_height)
	visual_rig = _runtime_nodes.visual_rig


func _physics_process(delta: float) -> void:
	_motion.update(self, delta)
	visual_rig.update_visual(delta, facing_direction, is_on_floor())


func apply_explosion_impulse(origin: Vector3, force: float) -> void:
	var away: Vector3 = ExplosionImpulseSolverScript.resolve_direction(origin, global_position, facing_direction)
	_motion.apply_explosion(self, away, force)
	visual_rig.apply_explosion_reaction(away, force * explosion_reaction_gain)


func _compute_move_direction() -> Vector3:
	return Vector3.ZERO


func _compute_facing_direction(move_direction: Vector3) -> Vector3:
	return move_direction if move_direction.length_squared() > 0.0001 else facing_direction


func _consume_jump_request() -> bool:
	return false


class RuntimeNodes:
	var _collision_shape: CollisionShape3D
	var visual_rig: PrototypeCharacterVisual3D


	func build(owner: LaunchableCharacterActor3D, visual_script: GDScript) -> void:
		_collision_shape = CollisionShape3D.new()
		_collision_shape.name = "CollisionShape3D"
		owner.add_child(_collision_shape)

		visual_rig = visual_script.new()
		visual_rig.name = "VisualRig"
		var skeleton := Skeleton3D.new()
		skeleton.name = "Skeleton3D"
		visual_rig.add_child(skeleton)
		owner.add_child(visual_rig)


	func apply_capsule(collider_radius: float, collider_height: float) -> void:
		var capsule := CapsuleShape3D.new()
		capsule.radius = collider_radius
		capsule.height = max(MIN_COLLIDER_HEIGHT, collider_height)
		_collision_shape.shape = capsule
		_collision_shape.position = Vector3(0.0, collider_height * 0.5, 0.0)
		_collision_shape.rotation = Vector3.ZERO


class MotionState:
	var _impulse_velocity: Vector3 = Vector3.ZERO


	func update(owner: LaunchableCharacterActor3D, delta: float) -> void:
		var move_direction: Vector3 = owner._compute_move_direction()
		var flat_facing: Vector3 = owner._compute_facing_direction(move_direction)
		if flat_facing.length_squared() > 0.0001:
			owner.facing_direction = flat_facing.normalized()

		var desired_horizontal: Vector3 = move_direction * owner.move_speed
		owner.velocity.x = desired_horizontal.x + _impulse_velocity.x
		owner.velocity.z = desired_horizontal.z + _impulse_velocity.z

		if not owner.is_on_floor():
			owner.velocity.y -= owner.gravity_force * delta
		elif owner._consume_jump_request():
			owner.velocity.y = owner.jump_velocity

		_impulse_velocity = _impulse_velocity.move_toward(Vector3.ZERO, owner.impulse_damping * delta)
		owner.move_and_slide()


	func apply_explosion(owner: LaunchableCharacterActor3D, away: Vector3, force: float) -> void:
		_impulse_velocity += away * force
		owner.velocity.y += force * owner.explosion_upward_ratio
