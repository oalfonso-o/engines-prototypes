extends Node3D
class_name IsoMap3D

const TERRAIN_COLORS := {
	"a": Color("284b7a"),
	"b": Color("274170"),
	"j": Color("123842"),
	"p": Color("1b5056"),
}

@export var tile_size := 2.0
@export var platform_thickness := 0.6
@export var level_height := 1.4

var tile_count := 0
var platform_count := 0
var ramp_count := 0
var map_width := 0
var map_height := 0
var map_center := Vector3.ZERO
var player_spawn_world := Vector3.ZERO

var _x_origin := 0.0
var _z_origin := 0.0
var _terrain_materials: Dictionary = {}
var _top_line_material: StandardMaterial3D
var _side_line_material: StandardMaterial3D
var _heights_grid: Array = []


func build_from_dir(map_dir: String) -> void:
	_clear_children()
	_ensure_materials()

	var terrain_grid := _read_token_grid("%s/terrain.txt" % map_dir)
	var heights_grid := _read_int_grid("%s/heights.txt" % map_dir)
	var ramps_grid := _read_token_grid("%s/ramps.txt" % map_dir)
	var meta_grid := _read_token_grid("%s/meta.txt" % map_dir)

	map_height = terrain_grid.size()
	map_width = terrain_grid[0].size()
	_heights_grid = heights_grid
	_x_origin = -((map_width - 1) * tile_size) * 0.5
	_z_origin = -((map_height - 1) * tile_size) * 0.5
	map_center = Vector3.ZERO

	tile_count = 0
	platform_count = 0
	ramp_count = 0
	player_spawn_world = Vector3.ZERO

	for row in range(map_height):
		for column in range(map_width):
			var terrain := str(terrain_grid[row][column])
			if terrain == "x":
				continue
			var tile_height := int(heights_grid[row][column])
			var ramp := str(ramps_grid[row][column])
			_build_tile(column, row, tile_height, terrain, ramp)
			if str(meta_grid[row][column]) == "P":
				player_spawn_world = _tile_world_center(column, row, tile_height) + Vector3(0.0, 0.05, 0.0)

	if player_spawn_world == Vector3.ZERO:
		player_spawn_world = _tile_world_center(0, 0, 0) + Vector3(0.0, 0.05, 0.0)


func _build_tile(cell_x: int, cell_y: int, tile_height: int, terrain: String, ramp: String) -> void:
	var node := StaticBody3D.new()
	node.name = "Tile_%d_%d" % [cell_x, cell_y]
	add_child(node)

	var center: Vector3 = _tile_world_center(cell_x, cell_y, tile_height)
	node.position = center + Vector3(0.0, -platform_thickness * 0.5, 0.0)

	var mesh_instance := MeshInstance3D.new()
	mesh_instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	node.add_child(mesh_instance)

	var collision_shape := CollisionShape3D.new()
	node.add_child(collision_shape)

	var top_color: Color = TERRAIN_COLORS.get(terrain, Color("1f3f52"))
	var base_material: StandardMaterial3D = _terrain_materials.get(terrain) as StandardMaterial3D
	if base_material == null:
		base_material = _make_base_material(top_color)
		_terrain_materials[terrain] = base_material

	if ramp != ".":
		var ramp_mesh := _build_ramp_mesh(ramp)
		mesh_instance.mesh = ramp_mesh
		mesh_instance.material_override = base_material
		collision_shape.shape = ramp_mesh.create_trimesh_shape()
		node.add_child(_build_ramp_lines(ramp))
		ramp_count += 1
	else:
		var box_mesh := BoxMesh.new()
		box_mesh.size = Vector3(tile_size, platform_thickness, tile_size)
		mesh_instance.mesh = box_mesh
		mesh_instance.material_override = base_material
		var box_shape := BoxShape3D.new()
		box_shape.size = box_mesh.size
		collision_shape.shape = box_shape
		node.add_child(_build_box_lines(box_mesh.size))

	tile_count += 1
	platform_count += 1


func _tile_world_center(cell_x: int, cell_y: int, tile_height: int) -> Vector3:
	return Vector3(
		_x_origin + (cell_x * tile_size),
		tile_height * level_height,
		_z_origin + (cell_y * tile_size)
	)


func world_for_cell(cell_x: int, cell_y: int, vertical_offset: float = 0.0) -> Vector3:
	var clamped_x := clampi(cell_x, 0, map_width - 1)
	var clamped_y := clampi(cell_y, 0, map_height - 1)
	var tile_height := int(_heights_grid[clamped_y][clamped_x])
	return _tile_world_center(clamped_x, clamped_y, tile_height) + Vector3(0.0, vertical_offset, 0.0)


func _read_token_grid(path: String) -> Array:
	var text := FileAccess.get_file_as_string(path)
	var rows: Array = []
	for raw_line in text.split("\n", false):
		var line := raw_line.strip_edges()
		if line.is_empty():
			continue
		rows.append(line.split(" ", false))
	return rows


func _read_int_grid(path: String) -> Array:
	var rows := _read_token_grid(path)
	var parsed: Array = []
	for row in rows:
		var values: Array = []
		for token in row:
			values.append(int(token))
		parsed.append(values)
	return parsed


func _clear_children() -> void:
	for child in get_children():
		child.free()


func _ensure_materials() -> void:
	if not _terrain_materials.is_empty():
		return
	for terrain in TERRAIN_COLORS.keys():
		_terrain_materials[terrain] = _make_base_material(TERRAIN_COLORS[terrain])
	_top_line_material = _make_line_material(Color("43d6ff"))
	_side_line_material = _make_line_material(Color("ff4bc6"))


