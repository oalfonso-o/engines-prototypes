extends StaticBody3D
class_name IsoTarget3D

const TARGET_GROUP := "damageable_targets"

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
var _health_bar_root: Node3D
var _health_bar_mesh: MeshInstance3D
var _health_bar_material: ShaderMaterial
var _shadow_mesh: MeshInstance3D

@onready var collision_shape: CollisionShape3D = _ensure_collision_shape()
@onready var visual_root: Node3D = _ensure_visual_root()


func _ready() -> void:
	add_to_group(TARGET_GROUP)
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
		_body_material.emission_energy_multiplier = lerp(_body_material.emission_energy_multiplier, 0.45, delta * 8.0)


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


func _respawn() -> void:
	health = max_health
	last_damage_taken = 0.0
	visible = true
	collision_shape.disabled = false
	if _body_material != null:
		_body_material.emission_energy_multiplier = 0.45
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

	_shadow_mesh = MeshInstance3D.new()
	_shadow_mesh.name = "BlobShadow"
	_shadow_mesh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var shadow_mesh := QuadMesh.new()
	shadow_mesh.size = Vector2(body_radius * 2.9, body_radius * 2.3)
	_shadow_mesh.mesh = shadow_mesh
	var shadow_material := ShaderMaterial.new()
	var shadow_shader := Shader.new()
	shadow_shader.code = """
shader_type spatial;
render_mode unshaded, cull_disabled, depth_draw_never;

uniform vec4 shadow_color : source_color = vec4(0.0, 0.0, 0.0, 0.62);

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
	_shadow_mesh.position = Vector3(0.0, 0.03, 0.0)
	_shadow_mesh.rotation_degrees = Vector3(-90.0, 0.0, 0.0)
	add_child(_shadow_mesh)

	_health_bar_root = Node3D.new()
	_health_bar_root.name = "HealthBarRoot"
	_health_bar_root.position = Vector3(0.0, body_height + 0.58, 0.0)
	add_child(_health_bar_root)

	var bar_width: float = 1.4
	var bar_height: float = 0.14

	_health_bar_mesh = MeshInstance3D.new()
	_health_bar_mesh.name = "HealthBar"
	_health_bar_mesh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var bar_mesh := QuadMesh.new()
	bar_mesh.size = Vector2(bar_width, bar_height)
	_health_bar_mesh.mesh = bar_mesh
	_health_bar_material = ShaderMaterial.new()
	_health_bar_material.render_priority = 100
	var shader := Shader.new()
	shader.code = """
shader_type spatial;
render_mode unshaded, cull_disabled, depth_draw_never, depth_test_disabled;

uniform float fill_ratio : hint_range(0.0, 1.0) = 1.0;
uniform vec4 base_color : source_color = vec4(1.0, 0.30, 0.34, 1.0);
uniform vec4 fill_color : source_color = vec4(0.39, 1.0, 0.45, 1.0);

void vertex() {
	mat4 model_view = VIEW_MATRIX * MODEL_MATRIX;
	model_view[0].xyz = vec3(length(MODEL_MATRIX[0].xyz), 0.0, 0.0);
	model_view[1].xyz = vec3(0.0, length(MODEL_MATRIX[1].xyz), 0.0);
	model_view[2].xyz = vec3(0.0, 0.0, 1.0);
	MODELVIEW_MATRIX = model_view;
}

void fragment() {
	vec2 uv = UV;
	vec3 color = base_color.rgb;
	if (uv.x <= fill_ratio) {
		color = fill_color.rgb;
	}
	ALBEDO = color;
	EMISSION = vec3(0.0);
	ALPHA = 1.0;
}
"""
	_health_bar_material.shader = shader
	_health_bar_mesh.material_override = _health_bar_material
	_health_bar_root.add_child(_health_bar_mesh)


func _update_health_label() -> void:
	if _health_bar_material == null:
		return
	var ratio: float = clampf(health / maxf(0.01, max_health), 0.0, 1.0)
	_health_bar_material.set_shader_parameter("fill_ratio", ratio)
