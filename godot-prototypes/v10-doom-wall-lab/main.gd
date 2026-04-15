extends Node3D

const BACKDROP_COLOR: Color = Color("0b0d10")
const FLOOR_COLOR: Color = Color("20242a")
const FLOOR_GRID_COLOR: Color = Color("2a3038")
const LABEL_COLOR: Color = Color("e8edf2")
const LIGHT_COLOR: Color = Color("f2f0ea")

const BACKDROP_SIZE: Vector3 = Vector3(36.0, 13.0, 1.0)
const FLOOR_SIZE: Vector3 = Vector3(44.0, 1.0, 34.0)
const PLAYER_SPAWN_POSITION: Vector3 = Vector3(0.0, 0.95, 9.5)
const PLAYER_COLLISION_HEIGHT: float = 1.2
const PLAYER_COLLISION_RADIUS: float = 0.35
const CAMERA_HEIGHT: float = 0.72
const PLAYER_SPEED: float = 7.5
const PLAYER_SPRINT_SPEED: float = 11.5
const PLAYER_ACCELERATION: float = 10.0
const PLAYER_AIR_CONTROL: float = 3.5
const PLAYER_GRAVITY: float = 24.0
const PLAYER_JUMP_VELOCITY: float = 8.5
const PLAYER_FLOOR_SNAP: float = 0.35
const MOUSE_SENSITIVITY: float = 0.0027
const PITCH_LIMIT_DEGREES: float = 82.0
const WALL_SIZE: Vector3 = Vector3(5.5, 4.5, 0.35)
const WALL_ROW_Z: float = -8.0
const WALL_SPACING: float = 8.0
const WALL_LABEL_HEIGHT: float = 3.35
const WALL_BASE_SIZE: Vector3 = Vector3(6.2, 0.3, 1.6)
const WALL_POSITIONS: Array[float] = [-12.0, -4.0, 4.0, 12.0]

var player: CharacterBody3D
var camera_pivot: Node3D
var camera: Camera3D
var look_pitch: float = 0.0


func _ready() -> void:
	_build_environment()
	_build_lighting()
	_build_floor()
	_build_backdrop()
	_build_wall_gallery()
	_build_player()
	_build_overlay()
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _physics_process(delta: float) -> void:
	if player == null:
		return

	var move_input: Vector2 = _read_move_input()
	var move_basis: Basis = Basis(Vector3.UP, player.rotation.y)
	var desired_direction: Vector3 = (move_basis * Vector3(move_input.x, 0.0, move_input.y)).normalized()
	var desired_speed: float = PLAYER_SPRINT_SPEED if Input.is_physical_key_pressed(KEY_SHIFT) else PLAYER_SPEED
	var desired_velocity: Vector3 = desired_direction * desired_speed
	var blend_rate: float = PLAYER_ACCELERATION if player.is_on_floor() else PLAYER_AIR_CONTROL

	var velocity: Vector3 = player.velocity
	var horizontal_velocity: Vector3 = Vector3(velocity.x, 0.0, velocity.z)
	horizontal_velocity = horizontal_velocity.lerp(desired_velocity, clampf(delta * blend_rate, 0.0, 1.0))
	velocity.x = horizontal_velocity.x
	velocity.z = horizontal_velocity.z

	if player.is_on_floor():
		velocity.y = -0.01
		if Input.is_physical_key_pressed(KEY_SPACE):
			velocity.y = PLAYER_JUMP_VELOCITY
	else:
		velocity.y -= PLAYER_GRAVITY * delta

	player.velocity = velocity
	player.move_and_slide()


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		player.rotation.y -= event.relative.x * MOUSE_SENSITIVITY
		look_pitch = clampf(
			look_pitch - (event.relative.y * MOUSE_SENSITIVITY),
			deg_to_rad(-PITCH_LIMIT_DEGREES),
			deg_to_rad(PITCH_LIMIT_DEGREES)
		)
		camera_pivot.rotation.x = look_pitch
		return

	if event.is_action_pressed("ui_cancel"):
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		return

	if event is InputEventMouseButton and event.pressed and Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _exit_tree() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE


func _build_environment() -> void:
	var world_environment: WorldEnvironment = WorldEnvironment.new()
	world_environment.name = "WorldEnvironment"

	var environment: Environment = Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = BACKDROP_COLOR
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("6c7684")
	environment.ambient_light_energy = 0.6
	environment.fog_enabled = true
	environment.fog_density = 0.012
	environment.fog_light_color = BACKDROP_COLOR.lightened(0.2)
	world_environment.environment = environment

	add_child(world_environment)


