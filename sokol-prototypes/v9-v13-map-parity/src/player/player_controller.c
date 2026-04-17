#include "player/player_controller.h"

#include <math.h>

static Vec3 player_horizontal_forward(const PlayerState* state) {
    const Vec3 full_forward = player_forward(state);
    return vec3_normalize(vec3_make(full_forward.x, 0.0f, full_forward.z));
}

static Vec3 player_horizontal_right(const PlayerState* state) {
    return vec3_normalize(vec3_make(cosf(state->yaw), 0.0f, sinf(state->yaw)));
}

static void resolve_player_x(PlayerState* state, float delta_x, const PlayerControllerConfig* config, CollisionScene collision_scene) {
    if (delta_x == 0.0f) {
        return;
    }

    float new_x = state->position.x + delta_x;
    const float player_min_y = state->position.y;
    const float player_max_y = state->position.y + config->height;
    const float player_min_z = state->position.z - config->radius;
    const float player_max_z = state->position.z + config->radius;

    for (int i = 0; i < collision_scene.box_count; i++) {
        const CollisionBox box = collision_scene.boxes[i];
        if (!math3d_ranges_overlap(player_min_y, player_max_y, box.min_y, box.max_y)) {
            continue;
        }
        if (!math3d_ranges_overlap(player_min_z, player_max_z, box.min_z, box.max_z)) {
            continue;
        }
        const float player_min_x = new_x - config->radius;
        const float player_max_x = new_x + config->radius;
        if (!math3d_ranges_overlap(player_min_x, player_max_x, box.min_x, box.max_x)) {
            continue;
        }
        if (delta_x > 0.0f) {
            new_x = math3d_minf(new_x, box.min_x - config->radius);
        } else {
            new_x = math3d_maxf(new_x, box.max_x + config->radius);
        }
    }

    state->position.x = new_x;
}

static void resolve_player_z(PlayerState* state, float delta_z, const PlayerControllerConfig* config, CollisionScene collision_scene) {
    if (delta_z == 0.0f) {
        return;
    }

    float new_z = state->position.z + delta_z;
    const float player_min_y = state->position.y;
    const float player_max_y = state->position.y + config->height;
    const float player_min_x = state->position.x - config->radius;
    const float player_max_x = state->position.x + config->radius;

    for (int i = 0; i < collision_scene.box_count; i++) {
        const CollisionBox box = collision_scene.boxes[i];
        if (!math3d_ranges_overlap(player_min_y, player_max_y, box.min_y, box.max_y)) {
            continue;
        }
        if (!math3d_ranges_overlap(player_min_x, player_max_x, box.min_x, box.max_x)) {
            continue;
        }
        const float player_min_z = new_z - config->radius;
        const float player_max_z = new_z + config->radius;
        if (!math3d_ranges_overlap(player_min_z, player_max_z, box.min_z, box.max_z)) {
            continue;
        }
        if (delta_z > 0.0f) {
            new_z = math3d_minf(new_z, box.min_z - config->radius);
        } else {
            new_z = math3d_maxf(new_z, box.max_z + config->radius);
        }
    }

    state->position.z = new_z;
}

static void resolve_player_y(PlayerState* state, float delta_y, const PlayerControllerConfig* config, CollisionScene collision_scene) {
    float new_y = state->position.y + delta_y;
    bool grounded = false;
    const float player_min_x = state->position.x - config->radius;
    const float player_max_x = state->position.x + config->radius;
    const float player_min_z = state->position.z - config->radius;
    const float player_max_z = state->position.z + config->radius;

    for (int i = 0; i < collision_scene.box_count; i++) {
        const CollisionBox box = collision_scene.boxes[i];
        if (!math3d_ranges_overlap(player_min_x, player_max_x, box.min_x, box.max_x)) {
            continue;
        }
        if (!math3d_ranges_overlap(player_min_z, player_max_z, box.min_z, box.max_z)) {
            continue;
        }
        const float player_min_y = new_y;
        const float player_max_y = new_y + config->height;
        if (!math3d_ranges_overlap(player_min_y, player_max_y, box.min_y, box.max_y)) {
            continue;
        }
        if (delta_y <= 0.0f) {
            new_y = math3d_maxf(new_y, box.max_y);
            grounded = true;
        } else {
            new_y = math3d_minf(new_y, box.min_y - config->height);
        }
        state->vertical_velocity = 0.0f;
    }

    if (new_y < 0.0f) {
        new_y = 0.0f;
        grounded = true;
        state->vertical_velocity = 0.0f;
    }

    state->position.y = new_y;
    state->grounded = grounded;
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

    resolve_player_x(state, movement.x, config, collision_scene);
    resolve_player_z(state, movement.z, config, collision_scene);

    if (input->jump_queued && state->grounded) {
        state->vertical_velocity = config->jump_speed;
        state->grounded = false;
    }
    input->jump_queued = false;

    state->vertical_velocity -= config->gravity * delta_time;
    resolve_player_y(state, state->vertical_velocity * delta_time, config, collision_scene);
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
