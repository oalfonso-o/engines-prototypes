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
    float mvp[16];
} vs_params_t;

typedef struct {
    int size_x;
    int size_y;
    int size_z;
    float voxel_size;
    vertex_t* vertices;
    uint16_t* indices;
    int vertex_count;
    int index_count;
} runtime_mesh_t;

typedef struct {
    sg_pass_action pass_action;
    sg_pipeline pipeline;
    sg_bindings bindings;
    sg_shader shader;
    sg_buffer vertex_buffer;
    sg_buffer index_buffer;
    runtime_mesh_t mesh;
    vec3_t camera_position;
    float camera_yaw;
    float camera_pitch;
    float vertical_velocity;
    bool mouse_captured;
    bool move_forward;
    bool move_backward;
    bool move_left;
    bool move_right;
    bool jump_pressed;
} state_t;

static const char* RUNTIME_PATH = "sokol-prototypes/v3-voxel-runtime-pipeline/data/runtime_mesh.txt";
static const float CAMERA_MOUSE_SENSITIVITY = 0.0035f;
static const float CAMERA_MOVE_SPEED = 1.6f;
static const float CAMERA_EYE_HEIGHT = 0.17f;
static const float CAMERA_JUMP_SPEED = 1.3f;
static const float CAMERA_GRAVITY = 3.2f;
static const float GROUND_Y = 0.0f;

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
        0.0f, 0.0f, 0.0f, 1.0f
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

static void append_vertex(runtime_mesh_t* mesh, vertex_t vertex) {
    mesh->vertices = (vertex_t*)realloc(mesh->vertices, (size_t)(mesh->vertex_count + 1) * sizeof(vertex_t));
    mesh->vertices[mesh->vertex_count++] = vertex;
}

static void append_index(runtime_mesh_t* mesh, uint16_t index) {
    mesh->indices = (uint16_t*)realloc(mesh->indices, (size_t)(mesh->index_count + 1) * sizeof(uint16_t));
    mesh->indices[mesh->index_count++] = index;
}

static void append_quad(runtime_mesh_t* mesh, vertex_t a, vertex_t b, vertex_t c, vertex_t d) {
    const uint16_t base = (uint16_t) mesh->vertex_count;
    append_vertex(mesh, a);
    append_vertex(mesh, b);
    append_vertex(mesh, c);
    append_vertex(mesh, d);
    append_index(mesh, base + 0);
    append_index(mesh, base + 1);
    append_index(mesh, base + 2);
    append_index(mesh, base + 0);
    append_index(mesh, base + 2);
    append_index(mesh, base + 3);
}

static bool load_runtime_mesh(const char* path, runtime_mesh_t* out_mesh) {
    FILE* file = fopen(path, "r");
    if (!file) {
        return false;
    }

    char token[64] = {0};
    if (fscanf(file, "%63s", token) != 1 || strcmp(token, "RUNTIME_MESH_V1") != 0) {
        fclose(file);
        return false;
    }
    if (fscanf(file, "%63s %d %d %d", token, &out_mesh->size_x, &out_mesh->size_y, &out_mesh->size_z) != 4 || strcmp(token, "size") != 0) {
        fclose(file);
        return false;
    }
    if (fscanf(file, "%63s %f", token, &out_mesh->voxel_size) != 2 || strcmp(token, "voxel_size") != 0) {
        fclose(file);
        return false;
    }
    if (fscanf(file, "%63s %d", token, &out_mesh->vertex_count) != 2 || strcmp(token, "vertex_count") != 0) {
        fclose(file);
        return false;
    }
    if (fscanf(file, "%63s %d", token, &out_mesh->index_count) != 2 || strcmp(token, "index_count") != 0) {
        fclose(file);
        return false;
    }
    if (fscanf(file, "%63s", token) != 1 || strcmp(token, "vertices") != 0) {
        fclose(file);
        return false;
    }

    out_mesh->vertices = (vertex_t*)malloc((size_t)out_mesh->vertex_count * sizeof(vertex_t));
    out_mesh->indices = (uint16_t*)malloc((size_t)out_mesh->index_count * sizeof(uint16_t));
    if (!out_mesh->vertices || !out_mesh->indices) {
        fclose(file);
        return false;
    }

    for (int index = 0; index < out_mesh->vertex_count; index++) {
        vertex_t* vertex = &out_mesh->vertices[index];
        if (fscanf(file, "%f %f %f %f %f %f %f", &vertex->x, &vertex->y, &vertex->z, &vertex->r, &vertex->g, &vertex->b, &vertex->a) != 7) {
            fclose(file);
            return false;
        }
    }
    if (fscanf(file, "%63s", token) != 1 || strcmp(token, "indices") != 0) {
        fclose(file);
        return false;
    }
    for (int index = 0; index < out_mesh->index_count; index++) {
        int value = 0;
        if (fscanf(file, "%d", &value) != 1) {
            fclose(file);
            return false;
        }
        out_mesh->indices[index] = (uint16_t)value;
    }
    fclose(file);
    return true;
}

static void append_ground(runtime_mesh_t* mesh) {
    const vertex_t a = { -4.0f, GROUND_Y, -4.0f, 0.20f, 0.22f, 0.24f, 1.0f };
    const vertex_t b = { -4.0f, GROUND_Y,  4.0f, 0.20f, 0.22f, 0.24f, 1.0f };
    const vertex_t c = {  4.0f, GROUND_Y,  4.0f, 0.20f, 0.22f, 0.24f, 1.0f };
    const vertex_t d = {  4.0f, GROUND_Y, -4.0f, 0.20f, 0.22f, 0.24f, 1.0f };
    append_quad(mesh, a, b, c, d);
}

