#include "player/player_controller.h"

#include <math.h>

typedef enum {
    GROUND_KIND_NONE = 0,
    GROUND_KIND_CUBE_TOP = 1,
    GROUND_KIND_WEDGE_SLOPE = 2,
} GroundKind;

typedef struct {
    bool valid;
    float floor_y;
    GroundKind kind;
    int cell_x;
    int cell_y;
    int cell_z;
} GroundCandidate;

static Vec3 player_horizontal_forward(const PlayerState* state) {
    const Vec3 full_forward = player_forward(state);
    return vec3_normalize(vec3_make(full_forward.x, 0.0f, full_forward.z));
}

static Vec3 player_horizontal_right(const PlayerState* state) {
    return vec3_normalize(vec3_make(cosf(state->yaw), 0.0f, sinf(state->yaw)));
}

static bool closed_interval_contains(float value, float min_value, float max_value, float epsilon) {
    return value >= (min_value - epsilon) && value <= (max_value + epsilon);
}

static bool interval_overlaps(float a_min, float a_max, float b_min, float b_max, float epsilon) {
    return (a_min < (b_max + epsilon)) && (a_max > (b_min - epsilon));
}

static bool strict_interval_overlaps(float a_min, float a_max, float b_min, float b_max) {
    return (a_min < b_max) && (a_max > b_min);
}

static float wedge_floor_height(const CollisionWedge* wedge, const CollisionScene* scene, float sample_x, float sample_z) {
    const float width = wedge->max_x - wedge->min_x;
    const float depth = wedge->max_z - wedge->min_z;
    const float local_x = math3d_clampf((sample_x - wedge->min_x) / width, 0.0f, 1.0f);
    const float local_z = math3d_clampf((sample_z - wedge->min_z) / depth, 0.0f, 1.0f);
    float height_local = 0.0f;
    if (wedge->type_id == scene->wedge_type_id_pz) {
        height_local = local_z;
    } else if (wedge->type_id == scene->wedge_type_id_px) {
        height_local = local_x;
    } else if (wedge->type_id == scene->wedge_type_id_nz) {
        height_local = 1.0f - local_z;
    } else {
        height_local = 1.0f - local_x;
    }
    return wedge->min_y + (height_local * (wedge->max_y - wedge->min_y));
}

static bool ground_candidate_beats(const GroundCandidate* lhs, const GroundCandidate* rhs, float floor_epsilon) {
    if (!rhs->valid) {
        return true;
    }
    if (lhs->floor_y > (rhs->floor_y + floor_epsilon)) {
        return true;
    }
    if (rhs->floor_y > (lhs->floor_y + floor_epsilon)) {
        return false;
    }
    if (lhs->kind != rhs->kind) {
        return lhs->kind == GROUND_KIND_CUBE_TOP;
    }
    if (lhs->cell_y != rhs->cell_y) {
        return lhs->cell_y < rhs->cell_y;
    }
    if (lhs->cell_x != rhs->cell_x) {
        return lhs->cell_x < rhs->cell_x;
    }
    return lhs->cell_z < rhs->cell_z;
}

