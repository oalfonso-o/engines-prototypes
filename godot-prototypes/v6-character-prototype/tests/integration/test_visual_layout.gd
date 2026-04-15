extends RefCounted

const CharacterFixture := preload("res://tests/fixtures/fixtures_character.gd")
const VisualRigScript := preload("res://runtime/char_visual.gd")


func test_character_visual_layout_stays_above_floor(assertions, context) -> void:
	var fixture: CharacterFixture.Result = await CharacterFixture.instantiate(context)
	var character: Node3D = fixture.character
	var visual_rig: Node3D = fixture.visual_rig
	var skeleton: Skeleton3D = fixture.skeleton

	assertions.check(
		TestSupport.has_vertical_capsule_collider(character),
		"character must use one vertical capsule collider as the gameplay body"
	)
	assertions.check(
		absf(TestSupport.get_collider_bottom_y(character)) <= 0.12,
		"capsule bottom should stay very close to floor level"
	)

	var visual_lowest_point_y: float = TestSupport.get_visual_lowest_point_y(assertions, visual_rig)
	if is_inf(visual_lowest_point_y):
		return
	assertions.check(
		visual_lowest_point_y >= -0.02,
		"visual body should stay above the floor instead of sinking into it, lowest_y=%.4f" % visual_lowest_point_y
	)
	assertions.check(
		skeleton != null,
		"character should contain a Skeleton3D in the visual layer"
	)
	if skeleton == null:
		return

	for bone_name: String in VisualRigScript.REQUIRED_BONES:
		assertions.check(
			skeleton.find_bone(bone_name) != -1,
			"missing expected bone: %s" % bone_name
		)

	var torso_attachment: BoneAttachment3D = TestSupport.require_attachment(
		assertions,
		visual_rig,
		"TorsoAttachment"
	)
	var left_hand_attachment: BoneAttachment3D = TestSupport.require_attachment(
		assertions,
		visual_rig,
		"LeftHandAttachment"
	)
	var right_hand_attachment: BoneAttachment3D = TestSupport.require_attachment(
		assertions,
		visual_rig,
		"RightHandAttachment"
	)
	var left_foot_attachment: BoneAttachment3D = TestSupport.require_attachment(
		assertions,
		visual_rig,
		"LeftFootAttachment"
	)
	var right_foot_attachment: BoneAttachment3D = TestSupport.require_attachment(
		assertions,
		visual_rig,
		"RightFootAttachment"
	)
	if (
		torso_attachment == null
		or left_hand_attachment == null
		or right_hand_attachment == null
		or left_foot_attachment == null
		or right_foot_attachment == null
	):
		return

	var torso_center: Vector3 = torso_attachment.global_position
	var left_hand_center: Vector3 = left_hand_attachment.global_position
	var right_hand_center: Vector3 = right_hand_attachment.global_position
	var torso_radius: float = TestSupport.get_capsule_mesh_radius(assertions, torso_attachment)
	var hand_radius: float = TestSupport.get_sphere_mesh_radius(assertions, left_hand_attachment)
	var left_foot_lowest_y: float = TestSupport.get_mesh_lowest_point_y(assertions, left_foot_attachment)
	var right_foot_lowest_y: float = TestSupport.get_mesh_lowest_point_y(assertions, right_foot_attachment)
	if is_inf(torso_radius) or is_inf(hand_radius) or is_inf(left_foot_lowest_y) or is_inf(right_foot_lowest_y):
		return

	assertions.check(
		absf(left_hand_center.x - torso_center.x) > torso_radius + (hand_radius * 0.5),
		"left hand should start clearly outside torso, torso=%s hand=%s" % [str(torso_center), str(left_hand_center)]
	)
	assertions.check(
		absf(right_hand_center.x - torso_center.x) > torso_radius + (hand_radius * 0.5),
		"right hand should start clearly outside torso, torso=%s hand=%s" % [str(torso_center), str(right_hand_center)]
	)
	assertions.check(
		left_foot_lowest_y < torso_center.y - (torso_radius * 0.2),
		"left foot should start clearly below torso, torso=%s foot_y=%.4f" % [str(torso_center), left_foot_lowest_y]
	)
	assertions.check(
		right_foot_lowest_y < torso_center.y - (torso_radius * 0.2),
		"right foot should start clearly below torso, torso=%s foot_y=%.4f" % [str(torso_center), right_foot_lowest_y]
	)


