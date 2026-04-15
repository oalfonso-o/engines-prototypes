extends Node3D

const MAP_DIR := "res://maps/three_lanes"
const STAR_COUNT := 180
const IsoTargetScript = preload("res://scripts/iso_target.gd")
const TARGET_SPECS := [
	{
		"name": "NearDummy",
		"cell": Vector2i(5, 18),
		"vertical_offset": 0.0,
		"color": Color("ffb45d"),
	},
	{
		"name": "PlateauDummy",
		"cell": Vector2i(10, 10),
		"vertical_offset": 0.0,
		"color": Color("ff7c8d"),
	},
	{
		"name": "FarDummy",
		"cell": Vector2i(17, 3),
		"vertical_offset": 0.0,
		"color": Color("7dff6f"),
	},
]

@onready var world_environment: WorldEnvironment = $WorldEnvironment
@onready var key_light: DirectionalLight3D = $KeyLight
@onready var iso_camera: Camera3D = $IsoCamera
@onready var starfield_root: Node3D = $Starfield
@onready var iso_map: Node3D = $IsoMap
@onready var targets_root: Node3D = $Targets
@onready var player: CharacterBody3D = $Player
@onready var debug_hud: CanvasLayer = $DebugHud

var _camera_offset: Vector3 = Vector3.ZERO


func _ready() -> void:
	_setup_environment()
	_setup_light()
	_build_world()
	player.attach_camera(iso_camera)
	debug_hud.attach(player, iso_camera, iso_map, targets_root)


func _physics_process(delta: float) -> void:
	_update_camera_follow(delta)


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_F5:
			_build_world()


func get_target(name: String) -> Node3D:
	return targets_root.get_node_or_null(name) as Node3D


func _build_world() -> void:
	iso_map.build_from_dir(MAP_DIR)
	_setup_camera()
	_spawn_player()
	_spawn_targets()
	_build_starfield()


func _setup_environment() -> void:
	var environment := Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = Color("050914")
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("202f46")
	environment.ambient_light_energy = 1.2
	environment.glow_enabled = true
	environment.glow_intensity = 0.85
	environment.glow_strength = 1.0
	world_environment.environment = environment


func _setup_light() -> void:
	key_light.rotation_degrees = Vector3(-52.0, 45.0, 0.0)
	key_light.light_color = Color("78d7ff")
	key_light.light_energy = 0.8


func _setup_camera() -> void:
	var focus: Vector3 = iso_map.map_center + Vector3(0.0, iso_map.level_height * 0.9, 0.0)
	var max_span: float = max(iso_map.map_width * iso_map.tile_size, iso_map.map_height * iso_map.tile_size)
	iso_camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	iso_camera.size = max(22.0, max_span * 0.62)
	iso_camera.near = 0.05
	iso_camera.far = 250.0
	_camera_offset = Vector3(26.0, 30.0, 26.0)
	iso_camera.global_position = focus + _camera_offset
	iso_camera.look_at(focus, Vector3.UP)


func _spawn_player() -> void:
	player.global_position = iso_map.player_spawn_world + Vector3(0.0, 0.12, 0.0)
	player.reset_motion()
	player.snap_to_floor()
	_update_camera_follow(1.0)


func _spawn_targets() -> void:
	for child in targets_root.get_children():
		child.queue_free()

	for spec: Dictionary in TARGET_SPECS:
		var target := IsoTargetScript.new()
		target.name = str(spec["name"])
		target.position = iso_map.world_for_cell(spec["cell"].x, spec["cell"].y, spec["vertical_offset"])
		targets_root.add_child(target)
		target.setup_palette(spec["color"])


func _build_starfield() -> void:
	for child in starfield_root.get_children():
		child.queue_free()

	var rng := RandomNumberGenerator.new()
	rng.seed = 424242

	var star_mesh := SphereMesh.new()
	star_mesh.radius = 0.07
	star_mesh.height = 0.14

	var star_material := StandardMaterial3D.new()
	star_material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	star_material.albedo_color = Color("d5f8ff")
	star_material.emission_enabled = true
	star_material.emission = Color("87efff")
	star_material.emission_energy_multiplier = 0.9

	var stars := MultiMesh.new()
	stars.transform_format = MultiMesh.TRANSFORM_3D
	stars.mesh = star_mesh
	stars.instance_count = STAR_COUNT

	var radius: float = max(iso_map.map_width, iso_map.map_height) * iso_map.tile_size * 1.4
	for index in range(STAR_COUNT):
		var phi := rng.randf_range(0.0, TAU)
		var theta := rng.randf_range(0.2, 1.2)
		var distance := rng.randf_range(radius * 0.85, radius * 1.3)
		var offset := Vector3(
			cos(phi) * sin(theta) * distance,
			cos(theta) * distance * 0.7 + 10.0,
			sin(phi) * sin(theta) * distance
		)
		var transform := Transform3D(Basis.IDENTITY, iso_map.map_center + offset)
		var scale := rng.randf_range(0.5, 1.7)
		transform.basis = transform.basis.scaled(Vector3.ONE * scale)
		stars.set_instance_transform(index, transform)

	var star_instance := MultiMeshInstance3D.new()
	star_instance.multimesh = stars
	star_instance.material_override = star_material
	starfield_root.add_child(star_instance)


func _update_camera_follow(delta: float) -> void:
	if player == null or iso_camera == null:
		return

	var focus: Vector3 = player.global_position + Vector3(0.0, iso_map.level_height * 0.9, 0.0)
	var target_position: Vector3 = focus + _camera_offset
	iso_camera.global_position = target_position
	iso_camera.look_at(focus, Vector3.UP)
