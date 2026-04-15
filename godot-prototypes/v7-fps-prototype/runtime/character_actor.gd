extends CharacterBody3D
class_name LaunchableCharacterActor3D

const MIN_COLLIDER_HEIGHT: float = 0.45
const CharacterVisualScript := preload("res://runtime/character_visual.gd")

@export var collider_height: float = 1.72
@export var collider_radius: float = 0.34
@export var gravity_force: float = 20.0
@export var jump_velocity: float = 6.4
@export var move_speed: float = 5.2
@export var explosion_reaction_gain: float = 0.09
@export var explosion_upward_ratio: float = 0.48
@export var impulse_damping: float = 14.0

var facing_direction: Vector3 = Vector3.FORWARD

var _collision_shape: CollisionShape3D
var _impulse_velocity: Vector3 = Vector3.ZERO
var _visual_rig: Node3D


func _ready() -> void:
	floor_snap_length = 0.3
	add_to_group("launchable_character")
	_build_runtime_children()
	_apply_capsule()


func _physics_process(delta: float) -> void:
	_update_motion(delta)
	_visual_rig.update_visual(delta, facing_direction, is_on_floor())


func apply_explosion_impulse(origin: Vector3, force: float) -> void:
	var away: Vector3 = global_position - origin
	away.y = 0.0
	if away.length_squared() <= 0.0001:
		away = -facing_direction
	if away.length_squared() <= 0.0001:
		away = Vector3.FORWARD
	away = away.normalized()

	_impulse_velocity += away * force
	velocity.y += force * explosion_upward_ratio
	_visual_rig.apply_explosion_reaction(away, force * explosion_reaction_gain)


func _build_runtime_children() -> void:
	_collision_shape = CollisionShape3D.new()
	_collision_shape.name = "CollisionShape3D"
	add_child(_collision_shape)

	_visual_rig = CharacterVisualScript.new()
	_visual_rig.name = "VisualRig"
	var skeleton := Skeleton3D.new()
	skeleton.name = "Skeleton3D"
	_visual_rig.add_child(skeleton)
	add_child(_visual_rig)


func _apply_capsule() -> void:
	var capsule := CapsuleShape3D.new()
	capsule.radius = collider_radius
	capsule.height = max(MIN_COLLIDER_HEIGHT, collider_height)
	_collision_shape.shape = capsule
	_collision_shape.position = Vector3(0.0, collider_height * 0.5, 0.0)
	_collision_shape.rotation = Vector3.ZERO


func _update_motion(delta: float) -> void:
	var move_direction: Vector3 = _compute_move_direction()
	var flat_facing: Vector3 = _compute_facing_direction(move_direction)
	if flat_facing.length_squared() > 0.0001:
		facing_direction = flat_facing.normalized()

	var desired_horizontal: Vector3 = move_direction * move_speed
	velocity.x = desired_horizontal.x + _impulse_velocity.x
	velocity.z = desired_horizontal.z + _impulse_velocity.z

	if not is_on_floor():
		velocity.y -= gravity_force * delta
	elif _consume_jump_request():
		velocity.y = jump_velocity

	_impulse_velocity = _impulse_velocity.move_toward(Vector3.ZERO, impulse_damping * delta)
	move_and_slide()


func _compute_move_direction() -> Vector3:
	return Vector3.ZERO


func _compute_facing_direction(move_direction: Vector3) -> Vector3:
	return move_direction if move_direction.length_squared() > 0.0001 else facing_direction


func _consume_jump_request() -> bool:
	return false
