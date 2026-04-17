#define SOKOL_METAL
#define SOKOL_IMPL
#include "sokol/sokol_app.h"
#include "sokol/sokol_gfx.h"
#include "sokol/sokol_glue.h"
#include "sokol/sokol_log.h"

#include <math.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    float x;
    float y;
    float z;
} vec3_t;

typedef struct {
    float m[16];
} mat4_t;

typedef struct {
    float x;
    float y;
    float z;
    float r;
    float g;
    float b;
    float a;
} vertex_t;

typedef struct {
    float min_x;
    float min_y;
    float min_z;
    float max_x;
    float max_y;
    float max_z;
} collision_box_t;

typedef struct {
    float mvp[16];
} vs_params_t;

typedef struct {
    int size_x;
    int size_y;
    int size_z;
    float voxel_size;
    vertex_t* vertices;
    uint16_t* indices;
    collision_box_t* boxes;
    int vertex_count;
    int index_count;
    int box_count;
} runtime_world_t;

typedef struct {
    sg_pass_action pass_action;
    sg_pipeline pipeline;
    sg_bindings bindings;
    sg_shader shader;
    sg_buffer vertex_buffer;
    sg_buffer index_buffer;
    runtime_world_t world;
    vec3_t player_position;
    float camera_yaw;
    float camera_pitch;
    float vertical_velocity;
    bool grounded;
    bool mouse_captured;
    bool move_forward;
    bool move_backward;
    bool move_left;
    bool move_right;
    bool jump_queued;
} state_t;

static const char* RUNTIME_PATH = "data/runtime_world.txt";
static const float CAMERA_MOUSE_SENSITIVITY = 0.0035f;
static const float CAMERA_MOVE_SPEED = 3.6f;
static const float CAMERA_NEAR = 0.01f;
static const float CAMERA_FAR = 100.0f;
static const float CAMERA_FOV_Y = 60.0f * (3.14159265f / 180.0f);
static const float PLAYER_RADIUS = 0.22f;
static const float PLAYER_HEIGHT = 1.70f;
static const float PLAYER_EYE_HEIGHT = 1.56f;
static const float PLAYER_JUMP_SPEED = 5.2f;
static const float PLAYER_GRAVITY = 14.0f;

static state_t state;

static float clampf(float value, float min_value, float max_value) {
    if (value < min_value) {
        return min_value;
    }
    if (value > max_value) {
        return max_value;
    }
    return value;
}

static float maxf(float a, float b) {
    return a > b ? a : b;
}

static float minf(float a, float b) {
    return a < b ? a : b;
}

static bool range_overlaps(float a_min, float a_max, float b_min, float b_max) {
    return (a_min < b_max) && (a_max > b_min);
}

static vec3_t vec3_make(float x, float y, float z) {
    return (vec3_t){ x, y, z };
}

static vec3_t vec3_add(vec3_t a, vec3_t b) {
    return vec3_make(a.x + b.x, a.y + b.y, a.z + b.z);
}

static vec3_t vec3_sub(vec3_t a, vec3_t b) {
    return vec3_make(a.x - b.x, a.y - b.y, a.z - b.z);
}

static vec3_t vec3_scale(vec3_t v, float scale) {
    return vec3_make(v.x * scale, v.y * scale, v.z * scale);
}

static float vec3_dot(vec3_t a, vec3_t b) {
    return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
}

static vec3_t vec3_cross(vec3_t a, vec3_t b) {
    return vec3_make(
        (a.y * b.z) - (a.z * b.y),
        (a.z * b.x) - (a.x * b.z),
        (a.x * b.y) - (a.y * b.x)
    );
}

static vec3_t vec3_normalize(vec3_t v) {
    const float length = sqrtf(vec3_dot(v, v));
    if (length <= 0.00001f) {
        return vec3_make(0.0f, 0.0f, 0.0f);
    }
    return vec3_scale(v, 1.0f / length);
}

static mat4_t mat4_identity(void) {
    mat4_t result = { .m = {
        1.0f, 0.0f, 0.0f, 0.0f,
        0.0f, 1.0f, 0.0f, 0.0f,
        0.0f, 0.0f, 1.0f, 0.0f,
        0.0f, 0.0f, 0.0f, 1.0f,
    }};
    return result;
}

static mat4_t mat4_mul(mat4_t a, mat4_t b) {
    mat4_t result = {0};
    for (int col = 0; col < 4; col++) {
        for (int row = 0; row < 4; row++) {
            result.m[col * 4 + row] =
                a.m[0 * 4 + row] * b.m[col * 4 + 0] +
                a.m[1 * 4 + row] * b.m[col * 4 + 1] +
                a.m[2 * 4 + row] * b.m[col * 4 + 2] +
                a.m[3 * 4 + row] * b.m[col * 4 + 3];
        }
    }
    return result;
}

