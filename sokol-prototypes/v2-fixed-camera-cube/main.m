#define SOKOL_METAL
#define SOKOL_IMPL
#include "sokol/sokol_app.h"
#include "sokol/sokol_gfx.h"
#include "sokol/sokol_glue.h"
#include "sokol/sokol_log.h"
#include "sokol/util/sokol_gl.h"

#include <stdint.h>

typedef struct {
    float x;
    float y;
    float z;
} vec3_t;

typedef struct {
    sg_pass_action pass_action;
    sgl_pipeline pipeline;
} state_t;

static state_t state;

static void emit_tri(vec3_t a, vec3_t b, vec3_t c, uint8_t r, uint8_t g, uint8_t bcol) {
    sgl_v3f_c3b(a.x, a.y, a.z, r, g, bcol);
    sgl_v3f_c3b(b.x, b.y, b.z, r, g, bcol);
    sgl_v3f_c3b(c.x, c.y, c.z, r, g, bcol);
}

static void emit_quad(vec3_t a, vec3_t b, vec3_t c, vec3_t d, uint8_t r, uint8_t g, uint8_t bcol) {
    emit_tri(a, b, c, r, g, bcol);
    emit_tri(a, c, d, r, g, bcol);
}

static void draw_cube(void) {
    const vec3_t minp = { -0.75f, -0.75f, -0.75f };
    const vec3_t maxp = {  0.75f,  0.75f,  0.75f };

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

static void init(void) {
    sg_setup(&(sg_desc){
        .environment = sglue_environment(),
        .logger.func = slog_func,
    });
    sgl_setup(&(sgl_desc_t){
        .max_vertices = 1 << 14,
        .max_commands = 1 << 12,
        .logger.func = slog_func,
    });
    state.pipeline = sgl_make_pipeline(&(sg_pipeline_desc){
        .depth = {
            .write_enabled = true,
            .compare = SG_COMPAREFUNC_LESS_EQUAL,
        },
        .cull_mode = SG_CULLMODE_NONE,
    });
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
    sgl_defaults();
    sgl_load_pipeline(state.pipeline);

    sgl_matrix_mode_projection();
    sgl_load_identity();
    sgl_perspective(60.0f, sapp_widthf() / sapp_heightf(), 0.01f, 100.0f);

    sgl_matrix_mode_modelview();
    sgl_load_identity();
    sgl_lookat(1.15f, 0.95f, 1.45f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f);

    sgl_begin_triangles();
    draw_cube();
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
    if ((ev->type == SAPP_EVENTTYPE_KEY_DOWN) && (ev->key_code == SAPP_KEYCODE_ESCAPE)) {
        sapp_request_quit();
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
        .width = 960,
        .height = 640,
        .sample_count = 4,
        .high_dpi = true,
        .window_title = "sokol v2 fixed camera cube",
        .logger.func = slog_func,
    };
}
