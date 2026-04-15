extends RefCounted
class_name ScoreCountup

var displayed_score: int = 0
var is_complete: bool = false

var _target_score: int
var _score_per_second: float
var _score_progress: float = 0.0


func _init(target_score: int, score_per_second: float = 12.0) -> void:
	_target_score = target_score
	_score_per_second = score_per_second


func advance(delta: float) -> void:
	if is_complete:
		return
	_score_progress += _score_per_second * delta
	displayed_score = mini(_target_score, int(floor(_score_progress)))
	if displayed_score >= _target_score:
		displayed_score = _target_score
		is_complete = true
