#import <Foundation/Foundation.h>

#include "world/runtime_world.h"

#include <stdlib.h>
#include <string.h>

typedef struct {
    int origin_x;
    int origin_y;
    int origin_z;
    int u_x;
    int u_y;
    int u_z;
    int v_x;
    int v_y;
    int v_z;
    int normal_x;
    int normal_y;
    int normal_z;
} VoxelQuad;

typedef struct {
    const char* key;
    float r;
    float g;
    float b;
    float a;
} MaterialColor;

static const MaterialColor MATERIAL_COLORS[] = {
    { "gray",   0.525f, 0.545f, 0.573f, 1.0f },
    { "green",  0.435f, 0.584f, 0.443f, 1.0f },
    { "purple", 0.525f, 0.427f, 0.584f, 1.0f },
    { "metal",  0.659f, 0.639f, 0.604f, 1.0f },
};

static Vec3 world_point_from_voxel(int x, int y, int z, int size_x, int size_z, float voxel_size, float world_y_offset) {
    return vec3_make(
        ((float)x - ((float)size_x * 0.5f)) * voxel_size,
        ((float)y * voxel_size) + world_y_offset,
        ((float)z - ((float)size_z * 0.5f)) * voxel_size
    );
}

static float face_shade_for_normal(int nx, int ny, int nz) {
    if (ny > 0) {
        return 1.00f;
    }
    if (ny < 0) {
        return 0.62f;
    }
    if (nz > 0) {
        return 0.94f;
    }
    if (nz < 0) {
        return 0.74f;
    }
    if (nx > 0) {
        return 0.86f;
    }
    return 0.80f;
}

static MaterialColor material_color_for_key(const char* material_key) {
    const int material_count = (int)(sizeof(MATERIAL_COLORS) / sizeof(MATERIAL_COLORS[0]));
    for (int i = 0; i < material_count; i++) {
        if (strcmp(MATERIAL_COLORS[i].key, material_key) == 0) {
            return MATERIAL_COLORS[i];
        }
    }
    return MATERIAL_COLORS[0];
}

static bool voxel_quad_from_array(NSArray* source, VoxelQuad* out_quad) {
    if (![source isKindOfClass:[NSArray class]] || [source count] != 12) {
        return false;
    }
    out_quad->origin_x = [source[0] intValue];
    out_quad->origin_y = [source[1] intValue];
    out_quad->origin_z = [source[2] intValue];
    out_quad->u_x = [source[3] intValue];
    out_quad->u_y = [source[4] intValue];
    out_quad->u_z = [source[5] intValue];
    out_quad->v_x = [source[6] intValue];
    out_quad->v_y = [source[7] intValue];
    out_quad->v_z = [source[8] intValue];
    out_quad->normal_x = [source[9] intValue];
    out_quad->normal_y = [source[10] intValue];
    out_quad->normal_z = [source[11] intValue];
    return true;
}

static void append_runtime_quad(RuntimeWorld* world, int* vertex_cursor, int* index_cursor, const char* material_key, VoxelQuad quad) {
    const Vec3 origin = world_point_from_voxel(
        quad.origin_x, quad.origin_y, quad.origin_z,
        world->size_x, world->size_z, world->voxel_size, world->world_y_offset
    );
    const Vec3 u_axis = vec3_make(
        (float)quad.u_x * world->voxel_size,
        (float)quad.u_y * world->voxel_size,
        (float)quad.u_z * world->voxel_size
    );
    const Vec3 v_axis = vec3_make(
        (float)quad.v_x * world->voxel_size,
        (float)quad.v_y * world->voxel_size,
        (float)quad.v_z * world->voxel_size
    );
    const MaterialColor base_color = material_color_for_key(material_key);
    const float shade = face_shade_for_normal(quad.normal_x, quad.normal_y, quad.normal_z);
    const float r = base_color.r * shade;
    const float g = base_color.g * shade;
    const float b = base_color.b * shade;

    const Vec3 points[4] = {
        origin,
        vec3_add(origin, u_axis),
        vec3_add(vec3_add(origin, u_axis), v_axis),
        vec3_add(origin, v_axis),
    };

    const uint32_t base_index = (uint32_t)(*vertex_cursor);
    for (int i = 0; i < 4; i++) {
        world->vertices[*vertex_cursor + i] = (Vertex){ points[i].x, points[i].y, points[i].z, r, g, b, base_color.a };
    }

    world->indices[*index_cursor + 0] = base_index + 0;
    world->indices[*index_cursor + 1] = base_index + 1;
    world->indices[*index_cursor + 2] = base_index + 2;
    world->indices[*index_cursor + 3] = base_index + 0;
    world->indices[*index_cursor + 4] = base_index + 2;
    world->indices[*index_cursor + 5] = base_index + 3;
    *vertex_cursor += 4;
    *index_cursor += 6;
}