static void free_runtime_mesh(runtime_mesh_t* mesh) {
    free(mesh->vertices);
    free(mesh->indices);
    mesh->vertices = NULL;
    mesh->indices = NULL;
    mesh->vertex_count = 0;
    mesh->index_count = 0;
}

static void update_camera(float delta_time) {
    const float cos_pitch = cosf(state.camera_pitch);
    const vec3_t forward = vec3_normalize(vec3_make(
        sinf(state.camera_yaw) * cos_pitch,
        0.0f,
        cosf(state.camera_yaw) * cos_pitch
    ));
    const vec3_t right = vec3_make(cosf(state.camera_yaw), 0.0f, -sinf(state.camera_yaw));
    vec3_t movement = vec3_make(0.0f, 0.0f, 0.0f);

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
        state.camera_position = vec3_add(state.camera_position, movement);
    }

    if (state.jump_pressed && (state.camera_position.y <= CAMERA_EYE_HEIGHT + 0.0001f)) {
        state.vertical_velocity = CAMERA_JUMP_SPEED;
    }
    state.jump_pressed = false;
    state.vertical_velocity -= CAMERA_GRAVITY * delta_time;
    state.camera_position.y += state.vertical_velocity * delta_time;
    if (state.camera_position.y < CAMERA_EYE_HEIGHT) {
        state.camera_position.y = CAMERA_EYE_HEIGHT;
        state.vertical_velocity = 0.0f;
    }
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
        .vertex_func = {
            .source = vertex_source,
            .entry = "vs_main",
        },
        .fragment_func = {
            .source = fragment_source,
            .entry = "fs_main",
        },
        .uniform_blocks[0] = {
            .stage = SG_SHADERSTAGE_VERTEX,
            .size = sizeof(vs_params_t),
            .msl_buffer_n = 0,
        },
    });
}

static void init(void) {
    sg_setup(&(sg_desc){
        .environment = sglue_environment(),
        .logger.func = slog_func,
    });

    memset(&state.mesh, 0, sizeof(state.mesh));
    if (!load_runtime_mesh(RUNTIME_PATH, &state.mesh)) {
        fprintf(stderr, "failed to load runtime artifact: %s\n", RUNTIME_PATH);
        abort();
    }
    append_ground(&state.mesh);

    state.vertex_buffer = sg_make_buffer(&(sg_buffer_desc){
        .usage.vertex_buffer = true,
        .data = {
            .ptr = state.mesh.vertices,
            .size = (size_t)state.mesh.vertex_count * sizeof(vertex_t),
        },
    });
    state.index_buffer = sg_make_buffer(&(sg_buffer_desc){
        .usage.index_buffer = true,
        .data = {
            .ptr = state.mesh.indices,
            .size = (size_t)state.mesh.index_count * sizeof(uint16_t),
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
        .cull_mode = SG_CULLMODE_BACK,
        .colors[0].blend = {
            .enabled = false,
        },
    });
    state.bindings.vertex_buffers[0] = state.vertex_buffer;
    state.bindings.index_buffer = state.index_buffer;
    state.pass_action = (sg_pass_action){
        .colors[0] = {
            .load_action = SG_LOADACTION_CLEAR,
            .clear_value = { 0.67f, 0.72f, 0.78f, 1.0f },
        },
        .depth = {
            .load_action = SG_LOADACTION_CLEAR,
            .clear_value = 1.0f,
        },
    };
    state.camera_position = vec3_make(0.0f, CAMERA_EYE_HEIGHT, 1.8f);
    state.camera_yaw = 3.14159265f;
    state.camera_pitch = -0.18f;
}

static void frame(void) {
    const float delta_time = (float)sapp_frame_duration();
    update_camera(delta_time);

    const vec3_t camera_forward = vec3_make(
        sinf(state.camera_yaw) * cosf(state.camera_pitch),
        sinf(state.camera_pitch),
        cosf(state.camera_yaw) * cosf(state.camera_pitch)
    );
    const vec3_t target = vec3_add(state.camera_position, camera_forward);
    const mat4_t view = mat4_lookat(state.camera_position, target, vec3_make(0.0f, 1.0f, 0.0f));
    const mat4_t projection = mat4_perspective(60.0f * (3.14159265f / 180.0f), sapp_widthf() / sapp_heightf(), 0.01f, 100.0f);
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
    sg_draw(0, state.mesh.index_count, 1);
    sg_end_pass();
    sg_commit();
}

static void cleanup(void) {
    free_runtime_mesh(&state.mesh);
    sg_shutdown();
}

static void event(const sapp_event* event) {
    switch (event->type) {
        case SAPP_EVENTTYPE_MOUSE_DOWN:
            if (!state.mouse_captured) {
                sapp_lock_mouse(true);
                state.mouse_captured = true;
            }
            break;
        case SAPP_EVENTTYPE_MOUSE_MOVE:
            if (state.mouse_captured) {
                state.camera_yaw -= event->mouse_dx * CAMERA_MOUSE_SENSITIVITY;
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
                case SAPP_KEYCODE_SPACE: state.jump_pressed = true; break;
                case SAPP_KEYCODE_ESCAPE:
                    if (state.mouse_captured) {
                        sapp_lock_mouse(false);
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
        .window_title = "sokol v3 voxel runtime pipeline",
        .logger.func = slog_func,
    };
}
