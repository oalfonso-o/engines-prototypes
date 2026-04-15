extends RefCounted
class_name FpsArenaBuilder

const MapLoaderScript := preload("res://runtime/map_loader.gd")


func build(owner: Node3D, layout: MapLoaderScript.MapLayout, wall_height: float, cover_height: float) -> void:
	var floor: StaticBody3D = _build_floor(layout)
	floor.name = "Floor"
	owner.add_child(floor)

	for wall_tile: Vector2i in layout.wall_tiles:
		var wall: StaticBody3D = _build_block(
			MapLoaderScript._cell_to_world(wall_tile, layout.grid_size) + Vector3(0.0, wall_height * 0.5, 0.0),
			Vector3(MapLoaderScript.TILE_SIZE, wall_height, MapLoaderScript.TILE_SIZE),
			Color("6d7480")
		)
		wall.name = "Wall_%d_%d" % [wall_tile.x, wall_tile.y]
		owner.add_child(wall)

	for cover_tile: Vector2i in layout.cover_tiles:
		var cover: StaticBody3D = _build_block(
			MapLoaderScript._cell_to_world(cover_tile, layout.grid_size) + Vector3(0.0, cover_height * 0.5, 0.0),
			Vector3(MapLoaderScript.TILE_SIZE, cover_height, MapLoaderScript.TILE_SIZE),
			Color("7d6656")
		)
		cover.name = "Cover_%d_%d" % [cover_tile.x, cover_tile.y]
		owner.add_child(cover)


func _build_floor(layout: MapLoaderScript.MapLayout) -> StaticBody3D:
	var floor_size := Vector3(
		float(layout.grid_size.x) * MapLoaderScript.TILE_SIZE,
		1.0,
		float(layout.grid_size.y) * MapLoaderScript.TILE_SIZE
	)
	return _build_block(Vector3(0.0, -0.5, 0.0), floor_size, Color("39443b"))


func _build_block(position_value: Vector3, size: Vector3, color: Color) -> StaticBody3D:
	var body := StaticBody3D.new()
	body.position = position_value

	var collision_shape := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = size
	collision_shape.shape = shape
	body.add_child(collision_shape)

	var mesh_instance := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	mesh_instance.mesh = mesh
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.92
	mesh_instance.material_override = material
	body.add_child(mesh_instance)
	return body
