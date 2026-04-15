extends Node2D

const BackdropScript := preload("res://runtime/world/engine/starfield_backdrop.gd")
const GameRootScript := preload("res://runtime/world/engine/game_root.gd")
const GameOverOverlayScript := preload("res://runtime/ui/engine/game_over_overlay.gd")
const HudRootScript := preload("res://runtime/ui/engine/hud_root.gd")

var _backdrop: Node2D
var _game_over_overlay: CanvasLayer
var _game_root: Node2D
var _hud: CanvasLayer


func _ready() -> void:
	BootstrapBuilder.build(self, BackdropScript, GameRootScript, HudRootScript, GameOverOverlayScript)


func handle_run_ended(final_score: int) -> void:
	_game_over_overlay.show_game_over(final_score)


func restart_run() -> void:
	remove_child(_backdrop)
	_backdrop.queue_free()
	remove_child(_game_root)
	_game_root.queue_free()
	remove_child(_hud)
	_hud.queue_free()
	_game_over_overlay.hide_overlay()
	remove_child(_game_over_overlay)
	_game_over_overlay.queue_free()
	BootstrapBuilder.build(self, BackdropScript, GameRootScript, HudRootScript, GameOverOverlayScript)


class BootstrapBuilder:
	static func build(
		owner: Node2D,
		backdrop_script: GDScript,
		game_root_script: GDScript,
		hud_root_script: GDScript,
		game_over_overlay_script: GDScript
	) -> void:
		owner._backdrop = backdrop_script.new()
		owner._backdrop.name = "Backdrop"
		owner.add_child(owner._backdrop)

		owner._game_root = game_root_script.new()
		owner._game_root.name = "GameRoot"
		owner.add_child(owner._game_root)

		owner._hud = hud_root_script.new()
		owner._hud.name = "Hud"
		owner.add_child(owner._hud)
		owner._hud.bind_game_state(owner._game_root.run_model, owner._game_root.weapon_progression)

		owner._game_over_overlay = game_over_overlay_script.new()
		owner._game_over_overlay.name = "GameOverOverlay"
		owner.add_child(owner._game_over_overlay)

		owner._game_root.run_ended.connect(owner.handle_run_ended)
		owner._game_over_overlay.restart_requested.connect(owner.restart_run)
