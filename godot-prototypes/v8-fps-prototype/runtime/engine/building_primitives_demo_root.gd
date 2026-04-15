extends Node3D

const BuildingLayoutScript := preload("res://runtime/logic/building_layout.gd")
const ExplosionImpulseSolverScript := preload("res://runtime/logic/explosion_impulse_solver.gd")
const FpsPlayerScript := preload("res://runtime/engine/fps_player.gd")

const BUILDING_COLOR: Color = Color("8f8478")
const GROUND_COLOR: Color = Color("64735f")
const INTERIOR_COLOR: Color = Color("6f6258")
const ROOF_COLOR: Color = Color("49453f")
const TRIM_COLOR: Color = Color("b6aa95")


func _ready() -> void:
	SceneBuilder.new(self, BuildingLayoutScript.new()).build()


func apply_explosion(origin: Vector3, radius: float, impulse_force: float) -> void:
	ExplosionApplier.apply(self, origin, radius, impulse_force)


class SceneBuilder:
	var _layout: BuildingLayout
	var _owner: Node3D


	func _init(owner: Node3D, layout: BuildingLayout) -> void:
		_owner = owner
		_layout = layout


	func build() -> void:
		_owner.add_child(WorldBuilder.build_environment())
		_owner.add_child(WorldBuilder.build_light())
		_owner.add_child(GroundBuilder.build(_layout))
		_owner.add_child(BuildingBuilder.build(_layout))
		var projectiles_root: Node3D = ProjectilesBuilder.build()
		_owner.add_child(projectiles_root)
		_owner.add_child(PlayerBuilder.build(_layout, projectiles_root, _owner))


class LayoutMetrics:
	const BALCONY_DEPTH: float = 2.4
	const BALCONY_WIDTH_RATIO: float = 0.42
	const BACK_ROOM_DEPTH_RATIO: float = 0.3
	const GROUND_THICKNESS: float = 1.0
	const LANDING_DEPTH: float = 1.0
	const LANDING_WIDTH: float = 2.8
	const SIDE_OPENING_DEPTH: float = 2.6
	const WALL_THICKNESS: float = 0.25


	static func floor_base_y(floor_index: int) -> float:
		return float(floor_index) * BuildingLayoutScript.FLOOR_HEIGHT


	static func floor_slab_center_y(floor_index: int) -> float:
		if floor_index == 0:
			return GroundBuilder.surface_y() - (BuildingLayoutScript.FLOOR_THICKNESS * 0.5)
		return floor_base_y(floor_index) + (BuildingLayoutScript.FLOOR_THICKNESS * 0.5)


	static func floor_surface_y(floor_index: int) -> float:
		if floor_index == 0:
			return GroundBuilder.surface_y()
		return floor_base_y(floor_index) + BuildingLayoutScript.FLOOR_THICKNESS


	static func wall_height() -> float:
		return BuildingLayoutScript.FLOOR_HEIGHT - BuildingLayoutScript.FLOOR_THICKNESS


	static func wall_center_y(floor_index: int) -> float:
		return floor_surface_y(floor_index) + (wall_height() * 0.5)


	static func roof_center_y(layout: BuildingLayout) -> float:
		return floor_base_y(layout.floor_count()) + (BuildingLayoutScript.FLOOR_THICKNESS * 0.5)


	static func front_z() -> float:
		return BuildingLayoutScript.FOOTPRINT.y * 0.5


	static func back_z() -> float:
		return -front_z()


	static func left_x() -> float:
		return -(BuildingLayoutScript.FOOTPRINT.x * 0.5)


	static func right_x() -> float:
		return -left_x()


	static func side_wall_x(side_sign: float) -> float:
		return (BuildingLayoutScript.FOOTPRINT.x * 0.5 * side_sign) - (WALL_THICKNESS * 0.5 * side_sign)


	static func front_wall_z() -> float:
		return front_z() - (WALL_THICKNESS * 0.5)


	static func back_wall_z() -> float:
		return back_z() + (WALL_THICKNESS * 0.5)


	static func footprint_size() -> Vector2:
		return BuildingLayoutScript.FOOTPRINT


	static func ground_size() -> Vector2:
		return BuildingLayoutScript.EXTERIOR_GROUND_SIZE


