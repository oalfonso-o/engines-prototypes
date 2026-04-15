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
	info_label.size = Vector2(880.0, 300.0)
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
	var weapon_state: Dictionary = {}
	var shot_state: Dictionary = {}
	var crosshair_position := Vector2.ZERO
	if tracked_player != null:
		body_pos = tracked_player.global_position
		velocity = tracked_player.velocity
		on_floor = tracked_player.is_on_floor()
		weapon_state = tracked_player.get_weapon_debug_state()
		shot_state = tracked_player.get_last_shot_debug()
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

	var hit_rays := 0
	var blocked_rays := 0
	var miss_rays := 0
	if shot_state.has("rays"):
		for ray: Dictionary in shot_state["rays"]:
			match str(ray["status"]):
				"hit_enemy":
					hit_rays += 1
				"blocked":
					blocked_rays += 1
				_:
					miss_rays += 1

	var target_debug: Array[String] = []
	if tracked_targets_root != null:
		for child: Node in tracked_targets_root.get_children():
			if not child.has_method("apply_shot_damage"):
				continue
			var target = child
			target_debug.append("%s %.0f/%.0f" % [target.name, target.health, target.max_health])

	var weapon_name := str(weapon_state.get("weapon_name", "Weapon"))
	var ammo_in_magazine := int(weapon_state.get("ammo_in_magazine", 0))
	var reserve_ammo := int(weapon_state.get("reserve_ammo", 0))
	var rays_count := int(weapon_state.get("projectile_rays_count", 0))
	var damage_per_ray := float(weapon_state.get("damage_per_ray", 0.0))
	var total_damage := float(weapon_state.get("last_total_damage", 0.0))
	var reloading := bool(weapon_state.get("is_reloading", false))
	var reload_remaining := float(weapon_state.get("reload_remaining", 0.0))

	info_label.text = "\n".join([
		"FPS: %.1f" % fps,
		"Player: (%.2f, %.2f, %.2f) vel=(%.2f, %.2f, %.2f) on_floor=%s" % [body_pos.x, body_pos.y, body_pos.z, velocity.x, velocity.y, velocity.z, str(on_floor)],
		"Camera: (%.2f, %.2f, %.2f) ortho_size=%.2f" % [camera_pos.x, camera_pos.y, camera_pos.z, camera_size],
		"Weapon: %s ammo=%d/%d rays=%d dmg/ray=%.1f reload=%s %.2fs" % [weapon_name, ammo_in_magazine, reserve_ammo, rays_count, damage_per_ray, str(reloading), reload_remaining],
		"Last Shot: total=%.1f hit=%d blocked=%d miss=%d" % [total_damage, hit_rays, blocked_rays, miss_rays],
		"Map: tiles=%d ramps=%d floating neon platforms" % [tile_count, ramp_count],
		"Targets: %s" % ", ".join(target_debug),
		"Controls: WASD move  Space jump  Mouse aim  LMB fire  R reload  1/2 switch  F5 rebuild",
	])

	crosshair_label.position = crosshair_position - (crosshair_label.size * 0.5)
