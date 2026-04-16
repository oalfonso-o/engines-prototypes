extends RefCounted
class_name GridMapBasicTilesHouse

const HOUSE_SIZE: int = 8
const WALL_HEIGHT_CELLS: int = 3
const FLOOR_ITEM: int = 1
const ROOF_ITEM: int = 2
const FRONT_WALL_ITEM: int = 3
const BACK_WALL_ITEM: int = 4
const LEFT_WALL_ITEM: int = 5
const RIGHT_WALL_ITEM: int = 6
const FRONT_HEADER_ITEM: int = 7
const BACK_HEADER_ITEM: int = 8
const LEFT_HEADER_ITEM: int = 9
const RIGHT_HEADER_ITEM: int = 10
const BACK_SILL_ITEM: int = 11
const LEFT_SILL_ITEM: int = 12
const RIGHT_SILL_ITEM: int = 13
const WALL_THICKNESS: float = 0.35
const WALL_EDGE_OFFSET: float = 0.0


func build(wall_material: Material, floor_material: Material, roof_material: Material) -> Node3D:
	var root: Node3D = Node3D.new()
	root.name = "GridMapBasicTilesHouse"
	var grid: GridMap = GridMap.new()
	grid.name = "GridMap"
	grid.cell_size = Vector3.ONE
	grid.position = Vector3(-3.5, 0.0, -3.5)
	grid.mesh_library = _build_mesh_library(wall_material, floor_material, roof_material)
	_fill_floor(grid)
	_fill_front_wall(grid)
	_fill_back_wall(grid)
	_fill_side_walls(grid)
	_fill_roof(grid)
	root.add_child(grid)
	return root


func _fill_floor(grid: GridMap) -> void:
	for x: int in range(HOUSE_SIZE):
		for z: int in range(HOUSE_SIZE):
			grid.set_cell_item(Vector3i(x, 0, z), FLOOR_ITEM)


func _fill_front_wall(grid: GridMap) -> void:
	for y: int in range(WALL_HEIGHT_CELLS):
		for x: int in range(HOUSE_SIZE):
			if y < 2 and (x == 3 or x == 4):
				continue
			var item_id: int = FRONT_WALL_ITEM
			if y == 2 and (x == 3 or x == 4):
				item_id = FRONT_HEADER_ITEM
			grid.set_cell_item(Vector3i(x, y, HOUSE_SIZE - 1), item_id)


func _fill_back_wall(grid: GridMap) -> void:
	for y: int in range(WALL_HEIGHT_CELLS):
		for x: int in range(HOUSE_SIZE):
			if y == 1 and (x == 3 or x == 4):
				continue
			var item_id: int = BACK_WALL_ITEM
			if y == 0 and (x == 3 or x == 4):
				item_id = BACK_SILL_ITEM
			elif y == 2 and (x == 3 or x == 4):
				item_id = BACK_HEADER_ITEM
			grid.set_cell_item(Vector3i(x, y, 0), item_id)


func _fill_side_walls(grid: GridMap) -> void:
	for y: int in range(WALL_HEIGHT_CELLS):
		for z: int in range(HOUSE_SIZE):
			var left_item: int = LEFT_WALL_ITEM
			var right_item: int = RIGHT_WALL_ITEM
			if y == 1 and (z == 3 or z == 4):
				left_item = -1
				right_item = -1
			elif y == 0 and (z == 3 or z == 4):
				left_item = LEFT_SILL_ITEM
				right_item = RIGHT_SILL_ITEM
			elif y == 2 and (z == 3 or z == 4):
				left_item = LEFT_HEADER_ITEM
				right_item = RIGHT_HEADER_ITEM
			if left_item != -1:
				grid.set_cell_item(Vector3i(0, y, z), left_item)
			if right_item != -1:
				grid.set_cell_item(Vector3i(HOUSE_SIZE - 1, y, z), right_item)


