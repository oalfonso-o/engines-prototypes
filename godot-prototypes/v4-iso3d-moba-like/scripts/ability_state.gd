extends RefCounted
class_name AbilityState

var config: Resource
var cooldown_remaining: float = 0.0


func _init(ability_config: Resource) -> void:
	config = ability_config


func update(delta: float) -> void:
	cooldown_remaining = max(0.0, cooldown_remaining - delta)


func can_cast() -> bool:
	return cooldown_remaining <= 0.0


func consume_cast() -> void:
	cooldown_remaining = config.cooldown
