extends Node3D

const FpsPlayerScript := preload("res://runtime/engine/fps_player.gd")
const HudRootScript := preload("res://runtime/engine/hud_root.gd")

const BRIDGE_COLOR := Color("170703")
const FLOOR_COLOR := Color("130d0a")
const GLOW_COLOR := Color("ff8d1f")
const GLOW_HIGHLIGHT_COLOR := Color("ffd166")
const INNER_PANEL_COLOR := Color("2a120b")
const RAIL_COLOR := Color("ffb347")
const TRACK_COLOR := Color("080808")
const TUNNEL_WALL_COLOR := Color("4b2315")

const AMBIENT_LIGHT_ENERGY: float = 0.3
const CAMERA_LEAD_SEGMENTS: float = 2.0
const CAMERA_HEIGHT_RATIO: float = 0.18
const CAMERA_PITCH_DEGREES: float = -5.0
const FLOOR_CLEARANCE: float = 0.04
const FLOOR_COLLIDER_THICKNESS: float = 0.42
const FLOOR_THICKNESS: float = 0.12
const FLOOR_WIDTH_RATIO: float = 1.72
const GLOW_STRIP_DEPTH_RATIO: float = 0.12
const GLOW_STRIP_WIDTH_RATIO: float = 0.14
const INSET_DEPTH_RATIO: float = 0.36
const INSET_WIDTH_RATIO: float = 0.72
const LIGHT_ENERGY: float = 2.4
const LIGHT_INTERVAL: int = 4
const LIGHT_RANGE: float = 18.0
const OUTER_PANEL_LENGTH_RATIO: float = 0.88
const OUTER_PANEL_WIDTH_RATIO: float = 0.96
const PLAYER_SPAWN_SEGMENT_INDEX: int = 1
const PLAYER_SPAWN_Y_OFFSET: float = 0.06
const RAIL_ELEVATION: float = 0.08
const RAIL_OFFSET_RATIO: float = 0.22
const SEGMENT_RIB_LENGTH: float = 0.14
const TRACK_THICKNESS: float = 0.06
const TRACK_WIDTH_RATIO: float = 0.46

@export var segment_count: int = 30
@export var segment_spacing: float = 2.9
@export var tunnel_radius: float = 3.6
@export var polygon_side_count: int = 8
@export var emissive_intensity: float = 2.8
@export var panel_depth: float = 0.42
@export var rail_width: float = 0.12


func _ready() -> void:
	SceneBuilder.new(
		self,
		SceneConfig.new(
			segment_count,
			segment_spacing,
			tunnel_radius,
			polygon_side_count,
			emissive_intensity,
			panel_depth,
			rail_width
		)
	).build()


func apply_explosion(origin: Vector3, radius: float, force: float) -> void:
	ExplosionSystem.apply(self, origin, radius, force)


class SceneConfig:
	var emissive_intensity: float
	var panel_depth: float
	var polygon_side_count: int
	var rail_width: float
	var segment_count: int
	var segment_spacing: float
	var tunnel_radius: float


	func _init(
		p_segment_count: int,
		p_segment_spacing: float,
		p_tunnel_radius: float,
		p_polygon_side_count: int,
		p_emissive_intensity: float,
		p_panel_depth: float,
		p_rail_width: float
	) -> void:
		segment_count = maxi(p_segment_count, 24)
		segment_spacing = maxf(p_segment_spacing, 1.5)
		tunnel_radius = maxf(p_tunnel_radius, 2.0)
		polygon_side_count = maxi(p_polygon_side_count, 6)
		emissive_intensity = maxf(p_emissive_intensity, 0.1)
		panel_depth = maxf(p_panel_depth, 0.12)
		rail_width = maxf(p_rail_width, 0.04)


	func segment_center_z(segment_index: int) -> float:
		return -(float(segment_index) + CAMERA_LEAD_SEGMENTS) * segment_spacing


	func tunnel_center_z() -> float:
		return segment_center_z(int(float(segment_count) * 0.5))


	func tunnel_length() -> float:
		return float(segment_count) * segment_spacing


	func floor_center_y() -> float:
		return -tunnel_radius + FLOOR_CLEARANCE


	func floor_surface_y() -> float:
		return floor_center_y() + (FLOOR_THICKNESS * 0.5)


	func floor_width() -> float:
		return tunnel_radius * FLOOR_WIDTH_RATIO


	func track_width() -> float:
		return tunnel_radius * TRACK_WIDTH_RATIO


	func track_center_y() -> float:
		return floor_surface_y() + (TRACK_THICKNESS * 0.5)


	func track_surface_y() -> float:
		return track_center_y() + (TRACK_THICKNESS * 0.5)


	func player_spawn_position() -> Vector3:
		return Vector3(
			0.0,
			floor_surface_y() + PLAYER_SPAWN_Y_OFFSET,
			segment_center_z(PLAYER_SPAWN_SEGMENT_INDEX)
		)


