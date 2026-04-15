extends RefCounted
class_name RunModel

var final_score: int = 0
var is_game_over: bool = false
var score: int = 0


func register_enemy_kill() -> void:
	if not is_game_over:
		score += 1


func mark_player_dead() -> void:
	if is_game_over:
		return
	DeathStateApplier.apply(self)


class DeathStateApplier:
	static func apply(owner: RunModel) -> void:
		owner.is_game_over = true
		owner.final_score = owner.score
