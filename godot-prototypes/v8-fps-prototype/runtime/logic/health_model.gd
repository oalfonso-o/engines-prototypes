extends RefCounted
class_name HealthModel

var current_health: int
var max_health: int


func _init(max_health_value: int) -> void:
	max_health = max_health_value
	current_health = max_health_value


func apply_damage(amount: int) -> bool:
	current_health = max(0, current_health - amount)
	return current_health == 0
