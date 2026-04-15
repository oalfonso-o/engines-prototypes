extends RefCounted
class_name WeaponProgression

const BASE_FIRE_INTERVAL: float = 0.45
const FIRE_RATE_STEP: float = 0.05
const MIN_FIRE_INTERVAL: float = 0.1

var fire_interval: float = BASE_FIRE_INTERVAL
var fire_rate_level: int = 1
var shot_count: int = 1


func apply_booster(booster_type: String) -> void:
	BoosterApplier.apply(self, booster_type)


class BoosterApplier:
	static func apply(owner: WeaponProgression, booster_type: String) -> void:
		match booster_type:
			"extra_shot":
				owner.shot_count += 1
			"fire_rate":
				owner.fire_rate_level += 1
				owner.fire_interval = FireRateCurve.next_interval(owner.fire_interval)


class FireRateCurve:
	static func next_interval(current_interval: float) -> float:
		return maxf(MIN_FIRE_INTERVAL, current_interval - FIRE_RATE_STEP)
