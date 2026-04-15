extends CanvasLayer
class_name DebugHud3D

var tracked_player: CharacterBody3D
var tracked_camera: Camera3D
var tracked_map: Node3D
var tracked_targets_root: Node3D
var info_label: Label
var crosshair_label: Label


func _ready() -> void:
	info_label = Label.new()
	info_label.name = "InfoLabel"
	info_label.position = Vector2(18.0, 16.0)
	info_label.size = Vector2(980.0, 340.0)
	info_label.autowrap_mode = TextServer.AUTOWRAP_OFF
	info_label.add_theme_font_size_override("font_size", 20)
	info_label.add_theme_color_override("font_color", Color("dffcff"))
	info_label.add_theme_color_override("font_outline_color", Color("001018"))
	info_label.add_theme_constant_override("outline_size", 4)
	add_child(info_label)

	crosshair_label = Label.new()
	crosshair_label.name = "CrosshairLabel"
	crosshair_label.text = "+"
	crosshair_label.size = Vector2(32.0, 32.0)
	crosshair_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	crosshair_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	crosshair_label.add_theme_font_size_override("font_size", 32)
	crosshair_label.add_theme_color_override("font_color", Color("7ffbff"))
	crosshair_label.add_theme_color_override("font_outline_color", Color("25002b"))
	crosshair_label.add_theme_constant_override("outline_size", 5)
	add_child(crosshair_label)


func attach(player_node: CharacterBody3D, camera_node: Camera3D, map_node: Node3D, targets_root: Node3D) -> void:
	tracked_player = player_node
	tracked_camera = camera_node
	tracked_map = map_node
	tracked_targets_root = targets_root


func _process(_delta: float) -> void:
	if info_label == null:
		return

	var fps: float = Engine.get_frames_per_second()
	var body_pos: Vector3 = Vector3.ZERO
	var velocity: Vector3 = Vector3.ZERO
	var on_floor := false
	var ability_state: Dictionary = {}
	var cast_state: Dictionary = {}
	var crosshair_position := Vector2.ZERO
	if tracked_player != null:
		body_pos = tracked_player.global_position
		velocity = tracked_player.velocity
		on_floor = tracked_player.is_on_floor()
		ability_state = tracked_player.get_ability_debug_state()
		cast_state = tracked_player.get_last_cast_debug()
		crosshair_position = tracked_player.get_crosshair_screen_position()

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

	var target_debug: Array[String] = []
	if tracked_targets_root != null:
		for child: Node in tracked_targets_root.get_children():
			if not child.has_method("apply_shot_damage"):
				continue
			target_debug.append("%s %.0f/%.0f" % [child.name, child.health, child.max_health])

	var selected_id := str(ability_state.get("selected_ability_id", ""))
	var selected_name := str(ability_state.get("selected_display_name", ""))
	var wide_cd := _cooldown_label(ability_state.get("wide", {}))
	var narrow_cd := _cooldown_label(ability_state.get("narrow", {}))
	var grenade_cd := _cooldown_label(ability_state.get("grenade", {}))
	var cast_point: Vector3 = cast_state.get("target_point", Vector3.ZERO)
	var impact_point: Vector3 = cast_state.get("impact_point", Vector3.ZERO)

	info_label.text = "\n".join([
		"FPS: %.1f" % fps,
		"Player: (%.2f, %.2f, %.2f) vel=(%.2f, %.2f, %.2f) on_floor=%s" % [body_pos.x, body_pos.y, body_pos.z, velocity.x, velocity.y, velocity.z, str(on_floor)],
		"Camera: (%.2f, %.2f, %.2f) ortho_size=%.2f" % [camera_pos.x, camera_pos.y, camera_pos.z, camera_size],
		"Selected: %s (%s)   Cooldowns -> 1:%s  2:%s  F:%s" % [selected_name, selected_id, wide_cd, narrow_cd, grenade_cd],
		"Last Cast: %s mode=%s dmg=%.1f target=(%.2f, %.2f, %.2f) impact=(%.2f, %.2f, %.2f)" % [
			str(cast_state.get("ability_id", "")),
			str(cast_state.get("mode", "")),
			float(cast_state.get("damage", 0.0)),
			cast_point.x,
			cast_point.y,
			cast_point.z,
			impact_point.x,
			impact_point.y,
			impact_point.z,
		],
		"Map: tiles=%d ramps=%d floating neon platforms" % [tile_count, ramp_count],
		"Targets: %s" % ", ".join(target_debug),
		"Controls: WASD move  Space jump  1 wide beam  2 narrow beam  F grenade  LMB cast  F5 rebuild",
	])

	crosshair_label.position = crosshair_position - (crosshair_label.size * 0.5)
	crosshair_label.add_theme_color_override("font_color", _crosshair_color(selected_id))


func _cooldown_label(entry: Dictionary) -> String:
	if entry.is_empty():
		return "-"
	if bool(entry.get("ready", false)):
		return "ready"
	return "%.2fs" % float(entry.get("cooldown_remaining", 0.0))


func _crosshair_color(selected_id: String) -> Color:
	match selected_id:
		"wide":
			return Color("4fd8ff")
		"narrow":
			return Color("dcff6b")
		"grenade":
			return Color("ffb45d")
		_:
			return Color("7ffbff")
