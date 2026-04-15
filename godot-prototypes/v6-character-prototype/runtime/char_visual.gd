extends Node3D
class_name CharacterVisualRig3D

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

var _builder: RigBuilder
var _config: RigConfig
var _parts: VisualParts
var _pose_applier: PoseApplier
var _pose_solver: PoseSolver
var _reaction: ReactionState

@onready var _skeleton: Skeleton3D = $Skeleton3D


func _ready() -> void:
	_config = RigConfig.new()
	_parts = VisualParts.new()
	_reaction = ReactionState.new()
	_builder = RigBuilder.new(_config, _parts)
	_pose_solver = PoseSolver.new(_config, _reaction)
	_pose_applier = PoseApplier.new(_parts)
	_builder.rebuild_visual_structure(self, _skeleton)
	position.y = _config.visual_root_height
	_pose_applier.apply(_skeleton, _pose_solver.compute_pose(0.0, Vector3.FORWARD, global_basis))


func update_visual(delta: float, facing_direction: Vector3, on_floor: bool) -> void:
	_reaction.advance(delta, _config.reaction_recover_speed)
	position.y = _config.visual_root_height + _config.compute_idle_bob(on_floor)
	_parts.apply_flash_energy(_reaction.flash_energy())
	_pose_applier.apply(_skeleton, _pose_solver.compute_pose(delta, facing_direction, global_basis))


func apply_explosion_reaction(world_direction: Vector3, strength: float) -> void:
	_reaction.apply_explosion(world_direction, strength)


class RigConfig:
	var chest_tilt_strength: float = 0.55
	var _foot_offset_x: float = 0.23
	var _foot_offset_y: float = -0.82
	var foot_outward_strength: float = 0.06
	var foot_radius: float = 0.17
	var foot_tuck_strength: float = 0.14
	var hand_back_strength: float = 0.11
	var hand_lift_strength: float = 0.16
	var _hand_offset_x: float = 0.66
	var _hand_offset_y: float = 0.08
	var hand_outward_strength: float = 0.10
	var hand_radius: float = 0.12
	var head_follow_ratio: float = 0.58
	var head_follow_speed: float = 6.0
	var _head_offset_y: float = 0.82
	var head_radius: float = 0.20
	var _idle_bob_amplitude: float = 0.025
	var _idle_bob_speed: float = 4.2
	var reaction_recover_speed: float = 1.7
	var torso_height: float = 0.98
	var torso_radius: float = 0.28
	var visual_root_height: float = 0.96


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


class VisualParts:
	var body_material: StandardMaterial3D
	var head_attachment: BoneAttachment3D
	var left_foot_attachment: BoneAttachment3D
	var left_hand_attachment: BoneAttachment3D
	var right_foot_attachment: BoneAttachment3D
	var right_hand_attachment: BoneAttachment3D
	var torso_attachment: BoneAttachment3D


	func apply_flash_energy(flash_energy: float) -> void:
		if body_material != null:
			body_material.emission_energy_multiplier = flash_energy


class ReactionState:
	var _flash_timer: float = 0.0
	var head_lag_euler: Vector3 = Vector3.ZERO
	var reaction_strength: float = 0.0
	var _reaction_world_direction: Vector3 = Vector3.BACK


	func advance(delta: float, recover_speed: float) -> void:
		reaction_strength = move_toward(reaction_strength, 0.0, recover_speed * delta)
		_flash_timer = max(0.0, _flash_timer - delta)


	func apply_explosion(world_direction: Vector3, strength: float) -> void:
		_reaction_world_direction = world_direction.normalized() if world_direction.length_squared() > 0.0001 else Vector3.BACK
		reaction_strength = clampf(reaction_strength + strength, 0.0, 1.0)
		_flash_timer = 0.18


	func flash_energy() -> float:
		return 0.35 if _flash_timer <= 0.0 else 0.95


	func local_reaction(global_basis: Basis, facing_direction: Vector3) -> Vector3:
		var local_direction: Vector3 = global_basis.inverse() * _reaction_world_direction
		local_direction.y = 0.0
		if local_direction.length_squared() <= 0.0001:
			local_direction = -facing_direction if facing_direction.length_squared() > 0.0001 else Vector3.BACK
		if local_direction.length_squared() <= 0.0001:
			local_direction = Vector3.BACK
		return local_direction.normalized()