class StairRoute:
	var destination_floor_index: int
	var name: String
	var side_x: float
	var start_floor_index: int
	var start_z: float
	var z_direction: float


	func _init(
		p_name: String,
		p_start_floor_index: int,
		p_destination_floor_index: int,
		p_side_x: float,
		p_start_z: float,
		p_z_direction: float
	) -> void:
		name = p_name
		start_floor_index = p_start_floor_index
		destination_floor_index = p_destination_floor_index
		side_x = p_side_x
		start_z = p_start_z
		z_direction = p_z_direction


	func run_length() -> float:
		return StairBuilder.STEP_DEPTH * float(StairBuilder.STAIR_STEP_COUNT - 1)


	func top_step_z() -> float:
		return start_z + (z_direction * run_length())


	func opening_center() -> Vector3:
		return Vector3(side_x, LayoutMetrics.floor_slab_center_y(destination_floor_index), top_step_z())


	func opening_size() -> Vector3:
		return Vector3(
			StairBuilder.STAIR_WIDTH + 0.8,
			BuildingLayoutScript.FLOOR_THICKNESS,
			StairBuilder.STEP_DEPTH + 1.4
		)


	func landing_center() -> Vector3:
		return Vector3(
			side_x,
			LayoutMetrics.floor_slab_center_y(destination_floor_index),
			top_step_z() + (z_direction * (LayoutMetrics.LANDING_DEPTH * 0.25))
		)


class WorldBuilder:
	static func build_environment() -> WorldEnvironment:
		var world_environment: WorldEnvironment = WorldEnvironment.new()
		world_environment.name = "WorldEnvironment"
		var environment: Environment = Environment.new()
		environment.background_mode = Environment.BG_COLOR
		environment.background_color = Color("c9d5dc")
		environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
		environment.ambient_light_color = Color("f4efe5")
		environment.ambient_light_energy = 1.0
		world_environment.environment = environment
		return world_environment


	static func build_light() -> DirectionalLight3D:
		var light: DirectionalLight3D = DirectionalLight3D.new()
		light.name = "SunLight"
		light.light_energy = 1.8
		light.rotation_degrees = Vector3(-54.0, -30.0, 0.0)
		return light


class ProjectilesBuilder:
	static func build() -> Node3D:
		var projectiles_root: Node3D = Node3D.new()
		projectiles_root.name = "Projectiles"
		return projectiles_root


class GroundBuilder:
	static func build(_layout: BuildingLayout) -> StaticBody3D:
		var ground_size: Vector2 = LayoutMetrics.ground_size()
		return GeometryBuilder.build_block(
			"Ground",
			Vector3(0.0, -(LayoutMetrics.GROUND_THICKNESS * 0.5), 0.0),
			Vector3(ground_size.x, LayoutMetrics.GROUND_THICKNESS, ground_size.y),
			GROUND_COLOR
		)


	static func surface_y() -> float:
		return 0.0


class BuildingBuilder:
	static func build(layout: BuildingLayout) -> Node3D:
		var root: Node3D = Node3D.new()
		root.name = "BuildingRoot"
		root.add_child(FloorBuilder.build(layout))
		root.add_child(AccessBuilder.build(layout))
		root.add_child(WallBuilder.build(layout))
		root.add_child(RoomBuilder.build(layout))
		root.add_child(StairBuilder.build(layout))
		root.add_child(BalconyBuilder.build(layout))
		root.add_child(RoofBuilder.build(layout))
		return root