static GroundCandidate select_ground_candidate(float sample_x, float sample_z, float current_feet_y, float max_below, CollisionScene collision_scene) {
    GroundCandidate best = {0};

    for (int i = 0; i < collision_scene.box_count; i++) {
        const CollisionBox box = collision_scene.boxes[i];
        if (!closed_interval_contains(sample_x, box.min_x, box.max_x, collision_scene.horizontal_epsilon) ||
            !closed_interval_contains(sample_z, box.min_z, box.max_z, collision_scene.horizontal_epsilon)) {
            continue;
        }
        const float floor_y = box.max_y;
        if (floor_y < (current_feet_y - max_below - collision_scene.floor_epsilon)) {
            continue;
        }
        if (floor_y > (current_feet_y + collision_scene.floor_epsilon)) {
            continue;
        }
        if (box.min_y > (current_feet_y + collision_scene.floor_epsilon)) {
            continue;
        }
        const GroundCandidate candidate = {
            .valid = true,
            .floor_y = floor_y,
            .kind = GROUND_KIND_CUBE_TOP,
            .cell_x = 0,
            .cell_y = 0,
            .cell_z = 0,
        };
        if (ground_candidate_beats(&candidate, &best, collision_scene.floor_epsilon)) {
            best = candidate;
        }
    }

    for (int i = 0; i < collision_scene.wedge_count; i++) {
        const CollisionWedge* wedge = &collision_scene.wedges[i];
        if (!closed_interval_contains(sample_x, wedge->min_x, wedge->max_x, collision_scene.horizontal_epsilon) ||
            !closed_interval_contains(sample_z, wedge->min_z, wedge->max_z, collision_scene.horizontal_epsilon)) {
            continue;
        }
        const float floor_y = wedge_floor_height(wedge, &collision_scene, sample_x, sample_z);
        if (floor_y < (current_feet_y - max_below - collision_scene.floor_epsilon)) {
            continue;
        }
        if (wedge->min_y > (current_feet_y + collision_scene.floor_epsilon)) {
            continue;
        }
        const GroundCandidate candidate = {
            .valid = true,
            .floor_y = floor_y,
            .kind = GROUND_KIND_WEDGE_SLOPE,
            .cell_x = wedge->cell_x,
            .cell_y = wedge->cell_y,
            .cell_z = wedge->cell_z,
        };
        if (ground_candidate_beats(&candidate, &best, collision_scene.floor_epsilon)) {
            best = candidate;
        }
    }

    return best;
}

static bool player_overlaps_box(Vec3 position, const PlayerControllerConfig* config, const CollisionBox* box) {
    const float player_min_x = position.x - config->radius;
    const float player_max_x = position.x + config->radius;
    const float player_min_y = position.y;
    const float player_max_y = position.y + config->height;
    const float player_min_z = position.z - config->radius;
    const float player_max_z = position.z + config->radius;
    return math3d_ranges_overlap(player_min_x, player_max_x, box->min_x, box->max_x) &&
           math3d_ranges_overlap(player_min_y, player_max_y, box->min_y, box->max_y) &&
           math3d_ranges_overlap(player_min_z, player_max_z, box->min_z, box->max_z);
}

static bool player_overlaps_wedge(Vec3 position, const PlayerControllerConfig* config, CollisionScene collision_scene, const CollisionWedge* wedge) {
    const float player_min_y = position.y;
    const float player_max_y = position.y + config->height;
    if (!interval_overlaps(player_min_y, player_max_y, wedge->min_y, wedge->max_y, collision_scene.vertical_epsilon)) {
        return false;
    }
    if (!closed_interval_contains(position.x, wedge->min_x, wedge->max_x, collision_scene.horizontal_epsilon) ||
        !closed_interval_contains(position.z, wedge->min_z, wedge->max_z, collision_scene.horizontal_epsilon)) {
        return false;
    }
    return position.y < (wedge_floor_height(wedge, &collision_scene, position.x, position.z) - collision_scene.vertical_epsilon);
}

static bool spawn_candidate_is_valid(Vec3 candidate, const PlayerControllerConfig* config, CollisionScene collision_scene, float ground_search_distance, Vec3* out_grounded_spawn) {
    GroundCandidate ground = select_ground_candidate(candidate.x, candidate.z, candidate.y, ground_search_distance, collision_scene);
    if (!ground.valid) {
        return false;
    }
    if (candidate.y < (ground.floor_y - collision_scene.floor_epsilon)) {
        return false;
    }
    if ((candidate.y - ground.floor_y) > (ground_search_distance + collision_scene.floor_epsilon)) {
        return false;
    }

    *out_grounded_spawn = vec3_make(candidate.x, ground.floor_y, candidate.z);
    for (int i = 0; i < collision_scene.box_count; i++) {
        const CollisionBox* box = &collision_scene.boxes[i];
        if (player_overlaps_box(*out_grounded_spawn, config, box) &&
            out_grounded_spawn->y < (box->max_y - collision_scene.floor_epsilon)) {
            return false;
        }
    }
    for (int i = 0; i < collision_scene.wedge_count; i++) {
        const CollisionWedge* wedge = &collision_scene.wedges[i];
        const float wedge_floor_y = wedge_floor_height(wedge, &collision_scene, out_grounded_spawn->x, out_grounded_spawn->z);
        if (player_overlaps_wedge(*out_grounded_spawn, config, collision_scene, wedge) &&
            out_grounded_spawn->y < (wedge_floor_y - collision_scene.floor_epsilon)) {
            return false;
        }
    }
    return true;
}