func _make_base_material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.albedo_color = color
	material.emission_enabled = true
	material.emission = color.lightened(0.25)
	material.emission_energy_multiplier = 0.25
	return material


func _make_line_material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.albedo_color = color
	material.emission_enabled = true
	material.emission = color
	material.emission_energy_multiplier = 1.25
	material.no_depth_test = false
	return material


func _build_box_lines(size: Vector3) -> Node3D:
	var parent := Node3D.new()
	var half := size * 0.5
	var top_y := half.y + 0.01
	var bottom_y := -half.y - 0.01
	var corners_top := [
		Vector3(-half.x, top_y, -half.z),
		Vector3(half.x, top_y, -half.z),
		Vector3(half.x, top_y, half.z),
		Vector3(-half.x, top_y, half.z),
	]
	var corners_bottom := [
		Vector3(-half.x, bottom_y, -half.z),
		Vector3(half.x, bottom_y, -half.z),
		Vector3(half.x, bottom_y, half.z),
		Vector3(-half.x, bottom_y, half.z),
	]
	parent.add_child(_build_lines_from_segments(_loop_segments(corners_top), _top_line_material))
	parent.add_child(_build_lines_from_segments(_loop_segments(corners_bottom) + _vertical_segments(corners_top, corners_bottom), _side_line_material))
	return parent


func _build_ramp_lines(direction: String) -> Node3D:
	var parent := Node3D.new()
	var corners := _ramp_corners(direction)
	var top_segments := _loop_segments([
		corners["nw"],
		corners["ne"],
		corners["se"],
		corners["sw"],
	])
	var bottom_segments := _loop_segments([
		corners["bnw"],
		corners["bne"],
		corners["bse"],
		corners["bsw"],
	])
	var vertical_segments := [
		[corners["nw"], corners["bnw"]],
		[corners["ne"], corners["bne"]],
		[corners["se"], corners["bse"]],
		[corners["sw"], corners["bsw"]],
	]
	parent.add_child(_build_lines_from_segments(top_segments, _top_line_material))
	parent.add_child(_build_lines_from_segments(bottom_segments + vertical_segments, _side_line_material))
	return parent


func _build_lines_from_segments(segments: Array, material: StandardMaterial3D) -> MeshInstance3D:
	var immediate := ImmediateMesh.new()
	immediate.surface_begin(Mesh.PRIMITIVE_LINES, material)
	for segment in segments:
		immediate.surface_add_vertex(segment[0])
		immediate.surface_add_vertex(segment[1])
	immediate.surface_end()

	var lines := MeshInstance3D.new()
	lines.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	lines.mesh = immediate
	return lines


func _loop_segments(points: Array) -> Array:
	var segments: Array = []
	for index in range(points.size()):
		segments.append([points[index], points[(index + 1) % points.size()]])
	return segments


func _vertical_segments(top_points: Array, bottom_points: Array) -> Array:
	var segments: Array = []
	for index in range(top_points.size()):
		segments.append([top_points[index], bottom_points[index]])
	return segments


func _build_ramp_mesh(direction: String) -> ArrayMesh:
	var surface_tool := SurfaceTool.new()
	surface_tool.begin(Mesh.PRIMITIVE_TRIANGLES)

	var corners := _ramp_corners(direction)
	_add_quad(surface_tool, corners["nw"], corners["ne"], corners["se"], corners["sw"])
	_add_quad(surface_tool, corners["bsw"], corners["bse"], corners["bne"], corners["bnw"])
	_add_quad(surface_tool, corners["bnw"], corners["bne"], corners["ne"], corners["nw"])
	_add_quad(surface_tool, corners["bne"], corners["bse"], corners["se"], corners["ne"])
	_add_quad(surface_tool, corners["bse"], corners["bsw"], corners["sw"], corners["se"])
	_add_quad(surface_tool, corners["bsw"], corners["bnw"], corners["nw"], corners["sw"])

	surface_tool.generate_normals()
	return surface_tool.commit()


func _ramp_corners(direction: String) -> Dictionary:
	var half := tile_size * 0.5
	var bottom := -platform_thickness * 0.5
	var low_top := platform_thickness * 0.5
	var high_top := low_top + level_height

	var heights := {
		"nw": low_top,
		"ne": low_top,
		"se": low_top,
		"sw": low_top,
	}
	match direction:
		"N":
			heights["nw"] = high_top
			heights["ne"] = high_top
		"E":
			heights["ne"] = high_top
			heights["se"] = high_top
		"S":
			heights["se"] = high_top
			heights["sw"] = high_top
		"W":
			heights["sw"] = high_top
			heights["nw"] = high_top

	return {
		"nw": Vector3(-half, heights["nw"], -half),
		"ne": Vector3(half, heights["ne"], -half),
		"se": Vector3(half, heights["se"], half),
		"sw": Vector3(-half, heights["sw"], half),
		"bnw": Vector3(-half, bottom, -half),
		"bne": Vector3(half, bottom, -half),
		"bse": Vector3(half, bottom, half),
		"bsw": Vector3(-half, bottom, half),
	}


func _add_quad(surface_tool: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, d: Vector3) -> void:
	surface_tool.add_vertex(a)
	surface_tool.add_vertex(b)
	surface_tool.add_vertex(c)
	surface_tool.add_vertex(a)
	surface_tool.add_vertex(c)
	surface_tool.add_vertex(d)