class RigPose:
	var chest_euler: Vector3 = Vector3.ZERO
	var foot_euler: Vector3 = Vector3.ZERO
	var head_euler: Vector3 = Vector3.ZERO
	var head_position: Vector3 = Vector3.ZERO
	var left_foot_bone_position: Vector3 = Vector3.ZERO
	var left_foot_position: Vector3 = Vector3.ZERO
	var left_hand_bone_position: Vector3 = Vector3.ZERO
	var left_hand_euler: Vector3 = Vector3.ZERO
	var left_hand_position: Vector3 = Vector3.ZERO
	var right_foot_bone_position: Vector3 = Vector3.ZERO
	var right_foot_position: Vector3 = Vector3.ZERO
	var right_hand_bone_position: Vector3 = Vector3.ZERO
	var right_hand_euler: Vector3 = Vector3.ZERO
	var right_hand_position: Vector3 = Vector3.ZERO


class RigBuilder:
	var _config: RigConfig
	var _parts: VisualParts


	func _init(config: RigConfig, parts: VisualParts) -> void:
		_config = config
		_parts = parts


	func rebuild_visual_structure(owner: CharacterVisualRig3D, skeleton: Skeleton3D) -> void:
		owner.position = Vector3(0.0, _config.visual_root_height, 0.0)
		_clear_visual_children(owner, skeleton)
		_rebuild_skeleton(skeleton)

		_parts.body_material = _build_body_material()
		_parts.torso_attachment = _build_torso_attachment(owner, _parts.body_material)
		_parts.head_attachment = _build_head_attachment(owner, _parts.body_material)
		_parts.left_hand_attachment = _build_hand_attachment(
			owner,
			"LeftHandAttachment",
			BONE_LEFT_HAND,
			_build_limb_material(Color("7fe7ff"))
		)
		_parts.right_hand_attachment = _build_hand_attachment(
			owner,
			"RightHandAttachment",
			BONE_RIGHT_HAND,
			_build_limb_material(Color("7fe7ff"))
		)
		_parts.left_foot_attachment = _build_foot_attachment(
			owner,
			"LeftFootAttachment",
			BONE_LEFT_FOOT,
			_build_limb_material(Color("ffb36d"))
		)
		_parts.right_foot_attachment = _build_foot_attachment(
			owner,
			"RightFootAttachment",
			BONE_RIGHT_FOOT,
			_build_limb_material(Color("ffb36d"))
		)


	func _build_body_material() -> StandardMaterial3D:
		var material := StandardMaterial3D.new()
		material.shading_mode = BaseMaterial3D.SHADING_MODE_PER_PIXEL
		material.albedo_color = Color("efe7df")
		material.emission_enabled = true
		material.emission = Color("79f1ff")
		material.emission_energy_multiplier = 0.35
		return material


	func _build_foot_attachment(
		owner: CharacterVisualRig3D,
		node_name: String,
		bone_name: StringName,
		material: Material
	) -> BoneAttachment3D:
		var attachment := BoneAttachment3D.new()
		attachment.name = node_name
		attachment.bone_name = bone_name
		owner.add_child(attachment)

		var mesh_instance := MeshInstance3D.new()
		mesh_instance.mesh = GeometryFactory.make_hemisphere_mesh(_config.foot_radius)
		mesh_instance.material_override = material
		mesh_instance.rotation.x = PI
		attachment.add_child(mesh_instance)
		return attachment


	func _build_hand_attachment(
		owner: CharacterVisualRig3D,
		node_name: String,
		bone_name: StringName,
		material: Material
	) -> BoneAttachment3D:
		var attachment := BoneAttachment3D.new()
		attachment.name = node_name
		attachment.bone_name = bone_name
		owner.add_child(attachment)

		var mesh_instance := MeshInstance3D.new()
		mesh_instance.mesh = GeometryFactory.make_sphere_mesh(_config.hand_radius)
		mesh_instance.material_override = material
		attachment.add_child(mesh_instance)
		return attachment


	func _build_head_attachment(owner: CharacterVisualRig3D, material: Material) -> BoneAttachment3D:
		var attachment := BoneAttachment3D.new()
		attachment.name = "HeadAttachment"
		owner.add_child(attachment)

		var mesh_instance := MeshInstance3D.new()
		mesh_instance.mesh = GeometryFactory.make_sphere_mesh(_config.head_radius)
		mesh_instance.material_override = material
		attachment.add_child(mesh_instance)
		return attachment


	func _build_limb_material(color: Color) -> StandardMaterial3D:
		var material := StandardMaterial3D.new()
		material.shading_mode = BaseMaterial3D.SHADING_MODE_PER_PIXEL
		material.albedo_color = color
		material.emission_enabled = true
		material.emission = color.lightened(0.18)
		material.emission_energy_multiplier = 0.18
		return material


	func _build_torso_attachment(owner: CharacterVisualRig3D, material: Material) -> BoneAttachment3D:
		var attachment := BoneAttachment3D.new()
		attachment.name = "TorsoAttachment"
		owner.add_child(attachment)

		var mesh_instance := MeshInstance3D.new()
		var mesh := CapsuleMesh.new()
		mesh.radius = _config.torso_radius
		mesh.height = _config.torso_height
		mesh_instance.mesh = mesh
		mesh_instance.material_override = material
		attachment.add_child(mesh_instance)
		return attachment


	func _clear_visual_children(owner: CharacterVisualRig3D, preserved_child: Node) -> void:
		for child: Node in owner.get_children():
			if child != preserved_child:
				child.queue_free()


	func _rebuild_skeleton(skeleton: Skeleton3D) -> void:
		for child: Node in skeleton.get_children():
			child.queue_free()
		skeleton.clear_bones()

		var root_idx: int = skeleton.add_bone(BONE_ROOT)
		skeleton.set_bone_rest(root_idx, Transform3D(Basis.IDENTITY, Vector3.ZERO))

		var chest_idx: int = skeleton.add_bone(BONE_CHEST)
		skeleton.set_bone_parent(chest_idx, root_idx)
		skeleton.set_bone_rest(chest_idx, Transform3D(Basis.IDENTITY, Vector3.ZERO))

		var head_idx: int = skeleton.add_bone(BONE_HEAD)
		skeleton.set_bone_parent(head_idx, chest_idx)
		skeleton.set_bone_rest(head_idx, Transform3D(Basis.IDENTITY, _config.head_offset()))

		var left_hand_idx: int = skeleton.add_bone(BONE_LEFT_HAND)
		skeleton.set_bone_parent(left_hand_idx, chest_idx)
		skeleton.set_bone_rest(left_hand_idx, Transform3D(Basis.IDENTITY, _config.hand_offset(-1.0)))

		var right_hand_idx: int = skeleton.add_bone(BONE_RIGHT_HAND)
		skeleton.set_bone_parent(right_hand_idx, chest_idx)
		skeleton.set_bone_rest(right_hand_idx, Transform3D(Basis.IDENTITY, _config.hand_offset(1.0)))

		var left_foot_idx: int = skeleton.add_bone(BONE_LEFT_FOOT)
		skeleton.set_bone_parent(left_foot_idx, root_idx)
		skeleton.set_bone_rest(left_foot_idx, Transform3D(Basis.IDENTITY, _config.foot_offset(-1.0)))

		var right_foot_idx: int = skeleton.add_bone(BONE_RIGHT_FOOT)
		skeleton.set_bone_parent(right_foot_idx, root_idx)
		skeleton.set_bone_rest(right_foot_idx, Transform3D(Basis.IDENTITY, _config.foot_offset(1.0)))


