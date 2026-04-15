extends RefCounted

const DebugControllerScript := preload("res://debug/debug_controller.gd")


class CharacterStub:
	extends RefCounted

	var global_position: Vector3 = Vector3.ZERO
	var velocity: Vector3 = Vector3.ZERO
	var facing_direction: Vector3 = Vector3.FORWARD


func test_debug_label_mentions_controls(assertions, _context) -> void:
	var label: Label = Label.new()
	var character: CharacterStub = CharacterStub.new()
	var last_origin: Vector3 = Vector3(1.25, 2.5, -3.75)

	DebugControllerScript.DebugView.update_label(label, character, last_origin)

	var first_line: String = label.text.get_slice("\n", 0)
	assertions.check(first_line.findn("WASD") != -1, "debug label should mention movement controls")
	assertions.check(first_line.findn("Space") != -1, "debug label should mention jump controls")
	assertions.check(first_line.findn("G") != -1, "debug label should mention explosion controls")
	assertions.check(label.text.contains("Last explosion"), "debug label should include the last explosion field")
	assertions.check(
		label.text.contains("(1.25, 2.50, -3.75)"),
		"debug label should render the provided last explosion origin"
	)
	label.free()


func test_input_actions_trigger_explosion_only_on_g(assertions, _context) -> void:
	var g_key_event: InputEventKey = InputEventKey.new()
	g_key_event.pressed = true
	g_key_event.echo = false
	g_key_event.keycode = KEY_G

	var other_key_event: InputEventKey = InputEventKey.new()
	other_key_event.pressed = true
	other_key_event.echo = false
	other_key_event.keycode = KEY_H

	assertions.check(
		DebugControllerScript.InputActions.should_trigger_explosion(g_key_event),
		"pressing G should trigger the explosion action"
	)
	assertions.check(
		not DebugControllerScript.InputActions.should_trigger_explosion(other_key_event),
		"non-G keys should not trigger the explosion action"
	)
