#define SOKOL_METAL
#define SOKOL_IMPL
#include "sokol/sokol_app.h"
#include "sokol/sokol_gfx.h"
#include "sokol/sokol_glue.h"
#include "sokol/sokol_log.h"
#include "sokol/util/sokol_gl.h"

#include <math.h>
#include <stdbool.h>
#include <stdint.h>

typedef struct {
    float x;
    float y;
    float z;
} vec3_t;

typedef struct {
    bool forward;
    bool back;
    bool left;
    bool right;
    bool mouse_locked;
    float yaw;
    float pitch;
    vec3_t position;
    sg_pass_action pass_action;
    sgl_pipeline pipeline;
} state_t;

static state_t state;
static const float PLAYER_EYE_HEIGHT = 1.8f;
static const float PLAYER_RADIUS = 0.25f;
static const vec3_t CUBE_MIN = { -0.75f, 0.0f, -0.75f };
static const vec3_t CUBE_MAX = { 0.75f, 1.5f, 0.75f };

static vec3_t vec3_add(vec3_t a, vec3_t b) {
    return (vec3_t){ a.x + b.x, a.y + b.y, a.z + b.z };
}

static vec3_t vec3_scale(vec3_t v, float s) {
    return (vec3_t){ v.x * s, v.y * s, v.z * s };
}

static vec3_t vec3_cross(vec3_t a, vec3_t b) {
    return (vec3_t){
        a.y * b.z - a.z * b.y,
        a.z * b.x - a.x * b.z,
        a.x * b.y - a.y * b.x
    };
}

