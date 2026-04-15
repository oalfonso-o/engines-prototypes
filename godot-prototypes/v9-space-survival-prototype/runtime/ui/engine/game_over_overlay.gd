extends CanvasLayer
class_name SpaceGameOverOverlay

const ScoreCountupScript := preload("res://runtime/ui/logic/score_countup.gd")

signal restart_requested

var _score_countup: ScoreCountup
var _score_value: Label


func _ready() -> void:
	OverlayBuilder.build(self)
	hide()


func _process(delta: float) -> void:
	if _score_countup == null:
		return
	_score_countup.advance(delta)
	_score_value.text = str(_score_countup.displayed_score)


func _unhandled_input(event: InputEvent) -> void:
	if visible and event.is_action_pressed("ui_accept"):
		restart_requested.emit()


func show_game_over(final_score: int) -> void:
	_score_countup = ScoreCountupScript.new(final_score, maxf(10.0, float(final_score) * 4.0))
	_score_value.text = "0"
	show()


func hide_overlay() -> void:
	_score_countup = null
	_score_value.text = "0"
	hide()


class OverlayBuilder:
	static func build(owner: SpaceGameOverOverlay) -> void:
		var root := Control.new()
		root.name = "OverlayRoot"
		root.set_anchors_preset(Control.PRESET_FULL_RECT)
		owner.add_child(root)

		var title := Label.new()
		title.name = "Title"
		title.text = "Game Over"
		title.position = Vector2(640.0, 280.0)
		root.add_child(title)

		var score_label := Label.new()
		score_label.name = "ScoreValue"
		score_label.text = "0"
		score_label.position = Vector2(640.0, 340.0)
		root.add_child(score_label)
		owner._score_value = score_label

		var restart_label := Label.new()
		restart_label.name = "RestartHint"
		restart_label.text = "Press Space to start again"
		restart_label.position = Vector2(560.0, 400.0)
		root.add_child(restart_label)
