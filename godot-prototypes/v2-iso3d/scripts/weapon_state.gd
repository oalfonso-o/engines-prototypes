extends RefCounted
class_name WeaponState

var config: Resource
var ammo_in_magazine: int
var reserve_ammo: int
var cooldown_remaining: float = 0.0
var reload_remaining: float = 0.0


func _init(weapon_config: Resource) -> void:
	config = weapon_config
	ammo_in_magazine = config.magazine_size
	reserve_ammo = config.reserve_ammo


func update(delta: float) -> void:
	cooldown_remaining = max(0.0, cooldown_remaining - delta)
	if reload_remaining > 0.0:
		reload_remaining = max(0.0, reload_remaining - delta)
		if reload_remaining <= 0.0:
			_finish_reload()


func can_fire(trigger_pressed: bool, trigger_just_pressed: bool) -> bool:
	if reload_remaining > 0.0 or cooldown_remaining > 0.0 or ammo_in_magazine <= 0:
		return false
	if config.automatic_fire:
		return trigger_pressed
	return trigger_just_pressed


func consume_shot() -> void:
	ammo_in_magazine = max(0, ammo_in_magazine - 1)
	cooldown_remaining = 1.0 / max(0.01, config.fire_rate)


func start_reload() -> bool:
	if reload_remaining > 0.0:
		return false
	if ammo_in_magazine >= config.magazine_size:
		return false
	if reserve_ammo <= 0:
		return false
	reload_remaining = config.reload_time
	return true


func is_reloading() -> bool:
	return reload_remaining > 0.0


func ammo_label() -> String:
	return "%d/%d" % [ammo_in_magazine, reserve_ammo]


func _finish_reload() -> void:
	var needed: int = config.magazine_size - ammo_in_magazine
	var reloaded: int = min(needed, reserve_ammo)
	ammo_in_magazine += reloaded
	reserve_ammo -= reloaded
	reload_remaining = 0.0