bool player_select_effective_spawn(Vec3* out_spawn, const RuntimeSpawnConfig* spawn_config, const PlayerControllerConfig* config, CollisionScene collision_scene) {
    Vec3 grounded_spawn = {0};
    if (spawn_config->override_enabled &&
        spawn_candidate_is_valid(spawn_config->override_position, config, collision_scene, collision_scene.spawn_ground_search_distance, &grounded_spawn)) {
        *out_spawn = grounded_spawn;
        return true;
    }
    *out_spawn = spawn_config->map_default;
    return true;
}

static float resolve_ceiling_y(const PlayerState* state, float candidate_y, const PlayerControllerConfig* config, CollisionScene collision_scene) {
    const float player_min_x = state->position.x - config->radius;
    const float player_max_x = state->position.x + config->radius;
    const float player_min_z = state->position.z - config->radius;
    const float player_max_z = state->position.z + config->radius;

    for (int i = 0; i < collision_scene.box_count; i++) {
        const CollisionBox box = collision_scene.boxes[i];
        if (!math3d_ranges_overlap(player_min_x, player_max_x, box.min_x, box.max_x) ||
            !math3d_ranges_overlap(player_min_z, player_max_z, box.min_z, box.max_z)) {
            continue;
        }
        const float player_min_y = candidate_y;
        const float player_max_y = candidate_y + config->height;
        if (!math3d_ranges_overlap(player_min_y, player_max_y, box.min_y, box.max_y)) {
            continue;
        }
        candidate_y = math3d_minf(candidate_y, box.min_y - config->height);
    }
    return candidate_y;
}

