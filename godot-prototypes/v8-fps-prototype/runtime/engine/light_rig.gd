extends Node3D


func _ready() -> void:
	LightBuilder.build(self)


class LightBuilder:
	static func build(owner: Node3D) -> void:
		var sun := DirectionalLight3D.new()
		sun.name = "Sun"
		sun.position = Vector3(0.0, 16.0, 0.0)
		sun.rotation_degrees = Vector3(-52.0, 34.0, 0.0)
		sun.light_energy = 1.8
		owner.add_child(sun)

		var fill := OmniLight3D.new()
		fill.name = "Fill"
		fill.position = Vector3(0.0, 7.0, 0.0)
		fill.light_color = Color("a5c7ff")
		fill.light_energy = 0.35
		fill.omni_range = 40.0
		owner.add_child(fill)
