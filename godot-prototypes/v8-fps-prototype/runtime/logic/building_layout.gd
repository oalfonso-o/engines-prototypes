extends RefCounted
class_name BuildingLayout

const EXTERIOR_GROUND_SIZE: Vector2 = Vector2(72.0, 72.0)
const FLOOR_HEIGHT: float = 3.0
const FLOOR_THICKNESS: float = 0.2
const FOOTPRINT: Vector2 = Vector2(14.0, 10.0)
const SPAWN_OFFSET: Vector3 = Vector3(0.0, 1.1, 18.0)


func floor_count() -> int:
	return 3


func has_ground_stairs_on_left() -> bool:
	return true


func has_middle_stairs_on_right() -> bool:
	return true


func top_floor_has_balcony() -> bool:
	return true


func back_room_count_for_floor(_floor_index: int) -> int:
	return 2


func window_count_for_floor(_floor_index: int) -> int:
	return 4


func spawn_position() -> Vector3:
	return SPAWN_OFFSET
