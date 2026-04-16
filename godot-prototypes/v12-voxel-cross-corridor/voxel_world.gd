extends Node3D

const MAP_PATH: String = "res://maps/cross_cube_map.txt"
const WORLD_Y_OFFSET: float = 0.02
const EMPTY_CHAR: String = "0"


class StartupProfiler:
	var phase_totals_usec: Dictionary = {}
	var phase_starts_usec: Dictionary = {}
	var values: Dictionary = {}

	func begin(name: String) -> void:
		phase_starts_usec[name] = Time.get_ticks_usec()

	func end(name: String) -> void:
		if not phase_starts_usec.has(name):
			return
		var start_usec: int = int(phase_starts_usec[name])
		var delta_usec: int = Time.get_ticks_usec() - start_usec
		phase_totals_usec[name] = int(phase_totals_usec.get(name, 0)) + delta_usec
		phase_starts_usec.erase(name)

	func add_duration(name: String, delta_usec: int) -> void:
		phase_totals_usec[name] = int(phase_totals_usec.get(name, 0)) + delta_usec

	func set_value(name: String, value: Variant) -> void:
		values[name] = value

	func add_count(name: String, amount: int = 1) -> void:
		values[name] = int(values.get(name, 0)) + amount

	func duration_ms(name: String) -> float:
		return float(int(phase_totals_usec.get(name, 0))) / 1000.0

	func value(name: String, default_value: Variant = null) -> Variant:
		return values.get(name, default_value)

const VOXEL_TYPES := {
	"0": {
		"solid": false,
		"material_key": ""
	},
	"1": {
		"solid": true,
		"material_key": "gray"
	},
	"G": {
		"solid": true,
		"material_key": "green"
	},
	"P": {
		"solid": true,
		"material_key": "purple"
	},
	"=": {
		"solid": true,
		"material_key": "metal"
	}
}

var _dimensions: Vector3i = Vector3i.ZERO
var _voxel_size: float = 0.1
var _voxels: PackedByteArray = PackedByteArray()
var _active_min: Vector3i = Vector3i.ZERO
var _active_max: Vector3i = Vector3i.ZERO
var _empty_row: String = ""
var _material_cache: Dictionary = {}
var _map_loaded: bool = false
var _profiler: StartupProfiler = StartupProfiler.new()


func _ready() -> void:
	_profiler.begin("level.total")
	position.y = WORLD_Y_OFFSET
	_load_map()
	if _map_loaded:
		_build_world()
	_profiler.end("level.total")
	_print_startup_report()


func _load_map() -> void:
	_profiler.begin("map.total")
	_profiler.begin("map.file_load")
	var file: FileAccess = FileAccess.open(MAP_PATH, FileAccess.READ)
	if file == null:
		push_error("Could not open voxel map: %s" % MAP_PATH)
		_profiler.end("map.file_load")
		_profiler.end("map.total")
		return

	var raw_lines: PackedStringArray = file.get_as_text().split("\n", false)
	var lines: Array[String] = []
	for raw_line: String in raw_lines:
		var line: String = raw_line.strip_edges()
		if line.is_empty() or line.begins_with("#"):
			continue
		lines.append(line)
	_profiler.end("map.file_load")

	if lines.size() < 2:
		push_error("Voxel map header missing in %s" % MAP_PATH)
		_profiler.end("map.total")
		return

	var size_parts: PackedStringArray = lines[0].split(" ", false)
	var voxel_parts: PackedStringArray = lines[1].split(" ", false)
	if size_parts.size() != 4 or size_parts[0] != "SIZE":
		push_error("Missing SIZE header in %s" % MAP_PATH)
		_profiler.end("map.total")
		return
	if voxel_parts.size() != 2 or voxel_parts[0] != "VOXEL":
		push_error("Missing VOXEL header in %s" % MAP_PATH)
		_profiler.end("map.total")
		return

	_dimensions = Vector3i(int(size_parts[1]), int(size_parts[2]), int(size_parts[3]))
	_voxel_size = float(voxel_parts[1])
	_profiler.set_value("grid.dimensions", _dimensions)
	_profiler.set_value("grid.voxel_size", _voxel_size)
	_profiler.set_value("grid.total_voxels", _dimensions.x * _dimensions.y * _dimensions.z)
	_empty_row = EMPTY_CHAR.repeat(_dimensions.x)
	_voxels.resize(_dimensions.x * _dimensions.y * _dimensions.z)
	_profiler.begin("map.grid_expansion")
	_fill_all_empty()

	var layer_written: PackedByteArray = PackedByteArray()
	layer_written.resize(_dimensions.y)

	_profiler.begin("map.parse_compact")
	var line_index: int = 2
	while line_index < lines.size():
		var line: String = lines[line_index]
		if line.begins_with("EMPTY_LAYERS "):
			if not _parse_empty_layers(line, layer_written):
				_profiler.end("map.parse_compact")
				_profiler.end("map.grid_expansion")
				_profiler.end("map.total")
				return
			line_index += 1
			continue
		if line.begins_with("LAYER "):
			line_index = _parse_layer_block(lines, line_index, layer_written)
			if line_index < 0:
				_profiler.end("map.parse_compact")
				_profiler.end("map.grid_expansion")
				_profiler.end("map.total")
				return
			continue
		push_error("Unexpected map directive: %s" % line)
		_profiler.end("map.parse_compact")
		_profiler.end("map.grid_expansion")
		_profiler.end("map.total")
		return
	_profiler.end("map.parse_compact")
	_profiler.end("map.grid_expansion")

	_profiler.begin("map.aux_structures")
	_recompute_active_bounds()
	_collect_grid_metrics()
	_profiler.end("map.aux_structures")
	_map_loaded = true
	_profiler.end("map.total")


