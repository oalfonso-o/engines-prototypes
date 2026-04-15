extends "res://runtime/character_actor.gd"
class_name EnemyTarget3D

const HealthDisplayScript := preload("res://runtime/health_display.gd")

@export var max_health: int = 100

var current_health: int = 100
var is_dead: bool = false

var _health_display: Label3D


func _ready() -> void:
	super._ready()
	current_health = max_health
	_build_health_display()


func apply_damage(amount: int) -> void:
	if is_dead:
		return
	current_health = max(0, current_health - amount)
	_health_display.update_health(current_health, max_health)
	_visual_rig.apply_explosion_reaction(-facing_direction, 0.35)
	if current_health == 0:
		is_dead = true
		queue_free()


func _build_health_display() -> void:
	_health_display = HealthDisplayScript.new()
	_health_display.name = "HealthDisplay"
	_health_display.position = Vector3(0.0, 2.2, 0.0)
	_health_display.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	_health_display.modulate = Color("f5f5f5")
	_health_display.font_size = 40
	_health_display.outline_size = 6
	_health_display.update_health(current_health, max_health)
	add_child(_health_display)
