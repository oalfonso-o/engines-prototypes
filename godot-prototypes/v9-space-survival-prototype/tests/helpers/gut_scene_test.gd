extends GutTest


func instantiate_main_scene() -> Node2D:
	var packed_scene: PackedScene = load("res://main.tscn") as PackedScene
	var main_scene: Node2D = packed_scene.instantiate() as Node2D
	add_child_autoqfree(main_scene)
	return main_scene


func process_frames(frame_count: int = 1) -> void:
	await wait_process_frames(frame_count)


func physics_frames(frame_count: int = 1) -> void:
	await wait_physics_frames(frame_count)


func settle_frames(frame_count: int) -> void:
	for _frame_index: int in range(frame_count):
		await wait_process_frames(1)
		await wait_physics_frames(1)


func game_root_from(scene: Node2D) -> Node2D:
	return scene.get_node("GameRoot") as Node2D


func player_from(scene: Node2D) -> Area2D:
	return scene.get_node("GameRoot/Player") as Area2D
