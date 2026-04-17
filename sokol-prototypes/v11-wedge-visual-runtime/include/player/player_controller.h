#pragma once

#include <stdbool.h>

#include "shared/math3d.h"
#include "world/runtime_world.h"

typedef struct {
    float mouse_sensitivity;
    float move_speed;
    float radius;
    float height;
    float eye_height;
    float jump_speed;
    float gravity;
    float pitch_limit;
} PlayerControllerConfig;

typedef struct {
    bool move_forward;
    bool move_backward;
    bool move_left;
    bool move_right;
    bool jump_queued;
} PlayerInputState;

typedef struct {
    Vec3 position;
    float yaw;
    float pitch;
    float vertical_velocity;
    bool grounded;
} PlayerState;

typedef struct {
    const CollisionBox* boxes;
    int box_count;
} CollisionScene;

void player_state_init(PlayerState* state, Vec3 spawn, float initial_pitch);
void player_input_clear(PlayerInputState* input);
void player_handle_mouse(PlayerState* state, const PlayerControllerConfig* config, float mouse_dx, float mouse_dy);
void player_update(PlayerState* state, PlayerInputState* input, const PlayerControllerConfig* config, CollisionScene collision_scene, float delta_time);
Vec3 player_forward(const PlayerState* state);
Vec3 player_eye_position(const PlayerState* state, const PlayerControllerConfig* config);
