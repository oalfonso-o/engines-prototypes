extends Node3D

const FILL_LIGHT_POSITION: Vector3 = Vector3(0.0, 3.0, 2.4)
const SUN_ROTATION_DEGREES: Vector3 = Vector3(-52.0, 35.0, 0.0)


func _ready() -> void:
	var sun := DirectionalLight3D.new()
	sun.name = "SunLight"
	sun.rotation_degrees = SUN_ROTATION_DEGREES
	sun.light_color = Color("fff1d8")
	sun.light_energy = 1.6
	sun.shadow_enabled = true
	sun.shadow_bias = 0.04
	sun.shadow_normal_bias = 1.0
	add_child(sun)

	var fill := OmniLight3D.new()
	fill.name = "FillLight"
	fill.position = FILL_LIGHT_POSITION
	fill.light_color = Color("8fd7ff")
	fill.light_energy = 0.55
	fill.omni_range = 12.0
	add_child(fill)