class FloorBuilder:
	static func build(layout: BuildingLayout) -> Node3D:
		var floors_root: Node3D = Node3D.new()
		floors_root.name = "FloorSlabs"
		for floor_index: int in range(layout.floor_count()):
			floors_root.add_child(build_floor_slab(layout, floor_index))
		return floors_root


	static func build_floor_slab(layout: BuildingLayout, floor_index: int) -> Node3D:
		var opening_route: StairRoute = StairBuilder.route_for_destination_floor(layout, floor_index)
		if opening_route == null:
			return GeometryBuilder.build_block(
				"FloorSlab%d" % floor_index,
				Vector3(0.0, LayoutMetrics.floor_slab_center_y(floor_index), 0.0),
				Vector3(
					LayoutMetrics.footprint_size().x,
					BuildingLayoutScript.FLOOR_THICKNESS,
					LayoutMetrics.footprint_size().y
				),
				TRIM_COLOR
			)

		return _build_floor_with_opening(floor_index, opening_route)


	static func _build_floor_with_opening(floor_index: int, route: StairRoute) -> Node3D:
		var slab_root: Node3D = Node3D.new()
		slab_root.name = "FloorSlab%d" % floor_index
		var footprint: Vector2 = LayoutMetrics.footprint_size()
		var opening_center: Vector3 = route.opening_center()
		var opening_size: Vector3 = route.opening_size()
		var opening_left: float = opening_center.x - (opening_size.x * 0.5)
		var opening_right: float = opening_center.x + (opening_size.x * 0.5)
		var opening_front: float = opening_center.z + (opening_size.z * 0.5)
		var opening_back: float = opening_center.z - (opening_size.z * 0.5)

		slab_root.add_child(
			GeometryBuilder.build_centered_strip(
				"FrontStrip",
				LayoutMetrics.floor_slab_center_y(floor_index),
				0.0,
				opening_front,
				footprint.x,
				LayoutMetrics.front_z() - opening_front,
				TRIM_COLOR
			)
		)
		slab_root.add_child(
			GeometryBuilder.build_centered_strip(
				"BackStrip",
				LayoutMetrics.floor_slab_center_y(floor_index),
				0.0,
				LayoutMetrics.back_z(),
				footprint.x,
				opening_back - LayoutMetrics.back_z(),
				TRIM_COLOR
			)
		)
		slab_root.add_child(
			GeometryBuilder.build_centered_strip(
				"LeftStrip",
				LayoutMetrics.floor_slab_center_y(floor_index),
				(LayoutMetrics.left_x() + opening_left) * 0.5,
				opening_center.z,
				opening_left - LayoutMetrics.left_x(),
				opening_size.z,
				TRIM_COLOR
			)
		)
		slab_root.add_child(
			GeometryBuilder.build_centered_strip(
				"RightStrip",
				LayoutMetrics.floor_slab_center_y(floor_index),
				(opening_right + LayoutMetrics.right_x()) * 0.5,
				opening_center.z,
				LayoutMetrics.right_x() - opening_right,
				opening_size.z,
				TRIM_COLOR
			)
		)
		return slab_root


