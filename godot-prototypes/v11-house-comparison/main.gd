extends Node3D

const PrimitivesHouseScript := preload("res://primitives_house.gd")
const GridMapMinimalHouseScript := preload("res://gridmap_minimal_house.gd")
const GridMapBasicTilesHouseScript := preload("res://gridmap_basic_tiles_house.gd")
const GridMapComposedTilesHouseScript := preload("res://gridmap_composed_tiles_house.gd")

const BACKGROUND_COLOR: Color = Color("b8c7d3")
const GROUND_COLOR: Color = Color("6c8060")
const ROOF_COLOR: Color = Color("5f5850")
const FLOOR_COLOR: Color = Color("d8d1c6")
const LIGHT_COLOR: Color = Color("f2f0ea")

const GROUND_SIZE: Vector3 = Vector3(120.0, 1.0, 72.0)
const PLAYER_SPAWN_POSITION: Vector3 = Vector3(0.0, 0.95, 18.0)
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

const HOUSE_X_POSITIONS: Array[float] = [-36.0, -12.0, 12.0, 36.0]
const HOUSE_Z_POSITION: float = 0.0
const LABEL_HEIGHT: float = 4.7

var player: CharacterBody3D
var camera_pivot: Node3D
var camera: Camera3D
var look_pitch: float = 0.0


func _ready() -> void:
	_build_environment()
	_build_lighting()
	_build_ground()
	_build_houses()
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
		look_pitch = clampf(look_pitch - (event.relative.y * MOUSE_SENSITIVITY), deg_to_rad(-PITCH_LIMIT_DEGREES), deg_to_rad(PITCH_LIMIT_DEGREES))
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
	environment.background_color = BACKGROUND_COLOR
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("dce3e8")
	environment.ambient_light_energy = 0.8
	environment.fog_enabled = true
	environment.fog_density = 0.008
	environment.fog_light_color = BACKGROUND_COLOR
	world_environment.environment = environment
	add_child(world_environment)


func _build_lighting() -> void:
	var sun: DirectionalLight3D = DirectionalLight3D.new()
	sun.name = "DirectionalLight3D"
	sun.rotation_degrees = Vector3(-50.0, -25.0, 0.0)
	sun.light_color = LIGHT_COLOR
	sun.light_energy = 1.6
	add_child(sun)

	var fill: OmniLight3D = OmniLight3D.new()
	fill.name = "FillLight"
	fill.position = Vector3(0.0, 10.0, 8.0)
	fill.omni_range = 80.0
	fill.light_energy = 0.5
	fill.light_color = Color("a8bdd0")
	add_child(fill)


func _build_ground() -> void:
	add_child(_create_box_body("Ground", GROUND_SIZE, Vector3(0.0, -0.5, 0.0), _build_flat_material(GROUND_COLOR)))


func _build_houses() -> void:
	var wall_material: Material = _build_generated_image_material()
	var floor_material: Material = _build_flat_material(FLOOR_COLOR)
	var roof_material: Material = _build_flat_material(ROOF_COLOR)

	var houses: Array = [
		{"name": "Primitives", "script": PrimitivesHouseScript},
		{"name": "Grid Minimal", "script": GridMapMinimalHouseScript},
		{"name": "Grid Basic Tiles", "script": GridMapBasicTilesHouseScript},
		{"name": "Grid Composed", "script": GridMapComposedTilesHouseScript}
	]

	for index: int in range(houses.size()):
		var house_root: Node3D = houses[index]["script"].new().build(wall_material, floor_material, roof_material)
		house_root.name = "%sRoot" % houses[index]["name"].replace(" ", "")
		house_root.position = Vector3(HOUSE_X_POSITIONS[index], 0.0, HOUSE_Z_POSITION)
		add_child(house_root)
		add_child(_build_house_label(houses[index]["name"], house_root.position + Vector3(0.0, LABEL_HEIGHT, 0.0)))


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
	camera.far = 200.0
	camera_pivot.add_child(camera)

	player.look_at(Vector3(0.0, CAMERA_HEIGHT, HOUSE_Z_POSITION), Vector3.UP)
	player.rotation.x = 0.0
	camera_pivot.rotation = Vector3.ZERO


func _build_overlay() -> void:
	var canvas: CanvasLayer = CanvasLayer.new()
	canvas.name = "CanvasLayer"
	add_child(canvas)

	var panel: ColorRect = ColorRect.new()
	panel.position = Vector2(16.0, 16.0)
	panel.size = Vector2(520.0, 90.0)
	panel.color = Color(0.0, 0.0, 0.0, 0.58)
	canvas.add_child(panel)

	var label: Label = Label.new()
	label.position = Vector2(28.0, 24.0)
	label.size = Vector2(500.0, 72.0)
	label.text = "V11 House Comparison\\nWASD move  Shift sprint  Space jump  Esc release mouse  Click recapture"
	canvas.add_child(label)


func _build_house_label(text_value: String, world_position: Vector3) -> Label3D:
	var label: Label3D = Label3D.new()
	label.name = "%sLabel" % text_value.replace(" ", "")
	label.text = text_value
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.font_size = 56
	label.pixel_size = 0.01
	label.position = world_position
	label.modulate = Color("eef2f6")
	return label


func _create_box_body(name: String, size: Vector3, world_position: Vector3, material: Material) -> StaticBody3D:
	var body: StaticBody3D = StaticBody3D.new()
	body.name = name
	body.position = world_position

	var mesh_instance: MeshInstance3D = MeshInstance3D.new()
	mesh_instance.name = "MeshInstance3D"
	var mesh: BoxMesh = BoxMesh.new()
	mesh.size = size
	mesh.material = material
	mesh_instance.mesh = mesh
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
