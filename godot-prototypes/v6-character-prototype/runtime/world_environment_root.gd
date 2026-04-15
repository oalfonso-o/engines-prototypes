extends WorldEnvironment

const AMBIENT_COLOR: Color = Color("334454")
const BACKGROUND_COLOR: Color = Color("0c1117")


func _ready() -> void:
	var environment := Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = BACKGROUND_COLOR
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = AMBIENT_COLOR
	environment.ambient_light_energy = 0.9
	self.environment = environment
