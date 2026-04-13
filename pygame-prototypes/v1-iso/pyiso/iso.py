from __future__ import annotations

from typing import Tuple


def grid_to_screen(
    grid_x: float,
    grid_y: float,
    height: float,
    tile_width: int,
    tile_height: int,
    height_step: int,
    origin_x: float,
    origin_y: float,
) -> Tuple[float, float]:
    half_w = tile_width / 2.0
    half_h = tile_height / 2.0
    screen_x = origin_x + (grid_x - grid_y) * half_w
    screen_y = origin_y + (grid_x + grid_y) * half_h - height * height_step
    return screen_x, screen_y


def origin_for_focus(
    focus_x: float,
    focus_y: float,
    focus_height: float,
    tile_width: int,
    tile_height: int,
    height_step: int,
    target_screen_x: float,
    target_screen_y: float,
) -> tuple[float, float]:
    half_w = tile_width / 2.0
    half_h = tile_height / 2.0
    origin_x = target_screen_x - (focus_x - focus_y) * half_w
    origin_y = target_screen_y - (focus_x + focus_y) * half_h + focus_height * height_step
    return origin_x, origin_y


def diamond_points(
    center_x: float,
    center_y: float,
    tile_width: int,
    tile_height: int,
) -> list[tuple[int, int]]:
    half_w = tile_width / 2.0
    half_h = tile_height / 2.0
    return [
        (round(center_x), round(center_y - half_h)),
        (round(center_x + half_w), round(center_y)),
        (round(center_x), round(center_y + half_h)),
        (round(center_x - half_w), round(center_y)),
    ]