func _build_lighting() -> void:
	var sun: DirectionalLight3D = DirectionalLight3D.new()
	sun.name = "DirectionalLight3D"
	sun.position = Vector3(0.0, 8.0, 4.0)
	sun.rotation_degrees = Vector3(-46.0, -25.0, 0.0)
	sun.light_color = LIGHT_COLOR
	sun.light_energy = 1.7
	add_child(sun)

	var fill_light: OmniLight3D = OmniLight3D.new()
	fill_light.name = "FillLight"
	fill_light.position = Vector3(0.0, 6.0, 2.0)
	fill_light.light_color = Color("8aa0b8")
	fill_light.light_energy = 0.65
	fill_light.omni_range = 28.0
	add_child(fill_light)

	var gallery_light: OmniLight3D = OmniLight3D.new()
	gallery_light.name = "GalleryLight"
	gallery_light.position = Vector3(0.0, 5.5, WALL_ROW_Z + 2.0)
	gallery_light.light_color = Color("d9dde5")
	gallery_light.light_energy = 2.0
	gallery_light.omni_range = 24.0
	add_child(gallery_light)


func _build_floor() -> void:
	add_child(_create_box_body("Floor", FLOOR_SIZE, Vector3(0.0, -0.5, 0.0), _build_floor_material()))


func _build_backdrop() -> void:
	add_child(
		_create_box_body(
			"Backdrop",
			BACKDROP_SIZE,
			Vector3(0.0, (BACKDROP_SIZE.y * 0.5) - 0.2, WALL_ROW_Z - 2.8),
			_build_flat_material(Color("12161b"))
		)
	)


func _build_wall_gallery() -> void:
	var generated_material: Material = _build_generated_image_material()
	var noise_material: Material = _build_noise_material()
	var shader_material: Material = _build_shader_material()
	var hybrid_material: Material = _build_hybrid_material()

	_add_wall_section("Generated Image", WALL_POSITIONS[0], generated_material, Color("a6afb8"))
	_add_wall_section("NoiseTexture", WALL_POSITIONS[1], noise_material, Color("97a6b4"))
	_add_wall_section("Shader", WALL_POSITIONS[2], shader_material, Color("b4bcc4"))
	_add_wall_section("Hybrid", WALL_POSITIONS[3], hybrid_material, Color("d0c39c"))

	add_child(_create_marker_strip())


func _build_player() -> void:
	player = CharacterBody3D.new()
	player.name = "Player"
	player.position = PLAYER_SPAWN_POSITION
	player.floor_snap_length = PLAYER_FLOOR_SNAP
	player.safe_margin = 0.001
	add_child(player)

	var collision: CollisionShape3D = CollisionShape3D.new()
	collision.name = "CollisionShape3D"
	var capsule: CapsuleShape3D = CapsuleShape3D.new()
	capsule.radius = PLAYER_COLLISION_RADIUS
	capsule.height = PLAYER_COLLISION_HEIGHT
	collision.shape = capsule
	player.add_child(collision)

	camera_pivot = Node3D.new()
	camera_pivot.name = "CameraPivot"
	camera_pivot.position = Vector3(0.0, CAMERA_HEIGHT, 0.0)
	player.add_child(camera_pivot)

	camera = Camera3D.new()
	camera.name = "Camera3D"
	camera.current = true
	camera.fov = 82.0
	camera.near = 0.05
	camera.far = 120.0
	camera_pivot.add_child(camera)

	player.look_at(Vector3(0.0, CAMERA_HEIGHT, WALL_ROW_Z), Vector3.UP)
	player.rotation.x = 0.0
	camera_pivot.rotation = Vector3.ZERO


func _build_overlay() -> void:
	var canvas: CanvasLayer = CanvasLayer.new()
	canvas.name = "CanvasLayer"
	add_child(canvas)

	var panel: ColorRect = ColorRect.new()
	panel.name = "HelpPanel"
	panel.position = Vector2(16.0, 16.0)
	panel.size = Vector2(420.0, 86.0)
	panel.color = Color(0.0, 0.0, 0.0, 0.58)
	canvas.add_child(panel)

	var label: Label = Label.new()
	label.name = "HelpLabel"
	label.position = Vector2(28.0, 24.0)
	label.size = Vector2(400.0, 70.0)
	label.text = "V10 Doom Wall Lab\nWASD move  Shift sprint  Space jump  Esc release mouse  Click recapture"
	canvas.add_child(label)


