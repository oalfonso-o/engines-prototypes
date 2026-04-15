extends RefCounted
class_name CharacterFixture

const SandboxFixture := preload("res://tests/fixtures/fixtures_sandbox.gd")


class Result:
	var scene: Node3D
	var character: Node3D
	var visual_rig: Node3D
	var skeleton: Skeleton3D


	func _init(
		scene_value: Node3D,
		character_value: Node3D,
		visual_rig_value: Node3D,
		skeleton_value: Skeleton3D
	) -> void:
		scene = scene_value
		character = character_value
		visual_rig = visual_rig_value
		skeleton = skeleton_value


static func instantiate(context) -> Result:
	var scene: Node3D = await SandboxFixture.instantiate(context)
	var character: Node3D = SandboxFixture.get_character(scene)
	var visual_rig: Node3D = SandboxFixture.get_visual_rig(scene)
	var skeleton: Skeleton3D = visual_rig.get_node("Skeleton3D") as Skeleton3D

	return Result.new(scene, character, visual_rig, skeleton)
