extends RefCounted
class_name GridMapMinimalHouse

const HOUSE_SIZE: int = 8
const WALL_HEIGHT_CELLS: int = 3
const FLOOR_ITEM: int = 1
const FRONT_WALL_ITEM: int = 2
const BACK_WALL_ITEM: int = 3
const LEFT_WALL_ITEM: int = 4
const RIGHT_WALL_ITEM: int = 5
const ROOF_ITEM: int = 6
const WALL_THICKNESS: float = 0.35
const WALL_EDGE_OFFSET: float = 0.0


func build(wall_material: Material, floor_material: Material, roof_material: Material) -> Node3D:
	var root: Node3D = Node3D.new()
	root.name = "GridMapMinimalHouse"
	var grid: GridMap = GridMap.new()
	grid.name = "GridMap"
	grid.cell_size = Vector3.ONE
	grid.position = Vector3(-3.5, 0.0, -3.5)
	grid.mesh_library = _build_mesh_library(wall_material, floor_material, roof_material)
	_fill_floor(grid)
	_fill_walls(grid)
	_fill_roof(grid)
	root.add_child(grid)
	return root


func _fill_floor(grid: GridMap) -> void:
	for x: int in range(HOUSE_SIZE):
		for z: int in range(HOUSE_SIZE):
			grid.set_cell_item(Vector3i(x, 0, z), FLOOR_ITEM)


func _fill_walls(grid: GridMap) -> void:
	for y: int in range(WALL_HEIGHT_CELLS):
		for x: int in range(HOUSE_SIZE):
			if not _is_front_door_opening(x, y):
				grid.set_cell_item(Vector3i(x, y, HOUSE_SIZE - 1), FRONT_WALL_ITEM)
			if not _is_back_window_opening(x, y):
				grid.set_cell_item(Vector3i(x, y, 0), BACK_WALL_ITEM)
		for z: int in range(HOUSE_SIZE):
			if not _is_side_window_opening(z, y):
				grid.set_cell_item(Vector3i(0, y, z), LEFT_WALL_ITEM)
			if not _is_side_window_opening(z, y):
				grid.set_cell_item(Vector3i(HOUSE_SIZE - 1, y, z), RIGHT_WALL_ITEM)


func _fill_roof(grid: GridMap) -> void:
	for x: int in range(HOUSE_SIZE):
		for z: int in range(HOUSE_SIZE):
			grid.set_cell_item(Vector3i(x, WALL_HEIGHT_CELLS, z), ROOF_ITEM)


func _is_front_door_opening(x: int, y: int) -> bool:
	return y < 2 and (x == 3 or x == 4)


func _is_back_window_opening(x: int, y: int) -> bool:
	return y == 1 and (x == 3 or x == 4)


func _is_side_window_opening(z: int, y: int) -> bool:
	return y == 1 and (z == 3 or z == 4)


func _build_mesh_library(wall_material: Material, floor_material: Material, roof_material: Material) -> MeshLibrary:
	var library: MeshLibrary = MeshLibrary.new()
	_add_item(library, FLOOR_ITEM, "Floor", Vector3(1.0, 0.1, 1.0), floor_material, Transform3D(Basis.IDENTITY, Vector3(0.0, 0.05, 0.0)))
	_add_item(library, FRONT_WALL_ITEM, "FrontWall", Vector3(1.0, 1.0, WALL_THICKNESS), wall_material, Transform3D(Basis.IDENTITY, Vector3(0.0, 0.5, WALL_EDGE_OFFSET)))
	_add_item(library, BACK_WALL_ITEM, "BackWall", Vector3(1.0, 1.0, WALL_THICKNESS), wall_material, Transform3D(Basis.IDENTITY, Vector3(0.0, 0.5, -WALL_EDGE_OFFSET)))
	_add_item(library, LEFT_WALL_ITEM, "LeftWall", Vector3(WALL_THICKNESS, 1.0, 1.0), wall_material, Transform3D(Basis.IDENTITY, Vector3(-WALL_EDGE_OFFSET, 0.5, 0.0)))
	_add_item(library, RIGHT_WALL_ITEM, "RightWall", Vector3(WALL_THICKNESS, 1.0, 1.0), wall_material, Transform3D(Basis.IDENTITY, Vector3(WALL_EDGE_OFFSET, 0.5, 0.0)))
	_add_item(library, ROOF_ITEM, "Roof", Vector3(1.0, 0.18, 1.0), roof_material, Transform3D(Basis.IDENTITY, Vector3(0.0, 0.09, 0.0)))
	return library


func _add_item(library: MeshLibrary, item_id: int, item_name: String, size: Vector3, material: Material, transform_value: Transform3D) -> void:
	library.create_item(item_id)
	library.set_item_name(item_id, item_name)
	var mesh: BoxMesh = BoxMesh.new()
	mesh.size = size
	mesh.material = material
	library.set_item_mesh(item_id, mesh)
	library.set_item_mesh_transform(item_id, transform_value)
	var shape: BoxShape3D = BoxShape3D.new()
	shape.size = size
	library.set_item_shapes(item_id, [shape, transform_value])
