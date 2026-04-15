extends "res://tests/helpers/gut_scene_test.gd"


func test_hud_shows_score_and_weapon_progression_values() -> void:
	var scene: Node2D = instantiate_main_scene()
	await settle_frames(2)

	var hud: CanvasLayer = scene.get_node_or_null("Hud") as CanvasLayer
	assert_not_null(hud, "main scene should create the HUD")
	if hud == null:
		return

	var score_value: Label = hud.get_node_or_null("ScorePanel/ScoreValue") as Label
	var shot_value: Label = hud.get_node_or_null("WeaponPanel/ShotCountValue") as Label
	var fire_rate_value: Label = hud.get_node_or_null("WeaponPanel/FireRateValue") as Label

	assert_not_null(score_value, "HUD should expose a score value label")
	assert_not_null(shot_value, "HUD should expose a shot count label")
	assert_not_null(fire_rate_value, "HUD should expose a fire rate label")
	if score_value == null or shot_value == null or fire_rate_value == null:
		return

	assert_eq(score_value.text, "0", "HUD should start with score zero")
	assert_eq(shot_value.text, "1", "HUD should show one shot initially")
	assert_eq(fire_rate_value.text, "1", "HUD should show fire rate level one initially")
