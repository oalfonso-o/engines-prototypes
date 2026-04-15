extends RefCounted

const MapLoaderScript := preload("res://runtime/map_loader.gd")


func test_default_map_parses_expected_spawn_and_cover_counts(assertions, _context) -> void:
	var layout = MapLoaderScript.load_layout("res://maps/default_arena.txt")

	assertions.check(layout != null, "map loader should return a layout object")
	assertions.check(layout.grid_size == Vector2i(13, 13), "default arena should parse as a 13x13 grid")
	assertions.check(layout.cover_tiles.size() == 5, "default arena should contain five cover blocks")
	assertions.check(layout.enemy_spawns.size() == 4, "default arena should contain four enemy spawns")
	assertions.check(layout.player_spawn != Vector3.ZERO, "default arena should define a player spawn")