func _parse_empty_layers(line: String, layer_written: PackedByteArray) -> bool:
	_profiler.add_count("map.empty_layer_directives")
	var parts: PackedStringArray = line.split(" ", false)
	if parts.size() != 3:
		push_error("Invalid EMPTY_LAYERS syntax: %s" % line)
		return false
	var first_layer: int = int(parts[1])
	var last_layer: int = int(parts[2])
	if first_layer < 0 or last_layer < first_layer or last_layer >= _dimensions.y:
		push_error("EMPTY_LAYERS out of range: %s" % line)
		return false
	for y: int in range(first_layer, last_layer + 1):
		if layer_written[y] == 1:
			push_error("Layer already defined before EMPTY_LAYERS: %d" % y)
			return false
		layer_written[y] = 1
	_profiler.add_count("map.empty_layers_from_directives", last_layer - first_layer + 1)
	return true


func _parse_layer_block(lines: Array[String], start_index: int, layer_written: PackedByteArray) -> int:
	_profiler.add_count("map.layer_blocks")
	var header: String = lines[start_index]
	var header_parts: PackedStringArray = header.split(" ", false)
	if header_parts.size() != 2 and header_parts.size() != 4:
		push_error("Invalid LAYER syntax: %s" % header)
		return -1
	if header_parts.size() == 4 and header_parts[2] != "REPEAT":
		push_error("Invalid LAYER REPEAT syntax: %s" % header)
		return -1

	var layer_start: int = int(header_parts[1])
	var repeat_count: int = 1 if header_parts.size() == 2 else int(header_parts[3])
	if layer_start < 0 or layer_start >= _dimensions.y or repeat_count <= 0 or layer_start + repeat_count > _dimensions.y:
		push_error("Layer range out of bounds: %s" % header)
		return -1

	var rows: Array[String] = []
	rows.resize(_dimensions.z)
	var row_written: PackedByteArray = PackedByteArray()
	row_written.resize(_dimensions.z)

	var line_index: int = start_index + 1
	while line_index < lines.size():
		var line: String = lines[line_index]
		if line.begins_with("LAYER ") or line.begins_with("EMPTY_LAYERS "):
			break
		if line.begins_with("EMPTY_ROWS "):
			var parts: PackedStringArray = line.split(" ", false)
			if parts.size() != 3:
				push_error("Invalid EMPTY_ROWS syntax: %s" % line)
				return -1
			var first_row: int = int(parts[1])
			var last_row: int = int(parts[2])
			if first_row < 0 or last_row < first_row or last_row >= _dimensions.z:
				push_error("EMPTY_ROWS out of range: %s" % line)
				return -1
			for z: int in range(first_row, last_row + 1):
				if row_written[z] == 1:
					push_error("Row already defined in layer %d: %d" % [layer_start, z])
					return -1
				rows[z] = _empty_row
				row_written[z] = 1
			line_index += 1
			continue
		if line.begins_with("ROW "):
			_profiler.add_count("map.row_directives")
			var parts: PackedStringArray = line.split(" ", false, 4)
			if parts.size() != 4:
				push_error("Invalid ROW syntax: %s" % line)
				return -1
			var row_index: int = int(parts[1])
			if row_index < 0 or row_index >= _dimensions.z:
				push_error("ROW out of range: %s" % line)
				return -1
			if row_written[row_index] == 1:
				push_error("Duplicate ROW in layer %d: %d" % [layer_start, row_index])
				return -1
			var row_value: String = ""
			if parts[2] == "RAW":
				row_value = parts[3]
				_profiler.add_count("map.raw_rows")
			elif parts[2] == "RLE":
				_profiler.begin("map.expand_rle")
				row_value = _expand_rle(parts[3])
				_profiler.end("map.expand_rle")
				_profiler.add_count("map.rle_rows")
			else:
				push_error("Unknown ROW encoding: %s" % line)
				return -1
			if row_value.length() != _dimensions.x:
				push_error("Expanded row length mismatch in layer %d row %d" % [layer_start, row_index])
				return -1
			rows[row_index] = row_value
			row_written[row_index] = 1
			line_index += 1
			continue
		push_error("Unexpected layer directive: %s" % line)
		return -1

	for z: int in range(_dimensions.z):
		if row_written[z] == 0:
			rows[z] = _empty_row

	var row_bytes: Array[PackedByteArray] = []
	row_bytes.resize(_dimensions.z)
	for z: int in range(_dimensions.z):
		row_bytes[z] = rows[z].to_ascii_buffer()

	for repeat_step: int in range(repeat_count):
		var y: int = layer_start + repeat_step
		if layer_written[y] == 1:
			push_error("Layer defined more than once: %d" % y)
			return -1
		layer_written[y] = 1
		_profiler.add_count("map.layers_written")
		for z: int in range(_dimensions.z):
			var buffer: PackedByteArray = row_bytes[z]
			_profiler.begin("map.write_grid")
			for x: int in range(_dimensions.x):
				_set_voxel_byte(x, y, z, buffer[x])
			_profiler.end("map.write_grid")

	return line_index