class SceneBuilder:
	var _config: SceneConfig
	var _material_library: MaterialLibrary
	var _owner: Node3D


	func _init(owner: Node3D, config: SceneConfig) -> void:
		_owner = owner
		_config = config
		_material_library = MaterialLibrary.new(config)


	func build() -> void:
		_owner.add_child(EnvironmentBuilder.build())
		_owner.add_child(CameraBuilder.build(_config))
		_owner.add_child(TunnelBuilder.build(_config, _material_library))
		_owner.add_child(FloorBuilder.build_floor(_config, _material_library))
		_owner.add_child(TrackBuilder.build_track(_config, _material_library))
		_owner.add_child(TrackBuilder.build_rail("RailLeft", -1.0, _config, _material_library))
		_owner.add_child(TrackBuilder.build_rail("RailRight", 1.0, _config, _material_library))
		_owner.add_child(LightBuilder.build(_config))
		_owner.add_child(ProjectilesBuilder.build())
		_owner.add_child(PlayerBuilder.build(_config, _owner))
		_owner.add_child(HudBuilder.build())


class EnvironmentBuilder:
	static func build() -> WorldEnvironment:
		var world_environment := WorldEnvironment.new()
		world_environment.name = "WorldEnvironment"
		world_environment.environment = _build_environment()
		return world_environment


	static func _build_environment() -> Environment:
		var environment := Environment.new()
		environment.background_mode = Environment.BG_COLOR
		environment.background_color = BRIDGE_COLOR
		environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
		environment.ambient_light_color = GLOW_COLOR
		environment.ambient_light_energy = AMBIENT_LIGHT_ENERGY
		environment.glow_enabled = true
		environment.glow_intensity = 0.7
		environment.glow_strength = 1.05
		environment.fog_enabled = true
		environment.fog_density = 0.028
		environment.fog_light_color = GLOW_COLOR
		environment.fog_sun_scatter = 0.0
		return environment


class CameraBuilder:
	static func build(config: SceneConfig) -> Camera3D:
		var camera := Camera3D.new()
		camera.name = "Camera3D"
		camera.current = false
		camera.fov = 76.0
		camera.position = Vector3(
			0.0,
			-(config.tunnel_radius * CAMERA_HEIGHT_RATIO),
			segment_offset(config)
		)
		camera.rotation_degrees.x = CAMERA_PITCH_DEGREES
		return camera


	static func segment_offset(config: SceneConfig) -> float:
		return config.segment_spacing * 1.35


class MaterialLibrary:
	var _config: SceneConfig
	var _floor_material: StandardMaterial3D
	var _glow_material: StandardMaterial3D
	var _inner_panel_material: StandardMaterial3D
	var _rail_material: StandardMaterial3D
	var _rib_material: StandardMaterial3D
	var _track_material: StandardMaterial3D
	var _wall_material: StandardMaterial3D


	func _init(config: SceneConfig) -> void:
		_config = config
		_wall_material = _build_surface_material(TUNNEL_WALL_COLOR, GLOW_COLOR.darkened(0.25), _config.emissive_intensity * 0.2)
		_inner_panel_material = _build_surface_material(INNER_PANEL_COLOR, GLOW_COLOR.darkened(0.45), _config.emissive_intensity * 0.1)
		_floor_material = _build_surface_material(FLOOR_COLOR, GLOW_COLOR.darkened(0.55), _config.emissive_intensity * 0.06)
		_glow_material = _build_glow_material(GLOW_COLOR, _config.emissive_intensity)
		_rib_material = _build_glow_material(GLOW_HIGHLIGHT_COLOR, _config.emissive_intensity * 1.15)
		_track_material = _build_surface_material(TRACK_COLOR, TRACK_COLOR, 0.0)
		_rail_material = _build_glow_material(RAIL_COLOR, _config.emissive_intensity * 1.05)


	func glow_material() -> StandardMaterial3D:
		return _glow_material


	func inner_panel_material() -> StandardMaterial3D:
		return _inner_panel_material


	func floor_material() -> StandardMaterial3D:
		return _floor_material


	func rail_material() -> StandardMaterial3D:
		return _rail_material


	func rib_material() -> StandardMaterial3D:
		return _rib_material


	func track_material() -> StandardMaterial3D:
		return _track_material


	func wall_material() -> StandardMaterial3D:
		return _wall_material


	static func _build_glow_material(color: Color, energy: float) -> StandardMaterial3D:
		var material := StandardMaterial3D.new()
		material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		material.albedo_color = color
		material.emission_enabled = true
		material.emission = color
		material.emission_energy_multiplier = energy
		return material


	static func _build_surface_material(color: Color, emission_color: Color, emission_energy: float) -> StandardMaterial3D:
		var material := StandardMaterial3D.new()
		material.shading_mode = BaseMaterial3D.SHADING_MODE_PER_PIXEL
		material.albedo_color = color
		material.roughness = 0.68
		material.metallic = 0.18
		material.emission_enabled = emission_energy > 0.0
		material.emission = emission_color
		material.emission_energy_multiplier = emission_energy
		return material