class WallBuilder:
	const DOOR_HEIGHT: float = 2.2
	const DOOR_WIDTH: float = 3.6
	const WINDOW_OPENING_WIDTH: float = 1.3


	static func build(layout: BuildingLayout) -> Node3D:
		var walls_root: Node3D = Node3D.new()
		walls_root.name = "ExteriorWalls"
		var wall_material: Material = HybridMaterialFactory.build()
		for floor_index: int in range(layout.floor_count()):
			walls_root.add_child(_build_front_wall(layout, floor_index, wall_material))
			walls_root.add_child(_build_back_wall(floor_index, wall_material))
			walls_root.add_child(_build_side_wall("LeftWall_Floor%d" % floor_index, -1.0, floor_index, wall_material))
			walls_root.add_child(_build_side_wall("RightWall_Floor%d" % floor_index, 1.0, floor_index, wall_material))
		return walls_root


	static func _build_front_wall(layout: BuildingLayout, floor_index: int, wall_material: Material) -> Node3D:
		var front_root: Node3D = Node3D.new()
		front_root.name = "FrontWall_Floor%d" % floor_index
		var wall_z: float = LayoutMetrics.front_wall_z()
		var wall_height: float = LayoutMetrics.wall_height()
		var footprint: Vector2 = LayoutMetrics.footprint_size()
		if floor_index == 0:
			var side_width: float = (footprint.x - DOOR_WIDTH) * 0.5
			front_root.add_child(
				GeometryBuilder.build_block_with_material(
					"DoorLeft",
					Vector3(-((DOOR_WIDTH * 0.5) + (side_width * 0.5)), LayoutMetrics.wall_center_y(floor_index), wall_z),
					Vector3(side_width, wall_height, LayoutMetrics.WALL_THICKNESS),
					wall_material
				)
			)
			front_root.add_child(
				GeometryBuilder.build_block_with_material(
					"DoorRight",
					Vector3((DOOR_WIDTH * 0.5) + (side_width * 0.5), LayoutMetrics.wall_center_y(floor_index), wall_z),
					Vector3(side_width, wall_height, LayoutMetrics.WALL_THICKNESS),
					wall_material
				)
			)
			var header_height: float = wall_height - DOOR_HEIGHT
			front_root.add_child(
				GeometryBuilder.build_block_with_material(
					"DoorHeader",
					Vector3(0.0, LayoutMetrics.floor_surface_y(floor_index) + DOOR_HEIGHT + (header_height * 0.5), wall_z),
					Vector3(DOOR_WIDTH, header_height, LayoutMetrics.WALL_THICKNESS),
					wall_material
				)
			)
			return front_root

		var column_count: int = layout.window_count_for_floor(floor_index) + 1
		var column_width: float = (footprint.x - (WINDOW_OPENING_WIDTH * float(layout.window_count_for_floor(floor_index)))) / float(column_count)
		var left_edge: float = LayoutMetrics.left_x()
		for column_index: int in range(column_count):
			var column_left: float = left_edge + (float(column_index) * (column_width + WINDOW_OPENING_WIDTH))
			front_root.add_child(
				GeometryBuilder.build_block_with_material(
					"FrontColumn%d" % column_index,
					Vector3(column_left + (column_width * 0.5), LayoutMetrics.wall_center_y(floor_index), wall_z),
					Vector3(column_width, wall_height, LayoutMetrics.WALL_THICKNESS),
					wall_material
				)
			)
		return front_root


	static func _build_back_wall(floor_index: int, wall_material: Material) -> StaticBody3D:
		var footprint: Vector2 = LayoutMetrics.footprint_size()
		return GeometryBuilder.build_block_with_material(
			"BackWall_Floor%d" % floor_index,
			Vector3(0.0, LayoutMetrics.wall_center_y(floor_index), LayoutMetrics.back_wall_z()),
			Vector3(footprint.x, LayoutMetrics.wall_height(), LayoutMetrics.WALL_THICKNESS),
			wall_material
		)


	static func _build_side_wall(block_name: String, side_sign: float, floor_index: int, wall_material: Material) -> Node3D:
		var side_root: Node3D = Node3D.new()
		side_root.name = block_name
		var footprint: Vector2 = LayoutMetrics.footprint_size()
		var segment_depth: float = (footprint.y - LayoutMetrics.SIDE_OPENING_DEPTH) * 0.5
		var wall_x: float = LayoutMetrics.side_wall_x(side_sign)
		side_root.add_child(
			GeometryBuilder.build_block_with_material(
				"FrontSegment",
				Vector3(wall_x, LayoutMetrics.wall_center_y(floor_index), (LayoutMetrics.front_z() - (segment_depth * 0.5))),
				Vector3(LayoutMetrics.WALL_THICKNESS, LayoutMetrics.wall_height(), segment_depth),
				wall_material
			)
		)
		side_root.add_child(
			GeometryBuilder.build_block_with_material(
				"BackSegment",
				Vector3(wall_x, LayoutMetrics.wall_center_y(floor_index), (LayoutMetrics.back_z() + (segment_depth * 0.5))),
				Vector3(LayoutMetrics.WALL_THICKNESS, LayoutMetrics.wall_height(), segment_depth),
				wall_material
			)
		)
		return side_root


