extends RefCounted
class_name PrimitivesHouse

const HOUSE_WIDTH: float = 8.0
const HOUSE_DEPTH: float = 8.0
const WALL_HEIGHT: float = 3.0
const WALL_THICKNESS: float = 0.35
const FLOOR_THICKNESS: float = 0.1
const ROOF_THICKNESS: float = 0.18
const DOOR_WIDTH: float = 2.0
const DOOR_HEIGHT: float = 2.3
const WINDOW_WIDTH: float = 1.8
const WINDOW_HEIGHT: float = 1.0
const WINDOW_SILL_HEIGHT: float = 1.2
const WALL_BASE_Y: float = FLOOR_THICKNESS


func build(wall_material: Material, floor_material: Material, roof_material: Material) -> Node3D:
	var root: Node3D = Node3D.new()
	root.name = "PrimitivesHouse"
	root.add_child(_build_block("Floor", Vector3(HOUSE_WIDTH, FLOOR_THICKNESS, HOUSE_DEPTH), Vector3(0.0, FLOOR_THICKNESS * 0.5, 0.0), floor_material))
	root.add_child(_build_front_wall(wall_material))
	root.add_child(_build_window_wall("BackWall", Vector3(0.0, WALL_BASE_Y + (WALL_HEIGHT * 0.5), -(HOUSE_DEPTH * 0.5) + (WALL_THICKNESS * 0.5)), Vector3(HOUSE_WIDTH, WALL_HEIGHT, WALL_THICKNESS), wall_material))
	root.add_child(_build_side_window_wall("LeftWall", -1.0, wall_material))
	root.add_child(_build_side_window_wall("RightWall", 1.0, wall_material))
	root.add_child(_build_block("Roof", Vector3(HOUSE_WIDTH + 0.2, ROOF_THICKNESS, HOUSE_DEPTH + 0.2), Vector3(0.0, WALL_BASE_Y + WALL_HEIGHT + (ROOF_THICKNESS * 0.5), 0.0), roof_material))
	return root


func _build_front_wall(wall_material: Material) -> Node3D:
	var root: Node3D = Node3D.new()
	root.name = "FrontWall"
	var side_width: float = (HOUSE_WIDTH - DOOR_WIDTH) * 0.5
	var wall_z: float = (HOUSE_DEPTH * 0.5) - (WALL_THICKNESS * 0.5)
	root.add_child(_build_block("DoorLeft", Vector3(side_width, WALL_HEIGHT, WALL_THICKNESS), Vector3(-((DOOR_WIDTH * 0.5) + (side_width * 0.5)), WALL_BASE_Y + (WALL_HEIGHT * 0.5), wall_z), wall_material))
	root.add_child(_build_block("DoorRight", Vector3(side_width, WALL_HEIGHT, WALL_THICKNESS), Vector3((DOOR_WIDTH * 0.5) + (side_width * 0.5), WALL_BASE_Y + (WALL_HEIGHT * 0.5), wall_z), wall_material))
	root.add_child(_build_block("DoorHeader", Vector3(DOOR_WIDTH, WALL_HEIGHT - DOOR_HEIGHT, WALL_THICKNESS), Vector3(0.0, WALL_BASE_Y + DOOR_HEIGHT + ((WALL_HEIGHT - DOOR_HEIGHT) * 0.5), wall_z), wall_material))
	return root


func _build_window_wall(block_name: String, wall_position: Vector3, wall_size: Vector3, wall_material: Material) -> Node3D:
	var root: Node3D = Node3D.new()
	root.name = block_name
	var side_width: float = (wall_size.x - WINDOW_WIDTH) * 0.5
	root.add_child(_build_block("Left", Vector3(side_width, wall_size.y, wall_size.z), wall_position + Vector3(-((WINDOW_WIDTH * 0.5) + (side_width * 0.5)), 0.0, 0.0), wall_material))
	root.add_child(_build_block("Right", Vector3(side_width, wall_size.y, wall_size.z), wall_position + Vector3((WINDOW_WIDTH * 0.5) + (side_width * 0.5), 0.0, 0.0), wall_material))
	root.add_child(_build_block("Bottom", Vector3(WINDOW_WIDTH, WINDOW_SILL_HEIGHT, wall_size.z), wall_position + Vector3(0.0, -((wall_size.y - WINDOW_SILL_HEIGHT) * 0.5), 0.0), wall_material))
	root.add_child(_build_block("Top", Vector3(WINDOW_WIDTH, wall_size.y - (WINDOW_SILL_HEIGHT + WINDOW_HEIGHT), wall_size.z), wall_position + Vector3(0.0, WINDOW_SILL_HEIGHT + WINDOW_HEIGHT + ((wall_size.y - (WINDOW_SILL_HEIGHT + WINDOW_HEIGHT)) * 0.5) - (wall_size.y * 0.5), 0.0), wall_material))
	return root


func _build_side_window_wall(block_name: String, side_sign: float, wall_material: Material) -> Node3D:
	var root: Node3D = Node3D.new()
	root.name = block_name
	var inner_depth: float = HOUSE_DEPTH - (WALL_THICKNESS * 2.0)
	var side_depth: float = (inner_depth - WINDOW_WIDTH) * 0.5
	var wall_x: float = (HOUSE_WIDTH * 0.5 * side_sign) - (WALL_THICKNESS * 0.5 * side_sign)
	root.add_child(_build_block("Front", Vector3(WALL_THICKNESS, WALL_HEIGHT, side_depth), Vector3(wall_x, WALL_BASE_Y + (WALL_HEIGHT * 0.5), (WINDOW_WIDTH * 0.5) + (side_depth * 0.5)), wall_material))
	root.add_child(_build_block("Back", Vector3(WALL_THICKNESS, WALL_HEIGHT, side_depth), Vector3(wall_x, WALL_BASE_Y + (WALL_HEIGHT * 0.5), -((WINDOW_WIDTH * 0.5) + (side_depth * 0.5))), wall_material))
	root.add_child(_build_block("Bottom", Vector3(WALL_THICKNESS, WINDOW_SILL_HEIGHT, WINDOW_WIDTH), Vector3(wall_x, WALL_BASE_Y + (WINDOW_SILL_HEIGHT * 0.5), 0.0), wall_material))
	root.add_child(_build_block("Top", Vector3(WALL_THICKNESS, WALL_HEIGHT - (WINDOW_SILL_HEIGHT + WINDOW_HEIGHT), WINDOW_WIDTH), Vector3(wall_x, WALL_BASE_Y + WINDOW_SILL_HEIGHT + WINDOW_HEIGHT + ((WALL_HEIGHT - (WINDOW_SILL_HEIGHT + WINDOW_HEIGHT)) * 0.5), 0.0), wall_material))
	return root


func _build_block(block_name: String, size: Vector3, position_value: Vector3, material: Material) -> StaticBody3D:
	var body: StaticBody3D = StaticBody3D.new()
	body.name = block_name
	body.position = position_value

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