static mat4_t mat4_perspective(float fov_y_radians, float aspect, float near_z, float far_z) {
    const float f = 1.0f / tanf(fov_y_radians * 0.5f);
    mat4_t result = {0};
    result.m[0] = f / aspect;
    result.m[5] = f;
    result.m[10] = far_z / (near_z - far_z);
    result.m[11] = -1.0f;
    result.m[14] = (near_z * far_z) / (near_z - far_z);
    return result;
}

static mat4_t mat4_lookat(vec3_t eye, vec3_t center, vec3_t up) {
    const vec3_t forward = vec3_normalize(vec3_sub(center, eye));
    const vec3_t right = vec3_normalize(vec3_cross(forward, up));
    const vec3_t camera_up = vec3_cross(right, forward);
    mat4_t result = mat4_identity();
    result.m[0] = right.x;
    result.m[1] = camera_up.x;
    result.m[2] = -forward.x;
    result.m[4] = right.y;
    result.m[5] = camera_up.y;
    result.m[6] = -forward.y;
    result.m[8] = right.z;
    result.m[9] = camera_up.z;
    result.m[10] = -forward.z;
    result.m[12] = -vec3_dot(right, eye);
    result.m[13] = -vec3_dot(camera_up, eye);
    result.m[14] = vec3_dot(forward, eye);
    return result;
}

static bool load_runtime_world(const char* path, runtime_world_t* out_world) {
    FILE* file = fopen(path, "r");
    if (!file) {
        return false;
    }

    char token[64] = {0};
    if (fscanf(file, "%63s", token) != 1 || strcmp(token, "RUNTIME_VOXEL_WORLD_V1") != 0) {
        fclose(file);
        return false;
    }
    if (fscanf(file, "%63s %d %d %d", token, &out_world->size_x, &out_world->size_y, &out_world->size_z) != 4 || strcmp(token, "size") != 0) {
        fclose(file);
        return false;
    }
    if (fscanf(file, "%63s %f", token, &out_world->voxel_size) != 2 || strcmp(token, "voxel_size") != 0) {
        fclose(file);
        return false;
    }
    if (fscanf(file, "%63s %d", token, &out_world->vertex_count) != 2 || strcmp(token, "vertex_count") != 0) {
        fclose(file);
        return false;
    }
    if (fscanf(file, "%63s %d", token, &out_world->index_count) != 2 || strcmp(token, "index_count") != 0) {
        fclose(file);
        return false;
    }
    if (fscanf(file, "%63s %d", token, &out_world->box_count) != 2 || strcmp(token, "box_count") != 0) {
        fclose(file);
        return false;
    }
    if (fscanf(file, "%63s", token) != 1 || strcmp(token, "vertices") != 0) {
        fclose(file);
        return false;
    }

    out_world->vertices = (vertex_t*)malloc((size_t)out_world->vertex_count * sizeof(vertex_t));
    out_world->indices = (uint16_t*)malloc((size_t)out_world->index_count * sizeof(uint16_t));
    out_world->boxes = (collision_box_t*)malloc((size_t)out_world->box_count * sizeof(collision_box_t));
    if (!out_world->vertices || !out_world->indices || !out_world->boxes) {
        fclose(file);
        return false;
    }

    for (int index = 0; index < out_world->vertex_count; index++) {
        vertex_t* vertex = &out_world->vertices[index];
        if (fscanf(file, "%f %f %f %f %f %f %f", &vertex->x, &vertex->y, &vertex->z, &vertex->r, &vertex->g, &vertex->b, &vertex->a) != 7) {
            fclose(file);
            return false;
        }
    }
    if (fscanf(file, "%63s", token) != 1 || strcmp(token, "indices") != 0) {
        fclose(file);
        return false;
    }
    for (int index = 0; index < out_world->index_count; index++) {
        int value = 0;
        if (fscanf(file, "%d", &value) != 1) {
            fclose(file);
            return false;
        }
        out_world->indices[index] = (uint16_t)value;
    }
    if (fscanf(file, "%63s", token) != 1 || strcmp(token, "boxes") != 0) {
        fclose(file);
        return false;
    }
    for (int index = 0; index < out_world->box_count; index++) {
        float min_x = 0.0f;
        float min_y = 0.0f;
        float min_z = 0.0f;
        float size_x = 0.0f;
        float size_y = 0.0f;
        float size_z = 0.0f;
        if (fscanf(file, "%f %f %f %f %f %f", &min_x, &min_y, &min_z, &size_x, &size_y, &size_z) != 6) {
            fclose(file);
            return false;
        }
        out_world->boxes[index] = (collision_box_t){
            .min_x = min_x,
            .min_y = min_y,
            .min_z = min_z,
            .max_x = min_x + size_x,
            .max_y = min_y + size_y,
            .max_z = min_z + size_z,
        };
    }

    fclose(file);
    return true;
}

