extends CanvasLayer
class_name SpaceHudRoot

var _fire_rate_value: Label
var _score_value: Label
var _shot_count_value: Label

var _run_model: RunModel
var _weapon_progression: WeaponProgression


func _ready() -> void:
	HudBuilder.build(self)


func _process(_delta: float) -> void:
	if _run_model == null or _weapon_progression == null:
		return
	_score_value.text = str(_run_model.score)
	_shot_count_value.text = str(_weapon_progression.shot_count)
	_fire_rate_value.text = str(_weapon_progression.fire_rate_level)


func bind_game_state(run_model: RunModel, weapon_progression: WeaponProgression) -> void:
	_run_model = run_model
	_weapon_progression = weapon_progression
	if _score_value != null:
		_score_value.text = str(_run_model.score)
	if _shot_count_value != null:
		_shot_count_value.text = str(_weapon_progression.shot_count)
	if _fire_rate_value != null:
		_fire_rate_value.text = str(_weapon_progression.fire_rate_level)


class HudBuilder:
	static func build(owner: SpaceHudRoot) -> void:
		var score_panel := Control.new()
		score_panel.name = "ScorePanel"
		score_panel.position = Vector2(28.0, 24.0)
		owner.add_child(score_panel)

		var score_label := Label.new()
		score_label.name = "ScoreLabel"
		score_label.text = "Score"
		score_panel.add_child(score_label)

		owner._score_value = Label.new()
		owner._score_value.name = "ScoreValue"
		owner._score_value.position = Vector2(0.0, 28.0)
		owner._score_value.text = "0"
		score_panel.add_child(owner._score_value)

		var weapon_panel := Control.new()
		weapon_panel.name = "WeaponPanel"
		weapon_panel.position = Vector2(28.0, 104.0)
		owner.add_child(weapon_panel)

		var shot_label := Label.new()
		shot_label.name = "ShotCountLabel"
		shot_label.text = "Shots"
		weapon_panel.add_child(shot_label)

		owner._shot_count_value = Label.new()
		owner._shot_count_value.name = "ShotCountValue"
		owner._shot_count_value.position = Vector2(0.0, 28.0)
		owner._shot_count_value.text = "1"
		weapon_panel.add_child(owner._shot_count_value)

		var fire_rate_label := Label.new()
		fire_rate_label.name = "FireRateLabel"
		fire_rate_label.position = Vector2(0.0, 56.0)
		fire_rate_label.text = "Rate"
		weapon_panel.add_child(fire_rate_label)

		owner._fire_rate_value = Label.new()
		owner._fire_rate_value.name = "FireRateValue"
		owner._fire_rate_value.position = Vector2(0.0, 84.0)
		owner._fire_rate_value.text = "1"
		weapon_panel.add_child(owner._fire_rate_value)