class TunnelBuilder:
	static func build(config: SceneConfig, material_library: MaterialLibrary) -> Node3D:
		var tunnel_root := Node3D.new()
		tunnel_root.name = "TunnelRoot"

		for segment_index: int in range(config.segment_count):
			tunnel_root.add_child(_build_segment(segment_index, config, material_library))

		return tunnel_root


	static func _build_segment(
		segment_index: int,
		config: SceneConfig,
		material_library: MaterialLibrary
	) -> Node3D:
		var segment := Node3D.new()
		segment.name = "Segment%02d" % segment_index
		segment.position.z = config.segment_center_z(segment_index)

		var side_step: float = TAU / float(config.polygon_side_count)
		var panel_width: float = 2.0 * config.tunnel_radius * tan(PI / float(config.polygon_side_count))
		for side_index: int in range(config.polygon_side_count):
			var angle: float = (-PI * 0.5) + (float(side_index) * side_step)
			segment.add_child(_build_wall_panel(angle, panel_width, config, material_library))
			segment.add_child(_build_inset_panel(angle, panel_width, config, material_library))
			segment.add_child(_build_glow_strip(angle, panel_width, config, material_library))
			segment.add_child(_build_segment_rib(angle, panel_width, config, material_library))

		return segment


	static func _build_wall_panel(
		angle: float,
		panel_width: float,
		config: SceneConfig,
		material_library: MaterialLibrary
	) -> StaticBody3D:
		var panel_size := Vector3(
			panel_width * OUTER_PANEL_WIDTH_RATIO,
			config.panel_depth,
			config.segment_spacing * OUTER_PANEL_LENGTH_RATIO
		)
		var body := StaticBody3D.new()
		var collision := CollisionShape3D.new()
		collision.shape = GeometryBuilder.build_box_shape(panel_size)
		body.add_child(collision)
		var mesh := MeshInstance3D.new()
		mesh.mesh = GeometryBuilder.build_box_mesh(panel_size)
		mesh.material_override = material_library.wall_material()
		body.add_child(mesh)
		GeometryBuilder.place_tunnel_piece(
			body,
			angle,
			config.tunnel_radius + (config.panel_depth * 0.5)
		)
		return body


	static func _build_inset_panel(
		angle: float,
		panel_width: float,
		config: SceneConfig,
		material_library: MaterialLibrary
	) -> MeshInstance3D:
		var inset_depth: float = config.panel_depth * INSET_DEPTH_RATIO
		var mesh := MeshInstance3D.new()
		mesh.mesh = GeometryBuilder.build_box_mesh(
			Vector3(
				panel_width * INSET_WIDTH_RATIO,
				inset_depth,
				config.segment_spacing * 0.6
			)
		)
		mesh.material_override = material_library.inner_panel_material()
		GeometryBuilder.place_tunnel_piece(
			mesh,
			angle,
			config.tunnel_radius + (config.panel_depth * 0.62)
		)
		return mesh


	static func _build_glow_strip(
		angle: float,
		panel_width: float,
		config: SceneConfig,
		material_library: MaterialLibrary
	) -> MeshInstance3D:
		var mesh := MeshInstance3D.new()
		mesh.mesh = GeometryBuilder.build_box_mesh(
			Vector3(
				panel_width * GLOW_STRIP_WIDTH_RATIO,
				config.panel_depth * GLOW_STRIP_DEPTH_RATIO,
				config.segment_spacing * 0.54
			)
		)
		mesh.material_override = material_library.glow_material()
		GeometryBuilder.place_tunnel_piece(
			mesh,
			angle,
			config.tunnel_radius + (config.panel_depth * 0.06)
		)
		return mesh


	static func _build_segment_rib(
		angle: float,
		panel_width: float,
		config: SceneConfig,
		material_library: MaterialLibrary
	) -> MeshInstance3D:
		var mesh := MeshInstance3D.new()
		mesh.mesh = GeometryBuilder.build_box_mesh(
			Vector3(
				panel_width * 0.9,
				config.panel_depth * 0.18,
				SEGMENT_RIB_LENGTH
			)
		)
		mesh.material_override = material_library.rib_material()
		GeometryBuilder.place_tunnel_piece(
			mesh,
			angle,
			config.tunnel_radius + (config.panel_depth * 0.12)
		)
		mesh.position.z -= (config.segment_spacing * 0.36)
		return mesh


