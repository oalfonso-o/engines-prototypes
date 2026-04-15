extends Area2D
class_name SpaceEnemyShip

signal collided_with_player(enemy: Area2D)

@export var move_speed: float = 150.0

var _run_model: RunModel
var _target: Area2D


func _ready() -> void:
	EnemyBuilder.build(self)
	add_to_group("enemy_ship")
	area_entered.connect(_on_area_entered)


func _physics_process(delta: float) -> void:
	if _run_model == null or _run_model.is_game_over or _target == null:
		return
	var direction := (_target.global_position - global_position).normalized()
	global_position += direction * move_speed * delta


func setup(target: Area2D, run_model: RunModel) -> void:
	_target = target
	_run_model = run_model


func _on_area_entered(area: Area2D) -> void:
	if _run_model != null and not _run_model.is_game_over and area.is_in_group("player_ship"):
		collided_with_player.emit(self)


class EnemyBuilder:
	static func build(owner: SpaceEnemyShip) -> void:
		var body := Polygon2D.new()
		body.name = "Body"
		body.polygon = PackedVector2Array([
			Vector2(0.0, -20.0),
			Vector2(18.0, 0.0),
			Vector2(0.0, 20.0),
			Vector2(-18.0, 0.0)
		])
		body.color = Color("ff6f91")
		owner.add_child(body)

		var collision_shape := CollisionShape2D.new()
		collision_shape.name = "CollisionShape2D"
		var shape := CircleShape2D.new()
		shape.radius = 18.0
		collision_shape.shape = shape
		owner.add_child(collision_shape)