func _expand_rle(rle_text: String) -> String:
	var result: String = ""
	var runs: PackedStringArray = rle_text.split(",", false)
	for run: String in runs:
		var parts: PackedStringArray = run.strip_edges().split(":", false)
		if parts.size() != 2:
			return ""
		var count: int = int(parts[0])
		var value: String = parts[1]
		if count < 0 or value.length() != 1:
			return ""
		result += value.repeat(count)
	return result


func _fill_all_empty() -> void:
	var empty_byte: int = EMPTY_CHAR.unicode_at(0)
	for index: int in range(_voxels.size()):
		_voxels[index] = empty_byte


func _recompute_active_bounds() -> void:
	var empty_byte: int = EMPTY_CHAR.unicode_at(0)
	var min_x: int = _dimensions.x
	var min_y: int = _dimensions.y
	var min_z: int = _dimensions.z
	var max_x: int = -1
	var max_y: int = -1
	var max_z: int = -1

	for y: int in range(_dimensions.y):
		for z: int in range(_dimensions.z):
			for x: int in range(_dimensions.x):
				if _voxels[voxel_index(x, y, z)] == empty_byte:
					continue
				min_x = mini(min_x, x)
				min_y = mini(min_y, y)
				min_z = mini(min_z, z)
				max_x = maxi(max_x, x + 1)
				max_y = maxi(max_y, y + 1)
				max_z = maxi(max_z, z + 1)

	if max_x < 0:
		_active_min = Vector3i.ZERO
		_active_max = Vector3i.ZERO
	else:
		_active_min = Vector3i(min_x, min_y, min_z)
		_active_max = Vector3i(max_x, max_y, max_z)


func _collect_grid_metrics() -> void:
	var empty_char: String = EMPTY_CHAR
	var total_voxels: int = _dimensions.x * _dimensions.y * _dimensions.z
	var empty_voxels: int = 0
	var solid_voxels: int = 0
	var char_counts: Dictionary = {}
	var empty_layers: int = 0

	for y: int in range(_dimensions.y):
		var layer_has_solid: bool = false
		for z: int in range(_dimensions.z):
			for x: int in range(_dimensions.x):
				var c: String = char(_voxels[voxel_index(x, y, z)])
				char_counts[c] = int(char_counts.get(c, 0)) + 1
				if c == empty_char:
					empty_voxels += 1
				else:
					solid_voxels += 1
					layer_has_solid = true
		if not layer_has_solid:
			empty_layers += 1

	_profiler.set_value("grid.total_voxels", total_voxels)
	_profiler.set_value("grid.empty_voxels", empty_voxels)
	_profiler.set_value("grid.solid_voxels", solid_voxels)
	_profiler.set_value("grid.empty_layers", empty_layers)
	_profiler.set_value("grid.char_counts", char_counts)


func _build_world() -> void:
	_profiler.begin("world.build_total")
	var world_body: StaticBody3D = StaticBody3D.new()
	world_body.name = "VoxelWorld"
	add_child(world_body)

	var mesh_instance: MeshInstance3D = MeshInstance3D.new()
	mesh_instance.name = "MeshInstance3D"
	mesh_instance.mesh = _build_mesh()
	world_body.add_child(mesh_instance)

	_build_collision(world_body)
	_profiler.end("world.build_total")


