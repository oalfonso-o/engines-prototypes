extends CharacterBody3D
class_name IsoPlayer3D

const WeaponConfigScript = preload("res://scripts/weapon_config.gd")
const WeaponStateScript = preload("res://scripts/weapon_state.gd")
const ShotFanSolverScript = preload("res://scripts/shot_fan_solver.gd")
const ShotDebugDrawerScript = preload("res://scripts/shot_debug_drawer.gd")

const WORLD_COLLISION_MASK := 1
const PLAYER_COLLISION_MASK := 2
const TARGET_COLLISION_MASK := 4
const SHOT_COLLISION_MASK := WORLD_COLLISION_MASK | TARGET_COLLISION_MASK

signal shot_resolved(result: Dictionary)
signal weapon_state_changed()

@export var move_speed: float = 9.0
@export var jump_velocity: float = 8.5
@export var gravity_force: float = 22.0
@export var air_control: float = 0.65
@export var body_radius: float = 0.36
@export var body_height: float = 1.75
@export var shot_origin_height_offset: float = 0.18
@export var rifle_config: Resource = WeaponConfigScript.new()
@export var pistol_config: Resource = WeaponConfigScript.new()

var attached_camera: Camera3D
var debug_move_input: Vector2 = Vector2.ZERO
var debug_input_enabled := false
var debug_jump_queued := false
var debug_fire_queued := false
var debug_reload_queued := false
var debug_aim_world_enabled := false
var debug_aim_world_point := Vector3.ZERO

var _weapon_states: Array = []
var _current_weapon_index := 0
var _trigger_was_pressed := false
var _crosshair_screen_position := Vector2.ZERO
var _last_shot_debug: Dictionary = {}
var _last_total_damage := 0.0
var _muzzle_flash_remaining := 0.0
var _muzzle_flash: MeshInstance3D
var _shot_debug_drawer

@onready var collision_shape: CollisionShape3D = _ensure_collision_shape()
@onready var visual_root: Node3D = _ensure_visual_root()


func _ready() -> void:
	collision_layer = PLAYER_COLLISION_MASK
	collision_mask = WORLD_COLLISION_MASK
	_setup_collision()
	_setup_visuals()
	_setup_weapons()
	_setup_debug_drawer()


func _physics_process(delta: float) -> void:
	var input_vector: Vector2 = _read_move_input()
	var desired_velocity: Vector3 = _camera_relative_velocity(input_vector) * move_speed

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

	_update_crosshair_position()
	_update_weapons(delta)
	_handle_weapon_switch_input()
	_handle_reload_request()
	_handle_fire_request()
	_update_visuals()
	_update_vfx(delta)
	_trigger_was_pressed = Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT)


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


func request_debug_fire() -> void:
	debug_fire_queued = true


func request_debug_reload() -> void:
	debug_reload_queued = true


func set_debug_aim_world_point(world_point: Vector3) -> void:
	debug_aim_world_enabled = true
	debug_aim_world_point = world_point


func clear_debug_aim_world_point() -> void:
	debug_aim_world_enabled = false


func select_weapon_index(index: int) -> void:
	_current_weapon_index = clampi(index, 0, _weapon_states.size() - 1)
	emit_signal("weapon_state_changed")


func reset_motion() -> void:
	velocity = Vector3.ZERO


func snap_to_floor() -> void:
	apply_floor_snap()


func get_crosshair_screen_position() -> Vector2:
	return _crosshair_screen_position


func get_last_shot_debug() -> Dictionary:
	return _last_shot_debug


func get_weapon_debug_state() -> Dictionary:
	var weapon_state = _active_weapon_state()
	return {
		"weapon_name": weapon_state.config.weapon_name,
		"ammo_in_magazine": weapon_state.ammo_in_magazine,
		"reserve_ammo": weapon_state.reserve_ammo,
		"magazine_size": weapon_state.config.magazine_size,
		"is_reloading": weapon_state.is_reloading(),
		"reload_remaining": weapon_state.reload_remaining,
		"projectile_rays_count": weapon_state.config.projectile_rays_count,
		"damage_per_ray": weapon_state.config.damage_per_ray,
		"vertical_span_degrees": weapon_state.config.vertical_span_degrees,
		"last_total_damage": _last_total_damage,
	}


func get_shot_origin() -> Vector3:
	return global_position + Vector3(0.0, body_height + shot_origin_height_offset, 0.0)


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


func _update_visuals() -> void:
	var flat_velocity := Vector3(velocity.x, 0.0, velocity.z)
	var bob := 0.0
	if is_on_floor() and flat_velocity.length() > 0.2:
		bob = sin(Time.get_ticks_msec() * 0.015) * 0.04
	elif not is_on_floor():
		bob = 0.08
	visual_root.position = Vector3(0.0, body_height * 0.5 + bob, 0.0)


func _update_weapons(delta: float) -> void:
	for weapon_state in _weapon_states:
		weapon_state.update(delta)


func _handle_weapon_switch_input() -> void:
	if Input.is_key_pressed(KEY_1):
		select_weapon_index(0)
	elif Input.is_key_pressed(KEY_2):
		select_weapon_index(1)


func _handle_reload_request() -> void:
	var reload_requested := false
	if debug_reload_queued:
		debug_reload_queued = false
		reload_requested = true
	elif Input.is_key_pressed(KEY_R):
		reload_requested = true

	if reload_requested and _active_weapon_state().start_reload():
		emit_signal("weapon_state_changed")


