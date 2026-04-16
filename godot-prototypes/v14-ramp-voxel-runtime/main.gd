extends Node3D

const PLAYER_SPAWN: Vector3 = Vector3(0.0, 1.0, -20.0)
const GROUND_SIZE: Vector3 = Vector3(60.0, 0.2, 60.0)

const FpsControllerScript := preload("res://fps_controller.gd")
const VoxelWorldScript := preload("res://voxel_world_runtime.gd")


func _ready() -> void:
	_build_environment()
	_build_lighting()
	_build_ground()
	_build_world()
	_build_player()
	_build_overlay()


func _build_environment() -> void:
	var world_environment: WorldEnvironment = WorldEnvironment.new()
	world_environment.name = "WorldEnvironment"
	var environment: Environment = Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = Color("9aa7b3")
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("d8dde2")
	environment.ambient_light_energy = 0.9
	environment.fog_enabled = true
	environment.fog_density = 0.006
	environment.fog_light_color = Color("b2bcc6")
	world_environment.environment = environment
	add_child(world_environment)


func _build_lighting() -> void:
	var sun: DirectionalLight3D = DirectionalLight3D.new()
	sun.name = "Sun"
	sun.rotation_degrees = Vector3(-55.0, 35.0, 0.0)
	sun.light_energy = 1.5
	sun.light_color = Color("f2efe7")
	add_child(sun)

	var fill: OmniLight3D = OmniLight3D.new()
	fill.name = "Fill"
	fill.position = Vector3(0.0, 6.0, 0.0)
	fill.light_energy = 0.35
	fill.omni_range = 30.0
	fill.light_color = Color("c7d5e0")
	add_child(fill)


func _build_world() -> void:
	var voxel_world: Node3D = VoxelWorldScript.new()
	voxel_world.name = "VoxelWorldRoot"
	add_child(voxel_world)


func _build_ground() -> void:
	var ground: StaticBody3D = StaticBody3D.new()
	ground.name = "Ground"
	ground.position = Vector3(0.0, -0.1, 0.0)
	add_child(ground)

	var mesh_instance: MeshInstance3D = MeshInstance3D.new()
	mesh_instance.name = "MeshInstance3D"
	var mesh: BoxMesh = BoxMesh.new()
	mesh.size = GROUND_SIZE
	var material: StandardMaterial3D = StandardMaterial3D.new()
	material.albedo_color = Color("8fa284")
	material.roughness = 1.0
	mesh.material = material
	mesh_instance.mesh = mesh
	ground.add_child(mesh_instance)

	var collision: CollisionShape3D = CollisionShape3D.new()
	collision.name = "CollisionShape3D"
	var shape: BoxShape3D = BoxShape3D.new()
	shape.size = GROUND_SIZE
	collision.shape = shape
	ground.add_child(collision)


func _build_player() -> void:
	var player: CharacterBody3D = FpsControllerScript.new()
	player.name = "Player"
	player.position = PLAYER_SPAWN
	add_child(player)
	player.look_at(Vector3(0.0, 1.0, 0.0), Vector3.UP)


func _build_overlay() -> void:
	var canvas: CanvasLayer = CanvasLayer.new()
	canvas.name = "CanvasLayer"
	add_child(canvas)

	var panel: ColorRect = ColorRect.new()
	panel.position = Vector2(16.0, 16.0)
	panel.size = Vector2(520.0, 84.0)
	panel.color = Color(0.0, 0.0, 0.0, 0.58)
	canvas.add_child(panel)

	var label: Label = Label.new()
	label.position = Vector2(28.0, 24.0)
	label.size = Vector2(500.0, 64.0)
	label.text = "V14 ramp voxel runtime\\nWASD move  Space jump  Mouse look  Esc release mouse  Click recapture"
	canvas.add_child(label)
