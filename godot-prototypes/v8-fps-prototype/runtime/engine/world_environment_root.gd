extends WorldEnvironment


func _ready() -> void:
	environment = EnvironmentBuilder.build()


class EnvironmentBuilder:
	static func build() -> Environment:
		var world_environment := Environment.new()
		world_environment.background_mode = Environment.BG_COLOR
		world_environment.background_color = Color("93b8d0")
		world_environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
		world_environment.ambient_light_color = Color("cfd6db")
		world_environment.ambient_light_energy = 0.9
		world_environment.fog_enabled = true
		world_environment.fog_light_color = Color("93b8d0")
		world_environment.fog_density = 0.008
		return world_environment
