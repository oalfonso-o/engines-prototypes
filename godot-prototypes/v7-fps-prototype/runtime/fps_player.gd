extends "res://runtime/character_actor.gd"
class_name FpsPlayerController

const GrenadeProjectileScript := preload("res://runtime/grenade_projectile.gd")
const PlayerWeaponScript := preload("res://runtime/player_weapon.gd")

@export var camera_pitch_limit: float = 80.0
@export var camera_height: float = 1.48
@export var fire_range: float = 120.0
@export var grenade_arc_height: float = 2.6
@export var grenade_impulse_force: float = 10.5
@export var grenade_radius: float = 7.0
@export var grenade_travel_speed: float = 18.0
@export var marker_max_distance: float = 60.0
@export var mouse_sensitivity: float = 0.0025
@export var weapon_damage: int = 20

var projectile_parent: Node3D
var world_root: Node3D

var _camera: Camera3D
var _camera_pivot: Node3D
var _grenade_marker: MeshInstance3D
var _grenade_target_position: Vector3 = Vector3.ZERO
var _has_grenade_target: bool = false
var _jump_queued: bool = false
var _look_pitch: float = 0.0
var _move_intent: Vector2 = Vector2.ZERO
var _move_intent_enabled: bool = false
var _weapon = PlayerWeaponScript.new()


func _ready() -> void:
	super._ready()
	_build_camera_rig()
	_build_grenade_marker()
	_visual_rig.hide_head_mesh()
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _process(_delta: float) -> void:
	_update_grenade_target_marker()


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		_apply_mouse_look(event.relative)
		return

	if event.is_action_pressed("ui_cancel"):
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		return

	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_LEFT:
			fire_hitscan()
		elif event.button_index == MOUSE_BUTTON_RIGHT and _has_grenade_target:
			throw_grenade_to(_grenade_target_position)


func queue_jump_intent() -> void:
	_jump_queued = true


func set_move_intent(input_vector: Vector2) -> void:
	_move_intent_enabled = true
	_move_intent = input_vector


func clear_move_intent() -> void:
	_move_intent_enabled = false
	_move_intent = Vector2.ZERO


func fire_hitscan() -> Dictionary:
	return _weapon.fire(_camera, self, weapon_damage, fire_range)


func aim_at_world_point(target_position: Vector3) -> void:
	var to_target: Vector3 = target_position - _camera.global_position
	var flat_target: Vector3 = Vector3(to_target.x, 0.0, to_target.z)
	if flat_target.length_squared() > 0.0001:
		rotation.y = atan2(-flat_target.x, -flat_target.z)

	var rotated_target: Vector3 = global_basis.inverse() * to_target
	var flat_distance: float = Vector2(rotated_target.x, rotated_target.z).length()
	_look_pitch = clampf(atan2(rotated_target.y, flat_distance), deg_to_rad(-camera_pitch_limit), deg_to_rad(camera_pitch_limit))
	_camera_pivot.rotation.x = _look_pitch


func throw_grenade_to(target_position: Vector3) -> void:
	if projectile_parent == null or world_root == null:
		return
	var projectile: Node3D = GrenadeProjectileScript.new()
	projectile.name = "GrenadeProjectile"
	projectile_parent.add_child(projectile)
	projectile.setup(
		_camera.global_position,
		target_position,
		grenade_travel_speed,
		grenade_arc_height,
		grenade_radius,
		grenade_impulse_force,
		world_root
	)


func _compute_move_direction() -> Vector3:
	var input_vector: Vector2 = _read_move_input()
	if input_vector.length_squared() <= 0.0001:
		return Vector3.ZERO

	var yaw_basis: Basis = Basis(Vector3.UP, rotation.y)
	var move: Vector3 = (yaw_basis * Vector3(input_vector.x, 0.0, input_vector.y)).normalized()
	return move


func _compute_facing_direction(_move_direction: Vector3) -> Vector3:
	var forward: Vector3 = -_camera.global_basis.z
	forward.y = 0.0
	return forward.normalized() if forward.length_squared() > 0.0001 else facing_direction


func _consume_jump_request() -> bool:
	if _jump_queued:
		_jump_queued = false
		return true
	return Input.is_physical_key_pressed(KEY_SPACE)


func _build_camera_rig() -> void:
	_camera_pivot = Node3D.new()
	_camera_pivot.name = "CameraPivot"
	_camera_pivot.position = Vector3(0.0, camera_height, 0.0)
	add_child(_camera_pivot)

	_camera = Camera3D.new()
	_camera.name = "Camera3D"
	_camera.current = true
	_camera.near = 0.05
	_camera_pivot.add_child(_camera)


func _build_grenade_marker() -> void:
	_grenade_marker = MeshInstance3D.new()
	_grenade_marker.name = "GrenadeMarker"
	var cylinder := CylinderMesh.new()
	cylinder.top_radius = 0.45
	cylinder.bottom_radius = 0.45
	cylinder.height = 0.05
	_grenade_marker.mesh = cylinder
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.albedo_color = Color("58d86d")
	material.emission_enabled = true
	material.emission = Color("58d86d")
	material.emission_energy_multiplier = 1.2
	_grenade_marker.material_override = material
	_grenade_marker.visible = false
	_grenade_marker.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	_grenade_marker.top_level = true
	add_child(_grenade_marker)


func _apply_mouse_look(relative_motion: Vector2) -> void:
	rotation.y -= relative_motion.x * mouse_sensitivity
	_look_pitch = clampf(_look_pitch - (relative_motion.y * mouse_sensitivity), deg_to_rad(-camera_pitch_limit), deg_to_rad(camera_pitch_limit))
	_camera_pivot.rotation.x = _look_pitch


func _read_move_input() -> Vector2:
	if _move_intent_enabled:
		return _move_intent
	var input_vector := Vector2.ZERO
	if Input.is_physical_key_pressed(KEY_A):
		input_vector.x -= 1.0
	if Input.is_physical_key_pressed(KEY_D):
		input_vector.x += 1.0
	if Input.is_physical_key_pressed(KEY_W):
		input_vector.y -= 1.0
	if Input.is_physical_key_pressed(KEY_S):
		input_vector.y += 1.0
	return input_vector.normalized()


func _update_grenade_target_marker() -> void:
	if _camera == null or projectile_parent == null:
		return
	var origin: Vector3 = _camera.global_position
	var direction: Vector3 = -_camera.global_basis.z
	var query := PhysicsRayQueryParameters3D.create(origin, origin + (direction * marker_max_distance))
	query.exclude = [self]
	var hit: Dictionary = _camera.get_world_3d().direct_space_state.intersect_ray(query)
	if hit.is_empty():
		_has_grenade_target = false
		_grenade_marker.visible = false
		return

	var normal: Vector3 = hit.get("normal", Vector3.UP)
	if normal.y < 0.55:
		_has_grenade_target = false
		_grenade_marker.visible = false
		return

	_has_grenade_target = true
	_grenade_target_position = hit.position
	_grenade_marker.visible = true
	_grenade_marker.global_position = _grenade_target_position + Vector3(0.0, 0.03, 0.0)
