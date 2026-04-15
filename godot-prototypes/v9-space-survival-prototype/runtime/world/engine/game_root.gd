extends Node2D
class_name SpaceGameRoot

const BoosterPickupScript := preload("res://runtime/world/engine/booster_pickup.gd")
const EnemyShipScript := preload("res://runtime/world/engine/enemy_ship.gd")
const ExplosionEffectScript := preload("res://runtime/combat/engine/explosion_effect.gd")
const PlayerShipScript := preload("res://runtime/player/engine/player_ship.gd")
const ProjectileScript := preload("res://runtime/combat/engine/projectile.gd")
const RunModelScript := preload("res://runtime/shared/logic/run_model.gd")
const SpawnRulesScript := preload("res://runtime/world/logic/spawn_rules.gd")
const SpawnScheduleScript := preload("res://runtime/world/logic/spawn_schedule.gd")
const WeaponProgressionScript := preload("res://runtime/combat/logic/weapon_progression.gd")

signal run_ended(final_score: int)

const WORLD_RECT: Rect2 = Rect2(Vector2.ZERO, Vector2(1600.0, 900.0))

@export var booster_interval_seconds: float = 10.0
@export var enemy_spawn_interval_seconds: float = 2.0

var player: Area2D
var run_model: RunModel = RunModelScript.new()
var weapon_progression: WeaponProgression = WeaponProgressionScript.new()

var _boosters_root: Node2D
var _effects_root: Node2D
var _enemies_root: Node2D
var _projectiles_root: Node2D
var _spawn_runtime: SpawnRuntime


func _ready() -> void:
	WorldBuilder.build(self, PlayerShipScript)
	_spawn_runtime = SpawnRuntime.new(enemy_spawn_interval_seconds, booster_interval_seconds)
	player.setup(self, run_model, weapon_progression, WORLD_RECT)


func _process(delta: float) -> void:
	if run_model.is_game_over:
		return
	_spawn_runtime.update(self, delta)


func spawn_enemy(position_value: Vector2) -> Area2D:
	var enemy: Area2D = EnemyShipScript.new()
	enemy.name = "Enemy_%d" % _enemies_root.get_child_count()
	enemy.position = position_value
	_enemies_root.add_child(enemy)
	enemy.setup(player, run_model)
	enemy.collided_with_player.connect(_on_enemy_collided_with_player)
	return enemy


func spawn_booster(position_value: Vector2, booster_type: String) -> Area2D:
	var booster: Area2D = BoosterPickupScript.new()
	booster.name = "Booster_%d" % _boosters_root.get_child_count()
	booster.position = position_value
	_boosters_root.add_child(booster)
	booster.setup(booster_type, run_model)
	booster.collected.connect(_on_booster_collected)
	return booster


func spawn_player_projectiles(origin: Vector2, facing_direction: Vector2, ship_radius: float) -> void:
	ProjectileSpawner.spawn(self, _projectiles_root, origin, facing_direction, ship_radius, weapon_progression.shot_count)


func end_run_at(position_value: Vector2) -> void:
	if run_model.is_game_over:
		return
	run_model.mark_player_dead()
	EffectSpawner.spawn_explosion(_effects_root, ExplosionEffectScript, position_value, Color("ff8e63"), 36.0)
	run_ended.emit(run_model.final_score)


func _on_booster_collected(booster_type: String, booster: Area2D) -> void:
	weapon_progression.apply_booster(booster_type)
	EffectSpawner.spawn_explosion(_effects_root, ExplosionEffectScript, booster.global_position, Color("8bffcb"), 18.0)
	booster.queue_free()


func _on_enemy_collided_with_player(enemy: Area2D) -> void:
	EffectSpawner.spawn_explosion(_effects_root, ExplosionEffectScript, enemy.global_position, Color("ff6f91"), 24.0)
	enemy.queue_free()
	end_run_at(player.global_position)


func _on_projectile_hit_enemy(enemy: Area2D, projectile: Area2D, hit_position: Vector2) -> void:
	if not is_instance_valid(enemy) or run_model.is_game_over:
		return
	run_model.register_enemy_kill()
	EffectSpawner.spawn_explosion(_effects_root, ExplosionEffectScript, hit_position, Color("ffd56b"), 20.0)
	enemy.queue_free()
	projectile.queue_free()


class WorldBuilder:
	static func build(owner: SpaceGameRoot, player_ship_script: GDScript) -> void:
		owner._enemies_root = Node2D.new()
		owner._enemies_root.name = "Enemies"
		owner.add_child(owner._enemies_root)

		owner._boosters_root = Node2D.new()
		owner._boosters_root.name = "Boosters"
		owner.add_child(owner._boosters_root)

		owner._projectiles_root = Node2D.new()
		owner._projectiles_root.name = "Projectiles"
		owner.add_child(owner._projectiles_root)

		owner._effects_root = Node2D.new()
		owner._effects_root.name = "Effects"
		owner.add_child(owner._effects_root)

		owner.player = player_ship_script.new()
		owner.player.name = "Player"
		owner.player.position = WORLD_RECT.get_center()
		owner.add_child(owner.player)


class SpawnRuntime:
	var _rng: RandomNumberGenerator = RandomNumberGenerator.new()
	var _schedule: SpawnSchedule


	func _init(enemy_interval_seconds: float, booster_interval_seconds: float) -> void:
		_rng.randomize()
		_schedule = SpawnScheduleScript.new(enemy_interval_seconds, booster_interval_seconds)


	func update(owner: SpaceGameRoot, delta: float) -> void:
		var ship_radius: float = owner.player.ship_radius
		for _enemy_index: int in range(_schedule.consume_enemy_spawns(delta)):
			var enemy_position: Vector2 = SpawnRulesScript.pick_spawn_position(
				_rng,
				WORLD_RECT,
				owner.player.global_position,
				ship_radius,
				5.0
			)
			owner.spawn_enemy(enemy_position)

		for _booster_index: int in range(_schedule.consume_booster_spawns(delta)):
			var booster_position: Vector2 = SpawnRulesScript.pick_spawn_position(
				_rng,
				WORLD_RECT,
				owner.player.global_position,
				ship_radius,
				5.0
			)
			owner.spawn_booster(booster_position, SpawnRulesScript.pick_booster_type(_rng))


class ProjectileSpawner:
	static func spawn(
		owner: SpaceGameRoot,
		projectiles_root: Node2D,
		origin: Vector2,
		facing_direction: Vector2,
		ship_radius: float,
		shot_count: int
	) -> void:
		var lateral_direction := Vector2(-facing_direction.y, facing_direction.x)
		var spacing: float = ship_radius * 0.55
		var center_offset: float = (float(shot_count - 1) * spacing) * 0.5
		for shot_index: int in range(shot_count):
			var projectile: Area2D = ProjectileScript.new()
			projectile.name = "Projectile_%d" % projectiles_root.get_child_count()
			var offset_amount: float = (float(shot_index) * spacing) - center_offset
			projectile.position = origin + (lateral_direction * offset_amount)
			projectiles_root.add_child(projectile)
			projectile.setup(facing_direction, owner.run_model)
			projectile.enemy_hit.connect(owner._on_projectile_hit_enemy)


class EffectSpawner:
	static func spawn_explosion(
		effects_root: Node2D,
		explosion_effect_script: GDScript,
		position_value: Vector2,
		color: Color,
		base_radius: float
	) -> void:
		var explosion: Node2D = explosion_effect_script.new()
		explosion.position = position_value
		effects_root.add_child(explosion)
		explosion.setup(color, base_radius)
