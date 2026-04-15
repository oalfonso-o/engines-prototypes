extends RefCounted
class_name CharacterRootFixture

const CharacterScript := preload("res://runtime/character_root.gd")
const FloorScript := preload("res://runtime/floor_root.gd")


class Result:
	var scene: Node3D
	var character: CharacterBody3D
	var floor: StaticBody3D


	func _init(scene_value: Node3D, character_value: CharacterBody3D, floor_value: StaticBody3D) -> void:
		scene = scene_value
		character = character_value
		floor = floor_value


static func instantiate(context) -> Result:
	var scene: Node3D = Node3D.new()
	scene.name = "CharacterRootTestScene"

	var floor: StaticBody3D = FloorScript.new() as StaticBody3D
	floor.name = "Floor"
	scene.add_child(floor)

	var character: CharacterBody3D = CharacterScript.new() as CharacterBody3D
	character.name = "CharacterPrototype"
	character.position = Vector3(0.0, 0.2, 0.0)
	scene.add_child(character)

	context.add_scene_root(scene)
	await context.settle_frames(12)
	return Result.new(scene, character, floor)
