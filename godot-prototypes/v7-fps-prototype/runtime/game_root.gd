extends Node3D

const ArenaBuilderScript := preload("res://runtime/arena_builder.gd")
const EnemyTargetScript := preload("res://runtime/enemy_target.gd")
const FpsPlayerScript := preload("res://runtime/fps_player.gd")
const MapLoaderScript := preload("res://runtime/map_loader.gd")
const MAP_PATH: String = "res://maps/default_arena.txt"

@export var cover_height: float = 5.0
@export var explosion_debug_flash_time: float = 0.22
@export var wall_height: float = 6.5

func _ready() -> void:
	var layout: MapLoaderScript.MapLayout = MapLoaderScript.load_layout(MAP_PATH)
	_build_world(layout)


func apply_explosion(origin: Vector3, radius: float, impulse_force: float) -> void:
	for body: Node in get_tree().get_nodes_in_group("launchable_character"):
		if body == null or not body.has_method("apply_explosion_impulse"):
			continue
		var character_body: Node3D = body as Node3D
		if character_body == null:
			continue
		var distance: float = character_body.global_position.distance_to(origin)
		if distance > radius:
			continue
		var distance_ratio: float = 1.0 - (distance / radius)
		body.apply_explosion_impulse(origin, impulse_force * maxf(0.25, distance_ratio))


func _build_world(layout: MapLoaderScript.MapLayout) -> void:
	var arena_root := Node3D.new()
	arena_root.name = "Arena"
	add_child(arena_root)
	ArenaBuilderScript.new().build(arena_root, layout, wall_height, cover_height)

	var projectiles_root := Node3D.new()
	projectiles_root.name = "Projectiles"
	add_child(projectiles_root)

	var player: CharacterBody3D = FpsPlayerScript.new()
	player.name = "Player"
	player.position = layout.player_spawn
	player.projectile_parent = projectiles_root
	player.world_root = self
	add_child(player)

	var enemies_root := Node3D.new()
	enemies_root.name = "Enemies"
	add_child(enemies_root)

	for enemy_index: int in range(layout.enemy_spawns.size()):
		var enemy: CharacterBody3D = EnemyTargetScript.new()
		enemy.name = "Enemy%02d" % enemy_index
		enemy.position = layout.enemy_spawns[enemy_index]
		enemies_root.add_child(enemy)
