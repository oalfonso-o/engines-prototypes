extends CharacterBody3D
class_name IsoPlayer3D

const AbilityConfigScript = preload("res://scripts/ability_config.gd")
const AbilityStateScript = preload("res://scripts/ability_state.gd")
const AbilityPreviewScript = preload("res://scripts/ability_preview.gd")
const LinearSkillshotScript = preload("res://scripts/linear_skillshot.gd")
const GrenadeProjectileScript = preload("res://scripts/grenade_projectile.gd")

const WORLD_COLLISION_MASK := 1

signal ability_selected(ability_id: String)
signal ability_cast(result: Dictionary)

@export var move_speed: float = 9.0
@export var jump_velocity: float = 8.5
@export var gravity_force: float = 22.0
@export var air_control: float = 0.65
@export var body_radius: float = 0.36
@export var body_height: float = 1.75
@export var line_cast_height_offset: float = 0.18
@export var grenade_origin_height: float = 1.1
@export var wide_skill_config: Resource = AbilityConfigScript.new()
@export var narrow_skill_config: Resource = AbilityConfigScript.new()
@export var grenade_skill_config: Resource = AbilityConfigScript.new()

var attached_camera: Camera3D
var projectile_root: Node3D
var targets_root: Node3D
var map_root: Node3D

var debug_move_input: Vector2 = Vector2.ZERO
var debug_input_enabled := false
var debug_jump_queued := false
var debug_cast_queued := false
var debug_aim_world_enabled := false
var debug_aim_world_point := Vector3.ZERO

var _ability_states: Dictionary = {}
var _selected_ability_id: String = ""
var _crosshair_screen_position: Vector2 = Vector2.ZERO
var _last_cast_debug: Dictionary = {}
var _preview: Node3D
var _ground_reference_y: float = 0.0
var _current_visual_facing: Vector3 = Vector3.FORWARD
var _shadow_mesh: MeshInstance3D

@onready var collision_shape: CollisionShape3D = _ensure_collision_shape()
@onready var visual_root: Node3D = _ensure_visual_root()


func _ready() -> void:
	collision_layer = 2
	collision_mask = WORLD_COLLISION_MASK
	_setup_collision()
	_setup_visuals()
	_setup_abilities()
	_setup_preview()
	_ground_reference_y = global_position.y
	_last_cast_debug = _empty_cast_debug()


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
		_ground_reference_y = global_position.y

	if _consume_jump() and is_on_floor():
		velocity.y = jump_velocity

	move_and_slide()

	_update_crosshair_position()
	_update_ability_states(delta)
	_handle_ability_selection_input()
	_update_preview()
	_handle_cast_input()
	_update_visuals()


func attach_camera(camera_node: Camera3D) -> void:
	attached_camera = camera_node


func attach_world(projectiles_node: Node3D, targets_node: Node3D, map_node: Node3D) -> void:
	projectile_root = projectiles_node
	targets_root = targets_node
	map_root = map_node


func set_debug_move_input(input_vector: Vector2) -> void:
	debug_input_enabled = true
	debug_move_input = input_vector


func clear_debug_input() -> void:
	debug_input_enabled = false
	debug_move_input = Vector2.ZERO


func request_debug_jump() -> void:
	debug_jump_queued = true


func request_debug_cast() -> void:
	debug_cast_queued = true


func set_debug_aim_world_point(world_point: Vector3) -> void:
	debug_aim_world_enabled = true
	debug_aim_world_point = world_point


func clear_debug_aim_world_point() -> void:
	debug_aim_world_enabled = false


func select_ability(ability_id: String) -> void:
	if not _ability_states.has(ability_id):
		return
	_selected_ability_id = ability_id
	emit_signal("ability_selected", ability_id)


func reset_motion() -> void:
	velocity = Vector3.ZERO


func snap_to_floor() -> void:
	apply_floor_snap()


func get_crosshair_screen_position() -> Vector2:
	return _crosshair_screen_position


func get_selected_ability_id() -> String:
	return _selected_ability_id


func get_ability_debug_state() -> Dictionary:
	var result: Dictionary = {
		"selected_ability_id": _selected_ability_id,
		"selected_display_name": "",
	}
	for ability_id: String in _ability_states.keys():
		var ability_state = _ability_states[ability_id]
		result[ability_id] = {
			"display_name": ability_state.config.display_name,
			"cooldown_remaining": ability_state.cooldown_remaining,
			"ready": ability_state.can_cast(),
		}
	if _ability_states.has(_selected_ability_id):
		result["selected_display_name"] = _ability_states[_selected_ability_id].config.display_name
	return result


