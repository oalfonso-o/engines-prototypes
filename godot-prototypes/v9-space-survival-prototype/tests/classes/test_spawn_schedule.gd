extends GutTest

const SpawnScheduleScript := preload("res://runtime/world/logic/spawn_schedule.gd")


func test_enemy_schedule_fires_every_two_seconds() -> void:
	var schedule = SpawnScheduleScript.new(2.0, 10.0)

	assert_eq(schedule.consume_enemy_spawns(1.9), 0, "enemy spawn should not trigger before 2 seconds")
	assert_eq(schedule.consume_enemy_spawns(0.1), 1, "enemy spawn should trigger at 2 seconds")
	assert_eq(schedule.consume_enemy_spawns(4.2), 2, "enemy schedule should catch up for larger elapsed windows")


func test_booster_schedule_fires_every_ten_seconds() -> void:
	var schedule = SpawnScheduleScript.new(2.0, 10.0)

	assert_eq(schedule.consume_booster_spawns(9.5), 0, "booster should not spawn before 10 seconds")
	assert_eq(schedule.consume_booster_spawns(0.5), 1, "booster should spawn at 10 seconds")
	assert_eq(schedule.consume_booster_spawns(20.0), 2, "booster schedule should support multiple overdue spawns")
