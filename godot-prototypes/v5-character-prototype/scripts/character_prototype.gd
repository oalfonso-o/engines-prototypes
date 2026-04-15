extends CharacterBody3D
class_name CharacterPrototype3D

const BONE_ROOT: StringName = &"root"
const BONE_TORSO: StringName = &"torso"
const BONE_HEAD: StringName = &"head"
const BONE_LEFT_HAND: StringName = &"left_hand"
const BONE_RIGHT_HAND: StringName = &"right_hand"
const BONE_LEFT_FOOT: StringName = &"left_foot"
const BONE_RIGHT_FOOT: StringName = &"right_foot"

const REQUIRED_BONES: PackedStringArray = [
	"root",
	"torso",
	"head",
	"left_hand",
	"right_hand",
	"left_foot",
	"right_foot",
]

@export var move_speed: float = 5.2
@export var jump_velocity: float = 6.4
@export var gravity_force: float = 20.0
@export var collider_radius: float = 0.34
@export var collider_height: float = 1.72
@export var visual_root_height: float = 0.96
@export var torso_radius: float = 0.28
@export var torso_height: float = 0.96
@export var head_radius: float = 0.21
@export var hand_radius: float = 0.12
@export var foot_radius: float = 0.16
@export var reaction_recover_speed: float = 1.7
@export var explosion_upward_ratio: float = 0.48
@export var impulse_damping: float = 14.0

var _reaction_strength: float = 0.0
var _reaction_world_direction: Vector3 = Vector3.BACK
var _head_lag_euler: Vector3 = Vector3.ZERO
var _facing_direction: Vector3 = Vector3.FORWARD
var _body_material: StandardMaterial3D
var _flash_timer: float = 0.0
var _impulse_velocity: Vector3 = Vector3.ZERO

var _torso_attachment: BoneAttachment3D
var _head_attachment: BoneAttachment3D
var _left_hand_attachment: BoneAttachment3D
var _right_hand_attachment: BoneAttachment3D
var _left_foot_attachment: BoneAttachment3D
var _right_foot_attachment: BoneAttachment3D

@onready var collision_shape: CollisionShape3D = $CollisionShape3D
@onready var visual_root: Node3D = $VisualRoot
@onready var skeleton: Skeleton3D = $VisualRoot/Skeleton3D


func _ready() -> void:
	_setup_collision()
	_setup_visual_layer()
	_apply_pose(0.0)


func _physics_process(delta: float) -> void:
	_update_movement(delta)
	_update_reaction(delta)
	_apply_pose(delta)


func apply_explosion_impulse(origin: Vector3, force: float) -> void:
	var away: Vector3 = global_position - origin
	away.y = 0.0
	if away.length_squared() <= 0.0001:
		away = -_facing_direction
	if away.length_squared() <= 0.0001:
		away = Vector3.FORWARD
	away = away.normalized()

	_impulse_velocity += away * force
	velocity.y += force * explosion_upward_ratio
	_reaction_world_direction = away
	_reaction_strength = clampf(_reaction_strength + (force * 0.09), 0.0, 1.0)
	_flash_timer = 0.18


func get_reaction_debug_state() -> Dictionary:
	return {
		"strength": _reaction_strength,
		"facing": _facing_direction,
		"reaction_direction": _reaction_world_direction,
		"head_lag_euler": _head_lag_euler,
		"impulse_velocity": _impulse_velocity,
	}


func get_facing_direction() -> Vector3:
	return _facing_direction


func get_visual_lowest_point_y() -> float:
	var values: Array[float] = [
		_left_foot_attachment.global_position.y - foot_radius,
		_right_foot_attachment.global_position.y - foot_radius,
		_torso_attachment.global_position.y - (torso_height * 0.5),
		_head_attachment.global_position.y - head_radius,
	]
	values.sort()
	return values[0]


func get_collider_bottom_y() -> float:
	var capsule: CapsuleShape3D = collision_shape.shape as CapsuleShape3D
	if capsule == null:
		return collision_shape.global_position.y
	return collision_shape.global_position.y - (capsule.height * 0.5)


func has_vertical_capsule_collider() -> bool:
	return collision_shape.shape is CapsuleShape3D and collision_shape.rotation == Vector3.ZERO


func _update_movement(delta: float) -> void:
	var input_vector: Vector2 = _read_move_input()
	var move_direction: Vector3 = Vector3(input_vector.x, 0.0, input_vector.y)
	if move_direction.length_squared() > 0.0001:
		move_direction = move_direction.normalized()
		_facing_direction = move_direction
		rotation.y = atan2(_facing_direction.x, _facing_direction.z)

	var desired_horizontal: Vector3 = move_direction * move_speed
	velocity.x = desired_horizontal.x + _impulse_velocity.x
	velocity.z = desired_horizontal.z + _impulse_velocity.z

	if not is_on_floor():
		velocity.y -= gravity_force * delta
	elif Input.is_key_pressed(KEY_SPACE):
		velocity.y = jump_velocity

	_impulse_velocity = _impulse_velocity.move_toward(Vector3.ZERO, impulse_damping * delta)
	move_and_slide()


