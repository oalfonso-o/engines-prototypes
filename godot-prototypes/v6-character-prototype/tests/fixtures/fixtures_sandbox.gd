extends RefCounted
class_name SandboxFixture

static func instantiate(context) -> Node3D:
	var scene: Node3D = context.instantiate_main_scene()
	await context.settle_frames(12)
	return scene


static func get_character(scene: Node3D) -> Node3D:
	var node: Node = scene.get_node_or_null("CharacterPrototype")
	assert(node != null, "sandbox fixture expected CharacterPrototype child")
	var character: Node3D = node as Node3D
	assert(character != null, "sandbox fixture expected CharacterPrototype to be a Node3D")
	return character


static func get_visual_rig(scene: Node3D) -> Node3D:
	var character: Node3D = get_character(scene)
	var node: Node = character.get_node_or_null("VisualRig")
	assert(node != null, "sandbox fixture expected VisualRig child under CharacterPrototype")
	var visual_rig: Node3D = node as Node3D
	assert(visual_rig != null, "sandbox fixture expected VisualRig to be a Node3D")
	return visual_rig


static func get_debug_label(scene: Node3D) -> Label:
	var node: Node = scene.get_node_or_null("DebugHud/InfoLabel")
	assert(node != null, "sandbox fixture expected DebugHud/InfoLabel child")
	var label: Label = node as Label
	assert(label != null, "sandbox fixture expected DebugHud/InfoLabel to be a Label")
	return label
