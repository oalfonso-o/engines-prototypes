extends CanvasLayer
class_name DebugHud3D

var tracked_player: CharacterBody3D
var tracked_camera: Camera3D
var tracked_map
var info_label: Label


func _ready() -> void:
	info_label = Label.new()
	info_label.name = "InfoLabel"
	info_label.position = Vector2(18.0, 16.0)
	info_label.size = Vector2(640.0, 180.0)
	info_label.autowrap_mode = TextServer.AUTOWRAP_OFF
	info_label.add_theme_font_size_override("font_size", 20)
	info_label.add_theme_color_override("font_color", Color("dffcff"))
	info_label.add_theme_color_override("font_outline_color", Color("001018"))
	info_label.add_theme_constant_override("outline_size", 4)
	add_child(info_label)


func attach(player_node: CharacterBody3D, camera_node: Camera3D, map_node: Node3D) -> void:
	tracked_player = player_node
	tracked_camera = camera_node
	tracked_map = map_node


func _process(_delta: float) -> void:
	if info_label == null:
		return

	var fps := Engine.get_frames_per_second()
	var body_pos := Vector3.ZERO
	var velocity := Vector3.ZERO
	var on_floor := false
	if tracked_player != null:
		body_pos = tracked_player.global_position
		velocity = tracked_player.velocity
		on_floor = tracked_player.is_on_floor()

	var camera_pos := Vector3.ZERO
	var camera_size := 0.0
	if tracked_camera != null:
		camera_pos = tracked_camera.global_position
		camera_size = tracked_camera.size

	var tile_count := 0
	var ramp_count := 0
	if tracked_map != null:
		tile_count = tracked_map.tile_count
		ramp_count = tracked_map.ramp_count

	info_label.text = "\n".join([
		"FPS: %.1f" % fps,
		"Player: (%.2f, %.2f, %.2f)  vel=(%.2f, %.2f, %.2f)  on_floor=%s" % [body_pos.x, body_pos.y, body_pos.z, velocity.x, velocity.y, velocity.z, str(on_floor)],
		"Camera: (%.2f, %.2f, %.2f)  ortho_size=%.2f" % [camera_pos.x, camera_pos.y, camera_pos.z, camera_size],
		"Map: tiles=%d ramps=%d floating neon platforms" % [tile_count, ramp_count],
	])
