extends "res://runtime/engine/character_actor.gd"
class_name FpsPlayerController

const GrenadeProjectileScript := preload("res://runtime/engine/grenade_projectile.gd")
const PlayerWeaponScript := preload("res://runtime/engine/player_weapon.gd")

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

var _camera_rig: CameraRig
var _input_state: InputState
var _marker_state: GrenadeMarkerState
var _weapon: PlayerWeaponSystem = PlayerWeaponScript.new()


func _ready() -> void:
	super._ready()
	_camera_rig = CameraRig.new()
	_camera_rig.build(self, camera_height)
	_input_state = InputState.new()
	_marker_state = GrenadeMarkerState.new()
	_marker_state.build(self)
	visual_rig.hide_head_mesh()
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _process(_delta: float) -> void:
	_marker_state.update(self, _camera_rig.camera, projectile_parent, marker_max_distance)


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		_camera_rig.apply_mouse_look(self, event.relative, mouse_sensitivity, camera_pitch_limit)
		return

	if event.is_action_pressed("ui_cancel"):
		Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		return

	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_LEFT:
			fire_hitscan()
		elif event.button_index == MOUSE_BUTTON_RIGHT and _marker_state.has_target:
			throw_grenade_to(_marker_state.target_position)

func fire_hitscan() -> Dictionary:
	return _weapon.fire(_camera_rig.camera, self, weapon_damage, fire_range)

func throw_grenade_to(target_position: Vector3) -> void:
	if projectile_parent == null or world_root == null:
		return
	var projectile: Node3D = GrenadeProjectileScript.new()
	projectile.name = "GrenadeProjectile"
	projectile_parent.add_child(projectile)
	projectile.setup(
		_camera_rig.camera.global_position,
		target_position,
		grenade_travel_speed,
		grenade_arc_height,
		grenade_radius,
		grenade_impulse_force,
		world_root
	)


func _compute_move_direction() -> Vector3:
	var input_vector: Vector2 = _input_state.read_move_input()
	if input_vector.length_squared() <= 0.0001:
		return Vector3.ZERO

	var yaw_basis: Basis = Basis(Vector3.UP, rotation.y)
	var move: Vector3 = (yaw_basis * Vector3(input_vector.x, 0.0, input_vector.y)).normalized()
	return move


func _compute_facing_direction(_move_direction: Vector3) -> Vector3:
	var forward: Vector3 = -_camera_rig.camera.global_basis.z
	forward.y = 0.0
	return forward.normalized() if forward.length_squared() > 0.0001 else facing_direction


func _consume_jump_request() -> bool:
	return _input_state.consume_jump_request()


class CameraRig:
	var camera: Camera3D
	var pivot: Node3D
	var look_pitch: float = 0.0


	func build(owner: FpsPlayerController, height: float) -> void:
		pivot = Node3D.new()
		pivot.name = "CameraPivot"
		pivot.position = Vector3(0.0, height, 0.0)
		owner.add_child(pivot)

		camera = Camera3D.new()
		camera.name = "Camera3D"
		camera.current = true
		camera.near = 0.05
		pivot.add_child(camera)


	func apply_mouse_look(owner: FpsPlayerController, relative_motion: Vector2, sensitivity: float, pitch_limit: float) -> void:
		owner.rotation.y -= relative_motion.x * sensitivity
		look_pitch = clampf(look_pitch - (relative_motion.y * sensitivity), deg_to_rad(-pitch_limit), deg_to_rad(pitch_limit))
		pivot.rotation.x = look_pitch


	func aim_at_world_point(owner: FpsPlayerController, target_position: Vector3, pitch_limit: float) -> void:
		var to_target: Vector3 = target_position - camera.global_position
		var flat_target: Vector3 = Vector3(to_target.x, 0.0, to_target.z)
		if flat_target.length_squared() > 0.0001:
			owner.rotation.y = atan2(-flat_target.x, -flat_target.z)

		var rotated_target: Vector3 = owner.global_basis.inverse() * to_target
		var flat_distance: float = Vector2(rotated_target.x, rotated_target.z).length()
		look_pitch = clampf(atan2(rotated_target.y, flat_distance), deg_to_rad(-pitch_limit), deg_to_rad(pitch_limit))
		pivot.rotation.x = look_pitch


class InputState:
	var _jump_queued: bool = false
	var _move_intent: Vector2 = Vector2.ZERO
	var _move_intent_enabled: bool = false


	func queue_jump() -> void:
		_jump_queued = true


	func set_move_intent(input_vector: Vector2) -> void:
		_move_intent_enabled = true
		_move_intent = input_vector


	func clear_move_intent() -> void:
		_move_intent_enabled = false
		_move_intent = Vector2.ZERO


	func consume_jump_request() -> bool:
		if _jump_queued:
			_jump_queued = false
			return true
		return Input.is_physical_key_pressed(KEY_SPACE)


	func read_move_input() -> Vector2:
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


class GrenadeMarkerState:
	var has_target: bool = false
	var marker: MeshInstance3D
	var target_position: Vector3 = Vector3.ZERO


	func build(owner: FpsPlayerController) -> void:
		marker = MeshInstance3D.new()
		marker.name = "GrenadeMarker"
		var cylinder := CylinderMesh.new()
		cylinder.top_radius = 0.45
		cylinder.bottom_radius = 0.45
		cylinder.height = 0.05
		marker.mesh = cylinder
		var material := StandardMaterial3D.new()
		material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		material.albedo_color = Color("58d86d")
		material.emission_enabled = true
		material.emission = Color("58d86d")
		material.emission_energy_multiplier = 1.2
		marker.material_override = material
		marker.visible = false
		marker.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		marker.top_level = true
		owner.add_child(marker)


	func update(owner: FpsPlayerController, camera: Camera3D, projectile_parent: Node3D, max_distance: float) -> void:
		if camera == null or projectile_parent == null:
			return
		var origin: Vector3 = camera.global_position
		var direction: Vector3 = -camera.global_basis.z
		var query := PhysicsRayQueryParameters3D.create(origin, origin + (direction * max_distance))
		query.exclude = [owner]
		var hit: Dictionary = camera.get_world_3d().direct_space_state.intersect_ray(query)
		if hit.is_empty():
			has_target = false
			marker.visible = false
			return

		var normal: Vector3 = hit.get("normal", Vector3.UP)
		if normal.y < 0.55:
			has_target = false
			marker.visible = false
			return

		has_target = true
		target_position = hit.position
		marker.visible = true
		marker.global_position = target_position + Vector3(0.0, 0.03, 0.0)
