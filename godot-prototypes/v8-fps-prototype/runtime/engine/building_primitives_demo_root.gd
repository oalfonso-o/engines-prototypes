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
	const SIDE_OPENING_DEPTH: float = 2.6
	const WALL_THICKNESS: float = 0.25


	static func floor_base_y(floor_index: int) -> float:
		return float(floor_index) * BuildingLayoutScript.FLOOR_HEIGHT


	static func floor_slab_center_y(floor_index: int) -> float:
		return floor_base_y(floor_index) + (BuildingLayoutScript.FLOOR_THICKNESS * 0.5)


	static func floor_surface_y(floor_index: int) -> float:
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


class BuildingBuilder:
	static func build(layout: BuildingLayout) -> Node3D:
		var root: Node3D = Node3D.new()
		root.name = "BuildingRoot"
		root.add_child(FloorBuilder.build(layout))
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
			floors_root.add_child(build_floor_slab("FloorSlab%d" % floor_index, floor_index))
		return floors_root


	static func build_floor_slab(block_name: String, floor_index: int) -> StaticBody3D:
		var footprint: Vector2 = LayoutMetrics.footprint_size()
		return GeometryBuilder.build_block(
			block_name,
			Vector3(0.0, LayoutMetrics.floor_slab_center_y(floor_index), 0.0),
			Vector3(footprint.x, BuildingLayoutScript.FLOOR_THICKNESS, footprint.y),
			TRIM_COLOR
		)


class WallBuilder:
	const DOOR_HEIGHT: float = 2.2
	const DOOR_WIDTH: float = 2.6
	const WINDOW_OPENING_WIDTH: float = 1.3


	static func build(layout: BuildingLayout) -> Node3D:
		var walls_root: Node3D = Node3D.new()
		walls_root.name = "ExteriorWalls"
		for floor_index: int in range(layout.floor_count()):
			walls_root.add_child(_build_front_wall(layout, floor_index))
			walls_root.add_child(_build_back_wall(floor_index))
			walls_root.add_child(_build_side_wall("LeftWall_Floor%d" % floor_index, -1.0, floor_index))
			walls_root.add_child(_build_side_wall("RightWall_Floor%d" % floor_index, 1.0, floor_index))
		return walls_root


	static func _build_front_wall(layout: BuildingLayout, floor_index: int) -> Node3D:
		var front_root: Node3D = Node3D.new()
		front_root.name = "FrontWall_Floor%d" % floor_index
		var wall_z: float = LayoutMetrics.front_wall_z()
		var wall_height: float = LayoutMetrics.wall_height()
		var footprint: Vector2 = LayoutMetrics.footprint_size()
		if floor_index == 0:
			var side_width: float = (footprint.x - DOOR_WIDTH) * 0.5
			front_root.add_child(
				GeometryBuilder.build_block(
					"DoorLeft",
					Vector3(-((DOOR_WIDTH * 0.5) + (side_width * 0.5)), LayoutMetrics.wall_center_y(floor_index), wall_z),
					Vector3(side_width, wall_height, LayoutMetrics.WALL_THICKNESS),
					BUILDING_COLOR
				)
			)
			front_root.add_child(
				GeometryBuilder.build_block(
					"DoorRight",
					Vector3((DOOR_WIDTH * 0.5) + (side_width * 0.5), LayoutMetrics.wall_center_y(floor_index), wall_z),
					Vector3(side_width, wall_height, LayoutMetrics.WALL_THICKNESS),
					BUILDING_COLOR
				)
			)
			var header_height: float = wall_height - DOOR_HEIGHT
			front_root.add_child(
				GeometryBuilder.build_block(
					"DoorHeader",
					Vector3(0.0, LayoutMetrics.floor_surface_y(floor_index) + DOOR_HEIGHT + (header_height * 0.5), wall_z),
					Vector3(DOOR_WIDTH, header_height, LayoutMetrics.WALL_THICKNESS),
					BUILDING_COLOR
				)
			)
			return front_root

		var column_count: int = layout.window_count_for_floor(floor_index) + 1
		var column_width: float = (footprint.x - (WINDOW_OPENING_WIDTH * float(layout.window_count_for_floor(floor_index)))) / float(column_count)
		var left_edge: float = LayoutMetrics.left_x()
		for column_index: int in range(column_count):
			var column_left: float = left_edge + (float(column_index) * (column_width + WINDOW_OPENING_WIDTH))
			front_root.add_child(
				GeometryBuilder.build_block(
					"FrontColumn%d" % column_index,
					Vector3(column_left + (column_width * 0.5), LayoutMetrics.wall_center_y(floor_index), wall_z),
					Vector3(column_width, wall_height, LayoutMetrics.WALL_THICKNESS),
					BUILDING_COLOR
				)
			)
		return front_root


	static func _build_back_wall(floor_index: int) -> StaticBody3D:
		var footprint: Vector2 = LayoutMetrics.footprint_size()
		return GeometryBuilder.build_block(
			"BackWall_Floor%d" % floor_index,
			Vector3(0.0, LayoutMetrics.wall_center_y(floor_index), LayoutMetrics.back_wall_z()),
			Vector3(footprint.x, LayoutMetrics.wall_height(), LayoutMetrics.WALL_THICKNESS),
			BUILDING_COLOR
		)


	static func _build_side_wall(block_name: String, side_sign: float, floor_index: int) -> Node3D:
		var side_root: Node3D = Node3D.new()
		side_root.name = block_name
		var footprint: Vector2 = LayoutMetrics.footprint_size()
		var segment_depth: float = (footprint.y - LayoutMetrics.SIDE_OPENING_DEPTH) * 0.5
		var wall_x: float = LayoutMetrics.side_wall_x(side_sign)
		side_root.add_child(
			GeometryBuilder.build_block(
				"FrontSegment",
				Vector3(wall_x, LayoutMetrics.wall_center_y(floor_index), (LayoutMetrics.front_z() - (segment_depth * 0.5))),
				Vector3(LayoutMetrics.WALL_THICKNESS, LayoutMetrics.wall_height(), segment_depth),
				BUILDING_COLOR
			)
		)
		side_root.add_child(
			GeometryBuilder.build_block(
				"BackSegment",
				Vector3(wall_x, LayoutMetrics.wall_center_y(floor_index), (LayoutMetrics.back_z() + (segment_depth * 0.5))),
				Vector3(LayoutMetrics.WALL_THICKNESS, LayoutMetrics.wall_height(), segment_depth),
				BUILDING_COLOR
			)
		)
		return side_root


