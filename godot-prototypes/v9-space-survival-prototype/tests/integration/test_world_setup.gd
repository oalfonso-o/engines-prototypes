extends "res://tests/helpers/gut_scene_test.gd"


func test_game_root_builds_player_and_runtime_containers() -> void:
	var scene: Node2D = instantiate_main_scene()
	await settle_frames(2)

	var game_root: Node2D = scene.get_node_or_null("GameRoot") as Node2D
	assert_not_null(game_root, "main scene should create GameRoot")
	if game_root == null:
		return

	assert_not_null(game_root.get_node_or_null("Player"), "game root should create the player ship")
	assert_not_null(game_root.get_node_or_null("Enemies"), "game root should create an enemy container")
	assert_not_null(game_root.get_node_or_null("Boosters"), "game root should create a booster container")
	assert_not_null(game_root.get_node_or_null("Projectiles"), "game root should create a projectile container")
	assert_not_null(game_root.get_node_or_null("Effects"), "game root should create an effects container")
