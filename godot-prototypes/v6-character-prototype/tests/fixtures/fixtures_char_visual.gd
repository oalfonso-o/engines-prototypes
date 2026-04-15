extends RefCounted
class_name CharVisualFixture

const VisualRigScript := preload("res://runtime/char_visual.gd")


class Result:
	var scene: Node3D
	var visual_rig: Node3D
	var skeleton: Skeleton3D


	func _init(scene_value: Node3D, visual_rig_value: Node3D, skeleton_value: Skeleton3D) -> void:
		scene = scene_value
		visual_rig = visual_rig_value
		skeleton = skeleton_value


static func instantiate(context) -> Result:
	var scene: Node3D = Node3D.new()
	scene.name = "CharVisualTestScene"

	var visual_rig: Node3D = VisualRigScript.new() as Node3D
	visual_rig.name = "VisualRig"

	var skeleton: Skeleton3D = Skeleton3D.new()
	skeleton.name = "Skeleton3D"
	visual_rig.add_child(skeleton)
	scene.add_child(visual_rig)

	context.add_scene_root(scene)
	await context.process_frame()

	skeleton = visual_rig.get_node_or_null("Skeleton3D") as Skeleton3D
	return Result.new(scene, visual_rig, skeleton)
