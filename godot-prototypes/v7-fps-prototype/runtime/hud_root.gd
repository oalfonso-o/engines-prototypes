extends CanvasLayer


func _ready() -> void:
	var crosshair := Label.new()
	crosshair.name = "Crosshair"
	crosshair.text = "+"
	crosshair.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	crosshair.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	crosshair.set_anchors_preset(Control.PRESET_CENTER)
	crosshair.position = Vector2(-12.0, -18.0)
	crosshair.size = Vector2(24.0, 36.0)
	crosshair.add_theme_font_size_override("font_size", 30)
	add_child(crosshair)

	var controls := Label.new()
	controls.name = "Controls"
	controls.text = "WASD move  Space jump  LMB shoot  RMB grenade  Esc release mouse"
	controls.position = Vector2(20.0, 20.0)
	controls.add_theme_font_size_override("font_size", 18)
	add_child(controls)
