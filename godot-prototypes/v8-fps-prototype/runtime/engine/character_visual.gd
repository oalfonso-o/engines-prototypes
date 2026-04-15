extends Node3D
class_name PrototypeCharacterVisual3D

const VisualPoseSolverScript := preload("res://runtime/logic/visual_pose_solver.gd")

const BONE_ROOT: StringName = &"root"
const BONE_CHEST: StringName = &"chest"
const BONE_HEAD: StringName = &"head"
const BONE_LEFT_HAND: StringName = &"left_hand"
const BONE_RIGHT_HAND: StringName = &"right_hand"
const BONE_LEFT_FOOT: StringName = &"left_foot"
const BONE_RIGHT_FOOT: StringName = &"right_foot"
const REQUIRED_BONES: PackedStringArray = [
	"root",
	"chest",
	"head",
	"left_hand",
	"right_hand",
	"left_foot",
	"right_foot",
]

var _config: RigConfig
var _reaction: ReactionState
var _parts: VisualParts

@onready var _skeleton: Skeleton3D = $Skeleton3D


func _ready() -> void:
	_config = RigConfig.new()
	_reaction = ReactionState.new()
	_parts = VisualParts.new()
	RigBuilder.rebuild(self, _skeleton, _config, _parts)
	position.y = _config.visual_root_height
	_apply_pose(Vector3.FORWARD, 0.0)


func update_visual(delta: float, facing_direction: Vector3, on_floor: bool) -> void:
	_reaction.advance(delta, _config.recovery_speed)
	position.y = _config.visual_root_height + _config.compute_idle_bob(on_floor)
	_apply_pose(facing_direction, delta)


func apply_explosion_reaction(world_direction: Vector3, strength: float) -> void:
	_reaction.apply(world_direction, strength)


func hide_head_mesh() -> void:
	if _parts.head_attachment != null:
		_parts.head_attachment.visible = false


func _apply_pose(facing_direction: Vector3, delta: float) -> void:
	var local_reaction: Vector3 = _reaction.local_direction(global_basis, facing_direction)
	var strength: float = _reaction.strength
	var pose: Dictionary = VisualPoseSolverScript.solve(local_reaction, strength, _config)
	var torso_rotation: Vector3 = pose["torso_rotation"]

	_parts.torso_attachment.rotation = torso_rotation
	_parts.left_hand_attachment.position = pose["left_hand_position"]
	_parts.right_hand_attachment.position = pose["right_hand_position"]
	_parts.left_foot_attachment.position = pose["left_foot_position"]
	_parts.right_foot_attachment.position = pose["right_foot_position"]

	_reaction.head_lag_euler = _reaction.head_lag_euler.move_toward(
		pose["head_target_rotation"],
		_config.head_follow_speed * delta
	)
	_parts.head_attachment.position = _config.head_offset()
	_parts.head_attachment.rotation = _reaction.head_lag_euler
	_parts.body_material.emission_energy_multiplier = _reaction.flash_energy()


class RigConfig:
	var foot_radius: float = 0.17
	var foot_outward_strength: float = 0.06
	var foot_tuck_strength: float = 0.14
	var hand_back_strength: float = 0.11
	var hand_lift_strength: float = 0.16
	var hand_outward_strength: float = 0.10
	var hand_radius: float = 0.12
	var head_follow_ratio: float = 0.58
	var head_follow_speed: float = 6.0
	var head_radius: float = 0.20
	var recovery_speed: float = 1.7
	var torso_height: float = 0.98
	var torso_radius: float = 0.28
	var torso_tilt_strength: float = 0.55
	var visual_root_height: float = 0.96

	var _foot_offset_x: float = 0.23
	var _foot_offset_y: float = -0.82
	var _hand_offset_x: float = 0.66
	var _hand_offset_y: float = 0.08
	var _head_offset_y: float = 0.82
	var _idle_bob_amplitude: float = 0.025
	var _idle_bob_speed: float = 4.2


	func compute_idle_bob(on_floor: bool) -> float:
		if not on_floor:
			return 0.0
		return sin(Time.get_ticks_msec() * 0.001 * _idle_bob_speed) * _idle_bob_amplitude


	func foot_offset(side_sign: float) -> Vector3:
		return Vector3(side_sign * _foot_offset_x, _foot_offset_y, 0.0)


	func hand_offset(side_sign: float) -> Vector3:
		return Vector3(side_sign * _hand_offset_x, _hand_offset_y, 0.0)


	func head_offset() -> Vector3:
		return Vector3(0.0, _head_offset_y, 0.0)