static void free_runtime_world(runtime_world_t* world) {
    free(world->vertices);
    free(world->indices);
    free(world->boxes);
    world->vertices = NULL;
    world->indices = NULL;
    world->boxes = NULL;
    world->vertex_count = 0;
    world->index_count = 0;
    world->box_count = 0;
}

static sg_shader make_shader(void) {
    const char* vertex_source =
        "#include <metal_stdlib>\n"
        "using namespace metal;\n"
        "struct vs_in {\n"
        "  float3 position [[attribute(0)]];\n"
        "  float4 color [[attribute(1)]];\n"
        "};\n"
        "struct vs_out {\n"
        "  float4 position [[position]];\n"
        "  float4 color;\n"
        "};\n"
        "struct params {\n"
        "  float4x4 mvp;\n"
        "};\n"
        "vertex vs_out vs_main(vs_in in [[stage_in]], constant params& p [[buffer(0)]]) {\n"
        "  vs_out out;\n"
        "  out.position = p.mvp * float4(in.position, 1.0);\n"
        "  out.color = in.color;\n"
        "  return out;\n"
        "}\n";
    const char* fragment_source =
        "#include <metal_stdlib>\n"
        "using namespace metal;\n"
        "struct fs_in {\n"
        "  float4 color;\n"
        "};\n"
        "fragment float4 fs_main(fs_in in [[stage_in]]) {\n"
        "  return in.color;\n"
        "}\n";
    return sg_make_shader(&(sg_shader_desc){
        .vertex_func = { .source = vertex_source, .entry = "vs_main" },
        .fragment_func = { .source = fragment_source, .entry = "fs_main" },
        .uniform_blocks[0] = {
            .stage = SG_SHADERSTAGE_VERTEX,
            .size = sizeof(vs_params_t),
            .msl_buffer_n = 0,
        },
    });
}

static vec3_t camera_forward(void) {
    const float cos_pitch = cosf(state.camera_pitch);
    return vec3_normalize(vec3_make(
        sinf(state.camera_yaw) * cos_pitch,
        sinf(state.camera_pitch),
        -cosf(state.camera_yaw) * cos_pitch
    ));
}

static vec3_t camera_right(void) {
    return vec3_normalize(vec3_make(cosf(state.camera_yaw), 0.0f, sinf(state.camera_yaw)));
}

static vec3_t camera_eye_position(void) {
    return vec3_add(state.player_position, vec3_make(0.0f, PLAYER_EYE_HEIGHT, 0.0f));
}

static void resolve_player_x(float delta_x) {
    if (delta_x == 0.0f) {
        return;
    }
    float new_x = state.player_position.x + delta_x;
    const float player_min_y = state.player_position.y;
    const float player_max_y = state.player_position.y + PLAYER_HEIGHT;
    const float player_min_z = state.player_position.z - PLAYER_RADIUS;
    const float player_max_z = state.player_position.z + PLAYER_RADIUS;

    for (int index = 0; index < state.world.box_count; index++) {
        const collision_box_t box = state.world.boxes[index];
        if (!range_overlaps(player_min_y, player_max_y, box.min_y, box.max_y)) {
            continue;
        }
        if (!range_overlaps(player_min_z, player_max_z, box.min_z, box.max_z)) {
            continue;
        }
        const float player_min_x = new_x - PLAYER_RADIUS;
        const float player_max_x = new_x + PLAYER_RADIUS;
        if (!range_overlaps(player_min_x, player_max_x, box.min_x, box.max_x)) {
            continue;
        }
        if (delta_x > 0.0f) {
            new_x = minf(new_x, box.min_x - PLAYER_RADIUS);
        } else {
            new_x = maxf(new_x, box.max_x + PLAYER_RADIUS);
        }
    }
    state.player_position.x = new_x;
}