class TrackBuilder:
	static func build_track(config: SceneConfig, material_library: MaterialLibrary) -> MeshInstance3D:
		var track := MeshInstance3D.new()
		track.name = "Track"
		track.mesh = GeometryBuilder.build_box_mesh(
			Vector3(
				config.track_width(),
				TRACK_THICKNESS,
				config.tunnel_length()
			)
		)
		track.position = Vector3(0.0, config.track_center_y(), config.tunnel_center_z())
		track.material_override = material_library.track_material()
		return track


	static func build_rail(
		node_name: String,
		side_sign: float,
		config: SceneConfig,
		material_library: MaterialLibrary
	) -> MeshInstance3D:
		var mesh := MeshInstance3D.new()
		mesh.name = node_name
		mesh.mesh = GeometryBuilder.build_box_mesh(
			Vector3(config.rail_width, config.rail_width, config.tunnel_length())
		)
		mesh.position = Vector3(
			config.tunnel_radius * RAIL_OFFSET_RATIO * side_sign,
			config.track_surface_y() + RAIL_ELEVATION,
			config.tunnel_center_z()
		)
		mesh.material_override = material_library.rail_material()
		return mesh


class FloorBuilder:
	static func build_floor(config: SceneConfig, material_library: MaterialLibrary) -> StaticBody3D:
		var floor_body := StaticBody3D.new()
		floor_body.name = "Floor"
		floor_body.position = Vector3(0.0, config.floor_center_y(), config.tunnel_center_z())

		var collision := CollisionShape3D.new()
		collision.name = "CollisionShape3D"
		collision.shape = GeometryBuilder.build_box_shape(
			Vector3(config.floor_width(), FLOOR_COLLIDER_THICKNESS, config.tunnel_length())
		)
		collision.position.y = -((FLOOR_COLLIDER_THICKNESS - FLOOR_THICKNESS) * 0.5)
		floor_body.add_child(collision)

		var mesh := MeshInstance3D.new()
		mesh.mesh = GeometryBuilder.build_box_mesh(
			Vector3(config.floor_width(), FLOOR_THICKNESS, config.tunnel_length())
		)
		mesh.material_override = material_library.floor_material()
		floor_body.add_child(mesh)
		return floor_body


class LightBuilder:
	static func build(config: SceneConfig) -> Node3D:
		var light_rig := Node3D.new()
		light_rig.name = "LightRig"

		for light_index: int in range(0, config.segment_count, LIGHT_INTERVAL):
			var light := OmniLight3D.new()
			light.name = "GlowLight%02d" % light_index
			light.position = Vector3(
				0.0,
				config.tunnel_radius * 0.55,
				config.segment_center_z(light_index)
			)
			light.light_color = GLOW_COLOR
			light.light_energy = LIGHT_ENERGY
			light.omni_range = LIGHT_RANGE
			light_rig.add_child(light)

		return light_rig


class ProjectilesBuilder:
	static func build() -> Node3D:
		var projectiles := Node3D.new()
		projectiles.name = "Projectiles"
		return projectiles


class PlayerBuilder:
	static func build(config: SceneConfig, world_root: Node3D) -> FpsPlayerController:
		var player: FpsPlayerController = FpsPlayerScript.new()
		player.name = "Player"
		player.position = config.player_spawn_position()
		player.projectile_parent = world_root.get_node("Projectiles") as Node3D
		player.world_root = world_root
		player.weapon_damage = 0
		return player


class HudBuilder:
	static func build() -> CanvasLayer:
		var hud: CanvasLayer = HudRootScript.new()
		hud.name = "Hud"
		return hud


class ExplosionSystem:
	static func apply(owner: Node3D, origin: Vector3, radius: float, force: float) -> void:
		var characters: Array[Node] = owner.get_tree().get_nodes_in_group("launchable_character")
		for node: Node in characters:
			if not node.has_method("apply_explosion_impulse"):
				continue
			if not (node is Node3D):
				continue
			var distance: float = (node as Node3D).global_position.distance_to(origin)
			if distance > radius:
				continue
			var attenuation: float = 1.0 - (distance / radius)
			node.apply_explosion_impulse(origin, force * attenuation)


class GeometryBuilder:
	static func build_box_mesh(size: Vector3) -> BoxMesh:
		var mesh := BoxMesh.new()
		mesh.size = size
		return mesh


	static func build_box_shape(size: Vector3) -> BoxShape3D:
		var shape := BoxShape3D.new()
		shape.size = size
		return shape


	static func place_tunnel_piece(piece: Node3D, angle: float, radial_distance: float) -> void:
		piece.position = Vector3.RIGHT.rotated(Vector3.FORWARD, angle) * radial_distance
		piece.rotation.z = angle
