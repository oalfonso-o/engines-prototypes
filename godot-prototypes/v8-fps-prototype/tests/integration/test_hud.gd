extends "res://tests/helpers/gut_scene_test.gd"


func test_hud_adds_visible_crosshair() -> void:
	var scene: Node3D = instantiate_main_scene()
	await process_frames()

	assert_not_null(scene.get_node_or_null("Hud"), "main scene should create a Hud node")
	assert_not_null(
		scene.get_node_or_null("Hud/Crosshair"),
		"hud should contain a centered crosshair node"
	)
	assert_not_null(
		scene.get_node_or_null("DebugHud/InfoLabel"),
		"debug HUD should expose the restored info label"
	)
