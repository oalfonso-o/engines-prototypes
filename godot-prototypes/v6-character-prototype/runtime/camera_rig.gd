extends Camera3D

const CAMERA_POSITION: Vector3 = Vector3(0.0, 3.8, 7.2)
const CAMERA_LOOK_TARGET: Vector3 = Vector3(0.0, 1.1, 0.0)


func _ready() -> void:
	current = true
	projection = Camera3D.PROJECTION_PERSPECTIVE
	fov = 52.0
	global_position = CAMERA_POSITION
	look_at(CAMERA_LOOK_TARGET, Vector3.UP)