static float resolve_horizontal_axis(PlayerState* state, const PlayerControllerConfig* config, CollisionScene collision_scene, char axis, float delta_axis) {
    if (delta_axis == 0.0f) {
        return axis == 'x' ? state->position.x : state->position.z;
    }

    const float current_feet_y = state->position.y;
    const float candidate_x = axis == 'x' ? state->position.x + delta_axis : state->position.x;
    const float candidate_z = axis == 'z' ? state->position.z + delta_axis : state->position.z;
    const float player_min_y = state->position.y;
    const float player_max_y = state->position.y + config->height;

    bool has_block = false;
    float resolved_axis = axis == 'x' ? candidate_x : candidate_z;

    for (int i = 0; i < collision_scene.box_count; i++) {
        const CollisionBox box = collision_scene.boxes[i];
        if (!interval_overlaps(player_min_y, player_max_y, box.min_y, box.max_y, collision_scene.vertical_epsilon)) {
            continue;
        }
        if (box.max_y <= (current_feet_y + collision_scene.floor_epsilon)) {
            continue;
        }
        if (axis == 'x') {
            if (!strict_interval_overlaps(candidate_z - config->radius, candidate_z + config->radius, box.min_z, box.max_z)) {
                continue;
            }
            if (!interval_overlaps(candidate_x - config->radius, candidate_x + config->radius, box.min_x, box.max_x, collision_scene.horizontal_epsilon)) {
                continue;
            }
            if (delta_axis > 0.0f) {
                const float block = box.min_x - config->radius;
                resolved_axis = has_block ? math3d_minf(resolved_axis, block) : block;
            } else {
                const float block = box.max_x + config->radius;
                resolved_axis = has_block ? math3d_maxf(resolved_axis, block) : block;
            }
            has_block = true;
        } else {
            if (!strict_interval_overlaps(candidate_x - config->radius, candidate_x + config->radius, box.min_x, box.max_x)) {
                continue;
            }
            if (!interval_overlaps(candidate_z - config->radius, candidate_z + config->radius, box.min_z, box.max_z, collision_scene.horizontal_epsilon)) {
                continue;
            }
            if (delta_axis > 0.0f) {
                const float block = box.min_z - config->radius;
                resolved_axis = has_block ? math3d_minf(resolved_axis, block) : block;
            } else {
                const float block = box.max_z + config->radius;
                resolved_axis = has_block ? math3d_maxf(resolved_axis, block) : block;
            }
            has_block = true;
        }
    }

    for (int i = 0; i < collision_scene.wedge_count; i++) {
        const CollisionWedge* wedge = &collision_scene.wedges[i];
        if (!interval_overlaps(player_min_y, player_max_y, wedge->min_y, wedge->max_y, collision_scene.vertical_epsilon)) {
            continue;
        }

        bool blocks = false;
        float block_coordinate = 0.0f;

        if (axis == 'x') {
            if (!interval_overlaps(candidate_z - config->radius, candidate_z + config->radius, wedge->min_z, wedge->max_z, collision_scene.horizontal_epsilon)) {
                continue;
            }
            if (delta_axis > 0.0f) {
                if (wedge->type_id == collision_scene.wedge_type_id_pz || wedge->type_id == collision_scene.wedge_type_id_nz || wedge->type_id == collision_scene.wedge_type_id_nx) {
                    blocks = true;
                    block_coordinate = wedge->min_x - config->radius;
                }
            } else {
                if (wedge->type_id == collision_scene.wedge_type_id_pz || wedge->type_id == collision_scene.wedge_type_id_nz || wedge->type_id == collision_scene.wedge_type_id_px) {
                    blocks = true;
                    block_coordinate = wedge->max_x + config->radius;
                }
            }
            if (!blocks || !interval_overlaps(candidate_x - config->radius, candidate_x + config->radius, wedge->min_x, wedge->max_x, collision_scene.horizontal_epsilon)) {
                continue;
            }
        } else {
            if (!interval_overlaps(candidate_x - config->radius, candidate_x + config->radius, wedge->min_x, wedge->max_x, collision_scene.horizontal_epsilon)) {
                continue;
            }
            if (delta_axis > 0.0f) {
                if (wedge->type_id == collision_scene.wedge_type_id_px || wedge->type_id == collision_scene.wedge_type_id_nx || wedge->type_id == collision_scene.wedge_type_id_nz) {
                    blocks = true;
                    block_coordinate = wedge->min_z - config->radius;
                }
            } else {
                if (wedge->type_id == collision_scene.wedge_type_id_px || wedge->type_id == collision_scene.wedge_type_id_nx || wedge->type_id == collision_scene.wedge_type_id_pz) {
                    blocks = true;
                    block_coordinate = wedge->max_z + config->radius;
                }
            }
            if (!blocks || !interval_overlaps(candidate_z - config->radius, candidate_z + config->radius, wedge->min_z, wedge->max_z, collision_scene.horizontal_epsilon)) {
                continue;
            }
        }

        if (delta_axis > 0.0f) {
            resolved_axis = has_block ? math3d_minf(resolved_axis, block_coordinate) : block_coordinate;
        } else {
            resolved_axis = has_block ? math3d_maxf(resolved_axis, block_coordinate) : block_coordinate;
        }
        has_block = true;
    }

    return has_block ? resolved_axis : (axis == 'x' ? candidate_x : candidate_z);
}

void player_state_init(PlayerState* state, Vec3 spawn, float initial_pitch) {
    state->position = spawn;
    state->yaw = 0.0f;
    state->pitch = initial_pitch;
    state->vertical_velocity = 0.0f;
    state->grounded = true;
}

void player_input_clear(PlayerInputState* input) {
    input->move_forward = false;
    input->move_backward = false;
    input->move_left = false;
    input->move_right = false;
    input->jump_queued = false;
}