func _build_mesh() -> ArrayMesh:
	_profiler.begin("mesh.total")
	var surface_builders: Dictionary = {}

	_profiler.begin("mesh.visible_face_generation")
	_append_x_faces(surface_builders)
	_append_y_faces(surface_builders)
	_append_z_faces(surface_builders)
	_profiler.end("mesh.visible_face_generation")

	_profiler.begin("mesh.array_assembly")
	var mesh: ArrayMesh = ArrayMesh.new()
	var material_keys: Array = surface_builders.keys()
	material_keys.sort()
	for material_key: String in material_keys:
		var builder: Dictionary = surface_builders[material_key]
		if builder["vertices"].is_empty():
			continue
		var arrays: Array = []
		arrays.resize(Mesh.ARRAY_MAX)
		arrays[Mesh.ARRAY_VERTEX] = builder["vertices"]
		arrays[Mesh.ARRAY_NORMAL] = builder["normals"]
		arrays[Mesh.ARRAY_TEX_UV] = builder["uvs"]
		arrays[Mesh.ARRAY_INDEX] = builder["indices"]
		_profiler.begin("mesh.arraymesh_creation")
		mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
		_profiler.end("mesh.arraymesh_creation")
		_profiler.begin("mesh.material_assignment")
		mesh.surface_set_material(mesh.get_surface_count() - 1, build_material(material_key))
		_profiler.end("mesh.material_assignment")
		_profiler.add_count("mesh.surfaces_generated")
	_profiler.end("mesh.array_assembly")
	_profiler.end("mesh.total")
	return mesh


func _append_x_faces(surface_builders: Dictionary) -> void:
	for plane_x: int in range(_active_min.x, _active_max.x + 1):
		var positive_mask: Array = _build_key_mask(_active_max.y - _active_min.y, _active_max.z - _active_min.z)
		var negative_mask: Array = _build_key_mask(_active_max.y - _active_min.y, _active_max.z - _active_min.z)
		for y: int in range(_active_min.y, _active_max.y):
			for z: int in range(_active_min.z, _active_max.z):
				var left_solid: bool = is_solid(plane_x - 1, y, z)
				var right_solid: bool = is_solid(plane_x, y, z)
				if left_solid and not right_solid:
					positive_mask[y - _active_min.y][z - _active_min.z] = material_key_for(plane_x - 1, y, z)
					_profiler.add_count("mesh.visible_faces_before_fusion")
				elif right_solid and not left_solid:
					negative_mask[y - _active_min.y][z - _active_min.z] = material_key_for(plane_x, y, z)
					_profiler.add_count("mesh.visible_faces_before_fusion")
		_emit_x_mask(surface_builders, plane_x, positive_mask, true)
		_emit_x_mask(surface_builders, plane_x, negative_mask, false)


func _append_y_faces(surface_builders: Dictionary) -> void:
	for plane_y: int in range(_active_min.y, _active_max.y + 1):
		var positive_mask: Array = _build_key_mask(_active_max.x - _active_min.x, _active_max.z - _active_min.z)
		var negative_mask: Array = _build_key_mask(_active_max.x - _active_min.x, _active_max.z - _active_min.z)
		for x: int in range(_active_min.x, _active_max.x):
			for z: int in range(_active_min.z, _active_max.z):
				var below_solid: bool = is_solid(x, plane_y - 1, z)
				var above_solid: bool = is_solid(x, plane_y, z)
				if below_solid and not above_solid:
					positive_mask[x - _active_min.x][z - _active_min.z] = material_key_for(x, plane_y - 1, z)
					_profiler.add_count("mesh.visible_faces_before_fusion")
				elif above_solid and not below_solid:
					negative_mask[x - _active_min.x][z - _active_min.z] = material_key_for(x, plane_y, z)
					_profiler.add_count("mesh.visible_faces_before_fusion")
		_emit_y_mask(surface_builders, plane_y, positive_mask, true)
		_emit_y_mask(surface_builders, plane_y, negative_mask, false)


func _append_z_faces(surface_builders: Dictionary) -> void:
	for plane_z: int in range(_active_min.z, _active_max.z + 1):
		var positive_mask: Array = _build_key_mask(_active_max.x - _active_min.x, _active_max.y - _active_min.y)
		var negative_mask: Array = _build_key_mask(_active_max.x - _active_min.x, _active_max.y - _active_min.y)
		for x: int in range(_active_min.x, _active_max.x):
			for y: int in range(_active_min.y, _active_max.y):
				var back_solid: bool = is_solid(x, y, plane_z - 1)
				var front_solid: bool = is_solid(x, y, plane_z)
				if back_solid and not front_solid:
					positive_mask[x - _active_min.x][y - _active_min.y] = material_key_for(x, y, plane_z - 1)
					_profiler.add_count("mesh.visible_faces_before_fusion")
				elif front_solid and not back_solid:
					negative_mask[x - _active_min.x][y - _active_min.y] = material_key_for(x, y, plane_z)
					_profiler.add_count("mesh.visible_faces_before_fusion")
		_emit_z_mask(surface_builders, plane_z, positive_mask, true)
		_emit_z_mask(surface_builders, plane_z, negative_mask, false)