class ReactionState:
	var head_lag_euler: Vector3 = Vector3.ZERO
	var strength: float = 0.0

	var _flash_timer: float = 0.0
	var _world_direction: Vector3 = Vector3.BACK


	func advance(delta: float, recovery_speed: float) -> void:
		strength = move_toward(strength, 0.0, recovery_speed * delta)
		_flash_timer = max(0.0, _flash_timer - delta)


	func apply(world_direction: Vector3, reaction_strength: float) -> void:
		_world_direction = world_direction.normalized() if world_direction.length_squared() > 0.0001 else Vector3.BACK
		strength = clampf(strength + reaction_strength, 0.0, 1.0)
		_flash_timer = 0.18


	func flash_energy() -> float:
		return 0.35 if _flash_timer <= 0.0 else 0.95


	func local_direction(global_basis: Basis, facing_direction: Vector3) -> Vector3:
		var reaction_direction: Vector3 = global_basis.inverse() * _world_direction
		reaction_direction.y = 0.0
		if reaction_direction.length_squared() <= 0.0001:
			reaction_direction = -facing_direction if facing_direction.length_squared() > 0.0001 else Vector3.BACK
		if reaction_direction.length_squared() <= 0.0001:
			reaction_direction = Vector3.BACK
		return reaction_direction.normalized()


class VisualParts:
	var body_material: StandardMaterial3D
	var head_attachment: BoneAttachment3D
	var left_foot_attachment: BoneAttachment3D
	var left_hand_attachment: BoneAttachment3D
	var right_foot_attachment: BoneAttachment3D
	var right_hand_attachment: BoneAttachment3D
	var torso_attachment: BoneAttachment3D


