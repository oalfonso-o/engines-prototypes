extends RefCounted
class_name FpsMapLoader

const EMPTY_TILE: String = "."
const PLAYER_TILE: String = "P"
const ENEMY_TILE: String = "E"
const COVER_TILE: String = "C"
const WALL_TILE: String = "W"
const TILE_SIZE: float = 4.0


class MapLayout:
	var cover_tiles: Array[Vector2i] = []
	var enemy_spawns: Array[Vector3] = []
	var grid_size: Vector2i = Vector2i.ZERO
	var player_spawn: Vector3 = Vector3.ZERO
	var wall_tiles: Array[Vector2i] = []


static func load_layout(path: String) -> MapLayout:
	var text: String = FileAccess.get_file_as_string(path).strip_edges()
	var rows: PackedStringArray = text.split("\n")
	var layout := MapLayout.new()
	layout.grid_size = Vector2i(rows[0].length(), rows.size())

	for z_index: int in range(rows.size()):
		var row: String = rows[z_index]
		for x_index: int in range(row.length()):
			var tile: String = row.substr(x_index, 1)
			var coords := Vector2i(x_index, z_index)
			match tile:
				WALL_TILE:
					layout.wall_tiles.append(coords)
				COVER_TILE:
					layout.cover_tiles.append(coords)
				ENEMY_TILE:
					layout.enemy_spawns.append(_cell_to_world(coords, layout.grid_size))
				PLAYER_TILE:
					layout.player_spawn = _cell_to_world(coords, layout.grid_size)
				EMPTY_TILE:
					pass
				_:
					push_error("unknown map tile '%s' in %s" % [tile, path])

	return layout


static func _cell_to_world(coords: Vector2i, grid_size: Vector2i) -> Vector3:
	var x_origin: float = (float(grid_size.x - 1) * 0.5) * TILE_SIZE
	var z_origin: float = (float(grid_size.y - 1) * 0.5) * TILE_SIZE
	return Vector3(
		(coords.x * TILE_SIZE) - x_origin,
		0.0,
		(coords.y * TILE_SIZE) - z_origin
	)
