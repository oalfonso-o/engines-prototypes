extends RefCounted
class_name SpawnSchedule

var _enemy_accumulator: TimeAccumulator
var _booster_accumulator: TimeAccumulator


func _init(enemy_interval_seconds: float = 2.0, booster_interval_seconds: float = 10.0) -> void:
	_enemy_accumulator = TimeAccumulator.new(enemy_interval_seconds)
	_booster_accumulator = TimeAccumulator.new(booster_interval_seconds)


func consume_enemy_spawns(delta: float) -> int:
	return _enemy_accumulator.consume(delta)


func consume_booster_spawns(delta: float) -> int:
	return _booster_accumulator.consume(delta)


class TimeAccumulator:
	var _elapsed: float = 0.0
	var _interval: float


	func _init(interval_seconds: float) -> void:
		_interval = interval_seconds


	func consume(delta: float) -> int:
		_elapsed += delta
		if _elapsed < _interval:
			return 0
		var spawn_count: int = int(floor(_elapsed / _interval))
		_elapsed -= float(spawn_count) * _interval
		return spawn_count