class RigBuilder:
	static func rebuild(
		owner: PrototypeCharacterVisual3D,
		skeleton: Skeleton3D,
		config: RigConfig,
		parts: VisualParts
	) -> void:
		_clear_children(owner, skeleton)
		_rebuild_skeleton(skeleton, config)
		parts.body_material = _build_body_material()
		parts.torso_attachment = _build_torso(owner, config, parts.body_material)
		parts.head_attachment = _build_head(owner, config, parts.body_material)
		parts.left_hand_attachment = _build_hand(owner, config, -1.0)
		parts.right_hand_attachment = _build_hand(owner, config, 1.0)
		parts.left_foot_attachment = _build_foot(owner, config, -1.0)
		parts.right_foot_attachment = _build_foot(owner, config, 1.0)


	static func _build_body_material() -> StandardMaterial3D:
		var material := StandardMaterial3D.new()
		material.shading_mode = BaseMaterial3D.SHADING_MODE_PER_PIXEL
		material.albedo_color = Color("efe7df")
		material.emission_enabled = true
		material.emission = Color("79f1ff")
		material.emission_energy_multiplier = 0.35
		return material


	static func _build_head(owner: PrototypeCharacterVisual3D, config: RigConfig, material: Material) -> BoneAttachment3D:
		var attachment := BoneAttachment3D.new()
		attachment.name = "HeadAttachment"
		attachment.bone_name = BONE_HEAD
		owner.add_child(attachment)

		var mesh := MeshInstance3D.new()
		var sphere := SphereMesh.new()
		sphere.radius = config.head_radius
		sphere.height = config.head_radius * 2.0
		mesh.mesh = sphere
		mesh.material_override = material
		attachment.add_child(mesh)
		attachment.position = config.head_offset()
		return attachment


	static func _build_hand(owner: PrototypeCharacterVisual3D, config: RigConfig, side_sign: float) -> BoneAttachment3D:
		var attachment := BoneAttachment3D.new()
		attachment.name = "LeftHandAttachment" if side_sign < 0.0 else "RightHandAttachment"
		attachment.bone_name = BONE_LEFT_HAND if side_sign < 0.0 else BONE_RIGHT_HAND
		owner.add_child(attachment)

		var mesh := MeshInstance3D.new()
		var sphere := SphereMesh.new()
		sphere.radius = config.hand_radius
		sphere.height = config.hand_radius * 2.0
		mesh.mesh = sphere
		mesh.material_override = _build_limb_material(Color("7fe7ff"))
		attachment.add_child(mesh)
		attachment.position = config.hand_offset(side_sign)
		return attachment


	static func _build_foot(owner: PrototypeCharacterVisual3D, config: RigConfig, side_sign: float) -> BoneAttachment3D:
		var attachment := BoneAttachment3D.new()
		attachment.name = "LeftFootAttachment" if side_sign < 0.0 else "RightFootAttachment"
		attachment.bone_name = BONE_LEFT_FOOT if side_sign < 0.0 else BONE_RIGHT_FOOT
		owner.add_child(attachment)

		var mesh := MeshInstance3D.new()
		var sphere := SphereMesh.new()
		sphere.radius = config.foot_radius
		sphere.height = config.foot_radius * 2.0
		mesh.mesh = sphere
		mesh.material_override = _build_limb_material(Color("ffb36d"))
		mesh.rotation.x = PI
		attachment.add_child(mesh)
		attachment.position = config.foot_offset(side_sign)
		return attachment


	static func _build_torso(owner: PrototypeCharacterVisual3D, config: RigConfig, material: Material) -> BoneAttachment3D:
		var attachment := BoneAttachment3D.new()
		attachment.name = "TorsoAttachment"
		attachment.bone_name = BONE_CHEST
		owner.add_child(attachment)

		var mesh := MeshInstance3D.new()
		var capsule := CapsuleMesh.new()
		capsule.radius = config.torso_radius
		capsule.height = config.torso_height
		mesh.mesh = capsule
		mesh.material_override = material
		attachment.add_child(mesh)
		return attachment


	static func _build_limb_material(color: Color) -> StandardMaterial3D:
		var material := StandardMaterial3D.new()
		material.shading_mode = BaseMaterial3D.SHADING_MODE_PER_PIXEL
		material.albedo_color = color
		material.emission_enabled = true
		material.emission = color.lightened(0.18)
		material.emission_energy_multiplier = 0.18
		return material


	static func _clear_children(owner: PrototypeCharacterVisual3D, preserved_child: Node) -> void:
		for child: Node in owner.get_children():
			if child != preserved_child:
				child.queue_free()


	static func _rebuild_skeleton(skeleton: Skeleton3D, config: RigConfig) -> void:
		skeleton.clear_bones()
		var root_idx: int = skeleton.add_bone(BONE_ROOT)
		skeleton.set_bone_rest(root_idx, Transform3D.IDENTITY)

		var chest_idx: int = skeleton.add_bone(BONE_CHEST)
		skeleton.set_bone_parent(chest_idx, root_idx)
		skeleton.set_bone_rest(chest_idx, Transform3D.IDENTITY)

		var head_idx: int = skeleton.add_bone(BONE_HEAD)
		skeleton.set_bone_parent(head_idx, chest_idx)
		skeleton.set_bone_rest(head_idx, Transform3D(Basis.IDENTITY, config.head_offset()))

		var left_hand_idx: int = skeleton.add_bone(BONE_LEFT_HAND)
		skeleton.set_bone_parent(left_hand_idx, chest_idx)
		skeleton.set_bone_rest(left_hand_idx, Transform3D(Basis.IDENTITY, config.hand_offset(-1.0)))

		var right_hand_idx: int = skeleton.add_bone(BONE_RIGHT_HAND)
		skeleton.set_bone_parent(right_hand_idx, chest_idx)
		skeleton.set_bone_rest(right_hand_idx, Transform3D(Basis.IDENTITY, config.hand_offset(1.0)))

		var left_foot_idx: int = skeleton.add_bone(BONE_LEFT_FOOT)
		skeleton.set_bone_parent(left_foot_idx, root_idx)
		skeleton.set_bone_rest(left_foot_idx, Transform3D(Basis.IDENTITY, config.foot_offset(-1.0)))

		var right_foot_idx: int = skeleton.add_bone(BONE_RIGHT_FOOT)
		skeleton.set_bone_parent(right_foot_idx, root_idx)
		skeleton.set_bone_rest(right_foot_idx, Transform3D(Basis.IDENTITY, config.foot_offset(1.0)))
