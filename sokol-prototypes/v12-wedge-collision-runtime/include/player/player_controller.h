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
    const CollisionWedge* wedges;
    int box_count;
    int wedge_count;
    float max_auto_step_height;
    float ground_snap_distance;
    float floor_epsilon;
    float horizontal_epsilon;
    float vertical_epsilon;
    float spawn_ground_search_distance;
    int wedge_type_id_pz;
    int wedge_type_id_px;
    int wedge_type_id_nz;
    int wedge_type_id_nx;
} CollisionScene;

void player_state_init(PlayerState* state, Vec3 spawn, float initial_pitch);
void player_input_clear(PlayerInputState* input);
void player_handle_mouse(PlayerState* state, const PlayerControllerConfig* config, float mouse_dx, float mouse_dy);
void player_update(PlayerState* state, PlayerInputState* input, const PlayerControllerConfig* config, CollisionScene collision_scene, float delta_time);
bool player_select_effective_spawn(Vec3* out_spawn, const RuntimeSpawnConfig* spawn_config, const PlayerControllerConfig* config, CollisionScene collision_scene);
Vec3 player_forward(const PlayerState* state);
Vec3 player_eye_position(const PlayerState* state, const PlayerControllerConfig* config);
