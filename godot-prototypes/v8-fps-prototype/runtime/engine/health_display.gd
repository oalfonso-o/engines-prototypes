extends Label3D
class_name EnemyHealthDisplay3D


func update_health(current_health: int, max_health: int) -> void:
	text = "%d / %d" % [current_health, max_health]
