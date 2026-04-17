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
    float u;
    float v;
} vertex_t;

typedef struct {
    float mvp[16];
} vs_params_t;

typedef struct {
    int index_start;
    int index_count;
    int texture_index;
} draw_item_t;

typedef struct {
    bool forward;
    bool back;
    bool left;
    bool right;
    bool mouse_locked;
    bool jump_pressed;
    float yaw;
    float pitch;
    float vertical_velocity;
    vec3_t position;
    sg_pass_action pass_action;
    sg_pipeline pipeline;
    sg_bindings bindings;
    sg_shader shader;
    sg_buffer vertex_buffer;
    sg_buffer index_buffer;
    sg_sampler sampler;
    sg_image images[6];
    sg_view views[6];
    draw_item_t items[6];
    int item_count;
    vertex_t* vertices;
    uint16_t* indices;
    int vertex_count;
    int index_count;
} state_t;

static const int TEX_SIZE = 64;
static const int WALL_COUNT = 5;
static const int TEX_FLOOR = 5;
static const float CAMERA_MOUSE_SENSITIVITY = 0.0035f;
static const float MOVE_SPEED = 4.8f;
static const float PLAYER_EYE_HEIGHT = 1.8f;
static const float JUMP_SPEED = 5.2f;
static const float GRAVITY = 14.0f;

static state_t state;

static vec3_t vec3_make(float x, float y, float z) {
    return (vec3_t){ x, y, z };
}

static vec3_t vec3_add(vec3_t a, vec3_t b) {
    return vec3_make(a.x + b.x, a.y + b.y, a.z + b.z);
}

static vec3_t vec3_scale(vec3_t v, float s) {
    return vec3_make(v.x * s, v.y * s, v.z * s);
}

static vec3_t vec3_sub(vec3_t a, vec3_t b) {
    return vec3_make(a.x - b.x, a.y - b.y, a.z - b.z);
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
    const float len = sqrtf(vec3_dot(v, v));
    if (len <= 0.00001f) {
        return vec3_make(0.0f, 0.0f, 0.0f);
    }
    return vec3_scale(v, 1.0f / len);
}

