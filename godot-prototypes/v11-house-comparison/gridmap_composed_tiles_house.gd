extends RefCounted
class_name GridMapComposedTilesHouse

const FLOOR_ITEM: int = 1
const ROOF_ITEM: int = 2
const FRONT_DOOR_WALL_ITEM: int = 3
const BACK_WINDOW_WALL_ITEM: int = 4
const SIDE_WINDOW_WALL_ITEM: int = 5

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


func build(wall_material: Material, floor_material: Material, roof_material: Material) -> Node3D:
	var root: Node3D = Node3D.new()
	root.name = "GridMapComposedTilesHouse"
	var grid: GridMap = GridMap.new()
	grid.name = "GridMap"
	grid.cell_size = Vector3.ONE
	grid.mesh_library = _build_mesh_library(wall_material, floor_material, roof_material)
	grid.set_cell_item(Vector3i(0, 0, 0), FLOOR_ITEM)
	grid.set_cell_item(Vector3i(0, 3, 0), ROOF_ITEM)
	grid.set_cell_item(Vector3i(0, 0, 4), FRONT_DOOR_WALL_ITEM)
	grid.set_cell_item(Vector3i(0, 0, -4), BACK_WINDOW_WALL_ITEM)
	grid.set_cell_item(Vector3i(-4, 0, 0), SIDE_WINDOW_WALL_ITEM)
	grid.set_cell_item(Vector3i(4, 0, 0), SIDE_WINDOW_WALL_ITEM)
	root.add_child(grid)
	return root


func _build_mesh_library(wall_material: Material, floor_material: Material, roof_material: Material) -> MeshLibrary:
	var library: MeshLibrary = MeshLibrary.new()
	_add_item(library, FLOOR_ITEM, "Floor", _build_floor_mesh(floor_material), [ _box_shape(Vector3(HOUSE_WIDTH, FLOOR_THICKNESS, HOUSE_DEPTH), Vector3(0.0, FLOOR_THICKNESS * 0.5, 0.0)) ])
	_add_item(library, ROOF_ITEM, "Roof", _build_floor_mesh(roof_material, ROOF_THICKNESS), [ _box_shape(Vector3(HOUSE_WIDTH + 0.2, ROOF_THICKNESS, HOUSE_DEPTH + 0.2), Vector3(0.0, ROOF_THICKNESS * 0.5, 0.0)) ])
	_add_item(library, FRONT_DOOR_WALL_ITEM, "FrontDoorWall", _build_front_door_wall_mesh(wall_material), _front_door_wall_shapes())
	_add_item(library, BACK_WINDOW_WALL_ITEM, "BackWindowWall", _build_back_window_wall_mesh(wall_material), _back_window_wall_shapes())
	_add_item(library, SIDE_WINDOW_WALL_ITEM, "SideWindowWall", _build_side_window_wall_mesh(wall_material), _side_window_wall_shapes())
	return library


func _add_item(library: MeshLibrary, item_id: int, item_name: String, mesh: ArrayMesh, shape_data: Array) -> void:
	library.create_item(item_id)
	library.set_item_name(item_id, item_name)
	library.set_item_mesh(item_id, mesh)
	library.set_item_shapes(item_id, shape_data)


func _build_floor_mesh(material: Material, thickness: float = FLOOR_THICKNESS) -> ArrayMesh:
	return _build_combined_mesh([
		{"size": Vector3(HOUSE_WIDTH, thickness, HOUSE_DEPTH), "center": Vector3(0.0, thickness * 0.5, 0.0)}
	], material)


func _build_front_door_wall_mesh(material: Material) -> ArrayMesh:
	var side_width: float = (HOUSE_WIDTH - DOOR_WIDTH) * 0.5
	var header_height: float = WALL_HEIGHT - DOOR_HEIGHT
	return _build_combined_mesh([
		{"size": Vector3(side_width, WALL_HEIGHT, WALL_THICKNESS), "center": Vector3(-((DOOR_WIDTH * 0.5) + (side_width * 0.5)), WALL_HEIGHT * 0.5, 0.0)},
		{"size": Vector3(side_width, WALL_HEIGHT, WALL_THICKNESS), "center": Vector3((DOOR_WIDTH * 0.5) + (side_width * 0.5), WALL_HEIGHT * 0.5, 0.0)},
		{"size": Vector3(DOOR_WIDTH, header_height, WALL_THICKNESS), "center": Vector3(0.0, DOOR_HEIGHT + (header_height * 0.5), 0.0)}
	], material)


