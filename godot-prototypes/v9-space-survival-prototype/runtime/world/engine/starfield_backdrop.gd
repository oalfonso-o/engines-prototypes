extends Node2D
class_name SpaceStarfieldBackdrop

const STAR_COUNT: int = 80
const WORLD_SIZE: Vector2 = Vector2(1600.0, 900.0)

var _stars: PackedVector2Array = PackedVector2Array()


func _ready() -> void:
	StarfieldBuilder.build(self)


func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, WORLD_SIZE), Color("070b18"), true)
	draw_rect(Rect2(Vector2(8.0, 8.0), WORLD_SIZE - Vector2(16.0, 16.0)), Color("162238"), false, 2.0)
	for star_position: Vector2 in _stars:
		draw_circle(star_position, 1.6, Color("d8f5ff"))


class StarfieldBuilder:
	static func build(owner: SpaceStarfieldBackdrop) -> void:
		var rng := RandomNumberGenerator.new()
		rng.seed = 9
		for _star_index: int in range(STAR_COUNT):
			owner._stars.append(Vector2(rng.randf_range(18.0, WORLD_SIZE.x - 18.0), rng.randf_range(18.0, WORLD_SIZE.y - 18.0)))
		owner.queue_redraw()