static float clampf(float v, float min_v, float max_v) {
    if (v < min_v) {
        return min_v;
    }
    if (v > max_v) {
        return max_v;
    }
    return v;
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

static vec3_t camera_forward(void) {
    const float cp = cosf(state.pitch);
    return vec3_normalize(vec3_make(
        cosf(state.yaw) * cp,
        sinf(state.pitch),
        sinf(state.yaw) * cp
    ));
}

static uint8_t hash_u8(int x, int y, int seed) {
    uint32_t h = (uint32_t)(x * 374761393u) ^ (uint32_t)(y * 668265263u) ^ (uint32_t)(seed * 2246822519u);
    h = (h ^ (h >> 13)) * 1274126177u;
    h ^= (h >> 16);
    return (uint8_t)(h & 255u);
}

static void set_pixel(uint8_t* pixels, int x, int y, uint8_t r, uint8_t g, uint8_t b, uint8_t a) {
    const int index = ((y * TEX_SIZE) + x) * 4;
    pixels[index + 0] = r;
    pixels[index + 1] = g;
    pixels[index + 2] = b;
    pixels[index + 3] = a;
}

static void generate_industrial(uint8_t* pixels) {
    for (int y = 0; y < TEX_SIZE; y++) {
        for (int x = 0; x < TEX_SIZE; x++) {
            uint8_t base = (uint8_t)(52 + (hash_u8(x / 4, y / 4, 1) % 18));
            if ((x % 16) == 0 || (y % 16) == 0) {
                base = (uint8_t)(base + 25);
            }
            if (((x % 16) == 3 || (x % 16) == 12) && ((y % 16) == 3 || (y % 16) == 12)) {
                set_pixel(pixels, x, y, 150, 150, 154, 255);
            } else {
                set_pixel(pixels, x, y, base, base, (uint8_t)(base + 6), 255);
            }
        }
    }
}

static void generate_gothic(uint8_t* pixels) {
    for (int y = 0; y < TEX_SIZE; y++) {
        for (int x = 0; x < TEX_SIZE; x++) {
            const int bx = x / 12;
            const int by = y / 10;
            uint8_t stone = (uint8_t)(44 + (hash_u8(bx, by, 2) % 30));
            uint8_t r = (uint8_t)(stone - 4);
            uint8_t g = (uint8_t)(stone - 2);
            uint8_t b = (uint8_t)(stone + 6);
            if ((x % 12) == 0 || (y % 10) == 0) {
                r = (uint8_t)(r / 2);
                g = (uint8_t)(g / 2);
                b = (uint8_t)(b / 2);
            }
            set_pixel(pixels, x, y, r, g, b, 255);
        }
    }
}

static void generate_scifi(uint8_t* pixels) {
    for (int y = 0; y < TEX_SIZE; y++) {
        for (int x = 0; x < TEX_SIZE; x++) {
            uint8_t r = 28;
            uint8_t g = 44;
            uint8_t b = 56;
            if ((x % 16) == 0 || (y % 16) == 0) {
                r = 60; g = 84; b = 96;
            }
            if ((x > 20 && x < 44) && ((y % 16) > 5 && (y % 16) < 9)) {
                r = 90; g = 180; b = 200;
            }
            if ((x % 8) == 0 && (y % 8) == 0) {
                r = 120; g = 140; b = 150;
            }
            set_pixel(pixels, x, y, r, g, b, 255);
        }
    }
}

static void generate_lava(uint8_t* pixels) {
    for (int y = 0; y < TEX_SIZE; y++) {
        for (int x = 0; x < TEX_SIZE; x++) {
            float fx = (float)x / 8.0f;
            float fy = (float)y / 8.0f;
            float waves = sinf(fx) + cosf(fy * 1.3f) + sinf((fx + fy) * 0.7f);
            uint8_t glow = (uint8_t)clampf(140.0f + (waves * 40.0f) + (hash_u8(x, y, 3) % 30), 0.0f, 255.0f);
            uint8_t r = (uint8_t)clampf(glow + 60.0f, 0.0f, 255.0f);
            uint8_t g = (uint8_t)clampf((float)glow * 0.55f, 0.0f, 255.0f);
            uint8_t b = (uint8_t)clampf((float)glow * 0.10f, 0.0f, 255.0f);
            if ((hash_u8(x / 3, y / 3, 9) % 7) == 0) {
                r = 255; g = 220; b = 100;
            }
            set_pixel(pixels, x, y, r, g, b, 255);
        }
    }
}

static void generate_concrete(uint8_t* pixels) {
    for (int y = 0; y < TEX_SIZE; y++) {
        for (int x = 0; x < TEX_SIZE; x++) {
            uint8_t v = (uint8_t)(92 + (hash_u8(x, y, 4) % 24));
            if ((x % 31) == 0 || (y % 29) == 0) {
                v = (uint8_t)(v - 18);
            }
            set_pixel(pixels, x, y, v, v, (uint8_t)(v - 2), 255);
        }
    }
}

static void generate_floor(uint8_t* pixels) {
    for (int y = 0; y < TEX_SIZE; y++) {
        for (int x = 0; x < TEX_SIZE; x++) {
            uint8_t v = (uint8_t)(42 + (hash_u8(x / 2, y / 2, 5) % 12));
            if (((x / 8) + (y / 8)) % 2 == 0) {
                v = (uint8_t)(v + 6);
            }
            set_pixel(pixels, x, y, v, v, v, 255);
        }
    }
}

static void append_vertex(vertex_t vertex) {
    state.vertices = (vertex_t*)realloc(state.vertices, (size_t)(state.vertex_count + 1) * sizeof(vertex_t));
    state.vertices[state.vertex_count++] = vertex;
}

static void append_index(uint16_t index) {
    state.indices = (uint16_t*)realloc(state.indices, (size_t)(state.index_count + 1) * sizeof(uint16_t));
    state.indices[state.index_count++] = index;
}

static void append_textured_quad(vec3_t a, vec3_t b, vec3_t c, vec3_t d, float u_repeat, float v_repeat, int texture_index) {
    const uint16_t base = (uint16_t)state.vertex_count;
    append_vertex((vertex_t){ a.x, a.y, a.z, 0.0f, 0.0f });
    append_vertex((vertex_t){ b.x, b.y, b.z, 0.0f, v_repeat });
    append_vertex((vertex_t){ c.x, c.y, c.z, u_repeat, v_repeat });
    append_vertex((vertex_t){ d.x, d.y, d.z, u_repeat, 0.0f });
    state.items[state.item_count++] = (draw_item_t){ state.index_count, 6, texture_index };
    append_index(base + 0);
    append_index(base + 1);
    append_index(base + 2);
    append_index(base + 0);
    append_index(base + 2);
    append_index(base + 3);
}

static void build_scene_geometry(void) {
    state.item_count = 0;
    state.vertices = NULL;
    state.indices = NULL;
    state.vertex_count = 0;
    state.index_count = 0;

    append_textured_quad(
        vec3_make(-8.0f, 0.0f, -8.0f),
        vec3_make(-8.0f, 0.0f,  8.0f),
        vec3_make( 8.0f, 0.0f,  8.0f),
        vec3_make( 8.0f, 0.0f, -8.0f),
        8.0f, 8.0f, TEX_FLOOR
    );

    const float z = -4.0f;
    const float width = 2.2f;
    const float height = 2.8f;
    const float xs[WALL_COUNT] = { -5.4f, -2.7f, 0.0f, 2.7f, 5.4f };
    for (int i = 0; i < WALL_COUNT; i++) {
        const float x0 = xs[i] - (width * 0.5f);
        const float x1 = xs[i] + (width * 0.5f);
        append_textured_quad(
            vec3_make(x0, 0.0f, z),
            vec3_make(x0, height, z),
            vec3_make(x1, height, z),
            vec3_make(x1, 0.0f, z),
            1.0f, 1.0f, i
        );
    }
}

static sg_shader make_shader(void) {
    const char* vertex_source =
        "#include <metal_stdlib>\n"
        "using namespace metal;\n"
        "struct vs_in {\n"
        "  float3 position [[attribute(0)]];\n"
        "  float2 uv [[attribute(1)]];\n"
        "};\n"
        "struct vs_out {\n"
        "  float4 position [[position]];\n"
        "  float2 uv;\n"
        "};\n"
        "struct params {\n"
        "  float4x4 mvp;\n"
        "};\n"
        "vertex vs_out vs_main(vs_in in [[stage_in]], constant params& p [[buffer(0)]]) {\n"
        "  vs_out out;\n"
        "  out.position = p.mvp * float4(in.position, 1.0);\n"
        "  out.uv = in.uv;\n"
        "  return out;\n"
        "}\n";
    const char* fragment_source =
        "#include <metal_stdlib>\n"
        "using namespace metal;\n"
        "struct fs_in {\n"
        "  float2 uv;\n"
        "};\n"
        "fragment float4 fs_main(fs_in in [[stage_in]], texture2d<float> tex [[texture(0)]], sampler smp [[sampler(0)]]) {\n"
        "  return tex.sample(smp, in.uv);\n"
        "}\n";
    return sg_make_shader(&(sg_shader_desc){
        .vertex_func = { .source = vertex_source, .entry = "vs_main" },
        .fragment_func = { .source = fragment_source, .entry = "fs_main" },
        .uniform_blocks[0] = {
            .stage = SG_SHADERSTAGE_VERTEX,
            .size = sizeof(vs_params_t),
            .msl_buffer_n = 0,
        },
        .views[0].texture = {
            .stage = SG_SHADERSTAGE_FRAGMENT,
            .image_type = SG_IMAGETYPE_2D,
            .sample_type = SG_IMAGESAMPLETYPE_FLOAT,
            .msl_texture_n = 0,
        },
        .samplers[0] = {
            .stage = SG_SHADERSTAGE_FRAGMENT,
            .sampler_type = SG_SAMPLERTYPE_FILTERING,
            .msl_sampler_n = 0,
        },
        .texture_sampler_pairs[0] = {
            .stage = SG_SHADERSTAGE_FRAGMENT,
            .view_slot = 0,
            .sampler_slot = 0,
        },
    });
}

static void create_texture(int index, void (*generator)(uint8_t*)) {
    uint8_t* pixels = (uint8_t*)malloc((size_t)(TEX_SIZE * TEX_SIZE * 4));
    generator(pixels);
    state.images[index] = sg_make_image(&(sg_image_desc){
        .width = TEX_SIZE,
        .height = TEX_SIZE,
        .pixel_format = SG_PIXELFORMAT_RGBA8,
        .data.mip_levels[0] = {
            .ptr = pixels,
            .size = (size_t)(TEX_SIZE * TEX_SIZE * 4),
        },
    });
    state.views[index] = sg_make_view(&(sg_view_desc){
        .texture.image = state.images[index],
    });
    free(pixels);
}

static void init(void) {
    sg_setup(&(sg_desc){
        .environment = sglue_environment(),
        .logger.func = slog_func,
    });

    build_scene_geometry();

    state.vertex_buffer = sg_make_buffer(&(sg_buffer_desc){
        .usage.vertex_buffer = true,
        .data = {
            .ptr = state.vertices,
            .size = (size_t)state.vertex_count * sizeof(vertex_t),
        },
    });
    state.index_buffer = sg_make_buffer(&(sg_buffer_desc){
        .usage.index_buffer = true,
        .data = {
            .ptr = state.indices,
            .size = (size_t)state.index_count * sizeof(uint16_t),
        },
    });

    create_texture(0, generate_industrial);
    create_texture(1, generate_gothic);
    create_texture(2, generate_scifi);
    create_texture(3, generate_lava);
    create_texture(4, generate_concrete);
    create_texture(5, generate_floor);

    state.sampler = sg_make_sampler(&(sg_sampler_desc){
        .min_filter = SG_FILTER_LINEAR,
        .mag_filter = SG_FILTER_LINEAR,
        .wrap_u = SG_WRAP_REPEAT,
        .wrap_v = SG_WRAP_REPEAT,
    });

    state.shader = make_shader();
    state.pipeline = sg_make_pipeline(&(sg_pipeline_desc){
        .shader = state.shader,
        .layout = {
            .buffers[0].stride = sizeof(vertex_t),
            .attrs = {
                [0].format = SG_VERTEXFORMAT_FLOAT3,
                [1].format = SG_VERTEXFORMAT_FLOAT2,
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
    state.bindings.samplers[0] = state.sampler;

    state.pass_action = (sg_pass_action){
        .colors[0] = {
            .load_action = SG_LOADACTION_CLEAR,
            .clear_value = { 0.08f, 0.09f, 0.12f, 1.0f },
        },
        .depth = {
            .load_action = SG_LOADACTION_CLEAR,
            .clear_value = 1.0f,
        },
    };

    state.position = vec3_make(0.0f, PLAYER_EYE_HEIGHT, 4.6f);
    state.yaw = -1.57079632679f;
    state.pitch = -0.08f;
}

static void frame(void) {
    float dt = (float)sapp_frame_duration();
    if ((dt <= 0.0f) || (dt > 0.1f)) {
        dt = 1.0f / 60.0f;
    }

    vec3_t forward = camera_forward();
    vec3_t flat_forward = vec3_normalize(vec3_make(forward.x, 0.0f, forward.z));
    vec3_t right = vec3_normalize(vec3_cross(flat_forward, vec3_make(0.0f, 1.0f, 0.0f)));
    vec3_t motion = vec3_make(0.0f, 0.0f, 0.0f);
    if (state.forward) motion = vec3_add(motion, flat_forward);
    if (state.back) motion = vec3_add(motion, vec3_scale(flat_forward, -1.0f));
    if (state.right) motion = vec3_add(motion, right);
    if (state.left) motion = vec3_add(motion, vec3_scale(right, -1.0f));
    if (vec3_dot(motion, motion) > 0.0f) {
        motion = vec3_scale(vec3_normalize(motion), MOVE_SPEED * dt);
        state.position = vec3_add(state.position, motion);
    }

    if (state.jump_pressed && (state.position.y <= PLAYER_EYE_HEIGHT + 0.001f)) {
        state.vertical_velocity = JUMP_SPEED;
    }
    state.jump_pressed = false;
    state.vertical_velocity -= GRAVITY * dt;
    state.position.y += state.vertical_velocity * dt;
    if (state.position.y < PLAYER_EYE_HEIGHT) {
        state.position.y = PLAYER_EYE_HEIGHT;
        state.vertical_velocity = 0.0f;
    }

    vec3_t target = vec3_add(state.position, camera_forward());
    mat4_t view = mat4_lookat(state.position, target, vec3_make(0.0f, 1.0f, 0.0f));
    mat4_t proj = mat4_perspective(60.0f * (3.14159265f / 180.0f), sapp_widthf() / sapp_heightf(), 0.01f, 100.0f);
    mat4_t mvp = mat4_mul(proj, view);
    vs_params_t params = {0};
    memcpy(params.mvp, mvp.m, sizeof(mvp.m));

    sg_begin_pass(&(sg_pass){
        .action = state.pass_action,
        .swapchain = sglue_swapchain(),
    });
    sg_apply_pipeline(state.pipeline);
    sg_apply_uniforms(0, &SG_RANGE(params));
    for (int i = 0; i < state.item_count; i++) {
        state.bindings.views[0] = state.views[state.items[i].texture_index];
        sg_apply_bindings(&state.bindings);
        sg_draw(state.items[i].index_start, state.items[i].index_count, 1);
    }
    sg_end_pass();
    sg_commit();
}

static void cleanup(void) {
    free(state.vertices);
    free(state.indices);
    sg_shutdown();
}

static void event(const sapp_event* ev) {
    switch (ev->type) {
        case SAPP_EVENTTYPE_KEY_DOWN:
            switch (ev->key_code) {
                case SAPP_KEYCODE_W: state.forward = true; break;
                case SAPP_KEYCODE_S: state.back = true; break;
                case SAPP_KEYCODE_A: state.left = true; break;
                case SAPP_KEYCODE_D: state.right = true; break;
                case SAPP_KEYCODE_SPACE: state.jump_pressed = true; break;
                case SAPP_KEYCODE_ESCAPE:
                    if (state.mouse_locked) {
                        state.mouse_locked = false;
                        sapp_lock_mouse(false);
                        sapp_show_mouse(true);
                    } else {
                        sapp_request_quit();
                    }
                    break;
                default: break;
            }
            break;
        case SAPP_EVENTTYPE_KEY_UP:
            switch (ev->key_code) {
                case SAPP_KEYCODE_W: state.forward = false; break;
                case SAPP_KEYCODE_S: state.back = false; break;
                case SAPP_KEYCODE_A: state.left = false; break;
                case SAPP_KEYCODE_D: state.right = false; break;
                default: break;
            }
            break;
        case SAPP_EVENTTYPE_MOUSE_DOWN:
            if (!state.mouse_locked) {
                state.mouse_locked = true;
                sapp_lock_mouse(true);
                sapp_show_mouse(false);
            }
            break;
        case SAPP_EVENTTYPE_MOUSE_MOVE:
            if (state.mouse_locked) {
                state.yaw += ev->mouse_dx * CAMERA_MOUSE_SENSITIVITY;
                state.pitch -= ev->mouse_dy * CAMERA_MOUSE_SENSITIVITY;
                state.pitch = clampf(state.pitch, -1.45f, 1.45f);
            }
            break;
        default:
            break;
    }
}

sapp_desc sokol_main(int argc, char* argv[]) {
    (void) argc;
    (void) argv;
    return (sapp_desc){
        .init_cb = init,
        .frame_cb = frame,
        .cleanup_cb = cleanup,
        .event_cb = event,
        .width = 1280,
        .height = 720,
        .sample_count = 4,
        .high_dpi = true,
        .window_title = "sokol v7 procedural wall textures",
        .logger.func = slog_func,
    };
}
