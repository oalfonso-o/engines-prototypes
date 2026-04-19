#pragma once

#include <stdbool.h>

#include "shared/math3d.h"

#define PROJECT_SETTINGS_MAX_MATERIALS 16

typedef struct {
    float r;
    float g;
    float b;
    float a;
} Color4;

typedef struct {
    char source_map[128];
    char runtime_artifact[128];
    char debug_artifact[128];
} PathSettings;

typedef struct {
    bool override_enabled;
    Vec3 override_position;
    float ground_search_distance;
} SpawnSettings;

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
    char key[32];
    Color4 color;
} MaterialSetting;

typedef struct {
    Color4 clear_color;
    float shade_pos_y;
    float shade_neg_y;
    float shade_pos_z;
    float shade_neg_z;
    float shade_pos_x;
    float shade_neg_x;
} RenderSettings;

typedef struct {
    float ground_snap_distance;
    float floor_epsilon;
    float horizontal_epsilon;
    float vertical_epsilon;
    int wedge_type_id_pz;
    int wedge_type_id_px;
    int wedge_type_id_nz;
    int wedge_type_id_nx;
} CollisionSettings;

typedef struct {
    PathSettings paths;
    SpawnSettings spawn;
    AppSettings app;
    CameraSettings camera;
    PlayerSettings player;
    MaterialSetting materials[PROJECT_SETTINGS_MAX_MATERIALS];
    int material_count;
    RenderSettings render;
    CollisionSettings collision;
} ProjectSettings;

bool project_settings_load(const char* settings_path, ProjectSettings* out_settings);
void project_settings_release(ProjectSettings* settings);
bool project_settings_material_color(const ProjectSettings* settings, const char* material_key, Color4* out_color);
float project_settings_face_shade_for_normal(const ProjectSettings* settings, int nx, int ny, int nz);