bool runtime_world_load(const char* artifact_path, RuntimeWorld* out_world) {
    memset(out_world, 0, sizeof(*out_world));

    @autoreleasepool {
        NSString* file_path = [NSString stringWithUTF8String:artifact_path];
        NSData* data = [NSData dataWithContentsOfFile:file_path];
        if (data == nil) {
            return false;
        }

        NSError* error = nil;
        NSDictionary* payload = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
        if (payload == nil || ![payload isKindOfClass:[NSDictionary class]]) {
            return false;
        }

        NSArray* dimensions = payload[@"dimensions"];
        NSArray* spawn = payload[@"spawn"];
        NSArray* materials = payload[@"materials"];
        NSDictionary* quads_by_material = payload[@"quads"];
        NSArray* boxes = payload[@"boxes"];
        if (![dimensions isKindOfClass:[NSArray class]] || [dimensions count] != 3) {
            return false;
        }
        if (![spawn isKindOfClass:[NSArray class]] || [spawn count] != 3) {
            return false;
        }
        if (![materials isKindOfClass:[NSArray class]] || ![quads_by_material isKindOfClass:[NSDictionary class]] || ![boxes isKindOfClass:[NSArray class]]) {
            return false;
        }

        out_world->size_x = [dimensions[0] intValue];
        out_world->size_y = [dimensions[1] intValue];
        out_world->size_z = [dimensions[2] intValue];
        out_world->voxel_size = [payload[@"voxel_size"] floatValue];
        out_world->world_y_offset = [payload[@"world_y_offset"] floatValue];
        out_world->spawn = vec3_make([spawn[0] floatValue], [spawn[1] floatValue], [spawn[2] floatValue]);
        out_world->box_count = (int)[boxes count];

        int total_quads = 0;
        for (NSString* material in materials) {
            NSArray* material_quads = quads_by_material[material];
            if ([material_quads isKindOfClass:[NSArray class]]) {
                total_quads += (int)[material_quads count];
            }
        }

        out_world->vertex_count = total_quads * 4;
        out_world->index_count = total_quads * 6;
        out_world->vertices = (Vertex*)malloc((size_t)out_world->vertex_count * sizeof(Vertex));
        out_world->indices = (uint32_t*)malloc((size_t)out_world->index_count * sizeof(uint32_t));
        out_world->boxes = (CollisionBox*)malloc((size_t)out_world->box_count * sizeof(CollisionBox));
        if (!out_world->vertices || !out_world->indices || !out_world->boxes) {
            return false;
        }

        int vertex_cursor = 0;
        int index_cursor = 0;
        for (NSString* material in materials) {
            NSArray* material_quads = quads_by_material[material];
            if (![material_quads isKindOfClass:[NSArray class]]) {
                continue;
            }
            const char* material_key = [material UTF8String];
            for (NSArray* source_quad in material_quads) {
                VoxelQuad quad = {0};
                if (!voxel_quad_from_array(source_quad, &quad)) {
                    return false;
                }
                append_runtime_quad(out_world, &vertex_cursor, &index_cursor, material_key, quad);
            }
        }

        for (int i = 0; i < out_world->box_count; i++) {
            NSArray* source_box = boxes[i];
            if (![source_box isKindOfClass:[NSArray class]] || [source_box count] != 6) {
                return false;
            }
            const int x = [source_box[0] intValue];
            const int y = [source_box[1] intValue];
            const int z = [source_box[2] intValue];
            const int width = [source_box[3] intValue];
            const int height = [source_box[4] intValue];
            const int depth = [source_box[5] intValue];
            const Vec3 min_corner = world_point_from_voxel(
                x, y, z,
                out_world->size_x, out_world->size_z,
                out_world->voxel_size, out_world->world_y_offset
            );
            out_world->boxes[i] = (CollisionBox){
                .min_x = min_corner.x,
                .min_y = min_corner.y,
                .min_z = min_corner.z,
                .max_x = min_corner.x + ((float)width * out_world->voxel_size),
                .max_y = min_corner.y + ((float)height * out_world->voxel_size),
                .max_z = min_corner.z + ((float)depth * out_world->voxel_size),
            };
        }
    }

    return true;
}

void runtime_world_append_ground_plane(RuntimeWorld* world, float half_size) {
    const int extra_vertex_count = 4;
    const int extra_index_count = 6;
    const uint32_t base_index = (uint32_t)world->vertex_count;
    world->vertices = (Vertex*)realloc(world->vertices, (size_t)(world->vertex_count + extra_vertex_count) * sizeof(Vertex));
    world->indices = (uint32_t*)realloc(world->indices, (size_t)(world->index_count + extra_index_count) * sizeof(uint32_t));
    if (!world->vertices || !world->indices) {
        abort();
    }

    const Vertex ground_vertices[4] = {
        { -half_size, 0.0f, -half_size, 0.561f, 0.635f, 0.518f, 1.0f },
        { -half_size, 0.0f,  half_size, 0.561f, 0.635f, 0.518f, 1.0f },
        {  half_size, 0.0f,  half_size, 0.561f, 0.635f, 0.518f, 1.0f },
        {  half_size, 0.0f, -half_size, 0.561f, 0.635f, 0.518f, 1.0f },
    };
    const uint32_t ground_indices[6] = {
        base_index + 0, base_index + 1, base_index + 2,
        base_index + 0, base_index + 2, base_index + 3,
    };

    memcpy(&world->vertices[world->vertex_count], ground_vertices, sizeof(ground_vertices));
    memcpy(&world->indices[world->index_count], ground_indices, sizeof(ground_indices));
    world->vertex_count += extra_vertex_count;
    world->index_count += extra_index_count;
}

void runtime_world_release(RuntimeWorld* world) {
    free(world->vertices);
    free(world->indices);
    free(world->boxes);
    memset(world, 0, sizeof(*world));
}
