extends CanvasLayer


func _ready() -> void:
	var label := Label.new()
	label.name = "InfoLabel"
	label.offset_left = 24.0
	label.offset_top = 22.0
	label.offset_right = 760.0
	label.offset_bottom = 220.0
	label.add_theme_font_size_override("font_size", 22)
	add_child(label)
