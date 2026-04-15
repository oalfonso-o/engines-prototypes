extends RefCounted


func test_hud_adds_visible_crosshair(assertions, context) -> void:
	var scene: Node3D = context.instantiate_main_scene()
	await context.process_frame()

	assertions.check(scene.get_node_or_null("Hud") != null, "main scene should create a Hud node")
	assertions.check(
		scene.get_node_or_null("Hud/Crosshair") != null,
		"hud should contain a centered crosshair node"
	)
