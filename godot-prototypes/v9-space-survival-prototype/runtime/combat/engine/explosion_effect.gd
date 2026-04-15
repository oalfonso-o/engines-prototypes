extends Node2D
class_name SpaceExplosionEffect

var _base_radius: float = 20.0
var _color: Color = Color.WHITE
var _duration: float = 0.28
var _elapsed: float = 0.0


func _process(delta: float) -> void:
	_elapsed += delta
	if _elapsed >= _duration:
		queue_free()
		return
	queue_redraw()


func _draw() -> void:
	var progress: float = _elapsed / _duration
	var radius: float = lerpf(_base_radius * 0.35, _base_radius, progress)
	var alpha: float = 1.0 - progress
	draw_circle(Vector2.ZERO, radius, Color(_color, alpha))


func setup(color: Color, base_radius: float) -> void:
	_color = color
	_base_radius = base_radius