func get_last_cast_debug() -> Dictionary:
	return _last_cast_debug


func get_visual_facing_direction() -> Vector3:
	return _current_visual_facing


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
	var aim_direction := _current_visual_aim_direction()
	if aim_direction.length_squared() > 0.0001:
		_current_visual_facing = aim_direction.normalized()
		visual_root.rotation.y = atan2(_current_visual_facing.x, _current_visual_facing.z)
	_update_shadow()


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


func _update_ability_states(delta: float) -> void:
	for ability_state in _ability_states.values():
		ability_state.update(delta)


func _handle_ability_selection_input() -> void:
	if Input.is_key_pressed(KEY_1):
		select_ability("wide")
	elif Input.is_key_pressed(KEY_2):
		select_ability("narrow")
	elif Input.is_key_pressed(KEY_F):
		select_ability("grenade")


func _update_preview() -> void:
	if _preview == null:
		return
	if _selected_ability_id.is_empty():
		_preview.clear_preview()
		return

	var ability_state = _ability_states.get(_selected_ability_id, null)
	if ability_state == null:
		_preview.clear_preview()
		return

	if ability_state.config.preview_mode == "linear":
		var linear_origin: Vector3 = _get_linear_origin(ability_state.config, Vector3.FORWARD)
		var aim_point: Vector3 = _current_linear_aim_point(linear_origin.y)
		_preview.show_linear_preview(
			_get_preview_origin(),
			_flat_direction_to(aim_point),
			ability_state.config.range,
			ability_state.config.width,
			ability_state.config.preview_color
		)
	else:
		var aim_point: Vector3 = _current_aim_world_point()
		_preview.show_circle_preview(
			aim_point + Vector3(0.0, 0.05, 0.0),
			ability_state.config.explosion_radius,
			ability_state.config.preview_color
		)


func _handle_cast_input() -> void:
	if _selected_ability_id.is_empty():
		return
	var cast_requested := false
	if debug_cast_queued:
		debug_cast_queued = false
		cast_requested = true
	elif Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
		cast_requested = true

	if not cast_requested:
		return

	var ability_state = _ability_states.get(_selected_ability_id, null)
	if ability_state == null or not ability_state.can_cast():
		return

	var result: Dictionary = {}
	if ability_state.config.preview_mode == "linear":
		var preview_origin: Vector3 = _get_linear_origin(ability_state.config, Vector3.FORWARD)
		var aim_point: Vector3 = _current_linear_aim_point(preview_origin.y)
		result = _cast_linear(ability_state.config, aim_point)
	else:
		var aim_point: Vector3 = _current_aim_world_point()
		result = _cast_grenade(ability_state.config, aim_point)

	ability_state.consume_cast()
	_last_cast_debug = result
	emit_signal("ability_cast", result)


func _cast_linear(config: Resource, aim_point: Vector3) -> Dictionary:
	var direction: Vector3 = _flat_direction_to(aim_point)
	if direction.length_squared() <= 0.0001:
		direction = Vector3.FORWARD
	var origin: Vector3 = _get_linear_origin(config, direction)
	var projectile := LinearSkillshotScript.new()
	projectile_root.add_child(projectile)
	projectile.configure(config, origin, direction, self)
	return {
		"ability_id": config.ability_id,
		"mode": "linear",
		"origin": origin,
		"target_point": aim_point,
		"impact_point": origin + (direction * config.range),
		"damage": config.damage,
		"cooldown": config.cooldown,
	}


func _cast_grenade(config: Resource, aim_point: Vector3) -> Dictionary:
	var origin: Vector3 = _get_grenade_origin()
	var projectile := GrenadeProjectileScript.new()
	projectile_root.add_child(projectile)
	projectile.configure(config, origin, aim_point)
	return {
		"ability_id": config.ability_id,
		"mode": "grenade",
		"origin": origin,
		"target_point": aim_point,
		"impact_point": aim_point,
		"damage": config.damage,
		"cooldown": config.cooldown,
	}