func _add_wall_section(label_text: String, x_position: float, material: Material, accent_color: Color) -> void:
	add_child(
		_create_box_body(
			"%sBase" % label_text,
			WALL_BASE_SIZE,
			Vector3(x_position, WALL_BASE_SIZE.y * 0.5, WALL_ROW_Z),
			_build_flat_material(Color("171b21"))
		)
	)

	add_child(
		_create_box_body(
			"%sWall" % label_text,
			WALL_SIZE,
			Vector3(x_position, (WALL_SIZE.y * 0.5) + WALL_BASE_SIZE.y, WALL_ROW_Z),
			material
		)
	)

	var label: Label3D = Label3D.new()
	label.name = "%sLabel" % label_text
	label.text = label_text
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.modulate = LABEL_COLOR
	label.outline_modulate = accent_color
	label.font_size = 64
	label.pixel_size = 0.01
	label.position = Vector3(x_position, WALL_LABEL_HEIGHT, WALL_ROW_Z + 1.15)
	add_child(label)


func _create_marker_strip() -> StaticBody3D:
	return _create_box_body(
		"GalleryMarker",
		Vector3(34.0, 0.05, 0.25),
		Vector3(0.0, 0.026, WALL_ROW_Z + 0.95),
		_build_flat_material(Color("56616f"))
	)


func _create_box_body(name: String, size: Vector3, world_position: Vector3, material: Material) -> StaticBody3D:
	var body: StaticBody3D = StaticBody3D.new()
	body.name = name
	body.position = world_position

	var mesh_instance: MeshInstance3D = MeshInstance3D.new()
	mesh_instance.name = "MeshInstance3D"
	var mesh: BoxMesh = BoxMesh.new()
	mesh.size = size
	mesh_instance.mesh = mesh
	mesh_instance.material_override = material
	body.add_child(mesh_instance)

	var collision: CollisionShape3D = CollisionShape3D.new()
	collision.name = "CollisionShape3D"
	var shape: BoxShape3D = BoxShape3D.new()
	shape.size = size
	collision.shape = shape
	body.add_child(collision)

	return body


func _build_flat_material(color: Color) -> StandardMaterial3D:
	var material: StandardMaterial3D = StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.95
	return material


func _build_floor_material() -> StandardMaterial3D:
	var image: Image = Image.create(128, 128, false, Image.FORMAT_RGBA8)
	for y: int in range(128):
		for x: int in range(128):
			var checker_dark: bool = ((x / 16) + (y / 16)) % 2 == 0
			var color: Color = FLOOR_COLOR if checker_dark else FLOOR_GRID_COLOR
			if x % 16 == 0 or y % 16 == 0:
				color = color.lightened(0.08)
			image.set_pixel(x, y, color)

	var texture: ImageTexture = ImageTexture.create_from_image(image)
	var material: StandardMaterial3D = StandardMaterial3D.new()
	material.albedo_texture = texture
	material.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	material.roughness = 1.0
	return material


func _build_generated_image_material() -> StandardMaterial3D:
	var image: Image = Image.create(64, 96, false, Image.FORMAT_RGBA8)
	var palette: Array[Color] = [
		Color("777d83"),
		Color("696f76"),
		Color("5c636a"),
		Color("4f565d")
	]

	for y: int in range(image.get_height()):
		for x: int in range(image.get_width()):
			var column: int = x / 16
			var row: int = y / 24
			var color: Color = palette[(column + row) % palette.size()]
			var local_x: int = x % 16
			var local_y: int = y % 24

			if local_x <= 1 or local_y <= 1 or local_x >= 14 or local_y >= 22:
				color = color.darkened(0.42)
			elif local_x == 7 or local_x == 8:
				color = color.darkened(0.14)
			elif local_y == 11 or local_y == 12:
				color = color.darkened(0.1)

			var grime_noise: float = _hash01(x, y, 3)
			if grime_noise > 0.89:
				color = color.darkened(0.2)

			var streak_noise: float = _hash01(column, x, 11)
			if streak_noise > 0.82 and y > 10:
				var streak_strength: float = 0.08 + (_hash01(x, y, 17) * 0.18)
				color = color.darkened(streak_strength)
			elif streak_noise < 0.08 and y > 16:
				color = color.lightened(0.08)

			if (local_x == 3 or local_x == 12) and (local_y == 3 or local_y == 20):
				color = color.lightened(0.14)

			image.set_pixel(x, y, color)

	var texture: ImageTexture = ImageTexture.create_from_image(image)
	var material: StandardMaterial3D = StandardMaterial3D.new()
	material.albedo_texture = texture
	material.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	material.roughness = 0.96
	material.metallic = 0.08
	return material


