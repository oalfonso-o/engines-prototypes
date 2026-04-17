#include "shared/math3d.h"

#include <math.h>

float math3d_clampf(float value, float min_value, float max_value) {
    if (value < min_value) {
        return min_value;
    }
    if (value > max_value) {
        return max_value;
    }
    return value;
}

float math3d_maxf(float a, float b) {
    return a > b ? a : b;
}

float math3d_minf(float a, float b) {
    return a < b ? a : b;
}

bool math3d_ranges_overlap(float a_min, float a_max, float b_min, float b_max) {
    return (a_min < b_max) && (a_max > b_min);
}

Vec3 vec3_make(float x, float y, float z) {
    return (Vec3){ x, y, z };
}

Vec3 vec3_add(Vec3 a, Vec3 b) {
    return vec3_make(a.x + b.x, a.y + b.y, a.z + b.z);
}

Vec3 vec3_sub(Vec3 a, Vec3 b) {
    return vec3_make(a.x - b.x, a.y - b.y, a.z - b.z);
}

Vec3 vec3_scale(Vec3 v, float scale) {
    return vec3_make(v.x * scale, v.y * scale, v.z * scale);
}

float vec3_dot(Vec3 a, Vec3 b) {
    return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
}

Vec3 vec3_cross(Vec3 a, Vec3 b) {
    return vec3_make(
        (a.y * b.z) - (a.z * b.y),
        (a.z * b.x) - (a.x * b.z),
        (a.x * b.y) - (a.y * b.x)
    );
}

Vec3 vec3_normalize(Vec3 v) {
    const float length = sqrtf(vec3_dot(v, v));
    if (length <= 0.00001f) {
        return vec3_make(0.0f, 0.0f, 0.0f);
    }
    return vec3_scale(v, 1.0f / length);
}

Mat4 mat4_identity(void) {
    Mat4 result = { .m = {
        1.0f, 0.0f, 0.0f, 0.0f,
        0.0f, 1.0f, 0.0f, 0.0f,
        0.0f, 0.0f, 1.0f, 0.0f,
        0.0f, 0.0f, 0.0f, 1.0f,
    }};
    return result;
}

Mat4 mat4_mul(Mat4 a, Mat4 b) {
    Mat4 result = {0};
    for (int col = 0; col < 4; col++) {
        for (int row = 0; row < 4; row++) {
            result.m[col * 4 + row] =
                a.m[0 * 4 + row] * b.m[col * 4 + 0] +
                a.m[1 * 4 + row] * b.m[col * 4 + 1] +
                a.m[2 * 4 + row] * b.m[col * 4 + 2] +
                a.m[3 * 4 + row] * b.m[col * 4 + 3];
        }
    }
    return result;
}

Mat4 mat4_perspective(float fov_y_radians, float aspect, float near_z, float far_z) {
    const float f = 1.0f / tanf(fov_y_radians * 0.5f);
    Mat4 result = {0};
    result.m[0] = f / aspect;
    result.m[5] = f;
    result.m[10] = far_z / (near_z - far_z);
    result.m[11] = -1.0f;
    result.m[14] = (near_z * far_z) / (near_z - far_z);
    return result;
}

Mat4 mat4_lookat(Vec3 eye, Vec3 center, Vec3 up) {
    const Vec3 forward = vec3_normalize(vec3_sub(center, eye));
    const Vec3 right = vec3_normalize(vec3_cross(forward, up));
    const Vec3 camera_up = vec3_cross(right, forward);
    Mat4 result = mat4_identity();
    result.m[0] = right.x;
    result.m[1] = camera_up.x;
    result.m[2] = -forward.x;
    result.m[4] = right.y;
    result.m[5] = camera_up.y;
    result.m[6] = -forward.y;
    result.m[8] = right.z;
    result.m[9] = camera_up.z;
    result.m[10] = -forward.z;
    result.m[12] = -vec3_dot(right, eye);
    result.m[13] = -vec3_dot(camera_up, eye);
    result.m[14] = vec3_dot(forward, eye);
    return result;
}
