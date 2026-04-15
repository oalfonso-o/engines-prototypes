extends Node3D
class_name AbilityPreview3D

var _linear_mesh_instance: MeshInstance3D
var _circle_mesh_instance: MeshInstance3D
var _linear_material: StandardMaterial3D
var _circle_material: StandardMaterial3D
const PREVIEW_ALPHA := 0.08


func _ready() -> void:
	top_level = true

	_linear_material = _make_material(Color("55d9ff"))
	_circle_material = _make_material(Color("ffb45d"))

	_linear_mesh_instance = MeshInstance3D.new()
	_linear_mesh_instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	_linear_mesh_instance.visible = false
	add_child(_linear_mesh_instance)

	_circle_mesh_instance = MeshInstance3D.new()
	_circle_mesh_instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	_circle_mesh_instance.visible = false
	add_child(_circle_mesh_instance)


func clear_preview() -> void:
	_linear_mesh_instance.visible = false
	_circle_mesh_instance.visible = false


func show_linear_preview(origin: Vector3, direction: Vector3, length: float, width: float, color: Color) -> void:
	clear_preview()
	var flat_direction := Vector3(direction.x, 0.0, direction.z)
	if flat_direction.length_squared() <= 0.0001:
		return
	flat_direction = flat_direction.normalized()

	var mesh := BoxMesh.new()
	mesh.size = Vector3(width, 0.04, length)
	_linear_mesh_instance.mesh = mesh
	_linear_material.albedo_color = Color(color.r, color.g, color.b, PREVIEW_ALPHA)
	_linear_material.emission = color
	_linear_mesh_instance.material_override = _linear_material
	_linear_mesh_instance.visible = true
	_linear_mesh_instance.global_position = origin + (flat_direction * (length * 0.5))
	_linear_mesh_instance.look_at(_linear_mesh_instance.global_position + flat_direction, Vector3.UP, true)
	_linear_mesh_instance.rotate_object_local(Vector3.UP, PI)


func show_circle_preview(center: Vector3, radius: float, color: Color) -> void:
	clear_preview()
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = 0.04
	mesh.radial_segments = 32
	_circle_mesh_instance.mesh = mesh
	_circle_material.albedo_color = Color(color.r, color.g, color.b, PREVIEW_ALPHA)
	_circle_material.emission = color
	_circle_mesh_instance.material_override = _circle_material
	_circle_mesh_instance.visible = true
	_circle_mesh_instance.global_position = center


func _make_material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material.albedo_color = Color(color.r, color.g, color.b, PREVIEW_ALPHA)
	material.emission_enabled = true
	material.emission = color
	material.emission_energy_multiplier = 0.8
	material.no_depth_test = false
	return material