func _build_noise_material() -> StandardMaterial3D:
	var noise: FastNoiseLite = FastNoiseLite.new()
	noise.seed = 88
	noise.noise_type = FastNoiseLite.TYPE_CELLULAR
	noise.frequency = 0.07
	noise.fractal_octaves = 3
	noise.fractal_gain = 0.45
	noise.cellular_jitter = 0.65

	var noise_texture: NoiseTexture2D = NoiseTexture2D.new()
	noise_texture.width = 256
	noise_texture.height = 256
	noise_texture.seamless = false
	noise_texture.noise = noise

	var material: StandardMaterial3D = StandardMaterial3D.new()
	material.albedo_texture = noise_texture
	material.albedo_color = Color("8a9098")
	material.roughness = 1.0
	material.metallic = 0.02
	return material


func _build_shader_material() -> ShaderMaterial:
	var material: ShaderMaterial = ShaderMaterial.new()
	var shader: Shader = Shader.new()
	shader.code = """
shader_type spatial;
render_mode cull_back, diffuse_lambert, specular_disabled;

uniform vec4 base_color : source_color = vec4(0.58, 0.59, 0.62, 1.0);
uniform float columns = 6.0;
uniform float rows = 4.0;
uniform float seam_width = 0.06;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void fragment() {
	vec2 low_uv = floor(UV * vec2(48.0, 64.0)) / vec2(48.0, 64.0);
	vec2 grid_uv = vec2(low_uv.x * columns, low_uv.y * rows);
	vec2 cell = floor(grid_uv);
	vec2 local = fract(grid_uv);
	float seam = step(local.x, seam_width) + step(local.y, seam_width) + step(1.0 - local.x, seam_width) + step(1.0 - local.y, seam_width);
	seam = clamp(seam, 0.0, 1.0);
	float panel_variation = hash(cell) * 0.22;
	float grime = hash(vec2(floor(low_uv.x * 20.0), floor(low_uv.y * 24.0))) * 0.09;
	float streak = step(0.84, hash(vec2(cell.x * 2.0, floor(low_uv.y * 20.0)))) * smoothstep(1.0, 0.15, low_uv.y) * 0.15;
	vec3 color = base_color.rgb - panel_variation - grime;
	color -= seam * 0.18;
	color += streak;
	ALBEDO = clamp(color, 0.0, 1.0);
	ROUGHNESS = 0.97;
	METALLIC = 0.06;
}
"""
	material.shader = shader
	return material


func _build_hybrid_material() -> ShaderMaterial:
	var source_texture: ImageTexture = _build_generated_image_material().albedo_texture as ImageTexture
	var material: ShaderMaterial = ShaderMaterial.new()
	var shader: Shader = Shader.new()
	shader.code = """
shader_type spatial;
render_mode cull_back, diffuse_lambert, specular_disabled;

uniform sampler2D wall_tex : source_color, filter_nearest;
uniform vec4 tint_color : source_color = vec4(0.88, 0.80, 0.62, 1.0);
uniform float contrast = 1.22;
uniform float seam_width = 0.06;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(91.7, 259.3))) * 43758.5453123);
}

void fragment() {
	vec2 pixel_uv = floor(UV * vec2(48.0, 64.0)) / vec2(48.0, 64.0);
	vec3 sampled = texture(wall_tex, pixel_uv).rgb;
	vec2 local = fract(UV * vec2(6.0, 4.0));
	float seam = step(local.x, seam_width) + step(local.y, seam_width) + step(1.0 - local.x, seam_width) + step(1.0 - local.y, seam_width);
	seam = clamp(seam, 0.0, 1.0);
	float stripe = step(0.86, hash(vec2(floor(UV.x * 24.0), floor(UV.y * 8.0))));
	float highlight = stripe * smoothstep(1.0, 0.2, UV.y) * 0.12;
	vec3 color = mix(sampled, sampled * tint_color.rgb, 0.35);
	color = mix(vec3(0.5), color, contrast);
	color -= seam * 0.14;
	color += highlight;
	ALBEDO = clamp(color, 0.0, 1.0);
	ROUGHNESS = 0.95;
	METALLIC = 0.08;
	EMISSION = vec3(highlight * 0.5);
}
"""
	material.shader = shader
	material.set_shader_parameter("wall_tex", source_texture)
	return material


func _read_move_input() -> Vector2:
	var input_vector: Vector2 = Vector2.ZERO
	if Input.is_physical_key_pressed(KEY_A):
		input_vector.x -= 1.0
	if Input.is_physical_key_pressed(KEY_D):
		input_vector.x += 1.0
	if Input.is_physical_key_pressed(KEY_W):
		input_vector.y -= 1.0
	if Input.is_physical_key_pressed(KEY_S):
		input_vector.y += 1.0
	return input_vector.normalized()


func _hash01(x: int, y: int, seed: int) -> float:
	var value: float = sin(float((x * 127) + (y * 311) + (seed * 947))) * 43758.5453
	return value - floorf(value)
