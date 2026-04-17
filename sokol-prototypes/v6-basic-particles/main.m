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
    vec3_t position;
    vec3_t velocity;
    float age;
    float lifetime;
    float size;
    float r;
    float g;
    float b;
    float a;
    bool active;
} particle_t;

typedef struct {
    vec3_t origin;
    particle_t* particles;
    int count;
} emitter_t;

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
    sgl_pipeline pipeline;
    emitter_t smoke;
    emitter_t sparks;
    uint32_t random_state;
} state_t;

static state_t state;

static const float PLAYER_EYE_HEIGHT = 1.8f;
static const float MOVE_SPEED = 4.6f;
static const float JUMP_SPEED = 5.2f;
static const float GRAVITY = 14.0f;
static const float MOUSE_SENSITIVITY = 0.0035f;
static const int SMOKE_COUNT = 96;
static const int SPARK_COUNT = 128;

static vec3_t vec3_make(float x, float y, float z) {
    return (vec3_t){ x, y, z };
}

static vec3_t vec3_add(vec3_t a, vec3_t b) {
    return vec3_make(a.x + b.x, a.y + b.y, a.z + b.z);
}

static vec3_t vec3_sub(vec3_t a, vec3_t b) {
    return vec3_make(a.x - b.x, a.y - b.y, a.z - b.z);
}

