extends GutTest

const MapLoaderScript := preload("res://runtime/engine/map_loader.gd")


func test_default_map_parses_expected_spawn_and_cover_counts() -> void:
	var layout: ArenaMapLayout = MapLoaderScript.load_layout("res://maps/default_arena.txt")

	assert_not_null(layout, "map loader should return a layout object")
	assert_eq(layout.grid_size, Vector2i(13, 13), "default arena should parse as a 13x13 grid")
	assert_eq(layout.cover_tiles.size(), 5, "default arena should contain five cover blocks")
	assert_eq(layout.enemy_spawns.size(), 4, "default arena should contain four enemy spawns")
	assert_ne(layout.player_spawn, Vector3.ZERO, "default arena should define a player spawn")
