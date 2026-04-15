extends Node3D

const ArenaBuilderScript := preload("res://runtime/engine/arena_builder.gd")
const EnemyTargetScript := preload("res://runtime/engine/enemy_target.gd")
const ExplosionImpulseSolverScript := preload("res://runtime/logic/explosion_impulse_solver.gd")
const FpsPlayerScript := preload("res://runtime/engine/fps_player.gd")
const MapLoaderScript := preload("res://runtime/engine/map_loader.gd")
const MAP_PATH: String = "res://maps/default_arena.txt"

@export var cover_height: float = 5.0
@export var wall_height: float = 6.5

func _ready() -> void:
	var layout: ArenaMapLayout = MapLoaderScript.load_layout(MAP_PATH)
	WorldBuilder.build(
		self,
		layout,
		wall_height,
		cover_height,
		ArenaBuilderScript,
		FpsPlayerScript,
		EnemyTargetScript
	)


func apply_explosion(origin: Vector3, radius: float, impulse_force: float) -> void:
	ExplosionApplier.apply(self, origin, radius, impulse_force)


class WorldBuilder:
	static func build(
		owner: Node3D,
		layout: ArenaMapLayout,
		wall_height_value: float,
		cover_height_value: float,
		arena_builder_script: GDScript,
		player_script: GDScript,
		enemy_script: GDScript
	) -> void:
		var arena_root := Node3D.new()
		arena_root.name = "Arena"
		owner.add_child(arena_root)
		arena_builder_script.new().build(arena_root, layout, wall_height_value, cover_height_value)

		var projectiles_root := Node3D.new()
		projectiles_root.name = "Projectiles"
		owner.add_child(projectiles_root)

		var player: CharacterBody3D = player_script.new()
		player.name = "Player"
		player.position = layout.player_spawn
		player.projectile_parent = projectiles_root
		player.world_root = owner
		owner.add_child(player)

		var enemies_root := Node3D.new()
		enemies_root.name = "Enemies"
		owner.add_child(enemies_root)

		for enemy_index: int in range(layout.enemy_spawns.size()):
			var enemy: CharacterBody3D = enemy_script.new()
			enemy.name = "Enemy%02d" % enemy_index
			enemy.position = layout.enemy_spawns[enemy_index]
			enemies_root.add_child(enemy)


class ExplosionApplier:
	static func apply(owner: Node3D, origin: Vector3, radius: float, impulse_force: float) -> void:
		for body: Node in owner.get_tree().get_nodes_in_group("launchable_character"):
			if body == null or not body.has_method("apply_explosion_impulse"):
				continue
			var character_body: Node3D = body as Node3D
			if character_body == null:
				continue
			var distance: float = character_body.global_position.distance_to(origin)
			if distance > radius:
				continue
			var scaled_force: float = ExplosionImpulseSolverScript.scale_force(distance, radius, impulse_force)
			body.apply_explosion_impulse(origin, scaled_force)