void player_handle_mouse(PlayerState* state, const PlayerControllerConfig* config, float mouse_dx, float mouse_dy) {
    state->yaw += mouse_dx * config->mouse_sensitivity;
    state->pitch -= mouse_dy * config->mouse_sensitivity;
    state->pitch = math3d_clampf(state->pitch, -config->pitch_limit, config->pitch_limit);
}

void player_update(PlayerState* state, PlayerInputState* input, const PlayerControllerConfig* config, CollisionScene collision_scene, float delta_time) {
    Vec3 movement = vec3_make(0.0f, 0.0f, 0.0f);
    const Vec3 forward = player_horizontal_forward(state);
    const Vec3 right = player_horizontal_right(state);
    if (input->move_forward) {
        movement = vec3_add(movement, forward);
    }
    if (input->move_backward) {
        movement = vec3_sub(movement, forward);
    }
    if (input->move_right) {
        movement = vec3_add(movement, right);
    }
    if (input->move_left) {
        movement = vec3_sub(movement, right);
    }
    if (vec3_dot(movement, movement) > 0.0f) {
        movement = vec3_scale(vec3_normalize(movement), config->move_speed * delta_time);
    }

    state->position.x = resolve_horizontal_axis(state, config, collision_scene, 'x', movement.x);
    state->position.z = resolve_horizontal_axis(state, config, collision_scene, 'z', movement.z);

    const float pre_vertical_feet_y = state->position.y;

    if (input->jump_queued && state->grounded) {
        state->vertical_velocity = config->jump_speed;
        state->grounded = false;
    }
    input->jump_queued = false;

    state->vertical_velocity -= config->gravity * delta_time;
    float candidate_y = state->position.y + (state->vertical_velocity * delta_time);
    if (state->vertical_velocity > 0.0f) {
        candidate_y = resolve_ceiling_y(state, candidate_y, config, collision_scene);
        if (candidate_y < state->position.y + (state->vertical_velocity * delta_time)) {
            state->vertical_velocity = 0.0f;
        }
    }
    state->position.y = candidate_y;

    const float downward_travel = state->vertical_velocity <= 0.0f
        ? math3d_maxf(0.0f, pre_vertical_feet_y - state->position.y)
        : 0.0f;
    const float ground_search_below = state->vertical_velocity <= 0.0f
        ? math3d_maxf(collision_scene.ground_snap_distance, downward_travel + collision_scene.vertical_epsilon)
        : collision_scene.ground_snap_distance;
    const GroundCandidate ground = select_ground_candidate(
        state->position.x,
        state->position.z,
        pre_vertical_feet_y,
        ground_search_below,
        collision_scene
    );

    if (ground.valid) {
        if (ground.kind == GROUND_KIND_CUBE_TOP) {
            if (state->position.y <= (ground.floor_y + collision_scene.vertical_epsilon) ||
                (state->vertical_velocity <= 0.0f && (state->position.y - ground.floor_y) <= (collision_scene.ground_snap_distance + collision_scene.floor_epsilon))) {
                state->position.y = ground.floor_y;
                state->vertical_velocity = 0.0f;
                state->grounded = true;
                return;
            }
        } else if (ground.kind == GROUND_KIND_WEDGE_SLOPE && state->vertical_velocity <= 0.0f) {
            state->position.y = ground.floor_y;
            state->vertical_velocity = 0.0f;
            state->grounded = true;
            return;
        }
    }

    state->grounded = false;
}

Vec3 player_forward(const PlayerState* state) {
    const float cos_pitch = cosf(state->pitch);
    return vec3_normalize(vec3_make(
        sinf(state->yaw) * cos_pitch,
        sinf(state->pitch),
        -cosf(state->yaw) * cos_pitch
    ));
}

Vec3 player_eye_position(const PlayerState* state, const PlayerControllerConfig* config) {
    return vec3_add(state->position, vec3_make(0.0f, config->eye_height, 0.0f));
}