class RoomBuilder:
	const BACK_DIVIDER_THICKNESS: float = 0.2
	const DOORWAY_WIDTH: float = 1.8


	static func build(layout: BuildingLayout) -> Node3D:
		var rooms_root: Node3D = Node3D.new()
		rooms_root.name = "BackRooms"
		var wall_material: Material = HybridMaterialFactory.build()
		for floor_index: int in range(layout.floor_count()):
			rooms_root.add_child(_build_floor_back_rooms(layout, floor_index, wall_material))
		return rooms_root


	static func _build_floor_back_rooms(layout: BuildingLayout, floor_index: int, wall_material: Material) -> Node3D:
		var floor_root: Node3D = Node3D.new()
		floor_root.name = "BackRooms_Floor%d" % floor_index
		var footprint: Vector2 = LayoutMetrics.footprint_size()
		var divider_z: float = LayoutMetrics.back_z() + (footprint.y * LayoutMetrics.BACK_ROOM_DEPTH_RATIO)
		var half_span: float = (footprint.x - DOORWAY_WIDTH) * 0.25
		var wall_y: float = LayoutMetrics.wall_center_y(floor_index)
		var room_count: int = layout.back_room_count_for_floor(floor_index)
		if room_count > 0:
			floor_root.add_child(
				GeometryBuilder.build_block_with_material(
					"DividerLeft",
					Vector3(-(DOORWAY_WIDTH * 0.5) - half_span, wall_y, divider_z),
					Vector3(half_span * 2.0, LayoutMetrics.wall_height(), BACK_DIVIDER_THICKNESS),
					wall_material
				)
			)
			floor_root.add_child(
				GeometryBuilder.build_block_with_material(
					"DividerRight",
					Vector3((DOORWAY_WIDTH * 0.5) + half_span, wall_y, divider_z),
					Vector3(half_span * 2.0, LayoutMetrics.wall_height(), BACK_DIVIDER_THICKNESS),
					wall_material
				)
			)
		floor_root.add_child(
			GeometryBuilder.build_block_with_material(
				"CenterPartition",
				Vector3(0.0, wall_y, LayoutMetrics.back_z() + ((divider_z - LayoutMetrics.back_z()) * 0.5)),
				Vector3(BACK_DIVIDER_THICKNESS, LayoutMetrics.wall_height(), divider_z - LayoutMetrics.back_z()),
				wall_material
			)
		)
		return floor_root


class StairBuilder:
	const RAMP_THICKNESS: float = 0.2
	const STAIR_STEP_COUNT: int = 44
	const STAIR_WIDTH: float = 2.2
	const STEP_DEPTH: float = 0.08


	static func build(layout: BuildingLayout) -> Node3D:
		var stairs_root: Node3D = Node3D.new()
		stairs_root.name = "Stairs"
		if layout.has_ground_stairs_on_left():
			stairs_root.add_child(_build_stair_stack(ground_left_route()))
		if layout.has_middle_stairs_on_right():
			stairs_root.add_child(_build_stair_stack(middle_right_route()))
		return stairs_root


	static func route_for_destination_floor(layout: BuildingLayout, floor_index: int) -> StairRoute:
		if layout.has_ground_stairs_on_left() and floor_index == 1:
			return ground_left_route()
		if layout.has_middle_stairs_on_right() and floor_index == 2:
			return middle_right_route()
		return null


	static func ground_left_route() -> StairRoute:
		return StairRoute.new(
			"GroundLeftStairs",
			0,
			1,
			-(BuildingLayoutScript.FOOTPRINT.x * 0.28),
			2.4,
			-1.0
		)


	static func middle_right_route() -> StairRoute:
		return StairRoute.new(
			"MiddleRightStairs",
			1,
			2,
			BuildingLayoutScript.FOOTPRINT.x * 0.28,
			-2.0,
			1.0
		)


	static func _build_stair_stack(route: StairRoute) -> Node3D:
		var stairs: Node3D = Node3D.new()
		stairs.name = route.name
		var start_surface_y: float = LayoutMetrics.floor_surface_y(route.start_floor_index)
		var destination_surface_y: float = LayoutMetrics.floor_surface_y(route.destination_floor_index)
		var step_height: float = (destination_surface_y - start_surface_y) / float(STAIR_STEP_COUNT)
		stairs.add_child(_build_ramp(route, start_surface_y, destination_surface_y))
		for step_index: int in range(STAIR_STEP_COUNT):
			var step_top_y: float = start_surface_y + (step_height * float(step_index + 1))
			var step_height_size: float = step_top_y - start_surface_y
			var step_z: float = route.start_z + (route.z_direction * STEP_DEPTH * float(step_index))
			stairs.add_child(
				GeometryBuilder.build_visual_block(
					"Step%d" % step_index,
					Vector3(route.side_x, start_surface_y + (step_height_size * 0.5), step_z),
					Vector3(STAIR_WIDTH, step_height_size, STEP_DEPTH),
					TRIM_COLOR
				)
			)
		stairs.add_child(_build_landing(route))
		return stairs


	static func _build_landing(route: StairRoute) -> StaticBody3D:
		return GeometryBuilder.build_block(
			"Landing",
			route.landing_center(),
			Vector3(LayoutMetrics.LANDING_WIDTH, BuildingLayoutScript.FLOOR_THICKNESS, LayoutMetrics.LANDING_DEPTH),
			TRIM_COLOR
		)


	static func _build_ramp(route: StairRoute, start_surface_y: float, destination_surface_y: float) -> StaticBody3D:
		return GeometryBuilder.build_ramp(
			"Ramp",
			Vector3(route.side_x, start_surface_y, route.start_z),
			Vector3(route.side_x, destination_surface_y, route.top_step_z()),
			STAIR_WIDTH,
			RAMP_THICKNESS,
			TRIM_COLOR
		)