static void resolve_player_z(float delta_z) {
    if (delta_z == 0.0f) {
        return;
    }
    float new_z = state.player_position.z + delta_z;
    const float player_min_y = state.player_position.y;
    const float player_max_y = state.player_position.y + PLAYER_HEIGHT;
    const float player_min_x = state.player_position.x - PLAYER_RADIUS;
    const float player_max_x = state.player_position.x + PLAYER_RADIUS;

    for (int index = 0; index < state.world.box_count; index++) {
        const collision_box_t box = state.world.boxes[index];
        if (!range_overlaps(player_min_y, player_max_y, box.min_y, box.max_y)) {
            continue;
        }
        if (!range_overlaps(player_min_x, player_max_x, box.min_x, box.max_x)) {
            continue;
        }
        const float player_min_z = new_z - PLAYER_RADIUS;
        const float player_max_z = new_z + PLAYER_RADIUS;
        if (!range_overlaps(player_min_z, player_max_z, box.min_z, box.max_z)) {
            continue;
        }
        if (delta_z > 0.0f) {
            new_z = minf(new_z, box.min_z - PLAYER_RADIUS);
        } else {
            new_z = maxf(new_z, box.max_z + PLAYER_RADIUS);
        }
    }
    state.player_position.z = new_z;
}

static void resolve_player_y(float delta_y) {
    float new_y = state.player_position.y + delta_y;
    bool grounded = false;
    const float player_min_x = state.player_position.x - PLAYER_RADIUS;
    const float player_max_x = state.player_position.x + PLAYER_RADIUS;
    const float player_min_z = state.player_position.z - PLAYER_RADIUS;
    const float player_max_z = state.player_position.z + PLAYER_RADIUS;

    for (int index = 0; index < state.world.box_count; index++) {
        const collision_box_t box = state.world.boxes[index];
        if (!range_overlaps(player_min_x, player_max_x, box.min_x, box.max_x)) {
            continue;
        }
        if (!range_overlaps(player_min_z, player_max_z, box.min_z, box.max_z)) {
            continue;
        }
        const float player_min_y = new_y;
        const float player_max_y = new_y + PLAYER_HEIGHT;
        if (!range_overlaps(player_min_y, player_max_y, box.min_y, box.max_y)) {
            continue;
        }
        if (delta_y <= 0.0f) {
            new_y = maxf(new_y, box.max_y);
            grounded = true;
        } else {
            new_y = minf(new_y, box.min_y - PLAYER_HEIGHT);
        }
        state.vertical_velocity = 0.0f;
    }

    state.player_position.y = new_y;
    state.grounded = grounded;
}

static void init(void) {
    sg_setup(&(sg_desc){
        .environment = sglue_environment(),
        .logger.func = slog_func,
    });

    memset(&state.world, 0, sizeof(state.world));
    if (!load_runtime_world(RUNTIME_PATH, &state.world)) {
        fprintf(stderr, "failed to load runtime artifact: %s\n", RUNTIME_PATH);
        abort();
    }

    state.vertex_buffer = sg_make_buffer(&(sg_buffer_desc){
        .usage.vertex_buffer = true,
        .data = {
            .ptr = state.world.vertices,
            .size = (size_t)state.world.vertex_count * sizeof(vertex_t),
        },
    });
    state.index_buffer = sg_make_buffer(&(sg_buffer_desc){
        .usage.index_buffer = true,
        .data = {
            .ptr = state.world.indices,
            .size = (size_t)state.world.index_count * sizeof(uint16_t),
        },
    });
    state.shader = make_shader();
    state.pipeline = sg_make_pipeline(&(sg_pipeline_desc){
        .shader = state.shader,
        .layout = {
            .buffers[0].stride = sizeof(vertex_t),
            .attrs = {
                [0].format = SG_VERTEXFORMAT_FLOAT3,
                [1].format = SG_VERTEXFORMAT_FLOAT4,
                [1].offset = 3 * sizeof(float),
            },
        },
        .index_type = SG_INDEXTYPE_UINT16,
        .depth = {
            .write_enabled = true,
            .compare = SG_COMPAREFUNC_LESS_EQUAL,
        },
        .cull_mode = SG_CULLMODE_NONE,
    });
    state.bindings.vertex_buffers[0] = state.vertex_buffer;
    state.bindings.index_buffer = state.index_buffer;
    state.pass_action = (sg_pass_action){
        .colors[0] = {
            .load_action = SG_LOADACTION_CLEAR,
            .clear_value = { 0.69f, 0.73f, 0.80f, 1.0f },
        },
        .depth = {
            .load_action = SG_LOADACTION_CLEAR,
            .clear_value = 1.0f,
        },
    };

    state.player_position = vec3_make(0.0f, 0.5f, 1.65f);
    state.camera_yaw = 0.0f;
    state.camera_pitch = -0.12f;
    state.grounded = true;
}