class PoseSolver:
	var _config: RigConfig
	var _reaction: ReactionState


	func _init(config: RigConfig, reaction: ReactionState) -> void:
		_config = config
		_reaction = reaction


	func compute_pose(delta: float, facing_direction: Vector3, global_basis: Basis) -> RigPose:
		var local_reaction: Vector3 = _reaction.local_reaction(global_basis, facing_direction)
		var reaction_strength: float = _reaction.reaction_strength
		var pose := RigPose.new()
		pose.chest_euler = Vector3(
			-reaction_strength * _config.chest_tilt_strength,
			local_reaction.x * reaction_strength * 0.12,
			-local_reaction.x * reaction_strength * 0.38
		)
		pose.left_hand_euler = Vector3(-reaction_strength * 0.85, 0.0, -reaction_strength * 0.18)
		pose.right_hand_euler = Vector3(-reaction_strength * 0.85, 0.0, reaction_strength * 0.18)
		pose.foot_euler = Vector3(reaction_strength * 0.55, 0.0, 0.0)
		pose.head_euler = _compute_head_euler(delta, pose.chest_euler)
		pose.head_position = _config.head_offset()
		pose.left_hand_position = _compute_hand_position(-1.0, reaction_strength)
		pose.right_hand_position = _compute_hand_position(1.0, reaction_strength)
		pose.left_foot_position = _compute_foot_position(-1.0, reaction_strength)
		pose.right_foot_position = _compute_foot_position(1.0, reaction_strength)
		pose.left_hand_bone_position = _compute_hand_bone_position(-1.0, reaction_strength)
		pose.right_hand_bone_position = _compute_hand_bone_position(1.0, reaction_strength)
		pose.left_foot_bone_position = _compute_foot_bone_position(-1.0, reaction_strength)
		pose.right_foot_bone_position = _compute_foot_bone_position(1.0, reaction_strength)
		return pose


	func _compute_foot_bone_position(side_sign: float, reaction_strength: float) -> Vector3:
		return Vector3(
			side_sign * _config.foot_outward_strength * reaction_strength,
			_config.foot_tuck_strength * reaction_strength,
			-0.04 * reaction_strength
		)


	func _compute_foot_position(side_sign: float, reaction_strength: float) -> Vector3:
		var base_offset: Vector3 = _config.foot_offset(side_sign)
		return base_offset + _compute_foot_bone_position(side_sign, reaction_strength)


	func _compute_hand_bone_position(side_sign: float, reaction_strength: float) -> Vector3:
		return Vector3(
			side_sign * _config.hand_outward_strength * reaction_strength,
			_config.hand_lift_strength * reaction_strength,
			-_config.hand_back_strength * reaction_strength
		)


	func _compute_hand_position(side_sign: float, reaction_strength: float) -> Vector3:
		var base_offset: Vector3 = _config.hand_offset(side_sign)
		return base_offset + _compute_hand_bone_position(side_sign, reaction_strength)


	func _compute_head_euler(delta: float, chest_euler: Vector3) -> Vector3:
		var desired_head_euler: Vector3 = chest_euler * _config.head_follow_ratio
		var head_weight: float = clampf(delta * _config.head_follow_speed, 0.0, 1.0)
		var new_head_lag: Vector3 = _reaction.head_lag_euler.lerp(desired_head_euler, head_weight)
		_reaction.head_lag_euler = new_head_lag
		return new_head_lag


