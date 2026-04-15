extends RefCounted
class_name FpsMapLoader

const MapLayoutParserScript := preload("res://runtime/logic/map_layout_parser.gd")


static func load_layout(path: String) -> ArenaMapLayout:
	var text: String = FileAccess.get_file_as_string(path).strip_edges()
	return MapLayoutParserScript.parse(text)
