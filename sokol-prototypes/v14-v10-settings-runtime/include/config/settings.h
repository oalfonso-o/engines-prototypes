#pragma once

#include <stdbool.h>

#include "shared/math3d.h"

#define SETTINGS_MAX_MATERIALS 16

typedef struct {
    float r;
    float g;
    float b;
    float a;
} Color4;

typedef struct {
    char source_map[256];
    char runtime_artifact[256];
} PathSettings;

typedef struct {
    char window_title[128];
    int window_width;
    int window_height;
    int sample_count;
    bool high_dpi;
} AppSettings;

typedef struct {
    float initial_pitch;
    float fov_y_degrees;
    float near_plane;
    float far_plane;
} CameraSettings;

typedef struct {
    float mouse_sensitivity;
    float move_speed;
    float radius;
    float height;
    float eye_height;
    float jump_speed;
    float gravity;
    float pitch_limit;
} PlayerSettings;

typedef struct {
    float ground_half_size;
    float world_y_offset;
    Vec3 spawn;
} WorldSettings;

typedef struct {
    char key[32];
    Color4 color;
} MaterialSetting;

typedef struct {
    Color4 clear_color;
    Color4 ground_plane_color;
    float shade_pos_y;
    float shade_neg_y;
    float shade_pos_z;
    float shade_neg_z;
    float shade_pos_x;
    float shade_neg_x;
} RenderSettings;

typedef struct {
    PathSettings paths;
    AppSettings app;
    CameraSettings camera;
    PlayerSettings player;
    WorldSettings world;
    MaterialSetting materials[SETTINGS_MAX_MATERIALS];
    int material_count;
    RenderSettings render;
} Settings;

bool settings_load(const char* settings_path, Settings* out_settings);
void settings_release(Settings* settings);
bool settings_material_color(const Settings* settings, const char* material_key, Color4* out_color);
float settings_face_shade_for_normal(const Settings* settings, int nx, int ny, int nz);