class PoseApplier:
	var _parts: VisualParts


	func _init(parts: VisualParts) -> void:
		_parts = parts


	func apply(skeleton: Skeleton3D, pose: RigPose) -> void:
		_set_bone_rotation(skeleton, BONE_ROOT, Vector3.ZERO)
		_set_bone_position(skeleton, BONE_ROOT, Vector3.ZERO)
		_set_bone_rotation(skeleton, BONE_CHEST, pose.chest_euler)
		_set_bone_position(skeleton, BONE_CHEST, Vector3.ZERO)
		_set_bone_rotation(skeleton, BONE_HEAD, pose.head_euler)
		_set_bone_position(skeleton, BONE_HEAD, Vector3.ZERO)
		_set_bone_rotation(skeleton, BONE_LEFT_HAND, pose.left_hand_euler)
		_set_bone_position(
			skeleton,
			BONE_LEFT_HAND,
			pose.left_hand_bone_position
		)
		_set_bone_rotation(skeleton, BONE_RIGHT_HAND, pose.right_hand_euler)
		_set_bone_position(
			skeleton,
			BONE_RIGHT_HAND,
			pose.right_hand_bone_position
		)
		_set_bone_rotation(skeleton, BONE_LEFT_FOOT, pose.foot_euler)
		_set_bone_position(
			skeleton,
			BONE_LEFT_FOOT,
			pose.left_foot_bone_position
		)
		_set_bone_rotation(skeleton, BONE_RIGHT_FOOT, pose.foot_euler)
		_set_bone_position(
			skeleton,
			BONE_RIGHT_FOOT,
			pose.right_foot_bone_position
		)

		_apply_attachment_pose(_parts.torso_attachment, Vector3.ZERO, pose.chest_euler)
		_apply_attachment_pose(_parts.head_attachment, pose.head_position, pose.head_euler)
		_apply_attachment_pose(_parts.left_hand_attachment, pose.left_hand_position, pose.left_hand_euler)
		_apply_attachment_pose(_parts.right_hand_attachment, pose.right_hand_position, pose.right_hand_euler)
		_apply_attachment_pose(_parts.left_foot_attachment, pose.left_foot_position, pose.foot_euler)
		_apply_attachment_pose(_parts.right_foot_attachment, pose.right_foot_position, pose.foot_euler)


	func _apply_attachment_pose(attachment: BoneAttachment3D, position: Vector3, rotation_euler: Vector3) -> void:
		if attachment == null:
			return
		attachment.transform = Transform3D(Basis.from_euler(rotation_euler), position)


	func _set_bone_position(skeleton: Skeleton3D, bone_name: StringName, position: Vector3) -> void:
		var bone_idx: int = skeleton.find_bone(bone_name)
		if bone_idx == -1:
			return
		skeleton.set_bone_pose_position(bone_idx, position)


	func _set_bone_rotation(skeleton: Skeleton3D, bone_name: StringName, euler: Vector3) -> void:
		var bone_idx: int = skeleton.find_bone(bone_name)
		if bone_idx == -1:
			return
		var basis := Basis.from_euler(euler)
		skeleton.set_bone_pose_rotation(bone_idx, basis.get_rotation_quaternion())