static vec3_t vec3_scale(vec3_t v, float s) {
    return vec3_make(v.x * s, v.y * s, v.z * s);
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
    return vec3_make(v.x / len, v.y / len, v.z / len);
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

static uint32_t random_u32(void) {
    state.random_state ^= state.random_state << 13;
    state.random_state ^= state.random_state >> 17;
    state.random_state ^= state.random_state << 5;
    return state.random_state;
}

static float random_f32(void) {
    return (float)(random_u32() & 0x00FFFFFF) / (float)0x01000000;
}

static float random_range(float min_v, float max_v) {
    return min_v + ((max_v - min_v) * random_f32());
}

static vec3_t camera_forward(void) {
    const float cp = cosf(state.pitch);
    return vec3_normalize((vec3_t){
        cosf(state.yaw) * cp,
        sinf(state.pitch),
        sinf(state.yaw) * cp
    });
}

static vec3_t camera_right(void) {
    const vec3_t up = vec3_make(0.0f, 1.0f, 0.0f);
    const vec3_t forward = camera_forward();
    return vec3_normalize(vec3_cross(forward, up));
}

static void emit_quad_color(vec3_t a, vec3_t b, vec3_t c, vec3_t d, float r, float g, float bcol, float apha) {
    sgl_v3f_c4f(a.x, a.y, a.z, r, g, bcol, apha);
    sgl_v3f_c4f(b.x, b.y, b.z, r, g, bcol, apha);
    sgl_v3f_c4f(c.x, c.y, c.z, r, g, bcol, apha);
    sgl_v3f_c4f(d.x, d.y, d.z, r, g, bcol, apha);
}

static void draw_ground(void) {
    const vec3_t a = vec3_make(-12.0f, 0.0f, -12.0f);
    const vec3_t b = vec3_make(-12.0f, 0.0f, 12.0f);
    const vec3_t c = vec3_make(12.0f, 0.0f, 12.0f);
    const vec3_t d = vec3_make(12.0f, 0.0f, -12.0f);
    emit_quad_color(a, b, c, d, 0.22f, 0.24f, 0.26f, 1.0f);
}

static void respawn_smoke_particle(particle_t* particle, vec3_t origin) {
    particle->position = vec3_make(
        origin.x + random_range(-0.18f, 0.18f),
        origin.y + random_range(0.02f, 0.10f),
        origin.z + random_range(-0.18f, 0.18f)
    );
    particle->velocity = vec3_make(
        random_range(-0.08f, 0.08f),
        random_range(0.25f, 0.55f),
        random_range(-0.08f, 0.08f)
    );
    particle->age = 0.0f;
    particle->lifetime = random_range(2.8f, 4.6f);
    particle->size = random_range(0.14f, 0.22f);
    particle->r = random_range(0.50f, 0.62f);
    particle->g = random_range(0.50f, 0.62f);
    particle->b = random_range(0.52f, 0.66f);
    particle->a = random_range(0.22f, 0.34f);
    particle->active = true;
}

static void respawn_spark_particle(particle_t* particle, vec3_t origin) {
    particle->position = vec3_make(
        origin.x + random_range(-0.08f, 0.08f),
        origin.y + random_range(0.04f, 0.10f),
        origin.z + random_range(-0.08f, 0.08f)
    );
    particle->velocity = vec3_make(
        random_range(-0.90f, 0.90f),
        random_range(1.8f, 3.4f),
        random_range(-0.90f, 0.90f)
    );
    particle->age = 0.0f;
    particle->lifetime = random_range(0.45f, 0.95f);
    particle->size = random_range(0.04f, 0.08f);
    particle->r = 1.00f;
    particle->g = random_range(0.55f, 0.85f);
    particle->b = random_range(0.08f, 0.20f);
    particle->a = random_range(0.75f, 1.00f);
    particle->active = true;
}

static void init_emitters(void) {
    state.smoke.origin = vec3_make(-2.2f, 0.0f, 0.0f);
    state.smoke.count = SMOKE_COUNT;
    state.smoke.particles = (particle_t*)calloc((size_t)SMOKE_COUNT, sizeof(particle_t));
    for (int i = 0; i < SMOKE_COUNT; i++) {
        respawn_smoke_particle(&state.smoke.particles[i], state.smoke.origin);
        state.smoke.particles[i].age = random_range(0.0f, state.smoke.particles[i].lifetime);
    }

    state.sparks.origin = vec3_make(2.2f, 0.0f, 0.0f);
    state.sparks.count = SPARK_COUNT;
    state.sparks.particles = (particle_t*)calloc((size_t)SPARK_COUNT, sizeof(particle_t));
    for (int i = 0; i < SPARK_COUNT; i++) {
        respawn_spark_particle(&state.sparks.particles[i], state.sparks.origin);
        state.sparks.particles[i].age = random_range(0.0f, state.sparks.particles[i].lifetime);
    }
}

static void update_smoke(float dt) {
    for (int i = 0; i < state.smoke.count; i++) {
        particle_t* particle = &state.smoke.particles[i];
        particle->age += dt;
        if (particle->age >= particle->lifetime) {
            respawn_smoke_particle(particle, state.smoke.origin);
            continue;
        }
        particle->position = vec3_add(particle->position, vec3_scale(particle->velocity, dt));
        particle->velocity.x += random_range(-0.06f, 0.06f) * dt;
        particle->velocity.z += random_range(-0.06f, 0.06f) * dt;
        particle->size += 0.04f * dt;
    }
}

static void update_sparks(float dt) {
    for (int i = 0; i < state.sparks.count; i++) {
        particle_t* particle = &state.sparks.particles[i];
        particle->age += dt;
        if (particle->age >= particle->lifetime) {
            respawn_spark_particle(particle, state.sparks.origin);
            continue;
        }
        particle->velocity.y -= 4.8f * dt;
        particle->position = vec3_add(particle->position, vec3_scale(particle->velocity, dt));
    }
}

static void draw_particle_quad(const particle_t* particle, vec3_t right, vec3_t up, float alpha_scale) {
    const vec3_t half_right = vec3_scale(right, particle->size);
    const vec3_t half_up = vec3_scale(up, particle->size);
    const vec3_t a = vec3_add(vec3_sub(particle->position, half_right), half_up);
    const vec3_t b = vec3_add(vec3_add(particle->position, half_right), half_up);
    const vec3_t c = vec3_sub(vec3_add(particle->position, half_right), half_up);
    const vec3_t d = vec3_sub(vec3_sub(particle->position, half_right), half_up);
    emit_quad_color(a, b, c, d, particle->r, particle->g, particle->b, particle->a * alpha_scale);
}

static void draw_smoke_particles(vec3_t right, vec3_t up) {
    for (int i = 0; i < state.smoke.count; i++) {
        const particle_t* particle = &state.smoke.particles[i];
        const float t = particle->age / particle->lifetime;
        const float alpha_scale = 1.0f - t;
        draw_particle_quad(particle, right, up, alpha_scale);
    }
}

static void draw_spark_particles(vec3_t right, vec3_t up) {
    for (int i = 0; i < state.sparks.count; i++) {
        const particle_t* particle = &state.sparks.particles[i];
        const float t = particle->age / particle->lifetime;
        const float alpha_scale = 1.0f - t;
        draw_particle_quad(particle, right, up, alpha_scale);
    }
}

static void init(void) {
    sg_setup(&(sg_desc){
        .environment = sglue_environment(),
        .logger.func = slog_func,
    });
    sgl_setup(&(sgl_desc_t){
        .max_vertices = 1 << 17,
        .max_commands = 1 << 14,
        .context_pool_size = 4,
        .pipeline_pool_size = 8,
        .logger.func = slog_func,
    });
    state.pipeline = sgl_make_pipeline(&(sg_pipeline_desc){
        .colors[0].blend = {
            .enabled = true,
            .src_factor_rgb = SG_BLENDFACTOR_SRC_ALPHA,
            .dst_factor_rgb = SG_BLENDFACTOR_ONE_MINUS_SRC_ALPHA,
            .op_rgb = SG_BLENDOP_ADD,
            .src_factor_alpha = SG_BLENDFACTOR_ONE,
            .dst_factor_alpha = SG_BLENDFACTOR_ONE_MINUS_SRC_ALPHA,
            .op_alpha = SG_BLENDOP_ADD,
        },
        .depth = {
            .write_enabled = true,
            .compare = SG_COMPAREFUNC_LESS_EQUAL,
        },
        .cull_mode = SG_CULLMODE_NONE,
    });

    state.position = vec3_make(0.0f, PLAYER_EYE_HEIGHT, 5.8f);
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
    state.random_state = 0x12345678u;
    init_emitters();
}

static void frame(void) {
    float dt = (float) sapp_frame_duration();
    if ((dt <= 0.0f) || (dt > 0.1f)) {
        dt = 1.0f / 60.0f;
    }

    const vec3_t forward = camera_forward();
    const vec3_t world_up = vec3_make(0.0f, 1.0f, 0.0f);
    vec3_t flat_forward = vec3_normalize(vec3_make(forward.x, 0.0f, forward.z));
    vec3_t right = vec3_normalize(vec3_cross(flat_forward, world_up));
    vec3_t motion = vec3_make(0.0f, 0.0f, 0.0f);
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
    if (vec3_dot(motion, motion) > 0.0f) {
        motion = vec3_normalize(motion);
        state.position = vec3_add(state.position, vec3_scale(motion, MOVE_SPEED * dt));
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

    update_smoke(dt);
    update_sparks(dt);

    vec3_t target = vec3_add(state.position, camera_forward());
    vec3_t billboard_right = camera_right();
    vec3_t billboard_up = world_up;

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

    sgl_begin_quads();
    draw_ground();
    draw_smoke_particles(billboard_right, billboard_up);
    draw_spark_particles(billboard_right, billboard_up);
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
    free(state.smoke.particles);
    free(state.sparks.particles);
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
                default:
                    break;
            }
            break;
        case SAPP_EVENTTYPE_KEY_UP:
            switch (ev->key_code) {
                case SAPP_KEYCODE_W: state.forward = false; break;
                case SAPP_KEYCODE_S: state.back = false; break;
                case SAPP_KEYCODE_A: state.left = false; break;
                case SAPP_KEYCODE_D: state.right = false; break;
                default:
                    break;
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
                state.yaw += ev->mouse_dx * MOUSE_SENSITIVITY;
                state.pitch -= ev->mouse_dy * MOUSE_SENSITIVITY;
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
        .window_title = "sokol v6 basic particles",
        .logger.func = slog_func,
    };
}
