extends CharacterBody3D
class_name IsoPlayer3D

@export var move_speed := 9.0
@export var jump_velocity := 8.5
@export var gravity_force := 22.0
@export var air_control := 0.65
@export var body_radius := 0.36
@export var body_height := 1.75

var attached_camera: Camera3D
var debug_move_input := Vector2.ZERO
var debug_input_enabled := false
var debug_jump_queued := false

@onready var collision_shape: CollisionShape3D = _ensure_collision_shape()
@onready var visual_root: Node3D = _ensure_visual_root()


func _ready() -> void:
	_setup_collision()
	_setup_visuals()


func _physics_process(delta: float) -> void:
	var input_vector := _read_move_input()
	var desired_velocity := _camera_relative_velocity(input_vector) * move_speed

	if not is_on_floor():
		velocity.y -= gravity_force * delta
		velocity.x = lerp(velocity.x, desired_velocity.x, air_control)
		velocity.z = lerp(velocity.z, desired_velocity.z, air_control)
	else:
		velocity.x = desired_velocity.x
		velocity.z = desired_velocity.z

	if _consume_jump() and is_on_floor():
		velocity.y = jump_velocity

	move_and_slide()
	_update_visuals(input_vector)


func attach_camera(camera_node: Camera3D) -> void:
	attached_camera = camera_node


func set_debug_move_input(input_vector: Vector2) -> void:
	debug_input_enabled = true
	debug_move_input = input_vector


func clear_debug_input() -> void:
	debug_input_enabled = false
	debug_move_input = Vector2.ZERO


func request_debug_jump() -> void:
	debug_jump_queued = true


func reset_motion() -> void:
	velocity = Vector3.ZERO


func snap_to_floor() -> void:
	apply_floor_snap()


func _read_move_input() -> Vector2:
	if debug_input_enabled:
		return debug_move_input

	var input_vector := Vector2.ZERO
	if Input.is_key_pressed(KEY_A):
		input_vector.x -= 1.0
	if Input.is_key_pressed(KEY_D):
		input_vector.x += 1.0
	if Input.is_key_pressed(KEY_W):
		input_vector.y += 1.0
	if Input.is_key_pressed(KEY_S):
		input_vector.y -= 1.0
	return input_vector.normalized()


func _consume_jump() -> bool:
	if debug_jump_queued:
		debug_jump_queued = false
		return true
	return Input.is_key_pressed(KEY_SPACE)


func _camera_relative_velocity(input_vector: Vector2) -> Vector3:
	if input_vector.length_squared() <= 0.0001:
		return Vector3.ZERO

	var forward := Vector3.FORWARD
	var right := Vector3.RIGHT
	if attached_camera != null:
		forward = -attached_camera.global_basis.z
		right = attached_camera.global_basis.x

	forward.y = 0.0
	right.y = 0.0
	forward = forward.normalized()
	right = right.normalized()
	var direction := (right * input_vector.x) + (forward * input_vector.y)
	return direction.normalized()


func _update_visuals(input_vector: Vector2) -> void:
	var flat_velocity := Vector3(velocity.x, 0.0, velocity.z)
	if flat_velocity.length() > 0.05:
		visual_root.look_at(global_position + flat_velocity, Vector3.UP, true)

	var bob := 0.0
	if is_on_floor() and flat_velocity.length() > 0.2:
		bob = sin(Time.get_ticks_msec() * 0.015) * 0.04
	elif not is_on_floor():
		bob = 0.08
	visual_root.position = Vector3(0.0, body_height * 0.5 + bob, 0.0)


func _ensure_collision_shape() -> CollisionShape3D:
	if has_node("CollisionShape3D"):
		return $CollisionShape3D
	var node := CollisionShape3D.new()
	node.name = "CollisionShape3D"
	add_child(node)
	return node


func _ensure_visual_root() -> Node3D:
	if has_node("VisualRoot"):
		return $VisualRoot
	var node := Node3D.new()
	node.name = "VisualRoot"
	add_child(node)
	return node


func _setup_collision() -> void:
	var capsule := CapsuleShape3D.new()
	capsule.radius = body_radius
	capsule.height = max(0.4, body_height - (body_radius * 2.0))
	collision_shape.shape = capsule
	collision_shape.position = Vector3(0.0, body_height * 0.5, 0.0)


func _setup_visuals() -> void:
	for child in visual_root.get_children():
		child.queue_free()

	var body_material := StandardMaterial3D.new()
	body_material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	body_material.albedo_color = Color("fff8f2")
	body_material.emission_enabled = true
	body_material.emission = Color("89fff0")
	body_material.emission_energy_multiplier = 0.55

	var torso := MeshInstance3D.new()
	var torso_mesh := CapsuleMesh.new()
	torso_mesh.radius = body_radius * 0.92
	torso_mesh.height = body_height * 0.72
	torso.mesh = torso_mesh
	torso.material_override = body_material
	torso.position = Vector3.ZERO
	visual_root.add_child(torso)

	var head := MeshInstance3D.new()
	var head_mesh := SphereMesh.new()
	head_mesh.radius = body_radius * 0.72
	head.mesh = head_mesh
	head.material_override = body_material
	head.position = Vector3(0.0, body_height * 0.62, 0.0)
	visual_root.add_child(head)

	var arm := MeshInstance3D.new()
	var arm_mesh := CapsuleMesh.new()
	arm_mesh.radius = 0.07
	arm_mesh.height = 0.56
	arm.mesh = arm_mesh
	arm.material_override = body_material
	arm.rotation_degrees = Vector3(90.0, 0.0, 55.0)
	arm.position = Vector3(body_radius * 0.72, body_height * 0.08, body_radius * 0.1)
	visual_root.add_child(arm)
