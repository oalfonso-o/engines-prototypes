#pragma once

#include <stdbool.h>

typedef struct {
    float x;
    float y;
    float z;
} Vec3;

typedef struct {
    float m[16];
} Mat4;

float math3d_clampf(float value, float min_value, float max_value);
float math3d_maxf(float a, float b);
float math3d_minf(float a, float b);
bool math3d_ranges_overlap(float a_min, float a_max, float b_min, float b_max);

Vec3 vec3_make(float x, float y, float z);
Vec3 vec3_add(Vec3 a, Vec3 b);
Vec3 vec3_sub(Vec3 a, Vec3 b);
Vec3 vec3_scale(Vec3 v, float scale);
float vec3_dot(Vec3 a, Vec3 b);
Vec3 vec3_cross(Vec3 a, Vec3 b);
Vec3 vec3_normalize(Vec3 v);

Mat4 mat4_identity(void);
Mat4 mat4_mul(Mat4 a, Mat4 b);
Mat4 mat4_perspective(float fov_y_radians, float aspect, float near_z, float far_z);
Mat4 mat4_lookat(Vec3 eye, Vec3 center, Vec3 up);