func _emit_x_mask(surface_builders: Dictionary, plane_x: int, mask: Array, positive: bool) -> void:
	for rect_info: Dictionary in _extract_key_rectangles(mask):
		var rect: Rect2i = rect_info["rect"]
		var material_key: String = rect_info["material_key"]
		var y0: int = _active_min.y + rect.position.x
		var z0: int = _active_min.z + rect.position.y
		var y1: int = y0 + rect.size.x
		var z1: int = z0 + rect.size.y
		var xw: float = _grid_x(plane_x)
		if positive:
			_append_quad_to_material(surface_builders, material_key, Vector3(xw, _grid_y(y0), _grid_z(z0)), Vector3(xw, _grid_y(y1), _grid_z(z0)), Vector3(xw, _grid_y(y1), _grid_z(z1)), Vector3(xw, _grid_y(y0), _grid_z(z1)), Vector3.RIGHT)
		else:
			_append_quad_to_material(surface_builders, material_key, Vector3(xw, _grid_y(y0), _grid_z(z1)), Vector3(xw, _grid_y(y1), _grid_z(z1)), Vector3(xw, _grid_y(y1), _grid_z(z0)), Vector3(xw, _grid_y(y0), _grid_z(z0)), Vector3.LEFT)


func _emit_y_mask(surface_builders: Dictionary, plane_y: int, mask: Array, positive: bool) -> void:
	for rect_info: Dictionary in _extract_key_rectangles(mask):
		var rect: Rect2i = rect_info["rect"]
		var material_key: String = rect_info["material_key"]
		var x0: int = _active_min.x + rect.position.x
		var z0: int = _active_min.z + rect.position.y
		var x1: int = x0 + rect.size.x
		var z1: int = z0 + rect.size.y
		var yw: float = _grid_y(plane_y)
		if positive:
			_append_quad_to_material(surface_builders, material_key, Vector3(_grid_x(x0), yw, _grid_z(z1)), Vector3(_grid_x(x1), yw, _grid_z(z1)), Vector3(_grid_x(x1), yw, _grid_z(z0)), Vector3(_grid_x(x0), yw, _grid_z(z0)), Vector3.UP)
		else:
			_append_quad_to_material(surface_builders, material_key, Vector3(_grid_x(x0), yw, _grid_z(z0)), Vector3(_grid_x(x1), yw, _grid_z(z0)), Vector3(_grid_x(x1), yw, _grid_z(z1)), Vector3(_grid_x(x0), yw, _grid_z(z1)), Vector3.DOWN)


func _emit_z_mask(surface_builders: Dictionary, plane_z: int, mask: Array, positive: bool) -> void:
	for rect_info: Dictionary in _extract_key_rectangles(mask):
		var rect: Rect2i = rect_info["rect"]
		var material_key: String = rect_info["material_key"]
		var x0: int = _active_min.x + rect.position.x
		var y0: int = _active_min.y + rect.position.y
		var x1: int = x0 + rect.size.x
		var y1: int = y0 + rect.size.y
		var zw: float = _grid_z(plane_z)
		if positive:
			_append_quad_to_material(surface_builders, material_key, Vector3(_grid_x(x0), _grid_y(y0), zw), Vector3(_grid_x(x1), _grid_y(y0), zw), Vector3(_grid_x(x1), _grid_y(y1), zw), Vector3(_grid_x(x0), _grid_y(y1), zw), Vector3.FORWARD)
		else:
			_append_quad_to_material(surface_builders, material_key, Vector3(_grid_x(x0), _grid_y(y1), zw), Vector3(_grid_x(x1), _grid_y(y1), zw), Vector3(_grid_x(x1), _grid_y(y0), zw), Vector3(_grid_x(x0), _grid_y(y0), zw), Vector3.BACK)


