extends GutTest

const WeaponProgressionScript := preload("res://runtime/combat/logic/weapon_progression.gd")


func test_extra_shot_booster_increases_parallel_shot_count() -> void:
	var progression = WeaponProgressionScript.new()

	assert_eq(progression.shot_count, 1, "weapon should start with one shot")
	progression.apply_booster("extra_shot")
	assert_eq(progression.shot_count, 2, "extra shot booster should increase shot count")
	progression.apply_booster("extra_shot")
	assert_eq(progression.shot_count, 3, "extra shot booster should stack permanently")


func test_fire_rate_booster_increases_fire_rate_stat_and_reduces_interval() -> void:
	var progression = WeaponProgressionScript.new()
	var initial_interval: float = progression.fire_interval

	assert_eq(progression.fire_rate_level, 1, "fire rate should start at level 1")
	progression.apply_booster("fire_rate")
	assert_eq(progression.fire_rate_level, 2, "fire rate booster should increase displayed fire rate level")
	assert_true(
		progression.fire_interval < initial_interval,
		"fire rate booster should reduce time between shots"
	)
