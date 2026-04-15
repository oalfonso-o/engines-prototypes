extends Area2D
class_name SpacePlayerShip

const DEFAULT_SHIP_RADIUS: float = 24.0

@export var brake_speed: float = 130.0
@export var cruise_speed: float = 220.0
@export var rotation_speed: float = 2.8
@export var thrust_speed: float = 360.0

var ship_radius: float = DEFAULT_SHIP_RADIUS

var _fire_state: FireState
var _motion_state: MotionState
var _run_model: RunModel
var _weapon_progression: WeaponProgression
var _world_rect: Rect2
var _world_root: Node2D


func _ready() -> void:
	ShipBuilder.build(self, ship_radius)
	add_to_group("player_ship")


func _physics_process(delta: float) -> void:
	if _run_model == null or _run_model.is_game_over:
		return
	_motion_state.update(self, delta, _world_rect)
	_fire_state.update(self, _world_root, _weapon_progression, ship_radius, delta)


func setup(world_root: Node2D, run_model: RunModel, weapon_progression: WeaponProgression, world_rect: Rect2) -> void:
	_world_root = world_root
	_run_model = run_model
	_weapon_progression = weapon_progression
	_world_rect = world_rect
	_motion_state = MotionState.new(cruise_speed, thrust_speed, brake_speed, rotation_speed)
	_fire_state = FireState.new()


class ShipBuilder:
	static func build(owner: SpacePlayerShip, radius: float) -> void:
		var body := Polygon2D.new()
		body.name = "Body"
		body.polygon = PackedVector2Array([
			Vector2(radius, 0.0),
			Vector2(-radius * 0.65, -radius * 0.7),
			Vector2(-radius * 0.35, 0.0),
			Vector2(-radius * 0.65, radius * 0.7)
		])
		body.color = Color("87c7ff")
		owner.add_child(body)

		var tail_left := Polygon2D.new()
		tail_left.name = "TailLeft"
		tail_left.polygon = PackedVector2Array([
			Vector2(-radius * 0.85, -radius * 0.2),
			Vector2(-radius * 1.15, -radius * 0.55),
			Vector2(-radius * 0.75, -radius * 0.45)
		])
		tail_left.color = Color("d7efff")
		owner.add_child(tail_left)

		var tail_center := Polygon2D.new()
		tail_center.name = "TailCenter"
		tail_center.polygon = PackedVector2Array([
			Vector2(-radius * 0.95, -radius * 0.16),
			Vector2(-radius * 1.3, 0.0),
			Vector2(-radius * 0.95, radius * 0.16)
		])
		tail_center.color = Color("d7efff")
		owner.add_child(tail_center)

		var tail_right := Polygon2D.new()
		tail_right.name = "TailRight"
		tail_right.polygon = PackedVector2Array([
			Vector2(-radius * 0.85, radius * 0.2),
			Vector2(-radius * 1.15, radius * 0.55),
			Vector2(-radius * 0.75, radius * 0.45)
		])
		tail_right.color = Color("d7efff")
		owner.add_child(tail_right)

		var collision_shape := CollisionShape2D.new()
		collision_shape.name = "CollisionShape2D"
		var shape := CircleShape2D.new()
		shape.radius = radius
		collision_shape.shape = shape
		owner.add_child(collision_shape)


class MotionState:
	var _brake_speed: float
	var _cruise_speed: float
	var _current_speed: float
	var _rotation_speed: float
	var _thrust_speed: float


	func _init(cruise: float, thrust: float, brake: float, rotation_speed_value: float) -> void:
		_brake_speed = brake
		_cruise_speed = cruise
		_current_speed = cruise
		_rotation_speed = rotation_speed_value
		_thrust_speed = thrust


	func update(owner: SpacePlayerShip, delta: float, world_rect: Rect2) -> void:
		var turn_input: float = 0.0
		if Input.is_physical_key_pressed(KEY_A):
			turn_input -= 1.0
		if Input.is_physical_key_pressed(KEY_D):
			turn_input += 1.0
		owner.rotation += turn_input * _rotation_speed * delta

		var target_speed: float = _cruise_speed
		if Input.is_physical_key_pressed(KEY_W):
			target_speed = _thrust_speed
		elif Input.is_physical_key_pressed(KEY_S):
			target_speed = _brake_speed
		_current_speed = move_toward(_current_speed, target_speed, 320.0 * delta)

		var forward := Vector2.RIGHT.rotated(owner.rotation)
		owner.global_position += forward * _current_speed * delta
		owner.global_position = owner.global_position.clamp(world_rect.position, world_rect.end)


class FireState:
	var _cooldown: float = 0.0


	func update(
		owner: SpacePlayerShip,
		world_root: Node2D,
		weapon_progression: WeaponProgression,
		ship_radius: float,
		delta: float
	) -> void:
		_cooldown -= delta
		if _cooldown > 0.0:
			return
		_cooldown = weapon_progression.fire_interval
		var facing_direction := Vector2.RIGHT.rotated(owner.rotation)
		var nose_origin := owner.global_position + (facing_direction * ship_radius)
		world_root.spawn_player_projectiles(nose_origin, facing_direction, ship_radius)