class RoomBuilder:
	const BACK_DIVIDER_THICKNESS: float = 0.2
	const DOORWAY_WIDTH: float = 1.8


	static func build(layout: BuildingLayout) -> Node3D:
		var rooms_root: Node3D = Node3D.new()
		rooms_root.name = "BackRooms"
		for floor_index: int in range(layout.floor_count()):
			rooms_root.add_child(_build_floor_back_rooms(layout, floor_index))
		return rooms_root


	static func _build_floor_back_rooms(layout: BuildingLayout, floor_index: int) -> Node3D:
		var floor_root: Node3D = Node3D.new()
		floor_root.name = "BackRooms_Floor%d" % floor_index
		var footprint: Vector2 = LayoutMetrics.footprint_size()
		var divider_z: float = LayoutMetrics.back_z() + (footprint.y * LayoutMetrics.BACK_ROOM_DEPTH_RATIO)
		var half_span: float = (footprint.x - DOORWAY_WIDTH) * 0.25
		var wall_y: float = LayoutMetrics.wall_center_y(floor_index)
		var room_count: int = layout.back_room_count_for_floor(floor_index)
		if room_count > 0:
			floor_root.add_child(
				GeometryBuilder.build_block(
					"DividerLeft",
					Vector3(-(DOORWAY_WIDTH * 0.5) - half_span, wall_y, divider_z),
					Vector3(half_span * 2.0, LayoutMetrics.wall_height(), BACK_DIVIDER_THICKNESS),
					INTERIOR_COLOR
				)
			)
			floor_root.add_child(
				GeometryBuilder.build_block(
					"DividerRight",
					Vector3((DOORWAY_WIDTH * 0.5) + half_span, wall_y, divider_z),
					Vector3(half_span * 2.0, LayoutMetrics.wall_height(), BACK_DIVIDER_THICKNESS),
					INTERIOR_COLOR
				)
			)
		floor_root.add_child(
			GeometryBuilder.build_block(
				"CenterPartition",
				Vector3(0.0, wall_y, LayoutMetrics.back_z() + ((divider_z - LayoutMetrics.back_z()) * 0.5)),
				Vector3(BACK_DIVIDER_THICKNESS, LayoutMetrics.wall_height(), divider_z - LayoutMetrics.back_z()),
				INTERIOR_COLOR
			)
		)
		return floor_root


class StairBuilder:
	const STAIR_STEP_COUNT: int = 10
	const STAIR_WIDTH: float = 2.2
	const STEP_DEPTH: float = 0.7


	static func build(layout: BuildingLayout) -> Node3D:
		var stairs_root: Node3D = Node3D.new()
		stairs_root.name = "Stairs"
		if layout.has_ground_stairs_on_left():
			stairs_root.add_child(_build_stair_stack("GroundLeftStairs", 0, -1.0))
		if layout.has_middle_stairs_on_right():
			stairs_root.add_child(_build_stair_stack("MiddleRightStairs", 1, 1.0))
		return stairs_root


	static func _build_stair_stack(stack_name: String, start_floor_index: int, side_sign: float) -> Node3D:
		var stairs: Node3D = Node3D.new()
		stairs.name = stack_name
		var step_height: float = BuildingLayoutScript.FLOOR_HEIGHT / float(STAIR_STEP_COUNT)
		var start_surface_y: float = LayoutMetrics.floor_surface_y(start_floor_index)
		var start_z: float = LayoutMetrics.front_z() - 1.4
		var x_position: float = side_sign * (BuildingLayoutScript.FOOTPRINT.x * 0.25)
		var z_direction: float = -side_sign
		for step_index: int in range(STAIR_STEP_COUNT):
			var step_top_y: float = start_surface_y + (step_height * float(step_index + 1))
			var step_height_size: float = step_top_y - start_surface_y
			var step_z: float = start_z + (z_direction * STEP_DEPTH * float(step_index))
			stairs.add_child(
				GeometryBuilder.build_block(
					"Step%d" % step_index,
					Vector3(x_position, start_surface_y + (step_height_size * 0.5), step_z),
					Vector3(STAIR_WIDTH, step_height_size, STEP_DEPTH),
					TRIM_COLOR
				)
			)
		return stairs


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
		var spawn_position: Vector3 = layout.spawn_position()
		player.name = "Player"
		player.position = Vector3(spawn_position.x, PLAYER_GROUND_CLEARANCE, spawn_position.z)
		player.projectile_parent = projectile_parent
		player.world_root = owner
		return player


class GeometryBuilder:
	static func build_block(block_name: String, position_value: Vector3, size: Vector3, color: Color) -> StaticBody3D:
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
