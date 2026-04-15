extends GutTest


func instantiate_main_scene() -> Node3D:
	var packed_scene: PackedScene = load("res://main.tscn") as PackedScene
	var main_scene: Node3D = packed_scene.instantiate() as Node3D
	add_child_autoqfree(main_scene)
	return main_scene


func add_scene_root(scene: Node3D) -> Node3D:
	add_child_autoqfree(scene)
	return scene


func settle_frames(frame_count: int) -> void:
	for _frame_index: int in range(frame_count):
		await wait_process_frames(1)
		await wait_physics_frames(1)


func process_frames(frame_count: int = 1) -> void:
	await wait_process_frames(frame_count)


func physics_frames(frame_count: int = 1) -> void:
	await wait_physics_frames(frame_count)
