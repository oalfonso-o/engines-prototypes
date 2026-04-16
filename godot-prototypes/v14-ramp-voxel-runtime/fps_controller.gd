extends CharacterBody3D

const MOUSE_SENSITIVITY: float = 0.0024
const MOVE_SPEED: float = 11.0
const AIR_CONTROL: float = 2.0
const ACCELERATION: float = 10.0
const GRAVITY: float = 24.0
const JUMP_SPEED: float = 8.0
const FLOOR_SNAP: float = 0.3
const PITCH_LIMIT: float = 1.45
const CAMERA_HEIGHT: float = 1.55
const CAPSULE_RADIUS: float = 0.35
const CAPSULE_HEIGHT: float = 1.2

var _camera_pivot: Node3D
var _camera: Camera3D
var _pitch: float = 0.0


func _ready() -> void:
	floor_snap_length = FLOOR_SNAP
	safe_margin = 0.001

	var collision: CollisionShape3D = CollisionShape3D.new()
	collision.name = "CollisionShape3D"
	var capsule: CapsuleShape3D = CapsuleShape3D.new()
	capsule.radius = CAPSULE_RADIUS
	capsule.height = CAPSULE_HEIGHT
	collision.shape = capsule
	add_child(collision)

	_camera_pivot = Node3D.new()
	_camera_pivot.name = "CameraPivot"
	_camera_pivot.position = Vector3(0.0, CAMERA_HEIGHT, 0.0)
	add_child(_camera_pivot)

	_camera = Camera3D.new()
	_camera.name = "Camera3D"
	_camera.current = true
	_camera.near = 0.05
	_camera.fov = 82.0
	_camera_pivot.add_child(_camera)

	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _physics_process(delta: float) -> void:
	var input_vector: Vector2 = Vector2.ZERO
	if Input.is_physical_key_pressed(KEY_A):
		input_vector.x -= 1.0
	if Input.is_physical_key_pressed(KEY_D):
		input_vector.x += 1.0
	if Input.is_physical_key_pressed(KEY_W):
		input_vector.y -= 1.0
	if Input.is_physical_key_pressed(KEY_S):
		input_vector.y += 1.0

	var basis_y: Basis = Basis(Vector3.UP, rotation.y)
	var desired_direction: Vector3 = (basis_y * Vector3(input_vector.x, 0.0, input_vector.y)).normalized()
	var desired_velocity: Vector3 = desired_direction * MOVE_SPEED
	var blend: float = ACCELERATION if is_on_floor() else AIR_CONTROL

	velocity.x = lerpf(velocity.x, desired_velocity.x, clampf(delta * blend, 0.0, 1.0))
	velocity.z = lerpf(velocity.z, desired_velocity.z, clampf(delta * blend, 0.0, 1.0))

	if is_on_floor():
		if Input.is_physical_key_pressed(KEY_SPACE):
			velocity.y = JUMP_SPEED
		else:
			velocity.y = -0.01
	else:
		velocity.y -= GRAVITY * delta

	move_and_slide()


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		rotation.y -= event.relative.x * MOUSE_SENSITIVITY
		_pitch = clampf(_pitch - (event.relative.y * MOUSE_SENSITIVITY), -PITCH_LIMIT, PITCH_LIMIT)
		_camera_pivot.rotation.x = _pitch
		return

	if event.is_action_pressed("ui_cancel"):
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		return

	if event is InputEventMouseButton and event.pressed and Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