func _current_aim_world_point() -> Vector3:
	if debug_aim_world_enabled:
		return debug_aim_world_point

	if attached_camera == null:
		return global_position + Vector3.FORWARD * 10.0

	var viewport := get_viewport()
	if viewport == null:
		return global_position + Vector3.FORWARD * 10.0

	var screen_position: Vector2 = viewport.get_mouse_position()
	var ray_origin: Vector3 = attached_camera.project_ray_origin(screen_position)
	var ray_direction: Vector3 = attached_camera.project_ray_normal(screen_position)
	var query: PhysicsRayQueryParameters3D = PhysicsRayQueryParameters3D.create(ray_origin, ray_origin + (ray_direction * 400.0), WORLD_COLLISION_MASK, [get_rid()])
	query.collide_with_areas = false
	query.collide_with_bodies = true
	var hit: Dictionary = get_world_3d().direct_space_state.intersect_ray(query)
	if not hit.is_empty():
		return hit["position"]

	var plane := Plane(Vector3.UP, _ground_reference_y)
	var plane_hit: Variant = plane.intersects_ray(ray_origin, ray_direction)
	if plane_hit == null:
		return global_position + (Vector3(ray_direction.x, 0.0, ray_direction.z).normalized() * 12.0)
	return plane_hit


func _current_linear_aim_point(plane_height: float) -> Vector3:
	if debug_aim_world_enabled:
		return debug_aim_world_point

	if attached_camera == null:
		return global_position + Vector3.FORWARD * 10.0

	var viewport := get_viewport()
	if viewport == null:
		return global_position + Vector3.FORWARD * 10.0

	var screen_position: Vector2 = viewport.get_mouse_position()
	var ray_origin: Vector3 = attached_camera.project_ray_origin(screen_position)
	var ray_direction: Vector3 = attached_camera.project_ray_normal(screen_position)
	var plane := Plane(Vector3.UP, plane_height)
	var hit: Variant = plane.intersects_ray(ray_origin, ray_direction)
	if hit == null:
		return global_position + (Vector3(ray_direction.x, 0.0, ray_direction.z).normalized() * 12.0)
	return hit


func _get_preview_origin() -> Vector3:
	return Vector3(global_position.x, global_position.y + (body_height * 0.62), global_position.z)


func _get_linear_origin(config: Resource, direction: Vector3) -> Vector3:
	var base_y: float = global_position.y if config.affects_jump_height else _ground_reference_y
	var chest_origin := Vector3(global_position.x, base_y + (body_height * 0.62), global_position.z)
	var launch_clearance: float = body_radius + 0.42
	var flat_direction := Vector3(direction.x, 0.0, direction.z).normalized()
	if flat_direction.length_squared() <= 0.0001:
		flat_direction = Vector3.FORWARD
	return chest_origin + (flat_direction * launch_clearance)


func _get_grenade_origin() -> Vector3:
	return Vector3(global_position.x, _ground_reference_y + grenade_origin_height, global_position.z)


func _flat_direction_to(point: Vector3) -> Vector3:
	var direction := point - global_position
	direction.y = 0.0
	if direction.length_squared() <= 0.0001:
		if attached_camera != null:
			var fallback := -attached_camera.global_basis.z
			fallback.y = 0.0
			if fallback.length_squared() > 0.0001:
				return fallback.normalized()
		return Vector3.FORWARD
	return direction.normalized()


func _current_visual_aim_direction() -> Vector3:
	if _selected_ability_id.is_empty():
		return _current_visual_facing

	var ability_state = _ability_states.get(_selected_ability_id, null)
	if ability_state == null:
		return _current_visual_facing

	if ability_state.config.preview_mode == "linear":
		var linear_origin: Vector3 = _get_linear_origin(ability_state.config, Vector3.FORWARD)
		var aim_point: Vector3 = _current_linear_aim_point(linear_origin.y)
		return _flat_direction_to(aim_point)

	return _flat_direction_to(_current_aim_world_point())