class AccessBuilder:


	static func build(layout: BuildingLayout) -> Node3D:
		var access_root: Node3D = Node3D.new()
		access_root.name = "Access"
		if layout.has_ground_stairs_on_left():
			access_root.add_child(_build_stair_approach(StairBuilder.ground_left_route(), 0))
		if layout.has_middle_stairs_on_right():
			access_root.add_child(_build_stair_approach(StairBuilder.middle_right_route(), 1))
		return access_root


	static func _build_stair_approach(route: StairRoute, floor_index: int) -> StaticBody3D:
		var approach_depth: float = 1.2
		var approach_z: float = route.start_z + (route.z_direction * (approach_depth * 0.5))
		return GeometryBuilder.build_block(
			"%sApproach" % route.name,
			Vector3(
				route.side_x,
				LayoutMetrics.floor_slab_center_y(floor_index),
				approach_z
			),
			Vector3(LayoutMetrics.LANDING_WIDTH, BuildingLayoutScript.FLOOR_THICKNESS, approach_depth),
			TRIM_COLOR
		)


class BalconyBuilder:
	static func build(layout: BuildingLayout) -> Node3D:
		var balcony_root: Node3D = Node3D.new()
		balcony_root.name = "Balcony"
		if not layout.top_floor_has_balcony():
			return balcony_root

		var platform_width: float = BuildingLayoutScript.FOOTPRINT.x * LayoutMetrics.BALCONY_WIDTH_RATIO
		var platform_y: float = LayoutMetrics.floor_slab_center_y(layout.floor_count() - 1)
		balcony_root.add_child(
			GeometryBuilder.build_block(
				"BalconyPlatform",
				Vector3(0.0, platform_y, LayoutMetrics.front_z() + (LayoutMetrics.BALCONY_DEPTH * 0.5)),
				Vector3(platform_width, BuildingLayoutScript.FLOOR_THICKNESS, LayoutMetrics.BALCONY_DEPTH),
				TRIM_COLOR
			)
		)
		return balcony_root


class RoofBuilder:
	static func build(layout: BuildingLayout) -> StaticBody3D:
		var footprint: Vector2 = LayoutMetrics.footprint_size()
		return GeometryBuilder.build_block(
			"Roof",
			Vector3(0.0, LayoutMetrics.roof_center_y(layout), 0.0),
			Vector3(footprint.x, BuildingLayoutScript.FLOOR_THICKNESS, footprint.y),
			ROOF_COLOR
		)


class PlayerBuilder:
	const PLAYER_GROUND_CLEARANCE: float = 0.08


	static func build(layout: BuildingLayout, projectile_parent: Node3D, owner: Node3D) -> CharacterBody3D:
		var player: CharacterBody3D = FpsPlayerScript.new()
		var spawn_position: Vector3 = SpawnAdapter.adapt_layout_spawn(layout.spawn_position())
		player.name = "Player"
		player.position = spawn_position
		player.projectile_parent = projectile_parent
		player.world_root = owner
		return player


