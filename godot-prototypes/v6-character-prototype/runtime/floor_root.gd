extends StaticBody3D

const FLOOR_SIZE: Vector3 = Vector3(18.0, 0.6, 18.0)
const FLOOR_CENTER_OFFSET: Vector3 = Vector3(0.0, -0.3, 0.0)


func _ready() -> void:
	var collision_node := CollisionShape3D.new()
	collision_node.name = "CollisionShape3D"
	add_child(collision_node)

	var mesh_node := MeshInstance3D.new()
	mesh_node.name = "MeshInstance3D"
	add_child(mesh_node)

	var box := BoxShape3D.new()
	box.size = FLOOR_SIZE
	collision_node.shape = box
	collision_node.position = FLOOR_CENTER_OFFSET

	var mesh := BoxMesh.new()
	mesh.size = FLOOR_SIZE
	mesh_node.mesh = mesh
	mesh_node.position = FLOOR_CENTER_OFFSET
	mesh_node.material_override = _build_floor_material()
	physics_material_override = null


func _build_floor_material() -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_PER_PIXEL
	material.albedo_color = Color("2c353f")
	material.roughness = 0.85
	return material
