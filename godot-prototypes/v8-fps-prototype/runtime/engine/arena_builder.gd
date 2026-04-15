extends RefCounted
class_name FpsArenaBuilder

const MapLayoutParserScript := preload("res://runtime/logic/map_layout_parser.gd")


func build(owner: Node3D, layout: ArenaMapLayout, wall_height: float, cover_height: float) -> void:
	var floor_body: StaticBody3D = GeometryBuilder.build_floor(layout, MapLayoutParserScript)
	floor_body.name = "Floor"
	owner.add_child(floor_body)

	for wall_tile: Vector2i in layout.wall_tiles:
		var wall: StaticBody3D = GeometryBuilder.build_block(
			MapLayoutParserScript.cell_to_world(wall_tile, layout.grid_size) + Vector3(0.0, wall_height * 0.5, 0.0),
			Vector3(MapLayoutParserScript.TILE_SIZE, wall_height, MapLayoutParserScript.TILE_SIZE),
			Color("6d7480")
		)
		wall.name = "Wall_%d_%d" % [wall_tile.x, wall_tile.y]
		owner.add_child(wall)

	for cover_tile: Vector2i in layout.cover_tiles:
		var cover: StaticBody3D = GeometryBuilder.build_block(
			MapLayoutParserScript.cell_to_world(cover_tile, layout.grid_size) + Vector3(0.0, cover_height * 0.5, 0.0),
			Vector3(MapLayoutParserScript.TILE_SIZE, cover_height, MapLayoutParserScript.TILE_SIZE),
			Color("7d6656")
		)
		cover.name = "Cover_%d_%d" % [cover_tile.x, cover_tile.y]
		owner.add_child(cover)


class GeometryBuilder:
	static func build_floor(layout: ArenaMapLayout, map_layout_parser_script: GDScript) -> StaticBody3D:
		var floor_size := Vector3(
			float(layout.grid_size.x) * map_layout_parser_script.TILE_SIZE,
			1.0,
			float(layout.grid_size.y) * map_layout_parser_script.TILE_SIZE
		)
		return build_block(Vector3(0.0, -0.5, 0.0), floor_size, Color("39443b"))


	static func build_block(position_value: Vector3, size: Vector3, color: Color) -> StaticBody3D:
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
