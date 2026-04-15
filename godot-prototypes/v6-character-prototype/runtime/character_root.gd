extends CharacterBody3D
class_name CharacterPrototype3D

const MIN_COLLIDER_HEIGHT: float = 0.45
const VisualRigScript := preload("res://runtime/char_visual.gd")

var facing_direction: Vector3 = Vector3.FORWARD

var _move_speed: float = 5.2
var _jump_velocity: float = 6.4
var _gravity_force: float = 20.0
var _collider_radius: float = 0.34
var _collider_height: float = 1.72
var _explosion_reaction_gain: float = 0.09
var _explosion_upward_ratio: float = 0.48
var _impulse_damping: float = 14.0
var _impulse_velocity: Vector3 = Vector3.ZERO
var _move_intent_enabled: bool = false
var _move_intent: Vector2 = Vector2.ZERO
var _jump_queued: bool = false
var _collision_shape: CollisionShape3D
var _visual_rig: Node3D


func _ready() -> void:
	floor_snap_length = 0.3
	_build_runtime_children()
	ColliderSetup.apply_capsule(_collision_shape, _collider_radius, _collider_height, MIN_COLLIDER_HEIGHT)


func _physics_process(delta: float) -> void:
	RuntimeFlow.update_gameplay(self, delta)
	RuntimeFlow.update_visual(self, delta)


func apply_explosion_impulse(origin: Vector3, force: float) -> void:
	ExplosionReaction.apply(self, origin, force, _explosion_reaction_gain, _explosion_upward_ratio)


func set_move_intent(input_vector: Vector2) -> void:
	RuntimeCommands.set_move_intent(self, input_vector)


func clear_move_intent() -> void:
	RuntimeCommands.clear_move_intent(self)


func queue_jump_intent() -> void:
	RuntimeCommands.queue_jump_intent(self)


func _build_runtime_children() -> void:
	_collision_shape = CollisionShape3D.new()
	_collision_shape.name = "CollisionShape3D"
	add_child(_collision_shape)

	var visual_rig := VisualRigScript.new()
	visual_rig.name = "VisualRig"

	var skeleton := Skeleton3D.new()
	skeleton.name = "Skeleton3D"
	visual_rig.add_child(skeleton)

	add_child(visual_rig)
	_visual_rig = visual_rig


class RuntimeFlow:
	static func update_gameplay(owner: CharacterPrototype3D, delta: float) -> void:
		var input_vector: Vector2 = InputReader.read_move_input(owner._move_intent_enabled, owner._move_intent)
		var move_direction: Vector3 = Vector3(input_vector.x, 0.0, input_vector.y)
		if move_direction.length_squared() > 0.0001:
			move_direction = move_direction.normalized()
			owner.facing_direction = move_direction
			owner.rotation.y = atan2(owner.facing_direction.x, owner.facing_direction.z)

		var desired_horizontal: Vector3 = move_direction * owner._move_speed
		owner.velocity.x = desired_horizontal.x + owner._impulse_velocity.x
		owner.velocity.z = desired_horizontal.z + owner._impulse_velocity.z

		if not owner.is_on_floor():
			owner.velocity.y -= owner._gravity_force * delta
		elif InputReader.consume_jump(owner):
			owner.velocity.y = owner._jump_velocity

		owner._impulse_velocity = owner._impulse_velocity.move_toward(Vector3.ZERO, owner._impulse_damping * delta)
		owner.move_and_slide()


	static func update_visual(owner: CharacterPrototype3D, delta: float) -> void:
		owner._visual_rig.update_visual(delta, owner.facing_direction, owner.is_on_floor())


class ColliderSetup:
	static func apply_capsule(
		shape_node: CollisionShape3D,
		radius: float,
		height: float,
		min_height: float
	) -> void:
		var capsule := CapsuleShape3D.new()
		capsule.radius = radius
		capsule.height = max(min_height, height)
		shape_node.shape = capsule
		shape_node.position = Vector3(0.0, height * 0.5, 0.0)
		shape_node.rotation = Vector3.ZERO


class ExplosionReaction:
	static func apply(
		owner: CharacterPrototype3D,
		origin: Vector3,
		force: float,
		reaction_gain: float,
		upward_ratio: float
	) -> void:
		var away: Vector3 = owner.global_position - origin
		away.y = 0.0
		if away.length_squared() <= 0.0001:
			away = -owner.facing_direction
		if away.length_squared() <= 0.0001:
			away = Vector3.FORWARD
		away = away.normalized()

		owner._impulse_velocity += away * force
		owner.velocity.y += force * upward_ratio
		owner._visual_rig.apply_explosion_reaction(away, force * reaction_gain)


class InputReader:
	static func consume_jump(owner: CharacterPrototype3D) -> bool:
		if owner._jump_queued:
			owner._jump_queued = false
			return true
		return Input.is_key_pressed(KEY_SPACE)


	static func read_move_input(intent_enabled: bool, intent: Vector2) -> Vector2:
		if intent_enabled:
			return intent
		var input_vector := Vector2.ZERO
		if Input.is_key_pressed(KEY_A):
			input_vector.x -= 1.0
		if Input.is_key_pressed(KEY_D):
			input_vector.x += 1.0
		if Input.is_key_pressed(KEY_W):
			input_vector.y -= 1.0
		if Input.is_key_pressed(KEY_S):
			input_vector.y += 1.0
		return input_vector.normalized()


class RuntimeCommands:
	static func set_move_intent(owner: CharacterPrototype3D, input_vector: Vector2) -> void:
		owner._move_intent_enabled = true
		owner._move_intent = input_vector


	static func clear_move_intent(owner: CharacterPrototype3D) -> void:
		owner._move_intent_enabled = false
		owner._move_intent = Vector2.ZERO


	static func queue_jump_intent(owner: CharacterPrototype3D) -> void:
		owner._jump_queued = true
