extends StaticBody3D
class_name IsoTarget3D

signal damaged(amount: float, remaining_health: float)
signal eliminated()

@export var max_health: float = 100.0
@export var body_radius: float = 0.38
@export var body_height: float = 1.8
@export var respawn_delay: float = 2.2

var health: float = 100.0
var last_damage_taken: float = 0.0
var _respawn_remaining: float = 0.0
var _body_material: StandardMaterial3D
var _pending_core_color: Color = Color("ffd07a")
var _health_label: Label3D
var _is_targeted := false

@onready var collision_shape: CollisionShape3D = _ensure_collision_shape()
@onready var visual_root: Node3D = _ensure_visual_root()


func _ready() -> void:
	collision_layer = 4
	collision_mask = 1
	health = max_health
	_setup_collision()
	_setup_visuals()
	_update_health_label()


func _process(delta: float) -> void:
	if _respawn_remaining > 0.0:
		_respawn_remaining = max(0.0, _respawn_remaining - delta)
		if _respawn_remaining <= 0.0:
			_respawn()
	elif _body_material != null:
		var target_emission: float = 1.05 if _is_targeted else 0.45
		_body_material.emission_energy_multiplier = lerp(_body_material.emission_energy_multiplier, target_emission, delta * 8.0)


func apply_shot_damage(amount: float, _hit_points: Array = []) -> void:
	if _respawn_remaining > 0.0:
		return
	last_damage_taken = amount
	health = max(0.0, health - amount)
	_update_health_label()
	if _body_material != null:
		_body_material.emission_energy_multiplier = 1.2
	emit_signal("damaged", amount, health)
	if health <= 0.0:
		_respawn_remaining = respawn_delay
		visible = false
		collision_shape.disabled = true
		emit_signal("eliminated")


func setup_palette(core_color: Color) -> void:
	_pending_core_color = core_color
	if _body_material != null:
		_body_material.albedo_color = core_color
		_body_material.emission = core_color.lightened(0.2)
	if _health_label != null:
		_health_label.modulate = core_color.lightened(0.35)


func get_target_point() -> Vector3:
	return global_position + Vector3(0.0, body_height * 0.82, 0.0)


func set_targeting_highlight(enabled: bool) -> void:
	_is_targeted = enabled
	if _body_material != null:
		_body_material.emission_energy_multiplier = 1.05 if enabled else 0.45


func _respawn() -> void:
	health = max_health
	last_damage_taken = 0.0
	visible = true
	collision_shape.disabled = false
	if _body_material != null:
		_body_material.emission_energy_multiplier = 1.05 if _is_targeted else 0.45
	_update_health_label()


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
	capsule.height = max(0.5, body_height - (body_radius * 2.0))
	collision_shape.shape = capsule
	collision_shape.position = Vector3(0.0, body_height * 0.5, 0.0)


func _setup_visuals() -> void:
	for child in visual_root.get_children():
		child.queue_free()

	_body_material = StandardMaterial3D.new()
	_body_material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	_body_material.albedo_color = _pending_core_color
	_body_material.emission_enabled = true
	_body_material.emission = _pending_core_color.lightened(0.2)
	_body_material.emission_energy_multiplier = 0.45

	var torso := MeshInstance3D.new()
	var torso_mesh := CapsuleMesh.new()
	torso_mesh.radius = body_radius
	torso_mesh.height = body_height * 0.72
	torso.mesh = torso_mesh
	torso.material_override = _body_material
	visual_root.add_child(torso)

	var head := MeshInstance3D.new()
	var head_mesh := SphereMesh.new()
	head_mesh.radius = body_radius * 0.68
	head.mesh = head_mesh
	head.material_override = _body_material
	head.position = Vector3(0.0, body_height * 0.64, 0.0)
	visual_root.add_child(head)

	_health_label = Label3D.new()
	_health_label.name = "HealthLabel"
	_health_label.position = Vector3(0.0, body_height + 0.55, 0.0)
	_health_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	_health_label.font_size = 46
	_health_label.modulate = _pending_core_color.lightened(0.35)
	_health_label.outline_size = 8
	_health_label.text = ""
	add_child(_health_label)


func _update_health_label() -> void:
	if _health_label == null:
		return
	_health_label.text = "%.0f/%.0f" % [health, max_health]