static void frame(void) {
    float delta_time = (float)sapp_frame_duration();
    if ((delta_time <= 0.0f) || (delta_time > 0.1f)) {
        delta_time = 1.0f / 60.0f;
    }

    vec3_t movement = vec3_make(0.0f, 0.0f, 0.0f);
    const vec3_t forward = vec3_normalize(vec3_make(camera_forward().x, 0.0f, camera_forward().z));
    const vec3_t right = camera_right();
    if (state.move_forward) {
        movement = vec3_add(movement, forward);
    }
    if (state.move_backward) {
        movement = vec3_sub(movement, forward);
    }
    if (state.move_right) {
        movement = vec3_add(movement, right);
    }
    if (state.move_left) {
        movement = vec3_sub(movement, right);
    }
    if (vec3_dot(movement, movement) > 0.0f) {
        movement = vec3_scale(vec3_normalize(movement), CAMERA_MOVE_SPEED * delta_time);
    }
    resolve_player_x(movement.x);
    resolve_player_z(movement.z);

    if (state.jump_queued && state.grounded) {
        state.vertical_velocity = PLAYER_JUMP_SPEED;
        state.grounded = false;
    }
    state.jump_queued = false;

    state.vertical_velocity -= PLAYER_GRAVITY * delta_time;
    resolve_player_y(state.vertical_velocity * delta_time);

    const vec3_t eye = camera_eye_position();
    const vec3_t target = vec3_add(eye, camera_forward());
    const mat4_t view = mat4_lookat(eye, target, vec3_make(0.0f, 1.0f, 0.0f));
    const mat4_t projection = mat4_perspective(CAMERA_FOV_Y, sapp_widthf() / sapp_heightf(), CAMERA_NEAR, CAMERA_FAR);
    const mat4_t mvp = mat4_mul(projection, view);
    vs_params_t params = {0};
    memcpy(params.mvp, mvp.m, sizeof(mvp.m));

    sg_begin_pass(&(sg_pass){
        .action = state.pass_action,
        .swapchain = sglue_swapchain(),
    });
    sg_apply_pipeline(state.pipeline);
    sg_apply_bindings(&state.bindings);
    sg_apply_uniforms(0, &SG_RANGE(params));
    sg_draw(0, state.world.index_count, 1);
    sg_end_pass();
    sg_commit();
}

static void cleanup(void) {
    free_runtime_world(&state.world);
    sg_shutdown();
}

static void event(const sapp_event* event) {
    switch (event->type) {
        case SAPP_EVENTTYPE_MOUSE_DOWN:
            if (!state.mouse_captured) {
                sapp_lock_mouse(true);
                sapp_show_mouse(false);
                state.mouse_captured = true;
            }
            break;
        case SAPP_EVENTTYPE_MOUSE_MOVE:
            if (state.mouse_captured) {
                state.camera_yaw += event->mouse_dx * CAMERA_MOUSE_SENSITIVITY;
                state.camera_pitch -= event->mouse_dy * CAMERA_MOUSE_SENSITIVITY;
                state.camera_pitch = clampf(state.camera_pitch, -1.45f, 1.45f);
            }
            break;
        case SAPP_EVENTTYPE_KEY_DOWN:
            switch (event->key_code) {
                case SAPP_KEYCODE_W: state.move_forward = true; break;
                case SAPP_KEYCODE_S: state.move_backward = true; break;
                case SAPP_KEYCODE_A: state.move_left = true; break;
                case SAPP_KEYCODE_D: state.move_right = true; break;
                case SAPP_KEYCODE_SPACE: state.jump_queued = true; break;
                case SAPP_KEYCODE_ESCAPE:
                    if (state.mouse_captured) {
                        sapp_lock_mouse(false);
                        sapp_show_mouse(true);
                        state.mouse_captured = false;
                    } else {
                        sapp_request_quit();
                    }
                    break;
                default:
                    break;
            }
            break;
        case SAPP_EVENTTYPE_KEY_UP:
            switch (event->key_code) {
                case SAPP_KEYCODE_W: state.move_forward = false; break;
                case SAPP_KEYCODE_S: state.move_backward = false; break;
                case SAPP_KEYCODE_A: state.move_left = false; break;
                case SAPP_KEYCODE_D: state.move_right = false; break;
                default:
                    break;
            }
            break;
        default:
            break;
    }
}

sapp_desc sokol_main(int argc, char* argv[]) {
    (void)argc;
    (void)argv;
    return (sapp_desc){
        .init_cb = init,
        .frame_cb = frame,
        .cleanup_cb = cleanup,
        .event_cb = event,
        .width = 1280,
        .height = 720,
        .sample_count = 4,
        .high_dpi = true,
        .window_title = "sokol v8 voxel collision runtime",
        .logger.func = slog_func,
    };
}
