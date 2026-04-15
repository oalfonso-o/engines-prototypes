extends RefCounted

const EnemyTargetScript := preload("res://runtime/enemy_target.gd")


func test_apply_damage_reduces_health(assertions, context) -> void:
	var root := Node3D.new()
	var enemy: CharacterBody3D = EnemyTargetScript.new()
	root.add_child(enemy)
	context.add_scene_root(root)
	await context.process_frame()

	assertions.check(enemy.has_method("apply_damage"), "enemy should expose apply_damage(amount)")
	if not enemy.has_method("apply_damage"):
		return
	enemy.apply_damage(20)

	assertions.check(enemy.current_health == 80, "enemy should lose 20 health per shot")
