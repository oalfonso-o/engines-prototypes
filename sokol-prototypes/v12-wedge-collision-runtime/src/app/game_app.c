#include "app/game_app.h"

#include "sokol/sokol_gfx.h"
#include "sokol/sokol_glue.h"
#include "sokol/sokol_log.h"

#include "config/project_settings.h"
#include "player/player_controller.h"
#include "render/world_renderer.h"
#include "shared/math3d.h"
#include "world/runtime_world.h"

#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    ProjectSettings settings;
    WorldRenderer renderer;
    RuntimeWorld world;
    PlayerState player;
    PlayerInputState input;
    PlayerControllerConfig player_config;
    bool mouse_captured;
} GameAppState;

static GameAppState app;
static ProjectSettings launch_settings;
static bool launch_settings_loaded = false;

static CollisionScene build_collision_scene(void) {
    return (CollisionScene){
        .boxes = app.world.boxes,
        .wedges = app.world.wedges,
        .box_count = app.world.box_count,
        .wedge_count = app.world.wedge_count,
        .max_auto_step_height = app.settings.collision.max_auto_step_height,
        .ground_snap_distance = app.settings.collision.ground_snap_distance,
        .floor_epsilon = app.settings.collision.floor_epsilon,
        .horizontal_epsilon = app.settings.collision.horizontal_epsilon,
        .vertical_epsilon = app.settings.collision.vertical_epsilon,
        .spawn_ground_search_distance = app.settings.spawn.ground_search_distance,
        .wedge_type_id_pz = app.settings.collision.wedge_type_id_pz,
        .wedge_type_id_px = app.settings.collision.wedge_type_id_px,
        .wedge_type_id_nz = app.settings.collision.wedge_type_id_nz,
        .wedge_type_id_nx = app.settings.collision.wedge_type_id_nx,
    };
}

static void app_init(void) {
    memset(&app, 0, sizeof(app));
    if (!launch_settings_loaded) {
        if (!project_settings_load("settings.yaml", &launch_settings)) {
            fprintf(stderr, "failed to load settings.yaml\n");
            abort();
        }
        launch_settings_loaded = true;
    }
    app.settings = launch_settings;

    sg_setup(&(sg_desc){
        .environment = sglue_environment(),
        .logger.func = slog_func,
    });

    app.player_config = (PlayerControllerConfig){
        .mouse_sensitivity = app.settings.player.mouse_sensitivity,
        .move_speed = app.settings.player.move_speed,
        .radius = app.settings.player.radius,
        .height = app.settings.player.height,
        .eye_height = app.settings.player.eye_height,
        .jump_speed = app.settings.player.jump_speed,
        .gravity = app.settings.player.gravity,
        .pitch_limit = app.settings.player.pitch_limit,
    };
    player_input_clear(&app.input);

    if (!runtime_world_load(app.settings.paths.runtime_artifact, &app.settings, &app.world)) {
        fprintf(stderr, "failed to load runtime artifact: %s\n", app.settings.paths.runtime_artifact);
        abort();
    }

    Vec3 effective_spawn = {0};
    const CollisionScene collision_scene = build_collision_scene();
    if (!player_select_effective_spawn(&effective_spawn, &app.world.spawn, &app.player_config, collision_scene)) {
        fprintf(stderr, "failed to resolve a valid spawn\n");
        abort();
    }

    world_renderer_init(&app.renderer, &app.world, app.settings.render.clear_color);
    player_state_init(&app.player, effective_spawn, app.settings.camera.initial_pitch);
}

static void app_frame(void) {
    float delta_time = (float)sapp_frame_duration();
    if ((delta_time <= 0.0f) || (delta_time > 0.1f)) {
        delta_time = 1.0f / 60.0f;
    }

    const CollisionScene collision_scene = build_collision_scene();
    player_update(&app.player, &app.input, &app.player_config, collision_scene, delta_time);

    const Vec3 eye = player_eye_position(&app.player, &app.player_config);
    const Vec3 target = vec3_add(eye, player_forward(&app.player));
    const Mat4 view = mat4_lookat(eye, target, vec3_make(0.0f, 1.0f, 0.0f));
    const float fov_y = app.settings.camera.fov_y_degrees * (3.14159265f / 180.0f);
    const Mat4 projection = mat4_perspective(fov_y, sapp_widthf() / sapp_heightf(), app.settings.camera.near_plane, app.settings.camera.far_plane);
    const Mat4 mvp = mat4_mul(projection, view);
    world_renderer_draw(&app.renderer, mvp, sglue_swapchain());
}

static void app_cleanup(void) {
    runtime_world_release(&app.world);
    project_settings_release(&app.settings);
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
    if (!launch_settings_loaded) {
        if (!project_settings_load("settings.yaml", &launch_settings)) {
            abort();
        }
        launch_settings_loaded = true;
    }

    return (sapp_desc){
        .init_cb = app_init,
        .frame_cb = app_frame,
        .cleanup_cb = app_cleanup,
        .event_cb = app_event,
        .width = launch_settings.app.window_width,
        .height = launch_settings.app.window_height,
        .sample_count = launch_settings.app.sample_count,
        .high_dpi = launch_settings.app.high_dpi,
        .window_title = launch_settings.app.window_title,
        .logger.func = slog_func,
    };
}
