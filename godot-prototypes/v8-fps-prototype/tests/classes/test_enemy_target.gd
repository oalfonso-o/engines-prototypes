extends "res://tests/helpers/gut_scene_test.gd"

const EnemyTargetScript := preload("res://runtime/engine/enemy_target.gd")


func test_apply_damage_reduces_health() -> void:
	var root := Node3D.new()
	var enemy: CharacterBody3D = EnemyTargetScript.new()
	root.add_child(enemy)
	add_scene_root(root)
	await process_frames()

	assert_true(enemy.has_method("apply_damage"), "enemy should expose apply_damage(amount)")
	if not enemy.has_method("apply_damage"):
		return

	enemy.apply_damage(20)
	assert_eq(enemy.health.current_health, 80, "enemy should lose 20 health per shot")
