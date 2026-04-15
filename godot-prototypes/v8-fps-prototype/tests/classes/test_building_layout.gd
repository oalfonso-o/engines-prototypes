extends GutTest

const BuildingLayoutScript := preload("res://runtime/logic/building_layout.gd")


func test_default_layout_defines_three_floors_stairs_and_balcony() -> void:
	var layout: BuildingLayout = BuildingLayoutScript.new()

	assert_eq(layout.floor_count(), 3, "layout should define exactly three floors")
	assert_true(layout.has_ground_stairs_on_left(), "ground floor stairs should start on the left")
	assert_true(layout.has_middle_stairs_on_right(), "middle floor stairs should continue on the right")
	assert_true(layout.top_floor_has_balcony(), "top floor should expose a balcony")
	assert_true(layout.spawn_position().y > 0.0, "spawn should be above exterior ground")


func test_default_layout_exposes_back_room_and_window_counts() -> void:
	var layout: BuildingLayout = BuildingLayoutScript.new()

	assert_eq(layout.back_room_count_for_floor(0), 2, "ground floor should define two back rooms")
	assert_eq(layout.window_count_for_floor(0), 4, "ground floor should define four windows")
	assert_eq(layout.window_count_for_floor(1), 4, "middle floor should define four windows")
	assert_eq(layout.window_count_for_floor(2), 4, "top floor should define four windows")
