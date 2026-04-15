extends Node3D

const CharacterPrototypeScript = preload("res://scripts/character_prototype.gd")

@onready var world_environment: WorldEnvironment = $WorldEnvironment
@onready var sun_light: DirectionalLight3D = $SunLight
@onready var fill_light: OmniLight3D = $FillLight
@onready var camera: Camera3D = $Camera3D
@onready var floor: StaticBody3D = $Floor
@onready var floor_collision: CollisionShape3D = $Floor/CollisionShape3D
@onready var floor_mesh: MeshInstance3D = $Floor/MeshInstance3D
@onready var character: CharacterBody3D = $CharacterPrototype
@onready var info_label: Label = $DebugHud/InfoLabel

var _last_explosion_origin: Vector3 = Vector3.ZERO


func _ready() -> void:
	_setup_environment()
	_setup_lighting()
	_setup_camera()
	_setup_floor()
	_update_label()


func _process(_delta: float) -> void:
	_update_label()


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_G:
			trigger_test_explosion()


func trigger_test_explosion() -> void:
	_last_explosion_origin = character.global_position + (character.get_facing_direction() * -1.8) + Vector3(0.35, 0.0, 0.45)
	character.apply_explosion_impulse(_last_explosion_origin, 8.6)
	_spawn_explosion_marker(_last_explosion_origin)


func get_character() -> CharacterBody3D:
	return character


func get_last_explosion_origin() -> Vector3:
	return _last_explosion_origin


func _setup_environment() -> void:
	var environment := Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = Color("0c1117")
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("334454")
	environment.ambient_light_energy = 0.9
	world_environment.environment = environment


func _setup_lighting() -> void:
	sun_light.rotation_degrees = Vector3(-52.0, 35.0, 0.0)
	sun_light.light_color = Color("fff1d8")
	sun_light.light_energy = 1.6
	sun_light.shadow_enabled = true
	sun_light.shadow_bias = 0.04
	sun_light.shadow_normal_bias = 1.0

	fill_light.global_position = Vector3(0.0, 3.0, 2.4)
	fill_light.light_color = Color("8fd7ff")
	fill_light.light_energy = 0.55
	fill_light.omni_range = 12.0


func _setup_camera() -> void:
	camera.projection = Camera3D.PROJECTION_PERSPECTIVE
	camera.fov = 52.0
	camera.global_position = Vector3(0.0, 3.8, 7.2)
	camera.look_at(Vector3(0.0, 1.1, 0.0), Vector3.UP)


func _setup_floor() -> void:
	var box := BoxShape3D.new()
	box.size = Vector3(18.0, 0.6, 18.0)
	floor_collision.shape = box
	floor_collision.position = Vector3(0.0, -0.3, 0.0)

	var mesh := BoxMesh.new()
	mesh.size = Vector3(18.0, 0.6, 18.0)
	floor_mesh.mesh = mesh
	floor_mesh.position = Vector3(0.0, -0.3, 0.0)
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_PER_PIXEL
	material.albedo_color = Color("2c353f")
	material.roughness = 0.85
	floor_mesh.material_override = material


func _update_label() -> void:
	var state: Dictionary = character.get_reaction_debug_state()
	info_label.text = "WASD move  Space jump  G explosion\nPos %s  Vel %s\nReaction %.2f  Last explosion %s" % [
		_snapped_vec3(character.global_position),
		_snapped_vec3(character.velocity),
		float(state["strength"]),
		_snapped_vec3(_last_explosion_origin),
	]


func _spawn_explosion_marker(origin: Vector3) -> void:
	var marker := MeshInstance3D.new()
	marker.top_level = true
	marker.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var mesh := SphereMesh.new()
	mesh.radius = 0.18
	mesh.height = 0.36
	marker.mesh = mesh
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.albedo_color = Color("ff8e5b")
	material.emission_enabled = true
	material.emission = Color("ff8e5b")
	material.emission_energy_multiplier = 1.2
	marker.material_override = material
	add_child(marker)
	marker.global_position = origin + Vector3(0.0, 0.18, 0.0)
	var timer := get_tree().create_timer(0.4)
	timer.timeout.connect(func() -> void:
		if is_instance_valid(marker):
			marker.queue_free()
	)


func _snapped_vec3(value: Vector3) -> String:
	return "(%.2f, %.2f, %.2f)" % [value.x, value.y, value.z]