func _build_back_window_wall_mesh(material: Material) -> ArrayMesh:
	var side_width: float = (HOUSE_WIDTH - WINDOW_WIDTH) * 0.5
	var top_height: float = WALL_HEIGHT - (WINDOW_SILL_HEIGHT + WINDOW_HEIGHT)
	return _build_combined_mesh([
		{"size": Vector3(side_width, WALL_HEIGHT, WALL_THICKNESS), "center": Vector3(-((WINDOW_WIDTH * 0.5) + (side_width * 0.5)), WALL_HEIGHT * 0.5, 0.0)},
		{"size": Vector3(side_width, WALL_HEIGHT, WALL_THICKNESS), "center": Vector3((WINDOW_WIDTH * 0.5) + (side_width * 0.5), WALL_HEIGHT * 0.5, 0.0)},
		{"size": Vector3(WINDOW_WIDTH, WINDOW_SILL_HEIGHT, WALL_THICKNESS), "center": Vector3(0.0, WINDOW_SILL_HEIGHT * 0.5, 0.0)},
		{"size": Vector3(WINDOW_WIDTH, top_height, WALL_THICKNESS), "center": Vector3(0.0, WINDOW_SILL_HEIGHT + WINDOW_HEIGHT + (top_height * 0.5), 0.0)}
	], material)


func _build_side_window_wall_mesh(material: Material) -> ArrayMesh:
	var side_depth: float = (HOUSE_DEPTH - WINDOW_WIDTH) * 0.5
	var top_height: float = WALL_HEIGHT - (WINDOW_SILL_HEIGHT + WINDOW_HEIGHT)
	return _build_combined_mesh([
		{"size": Vector3(WALL_THICKNESS, WALL_HEIGHT, side_depth), "center": Vector3(0.0, WALL_HEIGHT * 0.5, (HOUSE_DEPTH * 0.5) - (side_depth * 0.5))},
		{"size": Vector3(WALL_THICKNESS, WALL_HEIGHT, side_depth), "center": Vector3(0.0, WALL_HEIGHT * 0.5, -(HOUSE_DEPTH * 0.5) + (side_depth * 0.5))},
		{"size": Vector3(WALL_THICKNESS, WINDOW_SILL_HEIGHT, WINDOW_WIDTH), "center": Vector3(0.0, WINDOW_SILL_HEIGHT * 0.5, 0.0)},
		{"size": Vector3(WALL_THICKNESS, top_height, WINDOW_WIDTH), "center": Vector3(0.0, WINDOW_SILL_HEIGHT + WINDOW_HEIGHT + (top_height * 0.5), 0.0)}
	], material)


func _front_door_wall_shapes() -> Array:
	var side_width: float = (HOUSE_WIDTH - DOOR_WIDTH) * 0.5
	var header_height: float = WALL_HEIGHT - DOOR_HEIGHT
	return [
		_box_shape(Vector3(side_width, WALL_HEIGHT, WALL_THICKNESS), Vector3(-((DOOR_WIDTH * 0.5) + (side_width * 0.5)), WALL_HEIGHT * 0.5, 0.0)),
		_box_shape(Vector3(side_width, WALL_HEIGHT, WALL_THICKNESS), Vector3((DOOR_WIDTH * 0.5) + (side_width * 0.5), WALL_HEIGHT * 0.5, 0.0)),
		_box_shape(Vector3(DOOR_WIDTH, header_height, WALL_THICKNESS), Vector3(0.0, DOOR_HEIGHT + (header_height * 0.5), 0.0))
	]


func _back_window_wall_shapes() -> Array:
	var side_width: float = (HOUSE_WIDTH - WINDOW_WIDTH) * 0.5
	var top_height: float = WALL_HEIGHT - (WINDOW_SILL_HEIGHT + WINDOW_HEIGHT)
	return [
		_box_shape(Vector3(side_width, WALL_HEIGHT, WALL_THICKNESS), Vector3(-((WINDOW_WIDTH * 0.5) + (side_width * 0.5)), WALL_HEIGHT * 0.5, 0.0)),
		_box_shape(Vector3(side_width, WALL_HEIGHT, WALL_THICKNESS), Vector3((WINDOW_WIDTH * 0.5) + (side_width * 0.5), WALL_HEIGHT * 0.5, 0.0)),
		_box_shape(Vector3(WINDOW_WIDTH, WINDOW_SILL_HEIGHT, WALL_THICKNESS), Vector3(0.0, WINDOW_SILL_HEIGHT * 0.5, 0.0)),
		_box_shape(Vector3(WINDOW_WIDTH, top_height, WALL_THICKNESS), Vector3(0.0, WINDOW_SILL_HEIGHT + WINDOW_HEIGHT + (top_height * 0.5), 0.0))
	]


