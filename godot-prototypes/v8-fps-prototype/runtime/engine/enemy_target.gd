extends "res://runtime/engine/character_actor.gd"
class_name EnemyTarget3D

const HealthDisplayScript := preload("res://runtime/engine/health_display.gd")
const HealthModelScript := preload("res://runtime/logic/health_model.gd")

@export var max_health: int = 100

var health: HealthModel
var is_dead: bool = false
var _health_display: Label3D


func _ready() -> void:
	super._ready()
	health = HealthModelScript.new(max_health)
	_health_display = HealthPresentation.build_display(self, HealthDisplayScript, health)


func apply_damage(amount: int) -> void:
	if is_dead:
		return
	is_dead = health.apply_damage(amount)
	_health_display.update_health(health.current_health, health.max_health)
	visual_rig.apply_explosion_reaction(-facing_direction, 0.35)
	if is_dead:
		queue_free()


class HealthPresentation:
	static func build_display(owner: Node3D, health_display_script: GDScript, health_model: HealthModel) -> Label3D:
		var health_display: Label3D = health_display_script.new()
		health_display.name = "HealthDisplay"
		health_display.position = Vector3(0.0, 2.2, 0.0)
		health_display.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		health_display.modulate = Color("f5f5f5")
		health_display.font_size = 40
		health_display.outline_size = 6
		health_display.update_health(health_model.current_health, health_model.max_health)
		owner.add_child(health_display)
		return health_display