func _update_reaction(delta: float) -> void:
	_reaction_strength = move_toward(_reaction_strength, 0.0, reaction_recover_speed * delta)
	_flash_timer = max(0.0, _flash_timer - delta)
	if _body_material != null:
		_body_material.emission_energy_multiplier = 0.35 if _flash_timer <= 0.0 else 0.95


func _apply_pose(delta: float) -> void:
	var local_reaction: Vector3 = global_basis.inverse() * _reaction_world_direction
	local_reaction.y = 0.0
	if local_reaction.length_squared() <= 0.0001:
		local_reaction = Vector3.BACK
	local_reaction = local_reaction.normalized()

	var chest_euler: Vector3 = Vector3(
		-_reaction_strength * 0.55,
		local_reaction.x * _reaction_strength * 0.12,
		-local_reaction.x * _reaction_strength * 0.38
	)
	var left_hand_euler: Vector3 = Vector3(-0.85 * _reaction_strength, 0.0, -0.28 * _reaction_strength)
	var right_hand_euler: Vector3 = Vector3(-0.85 * _reaction_strength, 0.0, 0.28 * _reaction_strength)
	var foot_euler: Vector3 = Vector3(0.65 * _reaction_strength, 0.0, 0.0)

	var desired_head_euler: Vector3 = chest_euler * 0.55
	var head_lerp_weight: float = clampf(delta * 6.0, 0.0, 1.0)
	_head_lag_euler = _head_lag_euler.lerp(desired_head_euler, head_lerp_weight)

	_set_bone_rotation(BONE_ROOT, Vector3.ZERO)
	_set_bone_position(BONE_ROOT, Vector3.ZERO)
	_set_bone_rotation(BONE_TORSO, chest_euler)
	_set_bone_position(BONE_TORSO, Vector3.ZERO)
	_set_bone_rotation(BONE_HEAD, _head_lag_euler)
	_set_bone_position(BONE_HEAD, Vector3.ZERO)
	_set_bone_rotation(BONE_LEFT_HAND, left_hand_euler)
	_set_bone_position(BONE_LEFT_HAND, Vector3(-0.03 * _reaction_strength, 0.08 * _reaction_strength, -0.06 * _reaction_strength))
	_set_bone_rotation(BONE_RIGHT_HAND, right_hand_euler)
	_set_bone_position(BONE_RIGHT_HAND, Vector3(0.03 * _reaction_strength, 0.08 * _reaction_strength, -0.06 * _reaction_strength))
	_set_bone_rotation(BONE_LEFT_FOOT, foot_euler)
	_set_bone_position(BONE_LEFT_FOOT, Vector3(0.0, 0.10 * _reaction_strength, -0.05 * _reaction_strength))
	_set_bone_rotation(BONE_RIGHT_FOOT, foot_euler)
	_set_bone_position(BONE_RIGHT_FOOT, Vector3(0.0, 0.10 * _reaction_strength, -0.05 * _reaction_strength))


func _setup_collision() -> void:
	var capsule := CapsuleShape3D.new()
	capsule.radius = collider_radius
	capsule.height = max(0.45, collider_height - (collider_radius * 2.0))
	collision_shape.shape = capsule
	collision_shape.position = Vector3(0.0, collider_height * 0.5, 0.0)
	collision_shape.rotation = Vector3.ZERO