func _side_window_wall_shapes() -> Array:
	var side_depth: float = (HOUSE_DEPTH - WINDOW_WIDTH) * 0.5
	var top_height: float = WALL_HEIGHT - (WINDOW_SILL_HEIGHT + WINDOW_HEIGHT)
	return [
		_box_shape(Vector3(WALL_THICKNESS, WALL_HEIGHT, side_depth), Vector3(0.0, WALL_HEIGHT * 0.5, (HOUSE_DEPTH * 0.5) - (side_depth * 0.5))),
		_box_shape(Vector3(WALL_THICKNESS, WALL_HEIGHT, side_depth), Vector3(0.0, WALL_HEIGHT * 0.5, -(HOUSE_DEPTH * 0.5) + (side_depth * 0.5))),
		_box_shape(Vector3(WALL_THICKNESS, WINDOW_SILL_HEIGHT, WINDOW_WIDTH), Vector3(0.0, WINDOW_SILL_HEIGHT * 0.5, 0.0)),
		_box_shape(Vector3(WALL_THICKNESS, top_height, WINDOW_WIDTH), Vector3(0.0, WINDOW_SILL_HEIGHT + WINDOW_HEIGHT + (top_height * 0.5), 0.0))
	]


func _box_shape(size: Vector3, center: Vector3) -> Array:
	var shape: BoxShape3D = BoxShape3D.new()
	shape.size = size
	return [shape, Transform3D(Basis.IDENTITY, center)]


func _build_combined_mesh(parts: Array, material: Material) -> ArrayMesh:
	var st: SurfaceTool = SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for part in parts:
		_append_box(st, part["size"], part["center"])
	var mesh: ArrayMesh = st.commit()
	mesh.surface_set_material(0, material)
	return mesh


func _append_box(st: SurfaceTool, size: Vector3, center: Vector3) -> void:
	var hx: float = size.x * 0.5
	var hy: float = size.y * 0.5
	var hz: float = size.z * 0.5
	var p000: Vector3 = center + Vector3(-hx, -hy, -hz)
	var p001: Vector3 = center + Vector3(-hx, -hy, hz)
	var p010: Vector3 = center + Vector3(-hx, hy, -hz)
	var p011: Vector3 = center + Vector3(-hx, hy, hz)
	var p100: Vector3 = center + Vector3(hx, -hy, -hz)
	var p101: Vector3 = center + Vector3(hx, -hy, hz)
	var p110: Vector3 = center + Vector3(hx, hy, -hz)
	var p111: Vector3 = center + Vector3(hx, hy, hz)

	_add_face(st, p101, p001, p011, p111, Vector3.FORWARD, size.x, size.y)
	_add_face(st, p000, p100, p110, p010, Vector3.BACK, size.x, size.y)
	_add_face(st, p001, p000, p010, p011, Vector3.LEFT, size.z, size.y)
	_add_face(st, p100, p101, p111, p110, Vector3.RIGHT, size.z, size.y)
	_add_face(st, p110, p111, p011, p010, Vector3.UP, size.x, size.z)
	_add_face(st, p000, p001, p101, p100, Vector3.DOWN, size.x, size.z)


func _add_face(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, d: Vector3, normal: Vector3, u_size: float, v_size: float) -> void:
	_add_vertex(st, a, normal, Vector2(0.0, v_size))
	_add_vertex(st, b, normal, Vector2(u_size, v_size))
	_add_vertex(st, c, normal, Vector2(u_size, 0.0))
	_add_vertex(st, a, normal, Vector2(0.0, v_size))
	_add_vertex(st, c, normal, Vector2(u_size, 0.0))
	_add_vertex(st, d, normal, Vector2(0.0, 0.0))


func _add_vertex(st: SurfaceTool, position_value: Vector3, normal: Vector3, uv: Vector2) -> void:
	st.set_normal(normal)
	st.set_uv(uv)
	st.add_vertex(position_value)