class SpawnAdapter:
	static func adapt_layout_spawn(layout_spawn: Vector3) -> Vector3:
		var grounded_spawn_y: float = GroundBuilder.surface_y() + PlayerBuilder.PLAYER_GROUND_CLEARANCE
		if layout_spawn.y <= grounded_spawn_y:
			return layout_spawn
		return Vector3(layout_spawn.x, grounded_spawn_y, layout_spawn.z)


class HybridMaterialFactory:
	static func build() -> ShaderMaterial:
		var source_texture: ImageTexture = _build_generated_texture()
		var material: ShaderMaterial = ShaderMaterial.new()
		var shader: Shader = Shader.new()
		shader.code = """
shader_type spatial;
render_mode cull_back, diffuse_lambert, specular_disabled;

uniform sampler2D wall_tex : source_color, filter_nearest;
uniform vec4 tint_color : source_color = vec4(0.88, 0.80, 0.62, 1.0);
uniform float contrast = 1.22;
uniform float seam_width = 0.06;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(91.7, 259.3))) * 43758.5453123);
}

void fragment() {
	vec2 pixel_uv = floor(UV * vec2(48.0, 64.0)) / vec2(48.0, 64.0);
	vec3 sampled = texture(wall_tex, pixel_uv).rgb;
	vec2 local = fract(UV * vec2(6.0, 4.0));
	float seam = step(local.x, seam_width) + step(local.y, seam_width) + step(1.0 - local.x, seam_width) + step(1.0 - local.y, seam_width);
	seam = clamp(seam, 0.0, 1.0);
	float stripe = step(0.86, hash(vec2(floor(UV.x * 24.0), floor(UV.y * 8.0))));
	float highlight = stripe * smoothstep(1.0, 0.2, UV.y) * 0.12;
	vec3 color = mix(sampled, sampled * tint_color.rgb, 0.35);
	color = mix(vec3(0.5), color, contrast);
	color -= seam * 0.14;
	color += highlight;
	ALBEDO = clamp(color, 0.0, 1.0);
	ROUGHNESS = 0.95;
	METALLIC = 0.08;
	EMISSION = vec3(highlight * 0.5);
}
"""
		material.shader = shader
		material.set_shader_parameter("wall_tex", source_texture)
		return material


	static func _build_generated_texture() -> ImageTexture:
		var image: Image = Image.create(64, 96, false, Image.FORMAT_RGBA8)
		var palette: Array[Color] = [
			Color("777d83"),
			Color("696f76"),
			Color("5c636a"),
			Color("4f565d")
		]

		for y: int in range(image.get_height()):
			for x: int in range(image.get_width()):
				var column: int = x / 16
				var row: int = y / 24
				var color: Color = palette[(column + row) % palette.size()]
				var local_x: int = x % 16
				var local_y: int = y % 24

				if local_x <= 1 or local_y <= 1 or local_x >= 14 or local_y >= 22:
					color = color.darkened(0.42)
				elif local_x == 7 or local_x == 8:
					color = color.darkened(0.14)
				elif local_y == 11 or local_y == 12:
					color = color.darkened(0.1)

				var grime_noise: float = _hash01(x, y, 3)
				if grime_noise > 0.89:
					color = color.darkened(0.2)

				var streak_noise: float = _hash01(column, x, 11)
				if streak_noise > 0.82 and y > 10:
					var streak_strength: float = 0.08 + (_hash01(x, y, 17) * 0.18)
					color = color.darkened(streak_strength)
				elif streak_noise < 0.08 and y > 16:
					color = color.lightened(0.08)

				if (local_x == 3 or local_x == 12) and (local_y == 3 or local_y == 20):
					color = color.lightened(0.14)

				image.set_pixel(x, y, color)

		return ImageTexture.create_from_image(image)


	static func _hash01(x: int, y: int, seed: int) -> float:
		var value: float = sin(float((x * 127) + (y * 311) + (seed * 947))) * 43758.5453
		return value - floorf(value)


