extends RefCounted


func test_game_root_builds_player_and_enemy_nodes_from_map(assertions, context) -> void:
	var scene: Node3D = context.instantiate_main_scene()
	await context.process_frame()

	var game_root: Node3D = scene.get_node_or_null("GameRoot") as Node3D
	assertions.check(game_root != null, "main scene should create GameRoot")
	if game_root == null:
		return

	assertions.check(game_root.get_node_or_null("Player") != null, "game root should create the player from the map")
	var enemies_root: Node3D = game_root.get_node_or_null("Enemies") as Node3D
	assertions.check(enemies_root != null, "game root should create an Enemies container")
	if enemies_root == null:
		return

	assertions.check(enemies_root.get_child_count() == 4, "game root should spawn four enemies from the default map")
