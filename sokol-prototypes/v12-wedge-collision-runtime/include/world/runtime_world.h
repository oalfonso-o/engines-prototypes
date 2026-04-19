#pragma once

#include <stdbool.h>
#include <stdint.h>

#include "config/project_settings.h"
#include "shared/math3d.h"

typedef struct {
    float x;
    float y;
    float z;
    float r;
    float g;
    float b;
    float a;
} Vertex;

typedef struct {
    float min_x;
    float min_y;
    float min_z;
    float max_x;
    float max_y;
    float max_z;
} CollisionBox;

typedef struct {
    int cell_x;
    int cell_y;
    int cell_z;
    int type_id;
    float min_x;
    float min_y;
    float min_z;
    float max_x;
    float max_y;
    float max_z;
} CollisionWedge;

typedef struct {
    Vec3 map_default;
    bool override_enabled;
    Vec3 override_position;
} RuntimeSpawnConfig;

typedef struct {
    int size_x;
    int size_y;
    int size_z;
    float voxel_size;
    float world_y_offset;
    RuntimeSpawnConfig spawn;
    Vertex* vertices;
    uint32_t* indices;
    CollisionBox* boxes;
    CollisionWedge* wedges;
    int vertex_count;
    int index_count;
    int box_count;
    int wedge_count;
} RuntimeWorld;

bool runtime_world_load(const char* artifact_path, const ProjectSettings* settings, RuntimeWorld* out_world);
void runtime_world_release(RuntimeWorld* world);
