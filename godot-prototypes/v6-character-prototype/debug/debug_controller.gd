extends Node

const EXPLOSION_DISTANCE: float = 1.8
const EXPLOSION_FORCE: float = 8.6
const EXPLOSION_OFFSET: Vector3 = Vector3(0.35, 0.0, 0.45)
const EXPLOSION_MARKER_LIFETIME: float = 0.4

var _last_explosion_origin: Vector3 = Vector3.ZERO

@onready var _sandbox: Node3D = get_parent() as Node3D
@onready var _character = _sandbox.get_node("CharacterPrototype")
@onready var _info_label: Label = _sandbox.get_node("DebugHud/InfoLabel") as Label


func _ready() -> void:
	DebugView.update_label(_info_label, _character, _last_explosion_origin)


func _process(_delta: float) -> void:
	DebugView.update_label(_info_label, _character, _last_explosion_origin)


func _unhandled_input(event: InputEvent) -> void:
	if InputActions.should_trigger_explosion(event):
		_last_explosion_origin = ExplosionDebug.trigger(_sandbox, _character)


class InputActions:
	static func should_trigger_explosion(event: InputEvent) -> bool:
		return event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_G


class ExplosionDebug:
	static func trigger(sandbox: Node3D, character) -> Vector3:
		var explosion_origin: Vector3 = ExplosionDebug._compute_origin(character)
		character.apply_explosion_impulse(explosion_origin, EXPLOSION_FORCE)
		DebugView.spawn_explosion_marker(sandbox, explosion_origin, EXPLOSION_MARKER_LIFETIME)
		return explosion_origin


	static func _compute_origin(character) -> Vector3:
		return character.global_position + (character.facing_direction * -EXPLOSION_DISTANCE) + EXPLOSION_OFFSET


class DebugView:
	static func update_label(label: Label, character, last_origin: Vector3) -> void:
		label.text = "WASD move  Space jump  G explosion\nPos %s  Vel %s\nFacing %s  Last explosion %s" % [
			DebugView._snapped_vec3(character.global_position),
			DebugView._snapped_vec3(character.velocity),
			DebugView._snapped_vec3(character.facing_direction),
			DebugView._snapped_vec3(last_origin),
		]


	static func spawn_explosion_marker(owner: Node3D, origin: Vector3, lifetime: float) -> void:
		var marker := MeshInstance3D.new()
		marker.top_level = true
		marker.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		marker.mesh = DebugView._build_marker_mesh()
		marker.material_override = DebugView._build_marker_material()
		owner.add_child(marker)
		marker.global_position = origin + Vector3(0.0, 0.18, 0.0)
		var timer := owner.get_tree().create_timer(lifetime)
		timer.timeout.connect(func() -> void:
			if is_instance_valid(marker):
				marker.queue_free()
		)


	static func _build_marker_mesh() -> SphereMesh:
		var mesh := SphereMesh.new()
		mesh.radius = 0.18
		mesh.height = 0.36
		return mesh


	static func _build_marker_material() -> StandardMaterial3D:
		var material := StandardMaterial3D.new()
		material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		material.albedo_color = Color("ff8e5b")
		material.emission_enabled = true
		material.emission = Color("ff8e5b")
		material.emission_energy_multiplier = 1.2
		return material


	static func _snapped_vec3(value: Vector3) -> String:
		return "(%.2f, %.2f, %.2f)" % [value.x, value.y, value.z]
