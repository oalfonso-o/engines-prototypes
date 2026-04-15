extends Resource
class_name WeaponConfig

@export var weapon_name: String = "Weapon"
@export var magazine_size: int = 30
@export var reserve_ammo: int = 90
@export var reload_time: float = 1.8
@export var fire_rate: float = 8.0
@export var projectile_rays_count: int = 7
@export var damage_per_ray: float = 6.0
@export var max_range: float = 48.0
@export var vertical_span_degrees: float = 12.0
@export var ray_spacing_mode: String = "even"
@export var spread_horizontal_degrees: float = 0.0
@export var automatic_fire: bool = true