class GeometryBuilder:
	static func build_block_with_material(block_name: String, position_value: Vector3, size: Vector3, material: Material) -> StaticBody3D:
		var body: StaticBody3D = StaticBody3D.new()
		body.name = block_name
		body.position = position_value

		var collision_shape: CollisionShape3D = CollisionShape3D.new()
		collision_shape.name = "CollisionShape3D"
		var shape: BoxShape3D = BoxShape3D.new()
		shape.size = size
		collision_shape.shape = shape
		body.add_child(collision_shape)

		var mesh_instance: MeshInstance3D = MeshInstance3D.new()
		mesh_instance.name = "MeshInstance3D"
		var mesh: BoxMesh = BoxMesh.new()
		mesh.size = size
		mesh_instance.mesh = mesh
		mesh_instance.material_override = material
		body.add_child(mesh_instance)
		return body


	static func build_block(block_name: String, position_value: Vector3, size: Vector3, color: Color) -> StaticBody3D:
		return build_block_with_material(block_name, position_value, size, _build_material(color))


	static func build_visual_block(block_name: String, position_value: Vector3, size: Vector3, color: Color) -> MeshInstance3D:
		var mesh_instance: MeshInstance3D = MeshInstance3D.new()
		mesh_instance.name = block_name
		mesh_instance.position = position_value
		var mesh: BoxMesh = BoxMesh.new()
		mesh.size = size
		mesh_instance.mesh = mesh
		mesh_instance.material_override = _build_material(color)
		return mesh_instance


	static func build_centered_strip(
		block_name: String,
		center_y: float,
		center_x: float,
		center_z: float,
		size_x: float,
		size_z: float,
		color: Color
	) -> Node3D:
		if size_x <= 0.0 or size_z <= 0.0:
			return Node3D.new()
		return build_block(
			block_name,
			Vector3(center_x, center_y, center_z),
			Vector3(size_x, BuildingLayoutScript.FLOOR_THICKNESS, size_z),
			color
		)


	static func build_ramp(
		block_name: String,
		start_top: Vector3,
		end_top: Vector3,
		width: float,
		thickness: float,
		color: Color
	) -> StaticBody3D:
		var body: StaticBody3D = StaticBody3D.new()
		body.name = block_name
		var top_direction: Vector3 = end_top - start_top
		var top_midpoint: Vector3 = (start_top + end_top) * 0.5
		var direction_yz: Vector2 = Vector2(top_direction.z, top_direction.y).normalized()
		var normal_yz: Vector2 = Vector2(direction_yz.y, -direction_yz.x)
		body.position = top_midpoint - Vector3(0.0, normal_yz.y * (thickness * 0.5), normal_yz.x * (thickness * 0.5))
		body.look_at_from_position(body.position, body.position + top_direction, Vector3.UP, true)

		var collision_shape: CollisionShape3D = CollisionShape3D.new()
		collision_shape.name = "CollisionShape3D"
		var shape: BoxShape3D = BoxShape3D.new()
		shape.size = Vector3(width, thickness, top_direction.length())
		collision_shape.shape = shape
		body.add_child(collision_shape)

		var mesh_instance: MeshInstance3D = MeshInstance3D.new()
		mesh_instance.name = "MeshInstance3D"
		var mesh: BoxMesh = BoxMesh.new()
		mesh.size = shape.size
		mesh_instance.mesh = mesh
		mesh_instance.material_override = _build_material(color)
		body.add_child(mesh_instance)
		return body


	static func _build_material(color: Color) -> StandardMaterial3D:
		var material: StandardMaterial3D = StandardMaterial3D.new()
		material.albedo_color = color
		material.roughness = 0.94
		return material


class ExplosionApplier:
	static func apply(owner: Node3D, origin: Vector3, radius: float, impulse_force: float) -> void:
		for body_node: Node in owner.get_tree().get_nodes_in_group("launchable_character"):
			if body_node == null or not body_node.has_method("apply_explosion_impulse"):
				continue
			var body: Node3D = body_node as Node3D
			if body == null:
				continue
			var distance: float = body.global_position.distance_to(origin)
			if distance > radius:
				continue
			var scaled_force: float = ExplosionImpulseSolverScript.scale_force(distance, radius, impulse_force)
			body_node.apply_explosion_impulse(origin, scaled_force)