func _setup_abilities() -> void:
	if wide_skill_config.ability_id == "ability":
		wide_skill_config.ability_id = "wide"
		wide_skill_config.display_name = "Wide Beam"
		wide_skill_config.preview_mode = "linear"
		wide_skill_config.damage = 35.0
		wide_skill_config.cooldown = 0.2
		wide_skill_config.range = 22.0
		wide_skill_config.width = body_radius * 6.0
		wide_skill_config.projectile_height = 1.35
		wide_skill_config.travel_time = 0.2
		wide_skill_config.affects_jump_height = true
		wide_skill_config.preview_color = Color("4fd8ff")
		wide_skill_config.projectile_color = Color("84efff")

	if narrow_skill_config.ability_id == "ability":
		narrow_skill_config.ability_id = "narrow"
		narrow_skill_config.display_name = "Narrow Beam"
		narrow_skill_config.preview_mode = "linear"
		narrow_skill_config.damage = 35.0
		narrow_skill_config.cooldown = 0.2
		narrow_skill_config.range = 22.0
		narrow_skill_config.width = body_radius * 2.2
		narrow_skill_config.projectile_height = 1.05
		narrow_skill_config.travel_time = 0.2
		narrow_skill_config.affects_jump_height = true
		narrow_skill_config.preview_color = Color("b8f45d")
		narrow_skill_config.projectile_color = Color("dcff6b")

	if grenade_skill_config.ability_id == "ability":
		grenade_skill_config.ability_id = "grenade"
		grenade_skill_config.display_name = "Grenade"
		grenade_skill_config.preview_mode = "circle"
		grenade_skill_config.damage = 35.0
		grenade_skill_config.cooldown = 0.2
		grenade_skill_config.travel_time = 0.2
		grenade_skill_config.explosion_radius = 2.4
		grenade_skill_config.affects_jump_height = false
		grenade_skill_config.preview_color = Color("ff9d55")
		grenade_skill_config.projectile_color = Color("ffb45d")

	_ability_states = {
		"wide": AbilityStateScript.new(wide_skill_config),
		"narrow": AbilityStateScript.new(narrow_skill_config),
		"grenade": AbilityStateScript.new(grenade_skill_config),
	}
	select_ability("wide")


func _setup_preview() -> void:
	_preview = AbilityPreviewScript.new()
	_preview.name = "AbilityPreview"
	add_child(_preview)


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

	var body_material := ShaderMaterial.new()
	var shader := Shader.new()
	shader.code = """
shader_type spatial;
render_mode unshaded, cull_disabled;

uniform vec4 front_color : source_color = vec4(1.0, 0.97, 0.92, 1.0);
uniform vec4 back_color : source_color = vec4(0.44, 0.96, 0.92, 1.0);

varying float local_forward;

void vertex() {
	local_forward = VERTEX.z;
}

void fragment() {
	vec3 color = (local_forward >= 0.0) ? front_color.rgb : back_color.rgb;
	ALBEDO = color;
	EMISSION = color * 0.28;
	ALPHA = 1.0;
}
"""
	body_material.shader = shader

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

	_shadow_mesh = MeshInstance3D.new()
	_shadow_mesh.name = "BlobShadow"
	_shadow_mesh.top_level = true
	_shadow_mesh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var shadow_mesh := QuadMesh.new()
	shadow_mesh.size = Vector2(body_radius * 2.8, body_radius * 2.2)
	_shadow_mesh.mesh = shadow_mesh
	var shadow_material := ShaderMaterial.new()
	var shadow_shader := Shader.new()
	shadow_shader.code = """
shader_type spatial;
render_mode unshaded, cull_disabled, depth_draw_never;

uniform vec4 shadow_color : source_color = vec4(0.0, 0.0, 0.0, 0.72);

void fragment() {
	vec2 p = (UV - vec2(0.5)) * vec2(2.0, 2.0);
	float d = dot(p, p);
	float alpha = shadow_color.a * (1.0 - smoothstep(0.18, 1.0, d));
	ALBEDO = shadow_color.rgb;
	ALPHA = alpha;
}
"""
	shadow_material.shader = shadow_shader
	_shadow_mesh.material_override = shadow_material
	add_child(_shadow_mesh)
	_update_shadow()


func _empty_cast_debug() -> Dictionary:
	return {
		"ability_id": "",
		"mode": "",
		"origin": Vector3.ZERO,
		"target_point": Vector3.ZERO,
		"impact_point": Vector3.ZERO,
		"damage": 0.0,
		"cooldown": 0.0,
	}


func _update_shadow() -> void:
	if _shadow_mesh == null:
		return
	var shadow_y: float = _ground_reference_y + 0.03
	_shadow_mesh.global_position = Vector3(global_position.x, shadow_y, global_position.z)
	var shadow_scale: float = 1.0
	if not is_on_floor():
		var air_height: float = max(0.0, global_position.y - _ground_reference_y)
		shadow_scale = clampf(1.0 - (air_height * 0.12), 0.62, 1.0)
	_shadow_mesh.rotation_degrees = Vector3(-90.0, 0.0, 0.0)
	_shadow_mesh.scale = Vector3(shadow_scale, shadow_scale, 1.0)
