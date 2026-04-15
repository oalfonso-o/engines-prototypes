extends WorldEnvironment


func _ready() -> void:
	var environment := Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = Color("93b8d0")
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("cfd6db")
	environment.ambient_light_energy = 0.9
	environment.fog_enabled = true
	environment.fog_light_color = Color("93b8d0")
	environment.fog_density = 0.008
	self.environment = environment
