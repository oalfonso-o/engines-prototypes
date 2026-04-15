extends Node3D
class_name ShotDebugDrawer

@export var line_lifetime: float = 0.25
@export var impact_marker_size: float = 0.18
@export var target_marker_size: float = 0.12

var _entries: Array = []
var _mesh_instance: MeshInstance3D


func _ready() -> void:
	top_level = true
	_mesh_instance = MeshInstance3D.new()
	_mesh_instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(_mesh_instance)


func submit_shot(shot_result: Dictionary) -> void:
	_entries.append({
		"ttl": line_lifetime,
		"start": shot_result.get("origin", Vector3.ZERO),
		"end": shot_result.get("impact_position", Vector3.ZERO),
		"color": shot_result.get("debug_color", Color("48d8ff")),
		"target_point": shot_result.get("target_point", Vector3.ZERO),
		"has_target_point": shot_result.get("target", null) != null,
	})
	_rebuild_mesh()


func _process(delta: float) -> void:
	if _entries.is_empty():
		return
	var dirty := false
	for index in range(_entries.size() - 1, -1, -1):
		_entries[index]["ttl"] -= delta
		if _entries[index]["ttl"] <= 0.0:
			_entries.remove_at(index)
			dirty = true
	if dirty:
		_rebuild_mesh()


func _rebuild_mesh() -> void:
	if _entries.is_empty():
		_mesh_instance.mesh = null
		return

	var mesh := ImmediateMesh.new()
	mesh.surface_begin(Mesh.PRIMITIVE_LINES)
	for entry: Dictionary in _entries:
		mesh.surface_set_color(entry["color"])
		mesh.surface_add_vertex(entry["start"])
		mesh.surface_add_vertex(entry["end"])
		_add_impact_cross(mesh, entry["end"], entry["color"], impact_marker_size)
		if entry["has_target_point"]:
			_add_impact_cross(mesh, entry["target_point"], Color("ffe58b"), target_marker_size)
	mesh.surface_end()
	_mesh_instance.mesh = mesh


func _add_impact_cross(mesh: ImmediateMesh, point: Vector3, color: Color, size: float) -> void:
	mesh.surface_set_color(color)
	mesh.surface_add_vertex(point + Vector3(-size, 0.0, 0.0))
	mesh.surface_add_vertex(point + Vector3(size, 0.0, 0.0))
	mesh.surface_add_vertex(point + Vector3(0.0, -size, 0.0))
	mesh.surface_add_vertex(point + Vector3(0.0, size, 0.0))
	mesh.surface_add_vertex(point + Vector3(0.0, 0.0, -size))
	mesh.surface_add_vertex(point + Vector3(0.0, 0.0, size))
