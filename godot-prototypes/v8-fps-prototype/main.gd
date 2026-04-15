extends Node3D

const DebugControllerScript := preload("res://debug/debug_controller.gd")
const DebugHudScript := preload("res://debug/debug_hud.gd")
const GameRootScript := preload("res://runtime/engine/game_root.gd")
const HudRootScript := preload("res://runtime/engine/hud_root.gd")
const LightRigScript := preload("res://runtime/engine/light_rig.gd")
const WorldEnvironmentScript := preload("res://runtime/engine/world_environment_root.gd")

const DEBUG_ENABLED: bool = true


func _ready() -> void:
	_add_bootstrap_child("WorldEnvironment", WorldEnvironmentScript.new())
	_add_bootstrap_child("LightRig", LightRigScript.new())
	_add_bootstrap_child("GameRoot", GameRootScript.new())
	_add_bootstrap_child("Hud", HudRootScript.new())
	if DEBUG_ENABLED:
		_add_bootstrap_child("DebugHud", DebugHudScript.new())
		_add_bootstrap_child("DebugController", DebugControllerScript.new())


func _add_bootstrap_child(node_name: String, node: Node) -> void:
	node.name = node_name
	add_child(node)