func _handle_fire_request() -> void:
	var runtime_trigger_pressed := Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT)
	var debug_trigger_just_pressed := debug_fire_queued
	debug_fire_queued = false
	var trigger_pressed := runtime_trigger_pressed or debug_trigger_just_pressed
	var trigger_just_pressed := (runtime_trigger_pressed and not _trigger_was_pressed) or debug_trigger_just_pressed
	var weapon_state = _active_weapon_state()
	if not weapon_state.can_fire(trigger_pressed, trigger_just_pressed):
		return

	var horizontal_direction: Vector3 = _horizontal_aim_direction()
	if horizontal_direction.length_squared() <= 0.0001:
		return

	weapon_state.consume_shot()
	emit_signal("weapon_state_changed")
	var shot_result := ShotFanSolverScript.resolve_shot(
		get_world_3d().direct_space_state,
		get_shot_origin(),
		horizontal_direction,
		weapon_state.config,
		[get_rid()],
		SHOT_COLLISION_MASK
	)
	_apply_shot_damage(shot_result)
	_last_shot_debug = shot_result
	_shot_debug_drawer.submit_shot(shot_result["rays"])
	_muzzle_flash_remaining = 0.07
	emit_signal("shot_resolved", shot_result)
	if weapon_state.ammo_in_magazine <= 0 and weapon_state.reserve_ammo > 0:
		weapon_state.start_reload()


func _apply_shot_damage(shot_result: Dictionary) -> void:
	_last_total_damage = 0.0
	for record in shot_result["damage_records"]:
		var target = record["target"]
		var damage: float = record["damage"]
		target.apply_shot_damage(damage, record["hit_points"])
		_last_total_damage += damage


func _horizontal_aim_direction() -> Vector3:
	var shot_origin: Vector3 = get_shot_origin()
	var aim_world: Vector3 = _current_aim_world_point(shot_origin.y)
	var direction := aim_world - shot_origin
	direction.y = 0.0
	if direction.length_squared() <= 0.0001:
		if attached_camera != null:
			var fallback := -attached_camera.global_basis.z
			fallback.y = 0.0
			if fallback.length_squared() > 0.0001:
				return fallback.normalized()
		return Vector3.FORWARD
	return direction.normalized()


func _current_aim_world_point(plane_height: float) -> Vector3:
	if debug_aim_world_enabled:
		return debug_aim_world_point

	if attached_camera == null:
		return get_shot_origin() + Vector3.FORWARD * 10.0

	var viewport := get_viewport()
	if viewport == null:
		return get_shot_origin() + Vector3.FORWARD * 10.0

	var screen_position: Vector2 = viewport.get_mouse_position()
	var ray_origin: Vector3 = attached_camera.project_ray_origin(screen_position)
	var ray_direction: Vector3 = attached_camera.project_ray_normal(screen_position)
	var plane := Plane(Vector3.UP, plane_height)
	var hit = plane.intersects_ray(ray_origin, ray_direction)
	if hit == null:
		return ray_origin + ray_direction * 32.0
	return hit


func _update_crosshair_position() -> void:
	if attached_camera == null:
		_crosshair_screen_position = Vector2.ZERO
		return

	if debug_aim_world_enabled:
		_crosshair_screen_position = attached_camera.unproject_position(debug_aim_world_point)
		return

	var viewport := get_viewport()
	if viewport == null:
		_crosshair_screen_position = Vector2.ZERO
		return
	_crosshair_screen_position = viewport.get_mouse_position()


func _update_vfx(delta: float) -> void:
	_muzzle_flash_remaining = max(0.0, _muzzle_flash_remaining - delta)
	if _muzzle_flash != null:
		_muzzle_flash.visible = _muzzle_flash_remaining > 0.0
		_muzzle_flash.global_position = get_shot_origin()


func _active_weapon_state():
	return _weapon_states[_current_weapon_index]


func _setup_weapons() -> void:
	if rifle_config.weapon_name == "Weapon":
		rifle_config.weapon_name = "Rifle"
		rifle_config.magazine_size = 30
		rifle_config.reserve_ammo = 120
		rifle_config.reload_time = 1.7
		rifle_config.fire_rate = 10.0
		rifle_config.projectile_rays_count = 7
		rifle_config.damage_per_ray = 5.0
		rifle_config.max_range = 50.0
		rifle_config.vertical_span_degrees = 28.0
		rifle_config.ray_spacing_mode = "even"
		rifle_config.automatic_fire = true

	if pistol_config.weapon_name == "Weapon":
		pistol_config.weapon_name = "Pistol"
		pistol_config.magazine_size = 12
		pistol_config.reserve_ammo = 48
		pistol_config.reload_time = 1.25
		pistol_config.fire_rate = 4.0
		pistol_config.projectile_rays_count = 5
		pistol_config.damage_per_ray = 7.0
		pistol_config.max_range = 46.0
		pistol_config.vertical_span_degrees = 20.0
		pistol_config.ray_spacing_mode = "centered"
		pistol_config.automatic_fire = false

	_weapon_states = [
		WeaponStateScript.new(rifle_config),
		WeaponStateScript.new(pistol_config),
	]
	emit_signal("weapon_state_changed")


func _setup_debug_drawer() -> void:
	_shot_debug_drawer = ShotDebugDrawerScript.new()
	_shot_debug_drawer.name = "ShotDebugDrawer"
	add_child(_shot_debug_drawer)


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

	_muzzle_flash = MeshInstance3D.new()
	var flash_mesh := SphereMesh.new()
	flash_mesh.radius = 0.16
	flash_mesh.height = 0.32
	_muzzle_flash.mesh = flash_mesh
	var flash_material := StandardMaterial3D.new()
	flash_material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	flash_material.albedo_color = Color("fff7a1")
	flash_material.emission_enabled = true
	flash_material.emission = Color("ffd86b")
	flash_material.emission_energy_multiplier = 1.6
	_muzzle_flash.material_override = flash_material
	_muzzle_flash.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	_muzzle_flash.visible = false
	add_child(_muzzle_flash)
