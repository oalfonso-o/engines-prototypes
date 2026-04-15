extends Area2D
class_name SpaceProjectile

signal enemy_hit(enemy: Area2D, projectile: Area2D, hit_position: Vector2)

@export var move_speed: float = 700.0

var _direction: Vector2 = Vector2.RIGHT
var _lifetime: float = 1.6
var _run_model: RunModel


func _ready() -> void:
	ProjectileBuilder.build(self)
	area_entered.connect(_on_area_entered)


func _physics_process(delta: float) -> void:
	if _run_model != null and _run_model.is_game_over:
		queue_free()
		return
	global_position += _direction * move_speed * delta
	_lifetime -= delta
	if _lifetime <= 0.0:
		queue_free()


func setup(direction: Vector2, run_model: RunModel) -> void:
	_direction = direction.normalized()
	_run_model = run_model
	rotation = _direction.angle()


func _on_area_entered(area: Area2D) -> void:
	if _run_model != null and not _run_model.is_game_over and area.is_in_group("enemy_ship"):
		enemy_hit.emit(area, self, global_position)


class ProjectileBuilder:
	static func build(owner: SpaceProjectile) -> void:
		var body := Polygon2D.new()
		body.name = "Body"
		body.polygon = PackedVector2Array([
			Vector2(10.0, 0.0),
			Vector2(-4.0, -3.0),
			Vector2(-4.0, 3.0)
		])
		body.color = Color("8bf7ff")
		owner.add_child(body)

		var collision_shape := CollisionShape2D.new()
		collision_shape.name = "CollisionShape2D"
		var shape := CircleShape2D.new()
		shape.radius = 4.0
		collision_shape.shape = shape
		owner.add_child(collision_shape)