static vec3_t vec3_normalize(vec3_t v) {
    const float len = sqrtf((v.x * v.x) + (v.y * v.y) + (v.z * v.z));
    if (len <= 0.00001f) {
        return (vec3_t){ 0.0f, 0.0f, 0.0f };
    }
    return (vec3_t){ v.x / len, v.y / len, v.z / len };
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

static bool circle_intersects_aabb_xz(float px, float pz, float radius, vec3_t minp, vec3_t maxp) {
    const float closest_x = clampf(px, minp.x, maxp.x);
    const float closest_z = clampf(pz, minp.z, maxp.z);
    const float dx = px - closest_x;
    const float dz = pz - closest_z;
    return ((dx * dx) + (dz * dz)) < (radius * radius);
}

static void emit_tri(vec3_t a, vec3_t b, vec3_t c, uint8_t r, uint8_t g, uint8_t bcol) {
    sgl_v3f_c3b(a.x, a.y, a.z, r, g, bcol);
    sgl_v3f_c3b(b.x, b.y, b.z, r, g, bcol);
    sgl_v3f_c3b(c.x, c.y, c.z, r, g, bcol);
}

static void emit_quad(vec3_t a, vec3_t b, vec3_t c, vec3_t d, uint8_t r, uint8_t g, uint8_t bcol) {
    emit_tri(a, b, c, r, g, bcol);
    emit_tri(a, c, d, r, g, bcol);
}

static void draw_box(vec3_t minp, vec3_t maxp) {
    const vec3_t p000 = { minp.x, minp.y, minp.z };
    const vec3_t p001 = { minp.x, minp.y, maxp.z };
    const vec3_t p010 = { minp.x, maxp.y, minp.z };
    const vec3_t p011 = { minp.x, maxp.y, maxp.z };
    const vec3_t p100 = { maxp.x, minp.y, minp.z };
    const vec3_t p101 = { maxp.x, minp.y, maxp.z };
    const vec3_t p110 = { maxp.x, maxp.y, minp.z };
    const vec3_t p111 = { maxp.x, maxp.y, maxp.z };

    emit_quad(p001, p011, p111, p101, 220, 64, 64);
    emit_quad(p100, p110, p010, p000, 64, 180, 90);
    emit_quad(p000, p001, p011, p010, 64, 110, 220);
    emit_quad(p101, p100, p110, p111, 220, 200, 64);
    emit_quad(p010, p011, p111, p110, 200, 80, 210);
    emit_quad(p000, p100, p101, p001, 64, 210, 210);
}

static void draw_ground(void) {
    const vec3_t minp = { -20.0f, -0.05f, -20.0f };
    const vec3_t maxp = { 20.0f, 0.0f, 20.0f };
    const vec3_t p000 = { minp.x, minp.y, minp.z };
    const vec3_t p001 = { minp.x, minp.y, maxp.z };
    const vec3_t p010 = { minp.x, maxp.y, minp.z };
    const vec3_t p011 = { minp.x, maxp.y, maxp.z };
    const vec3_t p100 = { maxp.x, minp.y, minp.z };
    const vec3_t p101 = { maxp.x, minp.y, maxp.z };
    const vec3_t p110 = { maxp.x, maxp.y, minp.z };
    const vec3_t p111 = { maxp.x, maxp.y, maxp.z };
    emit_quad(p010, p011, p111, p110, 90, 90, 90);
    emit_quad(p000, p100, p101, p001, 40, 40, 40);
}

static void draw_center_cube(void) {
    draw_box((vec3_t){ -0.75f, 0.0f, -0.75f }, (vec3_t){ 0.75f, 1.5f, 0.75f });
}

static vec3_t camera_forward(void) {
    const float cp = cosf(state.pitch);
    return vec3_normalize((vec3_t){
        cosf(state.yaw) * cp,
        sinf(state.pitch),
        sinf(state.yaw) * cp
    });
}

static void init(void) {
    sg_setup(&(sg_desc){
        .environment = sglue_environment(),
        .logger.func = slog_func,
    });
    sgl_setup(&(sgl_desc_t){
        .max_vertices = 1 << 16,
        .max_commands = 1 << 14,
        .context_pool_size = 4,
        .pipeline_pool_size = 8,
        .logger.func = slog_func,
    });
    state.pipeline = sgl_make_pipeline(&(sg_pipeline_desc){
        .depth = {
            .write_enabled = true,
            .compare = SG_COMPAREFUNC_LESS_EQUAL,
        },
        .cull_mode = SG_CULLMODE_NONE,
    });

    state.position = (vec3_t){ 0.0f, PLAYER_EYE_HEIGHT, 6.0f };
    state.yaw = -1.57079632679f;
    state.pitch = -0.12f;
    state.pass_action = (sg_pass_action){
        .colors[0] = {
            .load_action = SG_LOADACTION_CLEAR,
            .clear_value = { 0.67f, 0.72f, 0.78f, 1.0f }
        },
        .depth = {
            .load_action = SG_LOADACTION_CLEAR,
            .clear_value = 1.0f
        }
    };
}

static void frame(void) {
    float dt = (float) sapp_frame_duration();
    if ((dt <= 0.0f) || (dt > 0.1f)) {
        dt = 1.0f / 60.0f;
    }

    const float move_speed = 4.8f;
    vec3_t forward = camera_forward();
    const vec3_t up = { 0.0f, 1.0f, 0.0f };
    vec3_t flat_forward = vec3_normalize((vec3_t){ forward.x, 0.0f, forward.z });
    vec3_t right = vec3_normalize(vec3_cross(flat_forward, up));
    vec3_t motion = { 0.0f, 0.0f, 0.0f };
    if (state.forward) {
        motion = vec3_add(motion, flat_forward);
    }
    if (state.back) {
        motion = vec3_add(motion, vec3_scale(flat_forward, -1.0f));
    }
    if (state.right) {
        motion = vec3_add(motion, right);
    }
    if (state.left) {
        motion = vec3_add(motion, vec3_scale(right, -1.0f));
    }
    motion = vec3_normalize(motion);
    const vec3_t delta = vec3_scale(motion, move_speed * dt);
    vec3_t next = state.position;

    next.x += delta.x;
    if (circle_intersects_aabb_xz(next.x, next.z, PLAYER_RADIUS, CUBE_MIN, CUBE_MAX)) {
        next.x = state.position.x;
    }

    next.z += delta.z;
    if (circle_intersects_aabb_xz(next.x, next.z, PLAYER_RADIUS, CUBE_MIN, CUBE_MAX)) {
        next.z = state.position.z;
    }

    next.y = PLAYER_EYE_HEIGHT;
    state.position = next;

    vec3_t target = vec3_add(state.position, camera_forward());

    sgl_defaults();
    sgl_load_pipeline(state.pipeline);
    sgl_matrix_mode_projection();
    sgl_load_identity();
    sgl_perspective(60.0f * (3.14159265359f / 180.0f), sapp_widthf() / sapp_heightf(), 0.01f, 100.0f);
    sgl_matrix_mode_modelview();
    sgl_load_identity();
    sgl_lookat(
        state.position.x, state.position.y, state.position.z,
        target.x, target.y, target.z,
        0.0f, 1.0f, 0.0f
    );

    sgl_begin_triangles();
    draw_ground();
    draw_center_cube();
    sgl_end();

    sg_begin_pass(&(sg_pass){
        .action = state.pass_action,
        .swapchain = sglue_swapchain()
    });
    sgl_draw();
    sg_end_pass();
    sg_commit();
}

static void cleanup(void) {
    sgl_shutdown();
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
                sapp_show_mouse(false);
                sapp_lock_mouse(true);
            }
            break;
        case SAPP_EVENTTYPE_MOUSE_MOVE:
            if (state.mouse_locked) {
                const float sensitivity = 0.0025f;
                state.yaw += ev->mouse_dx * sensitivity;
                state.pitch -= ev->mouse_dy * sensitivity;
                if (state.pitch > 1.5f) {
                    state.pitch = 1.5f;
                } else if (state.pitch < -1.5f) {
                    state.pitch = -1.5f;
                }
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
        .window_title = "sokol v1 basic fps cube",
        .logger.func = slog_func,
    };
}