class TestSupport:
	static func get_capsule_mesh_radius(assertions, attachment: BoneAttachment3D) -> float:
		var mesh_instance: MeshInstance3D = TestSupport._get_first_mesh_child(assertions, attachment)
		if mesh_instance == null:
			return INF
		var mesh: CapsuleMesh = mesh_instance.mesh as CapsuleMesh
		assertions.check(mesh != null, "%s should contain a CapsuleMesh child" % attachment.name)
		if mesh == null:
			return INF
		return mesh.radius


	static func get_collider_bottom_y(character: Node3D) -> float:
		var collision_shape: CollisionShape3D = character.get_node("CollisionShape3D") as CollisionShape3D
		var capsule: CapsuleShape3D = collision_shape.shape as CapsuleShape3D
		return collision_shape.global_position.y - (capsule.height * 0.5)


	static func get_mesh_lowest_point_y(assertions, node: Node3D) -> float:
		var mesh_instance: MeshInstance3D = TestSupport._get_first_mesh_child(assertions, node)
		if mesh_instance == null:
			return INF
		var aabb: AABB = mesh_instance.get_aabb()
		var lowest_y: float = INF
		for corner: Vector3 in TestSupport._aabb_corners(aabb):
			var world_corner: Vector3 = mesh_instance.global_transform * corner
			lowest_y = minf(lowest_y, world_corner.y)
		return lowest_y


	static func get_sphere_mesh_radius(assertions, attachment: BoneAttachment3D) -> float:
		var mesh_instance: MeshInstance3D = TestSupport._get_first_mesh_child(assertions, attachment)
		if mesh_instance == null:
			return INF
		var mesh: SphereMesh = mesh_instance.mesh as SphereMesh
		assertions.check(mesh != null, "%s should contain a SphereMesh child" % attachment.name)
		if mesh == null:
			return INF
		return mesh.radius


	static func get_visual_lowest_point_y(assertions, visual_rig: Node3D) -> float:
		var lowest_y: float = INF
		var attachment_names: PackedStringArray = [
			"TorsoAttachment",
			"HeadAttachment",
			"LeftHandAttachment",
			"RightHandAttachment",
			"LeftFootAttachment",
			"RightFootAttachment",
		]
		for attachment_name: String in attachment_names:
			var attachment: BoneAttachment3D = require_attachment(assertions, visual_rig, attachment_name)
			if attachment == null:
				return INF
			var attachment_lowest_y: float = TestSupport.get_mesh_lowest_point_y(assertions, attachment)
			if is_inf(attachment_lowest_y):
				return INF
			lowest_y = minf(lowest_y, attachment_lowest_y)
		return lowest_y


	static func has_vertical_capsule_collider(character: Node3D) -> bool:
		var collision_shape: CollisionShape3D = character.get_node("CollisionShape3D") as CollisionShape3D
		if collision_shape == null:
			return false
		var capsule: CapsuleShape3D = collision_shape.shape as CapsuleShape3D
		if capsule == null:
			return false
		return collision_shape.rotation.is_equal_approx(Vector3.ZERO)


	static func _aabb_corners(aabb: AABB) -> Array[Vector3]:
		var corners: Array[Vector3] = []
		var min_corner: Vector3 = aabb.position
		var max_corner: Vector3 = aabb.position + aabb.size
		for x_value: float in [min_corner.x, max_corner.x]:
			for y_value: float in [min_corner.y, max_corner.y]:
				for z_value: float in [min_corner.z, max_corner.z]:
					corners.append(Vector3(x_value, y_value, z_value))
		return corners


	static func require_attachment(assertions, visual_rig: Node3D, attachment_name: String) -> BoneAttachment3D:
		var attachment: BoneAttachment3D = visual_rig.get_node_or_null(attachment_name) as BoneAttachment3D
		assertions.check(attachment != null, "visual rig should contain %s" % attachment_name)
		return attachment


	static func _get_first_mesh_child(assertions, node: Node3D) -> MeshInstance3D:
		for child: Node in node.get_children():
			var mesh_instance: MeshInstance3D = child as MeshInstance3D
			if mesh_instance != null:
				return mesh_instance
		assertions.check(false, "%s should contain a MeshInstance3D child" % node.name)
		return null