func _setup_visual_layer() -> void:
	visual_root.position = Vector3(0.0, visual_root_height, 0.0)
	for child: Node in skeleton.get_children():
		child.queue_free()
	skeleton.clear_bones()

	var root_idx: int = skeleton.add_bone(BONE_ROOT)
	skeleton.set_bone_rest(root_idx, Transform3D(Basis.IDENTITY, Vector3.ZERO))

	var torso_idx: int = skeleton.add_bone(BONE_TORSO)
	skeleton.set_bone_parent(torso_idx, root_idx)
	skeleton.set_bone_rest(torso_idx, Transform3D(Basis.IDENTITY, Vector3.ZERO))

	var head_idx: int = skeleton.add_bone(BONE_HEAD)
	skeleton.set_bone_parent(head_idx, torso_idx)
	skeleton.set_bone_rest(head_idx, Transform3D(Basis.IDENTITY, Vector3(0.0, 0.78, 0.0)))

	var left_hand_idx: int = skeleton.add_bone(BONE_LEFT_HAND)
	skeleton.set_bone_parent(left_hand_idx, torso_idx)
	skeleton.set_bone_rest(left_hand_idx, Transform3D(Basis.IDENTITY, Vector3(-0.56, 0.10, 0.0)))

	var right_hand_idx: int = skeleton.add_bone(BONE_RIGHT_HAND)
	skeleton.set_bone_parent(right_hand_idx, torso_idx)
	skeleton.set_bone_rest(right_hand_idx, Transform3D(Basis.IDENTITY, Vector3(0.56, 0.10, 0.0)))

	var left_foot_idx: int = skeleton.add_bone(BONE_LEFT_FOOT)
	skeleton.set_bone_parent(left_foot_idx, root_idx)
	skeleton.set_bone_rest(left_foot_idx, Transform3D(Basis.IDENTITY, Vector3(-0.20, -0.80, 0.0)))

	var right_foot_idx: int = skeleton.add_bone(BONE_RIGHT_FOOT)
	skeleton.set_bone_parent(right_foot_idx, root_idx)
	skeleton.set_bone_rest(right_foot_idx, Transform3D(Basis.IDENTITY, Vector3(0.20, -0.80, 0.0)))

	_body_material = _make_body_material()
	_torso_attachment = _add_torso_attachment()
	_head_attachment = _add_head_attachment()
	_left_hand_attachment = _add_hand_attachment("LeftHandAttachment", BONE_LEFT_HAND, Color("7fe7ff"))
	_right_hand_attachment = _add_hand_attachment("RightHandAttachment", BONE_RIGHT_HAND, Color("7fe7ff"))
	_left_foot_attachment = _add_foot_attachment("LeftFootAttachment", BONE_LEFT_FOOT, Color("ffb36d"))
	_right_foot_attachment = _add_foot_attachment("RightFootAttachment", BONE_RIGHT_FOOT, Color("ffb36d"))


func _add_torso_attachment() -> BoneAttachment3D:
	var attachment := BoneAttachment3D.new()
	attachment.name = "TorsoAttachment"
	attachment.bone_name = BONE_TORSO
	skeleton.add_child(attachment)

	var mesh_instance := MeshInstance3D.new()
	var mesh := CapsuleMesh.new()
	mesh.radius = torso_radius
	mesh.height = torso_height
	mesh_instance.mesh = mesh
	mesh_instance.material_override = _body_material
	attachment.add_child(mesh_instance)
	return attachment


func _add_head_attachment() -> BoneAttachment3D:
	var attachment := BoneAttachment3D.new()
	attachment.name = "HeadAttachment"
	attachment.bone_name = BONE_HEAD
	skeleton.add_child(attachment)

	var mesh_instance := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radius = head_radius
	mesh_instance.mesh = mesh
	mesh_instance.material_override = _body_material
	attachment.add_child(mesh_instance)
	return attachment


func _add_hand_attachment(node_name: String, bone_name: StringName, color: Color) -> BoneAttachment3D:
	var attachment := BoneAttachment3D.new()
	attachment.name = node_name
	attachment.bone_name = bone_name
	skeleton.add_child(attachment)

	var mesh_instance := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radius = hand_radius
	mesh_instance.mesh = mesh
	mesh_instance.material_override = _make_limb_material(color)
	attachment.add_child(mesh_instance)
	return attachment


func _add_foot_attachment(node_name: String, bone_name: StringName, color: Color) -> BoneAttachment3D:
	var attachment := BoneAttachment3D.new()
	attachment.name = node_name
	attachment.bone_name = bone_name
	skeleton.add_child(attachment)

	var mesh_instance := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radius = foot_radius
	mesh_instance.mesh = mesh
	mesh_instance.material_override = _make_limb_material(color)
	attachment.add_child(mesh_instance)
	return attachment


func _make_body_material() -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_PER_PIXEL
	material.albedo_color = Color("efe7df")
	material.emission_enabled = true
	material.emission = Color("79f1ff")
	material.emission_energy_multiplier = 0.35
	return material


func _make_limb_material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_PER_PIXEL
	material.albedo_color = color
	material.emission_enabled = true
	material.emission = color.lightened(0.18)
	material.emission_energy_multiplier = 0.18
	return material


func _set_bone_rotation(bone_name: StringName, euler: Vector3) -> void:
	var bone_idx: int = skeleton.find_bone(bone_name)
	if bone_idx == -1:
		return
	var basis := Basis.from_euler(euler)
	skeleton.set_bone_pose_rotation(bone_idx, basis.get_rotation_quaternion())


func _set_bone_position(bone_name: StringName, position: Vector3) -> void:
	var bone_idx: int = skeleton.find_bone(bone_name)
	if bone_idx == -1:
		return
	skeleton.set_bone_pose_position(bone_idx, position)


func _read_move_input() -> Vector2:
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