func _append_quad_to_material(surface_builders: Dictionary, material_key: String, a: Vector3, b: Vector3, c: Vector3, d: Vector3, normal: Vector3) -> void:
	if material_key.is_empty():
		return
	var quad_start_usec: int = Time.get_ticks_usec()
	var builder: Dictionary = _ensure_surface_builder(surface_builders, material_key)
	var vertices: PackedVector3Array = builder["vertices"]
	var normals: PackedVector3Array = builder["normals"]
	var uvs: PackedVector2Array = builder["uvs"]
	var indices: PackedInt32Array = builder["indices"]
	var base: int = vertices.size()
	vertices.push_back(a)
	vertices.push_back(b)
	vertices.push_back(c)
	vertices.push_back(d)
	normals.push_back(normal)
	normals.push_back(normal)
	normals.push_back(normal)
	normals.push_back(normal)
	var u_len: float = a.distance_to(b)
	var v_len: float = a.distance_to(d)
	uvs.push_back(Vector2(0.0, 0.0))
	uvs.push_back(Vector2(u_len, 0.0))
	uvs.push_back(Vector2(u_len, v_len))
	uvs.push_back(Vector2(0.0, v_len))
	indices.push_back(base)
	indices.push_back(base + 2)
	indices.push_back(base + 1)
	indices.push_back(base)
	indices.push_back(base + 3)
	indices.push_back(base + 2)
	builder["vertices"] = vertices
	builder["normals"] = normals
	builder["uvs"] = uvs
	builder["indices"] = indices
	surface_builders[material_key] = builder
	_profiler.add_duration("mesh.bucket_writes", Time.get_ticks_usec() - quad_start_usec)
	_profiler.add_count("mesh.final_quads")
	_profiler.add_count("mesh.final_triangles", 2)


func _ensure_surface_builder(surface_builders: Dictionary, material_key: String) -> Dictionary:
	if not surface_builders.has(material_key):
		surface_builders[material_key] = {
			"vertices": PackedVector3Array(),
			"normals": PackedVector3Array(),
			"uvs": PackedVector2Array(),
			"indices": PackedInt32Array()
		}
	return surface_builders[material_key]


func build_material(material_key: String) -> Material:
	if _material_cache.has(material_key):
		return _material_cache[material_key]
	var material: StandardMaterial3D = StandardMaterial3D.new()
	material.roughness = 1.0
	match material_key:
		"gray":
			material.albedo_color = Color("868b92")
		"green":
			material.albedo_color = Color("6f9571")
		"purple":
			material.albedo_color = Color("866d95")
		"metal":
			material.albedo_color = Color("a8a39a")
			material.metallic = 0.65
			material.roughness = 0.35
		_:
			material.albedo_color = Color("ff00ff")
	_material_cache[material_key] = material
	return material


func _build_collision(world_body: StaticBody3D) -> void:
	_profiler.begin("collision.total")
	var active_size: Vector3i = _active_max - _active_min
	var visited: PackedByteArray = PackedByteArray()
	visited.resize(active_size.x * active_size.y * active_size.z)

	_profiler.begin("collision.scan_and_merge")
	for y: int in range(_active_min.y, _active_max.y):
		for z: int in range(_active_min.z, _active_max.z):
			for x: int in range(_active_min.x, _active_max.x):
				if not is_solid(x, y, z):
					continue
				var local_index: int = _active_index(x, y, z)
				if visited[local_index] == 1:
					continue

				var width: int = 1
				while x + width < _active_max.x and _can_expand_x(x, y, z, width, visited):
					width += 1

				var depth: int = 1
				while z + depth < _active_max.z and _can_expand_z(x, y, z, width, depth, visited):
					depth += 1

				var height: int = 1
				while y + height < _active_max.y and _can_expand_y(x, y, z, width, depth, height, visited):
					height += 1

				for dy: int in range(height):
					for dz: int in range(depth):
						for dx: int in range(width):
							visited[_active_index(x + dx, y + dy, z + dz)] = 1

				_profiler.end("collision.scan_and_merge")
				_profiler.begin("collision.shape_creation")
				var collision: CollisionShape3D = CollisionShape3D.new()
				collision.name = "Collision_%d_%d_%d" % [x, y, z]
				var shape: BoxShape3D = BoxShape3D.new()
				shape.size = Vector3(float(width) * _voxel_size, float(height) * _voxel_size, float(depth) * _voxel_size)
				collision.shape = shape
				collision.position = Vector3(
					_grid_x(x) + (shape.size.x * 0.5),
					_grid_y(y) + (shape.size.y * 0.5),
					_grid_z(z) + (shape.size.z * 0.5)
				)
				world_body.add_child(collision)
				_profiler.end("collision.shape_creation")
				_profiler.add_count("collision.boxes")
				_profiler.add_count("collision.shapes_created")
				_profiler.begin("collision.scan_and_merge")
	_profiler.end("collision.scan_and_merge")
	_profiler.end("collision.total")


