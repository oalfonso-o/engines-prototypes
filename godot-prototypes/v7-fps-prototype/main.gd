extends Node3D

const GameRootScript := preload("res://runtime/game_root.gd")
const HudRootScript := preload("res://runtime/hud_root.gd")
const LightRigScript := preload("res://runtime/light_rig.gd")
const WorldEnvironmentScript := preload("res://runtime/world_environment_root.gd")


func _ready() -> void:
	_add_bootstrap_child("WorldEnvironment", WorldEnvironmentScript.new())
	_add_bootstrap_child("LightRig", LightRigScript.new())
	_add_bootstrap_child("GameRoot", GameRootScript.new())
	_add_bootstrap_child("Hud", HudRootScript.new())


func _add_bootstrap_child(node_name: String, node: Node) -> void:
	node.name = node_name
	add_child(node)