class GeometryFactory:
	static func make_sphere_mesh(radius: float) -> SphereMesh:
		var mesh := SphereMesh.new()
		mesh.radius = radius
		mesh.height = radius * 2.0
		return mesh


	static func make_hemisphere_mesh(radius: float) -> ArrayMesh:
		var surface_tool := SurfaceTool.new()
		var latitude_segments: int = 8
		var longitude_segments: int = 14

		surface_tool.begin(Mesh.PRIMITIVE_TRIANGLES)

		for latitude: int in range(latitude_segments):
			var v0: float = float(latitude) / float(latitude_segments)
			var v1: float = float(latitude + 1) / float(latitude_segments)
			var theta0: float = (PI * 0.5) + (PI * 0.5 * v0)
			var theta1: float = (PI * 0.5) + (PI * 0.5 * v1)

			for longitude: int in range(longitude_segments):
				var u0: float = float(longitude) / float(longitude_segments)
				var u1: float = float(longitude + 1) / float(longitude_segments)
				var phi0: float = TAU * u0
				var phi1: float = TAU * u1

				var p00: Vector3 = GeometryFactory._sphere_point(radius, theta0, phi0)
				var p10: Vector3 = GeometryFactory._sphere_point(radius, theta0, phi1)
				var p01: Vector3 = GeometryFactory._sphere_point(radius, theta1, phi0)
				var p11: Vector3 = GeometryFactory._sphere_point(radius, theta1, phi1)

				GeometryFactory._add_triangle(surface_tool, p00, p01, p11)
				GeometryFactory._add_triangle(surface_tool, p00, p11, p10)

		var cap_center := Vector3.ZERO
		var cap_normal := Vector3.UP
		for longitude: int in range(longitude_segments):
			var u0: float = float(longitude) / float(longitude_segments)
			var u1: float = float(longitude + 1) / float(longitude_segments)
			var phi0: float = TAU * u0
			var phi1: float = TAU * u1
			var edge0 := Vector3(cos(phi0) * radius, 0.0, sin(phi0) * radius)
			var edge1 := Vector3(cos(phi1) * radius, 0.0, sin(phi1) * radius)

			surface_tool.set_normal(cap_normal)
			surface_tool.add_vertex(cap_center)
			surface_tool.set_normal(cap_normal)
			surface_tool.add_vertex(edge1)
			surface_tool.set_normal(cap_normal)
			surface_tool.add_vertex(edge0)

		surface_tool.generate_normals()
		return surface_tool.commit()


	static func _sphere_point(radius: float, theta: float, phi: float) -> Vector3:
		var sin_theta: float = sin(theta)
		return Vector3(
			radius * sin_theta * cos(phi),
			radius * cos(theta),
			radius * sin_theta * sin(phi)
		)


	static func _add_triangle(surface_tool: SurfaceTool, a: Vector3, b: Vector3, c: Vector3) -> void:
		surface_tool.set_normal(a.normalized())
		surface_tool.add_vertex(a)
		surface_tool.set_normal(b.normalized())
		surface_tool.add_vertex(b)
		surface_tool.set_normal(c.normalized())
		surface_tool.add_vertex(c)