func _can_expand_x(x: int, y: int, z: int, width: int, visited: PackedByteArray) -> bool:
	return is_solid(x + width, y, z) and visited[_active_index(x + width, y, z)] == 0


func _can_expand_z(x: int, y: int, z: int, width: int, depth: int, visited: PackedByteArray) -> bool:
	for dx: int in range(width):
		if not is_solid(x + dx, y, z + depth) or visited[_active_index(x + dx, y, z + depth)] == 1:
			return false
	return true


func _can_expand_y(x: int, y: int, z: int, width: int, depth: int, height: int, visited: PackedByteArray) -> bool:
	for dz: int in range(depth):
		for dx: int in range(width):
			if not is_solid(x + dx, y + height, z + dz) or visited[_active_index(x + dx, y + height, z + dz)] == 1:
				return false
	return true


func _build_key_mask(width: int, height: int) -> Array:
	var mask: Array = []
	mask.resize(width)
	for u: int in range(width):
		var row: Array = []
		row.resize(height)
		for v: int in range(height):
			row[v] = ""
		mask[u] = row
	return mask


func _extract_key_rectangles(mask: Array) -> Array[Dictionary]:
	var start_usec: int = Time.get_ticks_usec()
	var rectangles: Array[Dictionary] = []
	for u: int in range(mask.size()):
		var row: Array = mask[u]
		for v: int in range(row.size()):
			var material_key: String = row[v]
			if material_key.is_empty():
				continue
			var width: int = 1
			while v + width < row.size() and mask[u][v + width] == material_key:
				width += 1
			var height: int = 1
			var can_grow: bool = true
			while u + height < mask.size() and can_grow:
				for step: int in range(width):
					if mask[u + height][v + step] != material_key:
						can_grow = false
						break
				if can_grow:
					height += 1
			for clear_u: int in range(height):
				for clear_v: int in range(width):
					mask[u + clear_u][v + clear_v] = ""
			rectangles.append({
				"rect": Rect2i(Vector2i(u, v), Vector2i(height, width)),
				"material_key": material_key
			})
	_profiler.add_duration("mesh.face_fusion", Time.get_ticks_usec() - start_usec)
	return rectangles


func _grid_x(x: int) -> float:
	return (float(x) - (float(_dimensions.x) * 0.5)) * _voxel_size


func _grid_y(y: int) -> float:
	return float(y) * _voxel_size


func _grid_z(z: int) -> float:
	return (float(z) - (float(_dimensions.z) * 0.5)) * _voxel_size


func voxel_index(x: int, y: int, z: int) -> int:
	return x + (z * _dimensions.x) + (y * _dimensions.x * _dimensions.z)


func is_in_bounds(x: int, y: int, z: int) -> bool:
	return x >= 0 and y >= 0 and z >= 0 and x < _dimensions.x and y < _dimensions.y and z < _dimensions.z


func voxel_char(x: int, y: int, z: int) -> String:
	if not is_in_bounds(x, y, z):
		return EMPTY_CHAR
	return char(_voxels[voxel_index(x, y, z)])


func set_voxel_char(x: int, y: int, z: int, c: String) -> void:
	if not is_in_bounds(x, y, z):
		return
	_set_voxel_byte(x, y, z, c.unicode_at(0))


func voxel_type_for_char(c: String) -> Dictionary:
	if VOXEL_TYPES.has(c):
		return VOXEL_TYPES[c]
	return VOXEL_TYPES[EMPTY_CHAR]


func is_solid(x: int, y: int, z: int) -> bool:
	return voxel_type_for_char(voxel_char(x, y, z)).get("solid", false)


func material_key_for(x: int, y: int, z: int) -> String:
	return voxel_type_for_char(voxel_char(x, y, z)).get("material_key", "")


func _active_index(x: int, y: int, z: int) -> int:
	var size: Vector3i = _active_max - _active_min
	var lx: int = x - _active_min.x
	var ly: int = y - _active_min.y
	var lz: int = z - _active_min.z
	return lx + (lz * size.x) + (ly * size.x * size.z)


