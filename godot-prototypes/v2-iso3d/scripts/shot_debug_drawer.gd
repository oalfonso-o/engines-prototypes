extends Node3D
class_name ShotDebugDrawer

@export var line_lifetime: float = 0.18
@export var impact_marker_size: float = 0.16

var _entries: Array = []
var _mesh_instance: MeshInstance3D


func _ready() -> void:
	top_level = true
	_mesh_instance = MeshInstance3D.new()
	_mesh_instance.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(_mesh_instance)


func submit_shot(rays: Array) -> void:
	for ray in rays:
		var color := Color("48d8ff")
		if ray["status"] == "blocked":
			color = Color("ff4bc6")
		elif ray["status"] == "hit_enemy":
			color = Color("7dff6f")
		_entries.append({
			"ttl": line_lifetime,
			"start": ray["start"],
			"end": ray["end"],
			"color": color,
			"status": ray["status"],
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
	for entry in _entries:
		mesh.surface_set_color(entry["color"])
		mesh.surface_add_vertex(entry["start"])
		mesh.surface_add_vertex(entry["end"])
		if entry["status"] != "miss":
			_add_impact_cross(mesh, entry["end"], entry["color"])
	mesh.surface_end()
	_mesh_instance.mesh = mesh


func _add_impact_cross(mesh: ImmediateMesh, point: Vector3, color: Color) -> void:
	var size := impact_marker_size
	mesh.surface_set_color(color)
	mesh.surface_add_vertex(point + Vector3(-size, 0.0, 0.0))
	mesh.surface_add_vertex(point + Vector3(size, 0.0, 0.0))
	mesh.surface_add_vertex(point + Vector3(0.0, -size, 0.0))
	mesh.surface_add_vertex(point + Vector3(0.0, size, 0.0))
	mesh.surface_add_vertex(point + Vector3(0.0, 0.0, -size))
	mesh.surface_add_vertex(point + Vector3(0.0, 0.0, size))
