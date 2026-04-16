extends Node3D

@export_file("*.json") var runtime_path: String = "res://data/runtime_world.json"

var _material_cache: Dictionary = {}
var _dimensions: Vector3i = Vector3i.ZERO
var _voxel_size: float = 0.1
var _world_y_offset: float = 0.02


func _ready() -> void:
	var file: FileAccess = FileAccess.open(runtime_path, FileAccess.READ)
	if file == null:
		push_error("Missing runtime artifact: %s" % runtime_path)
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("Invalid runtime artifact JSON: %s" % runtime_path)
		return
	var data: Dictionary = parsed
	var dims: Array = data.get("dimensions", [0, 0, 0])
	_dimensions = Vector3i(int(dims[0]), int(dims[1]), int(dims[2]))
	_voxel_size = float(data.get("voxel_size", 0.1))
	_world_y_offset = float(data.get("world_y_offset", 0.02))
	position.y = _world_y_offset
	_build_world(data)


func _build_world(data: Dictionary) -> void:
	var world_body: StaticBody3D = StaticBody3D.new()
	world_body.name = "RuntimeWorld"
	add_child(world_body)

	var mesh_instance: MeshInstance3D = MeshInstance3D.new()
	mesh_instance.name = "MeshInstance3D"
	mesh_instance.mesh = _build_mesh(data)
	world_body.add_child(mesh_instance)

	_build_collision(world_body, data.get("collision_boxes", []))


func _build_mesh(data: Dictionary) -> ArrayMesh:
	var mesh: ArrayMesh = ArrayMesh.new()
	var materials: Array = data.get("materials", [])
	var quads_by_material: Dictionary = data.get("quads", {})
	var triangles_by_material: Dictionary = data.get("triangles", {})
	for material_key_variant: Variant in materials:
		var material_key: String = str(material_key_variant)
		var quad_list: Array = quads_by_material.get(material_key, [])
		var triangle_list: Array = triangles_by_material.get(material_key, [])
		if quad_list.is_empty() and triangle_list.is_empty():
			continue
		var vertices: PackedVector3Array = PackedVector3Array()
		var normals: PackedVector3Array = PackedVector3Array()
		var uvs: PackedVector2Array = PackedVector2Array()
		var indices: PackedInt32Array = PackedInt32Array()
		for quad_variant: Variant in quad_list:
			_append_runtime_quad(vertices, normals, uvs, indices, quad_variant)
		for triangle_variant: Variant in triangle_list:
			_append_runtime_triangle(vertices, normals, uvs, indices, triangle_variant)
		var arrays: Array = []
		arrays.resize(Mesh.ARRAY_MAX)
		arrays[Mesh.ARRAY_VERTEX] = vertices
		arrays[Mesh.ARRAY_NORMAL] = normals
		arrays[Mesh.ARRAY_TEX_UV] = uvs
		arrays[Mesh.ARRAY_INDEX] = indices
		mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
		mesh.surface_set_material(mesh.get_surface_count() - 1, _build_material(material_key))
	return mesh


func _append_runtime_quad(vertices: PackedVector3Array, normals: PackedVector3Array, uvs: PackedVector2Array, indices: PackedInt32Array, quad_variant: Variant) -> void:
	var quad: Array = quad_variant
	var origin: Vector3 = _point_from_array(quad, 0)
	var u_axis: Vector3 = Vector3(float(quad[3]), float(quad[4]), float(quad[5])) * _voxel_size
	var v_axis: Vector3 = Vector3(float(quad[6]), float(quad[7]), float(quad[8])) * _voxel_size
	var normal: Vector3 = Vector3(float(quad[9]), float(quad[10]), float(quad[11]))
	var a: Vector3 = origin
	var b: Vector3 = origin + u_axis
	var d: Vector3 = origin + v_axis
	var c: Vector3 = origin + u_axis + v_axis
	var base: int = vertices.size()
	vertices.push_back(a)
	vertices.push_back(b)
	vertices.push_back(c)
	vertices.push_back(d)
	normals.push_back(normal)
	normals.push_back(normal)
	normals.push_back(normal)
	normals.push_back(normal)
	var u_len: float = u_axis.length()
	var v_len: float = v_axis.length()
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


func _append_runtime_triangle(vertices: PackedVector3Array, normals: PackedVector3Array, uvs: PackedVector2Array, indices: PackedInt32Array, triangle_variant: Variant) -> void:
	var triangle: Array = triangle_variant
	var a: Vector3 = _point_from_array(triangle, 0)
	var b: Vector3 = _point_from_array(triangle, 3)
	var c: Vector3 = _point_from_array(triangle, 6)
	var normal: Vector3 = Vector3(float(triangle[9]), float(triangle[10]), float(triangle[11]))
	var base: int = vertices.size()
	vertices.push_back(a)
	vertices.push_back(b)
	vertices.push_back(c)
	normals.push_back(normal)
	normals.push_back(normal)
	normals.push_back(normal)
	uvs.push_back(Vector2(0.0, 0.0))
	uvs.push_back(Vector2(a.distance_to(b), 0.0))
	uvs.push_back(Vector2(a.distance_to(c), a.distance_to(c)))
	indices.push_back(base)
	indices.push_back(base + 1)
	indices.push_back(base + 2)


func _build_collision(world_body: StaticBody3D, boxes: Array) -> void:
	for box_variant: Variant in boxes:
		var box: Array = box_variant
		var collision: CollisionShape3D = CollisionShape3D.new()
		collision.name = "Collision"
		var shape: BoxShape3D = BoxShape3D.new()
		shape.size = Vector3(float(box[3]) * _voxel_size, float(box[4]) * _voxel_size, float(box[5]) * _voxel_size)
		collision.shape = shape
		collision.position = Vector3(
			_grid_x(float(box[0])) + (shape.size.x * 0.5),
			_grid_y(float(box[1])) + (shape.size.y * 0.5),
			_grid_z(float(box[2])) + (shape.size.z * 0.5)
		)
		world_body.add_child(collision)


func _build_material(material_key: String) -> Material:
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


func _point_from_array(values: Array, offset: int) -> Vector3:
	return Vector3(
		_grid_x(float(values[offset])),
		_grid_y(float(values[offset + 1])),
		_grid_z(float(values[offset + 2]))
	)


func _grid_x(x: float) -> float:
	return (x - (float(_dimensions.x) * 0.5)) * _voxel_size


func _grid_y(y: float) -> float:
	return y * _voxel_size


func _grid_z(z: float) -> float:
	return (z - (float(_dimensions.z) * 0.5)) * _voxel_size