func _print_startup_report() -> void:
	var dimensions: Vector3i = _profiler.value("grid.dimensions", Vector3i.ZERO)
	var char_counts: Dictionary = _profiler.value("grid.char_counts", {})
	var char_keys: Array = char_counts.keys()
	char_keys.sort()
	var char_lines: Array[String] = []
	for key: String in char_keys:
		char_lines.append("  %s => %d" % [key, int(char_counts[key])])

	var report: Array[String] = []
	report.append("")
	report.append("=== V12 Startup Profile ===")
	report.append("Grid")
	report.append("  dimensions: %d x %d x %d" % [dimensions.x, dimensions.y, dimensions.z])
	report.append("  voxel_size: %.3f" % float(_profiler.value("grid.voxel_size", 0.0)))
	report.append("  total_voxels: %d" % int(_profiler.value("grid.total_voxels", 0)))
	report.append("  solid_voxels: %d" % int(_profiler.value("grid.solid_voxels", 0)))
	report.append("  empty_voxels: %d" % int(_profiler.value("grid.empty_voxels", 0)))
	report.append("  empty_layers: %d" % int(_profiler.value("grid.empty_layers", 0)))
	report.append("  distinct_chars: %d" % char_keys.size())
	if not char_lines.is_empty():
		report.append("  char_counts:")
		for line: String in char_lines:
			report.append(line)

	report.append("Phases")
	report.append(_phase_line("  file load", "map.file_load"))
	report.append(_phase_line("  parse compact format", "map.parse_compact"))
	report.append(_phase_line("  expand grid in memory", "map.grid_expansion"))
	report.append(_phase_line("  auxiliary structures", "map.aux_structures"))
	report.append(_phase_line("  visible face generation", "mesh.visible_face_generation"))
	report.append(_phase_line("  face fusion", "mesh.face_fusion"))
	report.append(_phase_line("  mesh bucket writes", "mesh.bucket_writes"))
	report.append(_phase_line("  mesh array assembly", "mesh.array_assembly"))
	report.append(_phase_line("  ArrayMesh creation", "mesh.arraymesh_creation"))
	report.append(_phase_line("  material assignment", "mesh.material_assignment"))
	report.append(_phase_line("  collision generation", "collision.total"))
	report.append(_phase_line("  collision scan/merge", "collision.scan_and_merge"))
	report.append(_phase_line("  collision shape creation", "collision.shape_creation"))
	report.append(_phase_line("  level total", "level.total"))

	report.append("Parser Subphases")
	report.append(_phase_line("  RLE expansion", "map.expand_rle"))
	report.append(_phase_line("  grid writes", "map.write_grid"))
	report.append("  layer blocks: %d" % int(_profiler.value("map.layer_blocks", 0)))
	report.append("  row directives: %d" % int(_profiler.value("map.row_directives", 0)))
	report.append("  raw rows: %d" % int(_profiler.value("map.raw_rows", 0)))
	report.append("  rle rows: %d" % int(_profiler.value("map.rle_rows", 0)))
	report.append("  empty layer directives: %d" % int(_profiler.value("map.empty_layer_directives", 0)))
	report.append("  empty layers from directives: %d" % int(_profiler.value("map.empty_layers_from_directives", 0)))

	report.append("Mesh")
	report.append("  visible_faces_before_fusion: %d" % int(_profiler.value("mesh.visible_faces_before_fusion", 0)))
	report.append("  final_quads: %d" % int(_profiler.value("mesh.final_quads", 0)))
	report.append("  final_triangles: %d" % int(_profiler.value("mesh.final_triangles", 0)))
	report.append("  surfaces_generated: %d" % int(_profiler.value("mesh.surfaces_generated", 0)))

	report.append("Collision")
	report.append("  collision_boxes: %d" % int(_profiler.value("collision.boxes", 0)))
	report.append("  collision_shapes_created: %d" % int(_profiler.value("collision.shapes_created", 0)))

	report.append("Top Hotspots")
	for hotspot: String in _top_hotspots():
		report.append(hotspot)

	print("\n".join(report))


func _phase_line(label: String, phase_name: String) -> String:
	return "%s: %.3f ms" % [label, _profiler.duration_ms(phase_name)]


func _top_hotspots() -> Array[String]:
	var hotspot_names: Array[String] = [
		"map.file_load",
		"map.parse_compact",
		"map.grid_expansion",
		"map.aux_structures",
		"mesh.visible_face_generation",
		"mesh.face_fusion",
		"mesh.bucket_writes",
		"mesh.array_assembly",
		"mesh.arraymesh_creation",
		"mesh.material_assignment",
		"collision.total",
		"collision.scan_and_merge",
		"collision.shape_creation"
	]
	var hotspot_entries: Array[Dictionary] = []
	for name: String in hotspot_names:
		hotspot_entries.append({
			"name": name,
			"ms": _profiler.duration_ms(name)
		})
	hotspot_entries.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return float(a["ms"]) > float(b["ms"]))
	var lines: Array[String] = []
	for index: int in range(mini(5, hotspot_entries.size())):
		var entry: Dictionary = hotspot_entries[index]
		lines.append("  %d. %s -> %.3f ms" % [index + 1, String(entry["name"]), float(entry["ms"])])
	return lines


func _set_voxel_byte(x: int, y: int, z: int, value: int) -> void:
	_voxels[voxel_index(x, y, z)] = value
