extends RefCounted

const CharVisualFixture := preload("res://tests/fixtures/fixtures_char_visual.gd")
const VisualRigScript := preload("res://runtime/char_visual.gd")


func test_required_bones_exist(assertions, context) -> void:
	var fixture: CharVisualFixture.Result = await CharVisualFixture.instantiate(context)
	var skeleton: Skeleton3D = fixture.skeleton

	assertions.check(skeleton != null, "visual rig should contain a Skeleton3D child")
	if skeleton == null:
		return

	for bone_name: String in VisualRigScript.REQUIRED_BONES:
		assertions.check(skeleton.find_bone(bone_name) != -1, "missing expected bone: %s" % bone_name)


func test_explosion_reaction_updates_visible_pose(assertions, context) -> void:
	var fixture: CharVisualFixture.Result = await CharVisualFixture.instantiate(context)
	var visual_rig: Node3D = fixture.visual_rig
	var torso_attachment: BoneAttachment3D = visual_rig.get_node("TorsoAttachment") as BoneAttachment3D
	var initial_torso_rotation: Vector3 = torso_attachment.rotation

	visual_rig.apply_explosion_reaction(Vector3.RIGHT, 1.0)
	visual_rig.update_visual(0.016, Vector3.FORWARD, true)

	assertions.check(
		torso_attachment.rotation.distance_to(initial_torso_rotation) > 0.01,
		"visual rig should visibly react to an explosion"
	)
	assertions.check(
		visual_rig.position.y > 0.0,
		"visual rig should keep its root positioned above the floor"
	)
