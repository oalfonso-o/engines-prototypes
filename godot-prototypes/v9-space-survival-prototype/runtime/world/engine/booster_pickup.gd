extends Area2D
class_name SpaceBoosterPickup

signal collected(booster_type: String, booster: Area2D)

var booster_type: String = "extra_shot"
var _run_model: RunModel


func _ready() -> void:
	BoosterBuilder.build(self)
	area_entered.connect(_on_area_entered)


func setup(booster_type_value: String, run_model: RunModel) -> void:
	booster_type = booster_type_value
	_run_model = run_model
	if has_node("Body"):
		BodyPainter.paint($Body as Polygon2D, booster_type)


func _on_area_entered(area: Area2D) -> void:
	if _run_model != null and not _run_model.is_game_over and area.is_in_group("player_ship"):
		collected.emit(booster_type, self)


class BoosterBuilder:
	static func build(owner: SpaceBoosterPickup) -> void:
		var body := Polygon2D.new()
		body.name = "Body"
		body.polygon = PackedVector2Array([
			Vector2(0.0, -18.0),
			Vector2(18.0, 0.0),
			Vector2(0.0, 18.0),
			Vector2(-18.0, 0.0)
		])
		owner.add_child(body)
		BodyPainter.paint(body, owner.booster_type)

		var collision_shape := CollisionShape2D.new()
		collision_shape.name = "CollisionShape2D"
		var shape := CircleShape2D.new()
		shape.radius = 18.0
		collision_shape.shape = shape
		owner.add_child(collision_shape)


class BodyPainter:
	static func paint(body: Polygon2D, booster_type: String) -> void:
		body.color = Color("8bffcb") if booster_type == "fire_rate" else Color("ffe36e")
