#include "app/game_app.h"

#include "sokol/sokol_gfx.h"
#include "sokol/sokol_glue.h"
#include "sokol/sokol_log.h"

#include "player/player_controller.h"
#include "render/world_renderer.h"
#include "shared/math3d.h"
#include "world/runtime_world.h"

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    const char* runtime_artifact_path;
    float ground_half_size;
    float initial_pitch;
    int window_width;
    int window_height;
    const char* window_title;
} AppConfig;

typedef struct {
    WorldRenderer renderer;
    RuntimeWorld world;
    PlayerState player;
    PlayerInputState input;
    PlayerControllerConfig player_config;
    bool mouse_captured;
} GameAppState;

static const AppConfig APP_CONFIG = {
    .runtime_artifact_path = "data/runtime_world.json",
    .ground_half_size = 30.0f,
    .initial_pitch = -0.08f,
    .window_width = 1280,
    .window_height = 720,
    .window_title = "sokol v10 voxel ccw culling contract",
};

static const PlayerControllerConfig PLAYER_CONFIG = {
    .mouse_sensitivity = 0.0035f,
    .move_speed = 5.4f,
    .radius = 0.22f,
    .height = 1.70f,
    .eye_height = 1.56f,
    .jump_speed = 5.2f,
    .gravity = 14.0f,
    .pitch_limit = 1.45f,
};

static const float CAMERA_FOV_Y = 60.0f * (3.14159265f / 180.0f);
static const float CAMERA_NEAR = 0.01f;
static const float CAMERA_FAR = 200.0f;

static GameAppState app;

static void app_init(void) {
    sg_setup(&(sg_desc){
        .environment = sglue_environment(),
        .logger.func = slog_func,
    });

    memset(&app, 0, sizeof(app));
    app.player_config = PLAYER_CONFIG;
    player_input_clear(&app.input);

    if (!runtime_world_load(APP_CONFIG.runtime_artifact_path, &app.world)) {
        fprintf(stderr, "failed to load runtime artifact: %s\n", APP_CONFIG.runtime_artifact_path);
        abort();
    }

    runtime_world_append_ground_plane(&app.world, APP_CONFIG.ground_half_size);
    world_renderer_init(&app.renderer, &app.world);
    player_state_init(&app.player, app.world.spawn, APP_CONFIG.initial_pitch);
}

static void app_frame(void) {
    float delta_time = (float)sapp_frame_duration();
    if ((delta_time <= 0.0f) || (delta_time > 0.1f)) {
        delta_time = 1.0f / 60.0f;
    }

    const CollisionScene collision_scene = {
        .boxes = app.world.boxes,
        .box_count = app.world.box_count,
    };
    player_update(&app.player, &app.input, &app.player_config, collision_scene, delta_time);

    const Vec3 eye = player_eye_position(&app.player, &app.player_config);
    const Vec3 target = vec3_add(eye, player_forward(&app.player));
    const Mat4 view = mat4_lookat(eye, target, vec3_make(0.0f, 1.0f, 0.0f));
    const Mat4 projection = mat4_perspective(CAMERA_FOV_Y, sapp_widthf() / sapp_heightf(), CAMERA_NEAR, CAMERA_FAR);
    const Mat4 mvp = mat4_mul(projection, view);
    world_renderer_draw(&app.renderer, mvp, sglue_swapchain());
}

static void app_cleanup(void) {
    runtime_world_release(&app.world);
    sg_shutdown();
}

static void app_event(const sapp_event* event) {
    switch (event->type) {
        case SAPP_EVENTTYPE_MOUSE_DOWN:
            if (!app.mouse_captured) {
                sapp_lock_mouse(true);
                sapp_show_mouse(false);
                app.mouse_captured = true;
            }
            break;

        case SAPP_EVENTTYPE_MOUSE_MOVE:
            if (app.mouse_captured) {
                player_handle_mouse(&app.player, &app.player_config, event->mouse_dx, event->mouse_dy);
            }
            break;

        case SAPP_EVENTTYPE_KEY_DOWN:
            switch (event->key_code) {
                case SAPP_KEYCODE_W: app.input.move_forward = true; break;
                case SAPP_KEYCODE_S: app.input.move_backward = true; break;
                case SAPP_KEYCODE_A: app.input.move_left = true; break;
                case SAPP_KEYCODE_D: app.input.move_right = true; break;
                case SAPP_KEYCODE_SPACE: app.input.jump_queued = true; break;
                case SAPP_KEYCODE_ESCAPE:
                    if (app.mouse_captured) {
                        sapp_lock_mouse(false);
                        sapp_show_mouse(true);
                        app.mouse_captured = false;
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
                case SAPP_KEYCODE_W: app.input.move_forward = false; break;
                case SAPP_KEYCODE_S: app.input.move_backward = false; break;
                case SAPP_KEYCODE_A: app.input.move_left = false; break;
                case SAPP_KEYCODE_D: app.input.move_right = false; break;
                default:
                    break;
            }
            break;

        default:
            break;
    }
}

sapp_desc game_app_make_desc(void) {
    return (sapp_desc){
        .init_cb = app_init,
        .frame_cb = app_frame,
        .cleanup_cb = app_cleanup,
        .event_cb = app_event,
        .width = APP_CONFIG.window_width,
        .height = APP_CONFIG.window_height,
        .sample_count = 4,
        .high_dpi = true,
        .window_title = APP_CONFIG.window_title,
        .logger.func = slog_func,
    };
}
