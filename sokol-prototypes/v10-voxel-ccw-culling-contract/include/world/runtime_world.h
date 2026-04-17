#pragma once

#include <stdbool.h>
#include <stdint.h>

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
    int size_x;
    int size_y;
    int size_z;
    float voxel_size;
    float world_y_offset;
    Vec3 spawn;
    Vertex* vertices;
    uint32_t* indices;
    CollisionBox* boxes;
    int vertex_count;
    int index_count;
    int box_count;
} RuntimeWorld;

bool runtime_world_load(const char* artifact_path, RuntimeWorld* out_world);
void runtime_world_append_ground_plane(RuntimeWorld* world, float half_size);
void runtime_world_release(RuntimeWorld* world);
