extends Node3D

const CameraRigScript := preload("res://runtime/camera_rig.gd")
const CharacterRootScript := preload("res://runtime/character_root.gd")
const DebugControllerScript := preload("res://debug/debug_controller.gd")
const DebugHudScript := preload("res://debug/debug_hud.gd")
const FloorRootScript := preload("res://runtime/floor_root.gd")
const LightRigScript := preload("res://runtime/light_rig.gd")
const WorldEnvironmentRootScript := preload("res://runtime/world_environment_root.gd")


func _ready() -> void:
	_add_bootstrap_child("WorldEnvironment", WorldEnvironmentRootScript.new())
	_add_bootstrap_child("LightRig", LightRigScript.new())
	_add_bootstrap_child("Camera3D", CameraRigScript.new())
	_add_bootstrap_child("Floor", FloorRootScript.new())
	_add_bootstrap_child("CharacterPrototype", CharacterRootScript.new())
	_add_bootstrap_child("DebugHud", DebugHudScript.new())
	_add_bootstrap_child("DebugController", DebugControllerScript.new())


func _add_bootstrap_child(node_name: String, node: Node) -> void:
	node.name = node_name
	add_child(node)
