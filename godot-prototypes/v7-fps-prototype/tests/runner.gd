extends SceneTree

const CLASS_TEST_DIR: String = "res://tests/class"
const INTEGRATION_TEST_DIR: String = "res://tests/integration"
const TEST_FILE_PREFIX: String = "test_"
const TEST_FILE_EXTENSION: String = ".gd"
const OK_MESSAGE: String = "v7-fps-prototype tests OK"
const TEST_CLEANUP_GROUP: String = "v7_test_cleanup"

var _failures: Array[String] = []


func _initialize() -> void:
	await _run_all_tests()
	_report_and_exit()


func _run_all_tests() -> void:
	var test_files: Array[String] = _discover_test_files()
	for file_path: String in test_files:
		await _run_test_file(file_path)


func _run_test_file(file_path: String) -> void:
	var script: Script = load(file_path) as Script
	if script == null:
		_failures.append("%s::(load) -> failed to load test script" % file_path)
		return

	var test_methods: Array[String] = _discover_test_methods(script)
	for method_name: String in test_methods:
		await _sweep_test_cleanup_nodes()
		var test_instance: Object = script.new()
		var context: TestContext = TestContext.new(self)
		await _run_test_method(file_path, method_name, test_instance, context)
		await context.cleanup()
		await _sweep_test_cleanup_nodes()


func _run_test_method(file_path: String, method_name: String, test_instance: Object, context: TestContext) -> void:
	var assertions: Assertions = Assertions.new()
	await test_instance.call(method_name, assertions, context)
	for message: String in assertions.failures:
		_failures.append("%s::%s -> %s" % [file_path, method_name, message])


func _discover_test_files() -> Array[String]:
	var test_files: Array[String] = []
	_collect_test_files(CLASS_TEST_DIR, test_files)
	_collect_test_files(INTEGRATION_TEST_DIR, test_files)
	test_files.sort()
	return test_files


func _collect_test_files(directory_path: String, test_files: Array[String]) -> void:
	var directory: DirAccess = DirAccess.open(directory_path)
	if directory == null:
		return

	directory.list_dir_begin()
	while true:
		var entry_name: String = directory.get_next()
		if entry_name.is_empty():
			break
		if entry_name.begins_with("."):
			continue

		var entry_path: String = "%s/%s" % [directory_path, entry_name]
		if directory.current_is_dir():
			_collect_test_files(entry_path, test_files)
			continue

		if not entry_name.begins_with(TEST_FILE_PREFIX):
			continue
		if not entry_name.ends_with(TEST_FILE_EXTENSION):
			continue
		test_files.append(entry_path)
	directory.list_dir_end()


func _discover_test_methods(test_script: Script) -> Array[String]:
	var method_names: Array[String] = []
	for method: Dictionary in test_script.get_script_method_list():
		var method_name: String = method["name"]
		if method_name.begins_with(TEST_FILE_PREFIX):
			method_names.append(method_name)
	method_names.sort()
	return method_names


func _report_and_exit() -> void:
	if _failures.is_empty():
		print(OK_MESSAGE)
		quit(0)
		return

	for failure: String in _failures:
		push_error(failure)
	quit(1)


func _sweep_test_cleanup_nodes() -> void:
	const MAX_SWEEP_PASSES: int = 4
	for _pass_index: int in range(MAX_SWEEP_PASSES):
		var cleanup_nodes: Array[Node] = get_nodes_in_group(TEST_CLEANUP_GROUP)
		if cleanup_nodes.is_empty():
			return

		for node: Node in cleanup_nodes:
			if is_instance_valid(node):
				node.queue_free()

		await process_frame

	var remaining_nodes: Array[Node] = get_nodes_in_group(TEST_CLEANUP_GROUP)
	if not remaining_nodes.is_empty():
		_failures.append("cleanup group contamination after max sweep passes: %d nodes remain" % remaining_nodes.size())


class Assertions:
	var failures: Array[String] = []


	func check(condition: bool, message: String) -> void:
		if condition:
			return
		failures.append(message)


class TestContext:
	var _scene_tree: SceneTree
	var _tracked_nodes: Array[Node] = []


	func _init(scene_tree: SceneTree) -> void:
		_scene_tree = scene_tree


	func instantiate_main_scene() -> Node3D:
		var packed_scene: PackedScene = load("res://main.tscn") as PackedScene
		var main_scene: Node3D = packed_scene.instantiate() as Node3D
		_scene_tree.root.add_child(main_scene)
		main_scene.add_to_group(TEST_CLEANUP_GROUP)
		_tracked_nodes.append(main_scene)
		return main_scene


	func add_scene_root(scene: Node3D) -> Node3D:
		_scene_tree.root.add_child(scene)
		scene.add_to_group(TEST_CLEANUP_GROUP)
		_tracked_nodes.append(scene)
		return scene


	func settle_frames(frame_count: int) -> void:
		for _frame_index: int in range(frame_count):
			await process_frame()
			await physics_frame()


	func process_frame() -> void:
		await _scene_tree.process_frame


	func physics_frame() -> void:
		await _scene_tree.physics_frame


	func cleanup() -> void:
		for node: Node in _tracked_nodes:
			if is_instance_valid(node):
				node.queue_free()
		_tracked_nodes.clear()
		await process_frame()