func _fill_roof(grid: GridMap) -> void:
	for x: int in range(HOUSE_SIZE):
		for z: int in range(HOUSE_SIZE):
			grid.set_cell_item(Vector3i(x, WALL_HEIGHT_CELLS, z), ROOF_ITEM)


func _build_mesh_library(wall_material: Material, floor_material: Material, roof_material: Material) -> MeshLibrary:
	var library: MeshLibrary = MeshLibrary.new()
	_add_item(library, FLOOR_ITEM, "Floor", Vector3(1.0, 0.1, 1.0), floor_material, Transform3D(Basis.IDENTITY, Vector3(0.0, 0.05, 0.0)))
	_add_item(library, ROOF_ITEM, "Roof", Vector3(1.0, 0.18, 1.0), roof_material, Transform3D(Basis.IDENTITY, Vector3(0.0, 0.09, 0.0)))
	_add_item(library, FRONT_WALL_ITEM, "FrontWall", Vector3(1.0, 1.0, WALL_THICKNESS), wall_material, Transform3D(Basis.IDENTITY, Vector3(0.0, 0.5, WALL_EDGE_OFFSET)))
	_add_item(library, BACK_WALL_ITEM, "BackWall", Vector3(1.0, 1.0, WALL_THICKNESS), wall_material, Transform3D(Basis.IDENTITY, Vector3(0.0, 0.5, -WALL_EDGE_OFFSET)))
	_add_item(library, LEFT_WALL_ITEM, "LeftWall", Vector3(WALL_THICKNESS, 1.0, 1.0), wall_material, Transform3D(Basis.IDENTITY, Vector3(-WALL_EDGE_OFFSET, 0.5, 0.0)))
	_add_item(library, RIGHT_WALL_ITEM, "RightWall", Vector3(WALL_THICKNESS, 1.0, 1.0), wall_material, Transform3D(Basis.IDENTITY, Vector3(WALL_EDGE_OFFSET, 0.5, 0.0)))
	_add_item(library, FRONT_HEADER_ITEM, "FrontHeader", Vector3(1.0, 1.0, WALL_THICKNESS), wall_material, Transform3D(Basis.IDENTITY, Vector3(0.0, 0.5, WALL_EDGE_OFFSET)))
	_add_item(library, BACK_HEADER_ITEM, "BackHeader", Vector3(1.0, 1.0, WALL_THICKNESS), wall_material, Transform3D(Basis.IDENTITY, Vector3(0.0, 0.5, -WALL_EDGE_OFFSET)))
	_add_item(library, LEFT_HEADER_ITEM, "LeftHeader", Vector3(WALL_THICKNESS, 1.0, 1.0), wall_material, Transform3D(Basis.IDENTITY, Vector3(-WALL_EDGE_OFFSET, 0.5, 0.0)))
	_add_item(library, RIGHT_HEADER_ITEM, "RightHeader", Vector3(WALL_THICKNESS, 1.0, 1.0), wall_material, Transform3D(Basis.IDENTITY, Vector3(WALL_EDGE_OFFSET, 0.5, 0.0)))
	_add_item(library, BACK_SILL_ITEM, "BackSill", Vector3(1.0, 1.0, WALL_THICKNESS), wall_material, Transform3D(Basis.IDENTITY, Vector3(0.0, 0.5, -WALL_EDGE_OFFSET)))
	_add_item(library, LEFT_SILL_ITEM, "LeftSill", Vector3(WALL_THICKNESS, 1.0, 1.0), wall_material, Transform3D(Basis.IDENTITY, Vector3(-WALL_EDGE_OFFSET, 0.5, 0.0)))
	_add_item(library, RIGHT_SILL_ITEM, "RightSill", Vector3(WALL_THICKNESS, 1.0, 1.0), wall_material, Transform3D(Basis.IDENTITY, Vector3(WALL_EDGE_OFFSET, 0.5, 0.0)))
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
