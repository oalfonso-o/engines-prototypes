extends "res://tests/helpers/gut_scene_test.gd"


func test_main_scene_uses_a_minimal_bootstrap_root() -> void:
	var scene: Node2D = instantiate_main_scene()
	await process_frames()

	assert_not_null(scene.get_node_or_null("GameRoot"), "bootstrap should create a GameRoot child")
	assert_not_null(scene.get_node_or_null("Hud"), "bootstrap should create the HUD")
	assert_not_null(scene.get_node_or_null("GameOverOverlay"), "bootstrap should create the game over overlay")
