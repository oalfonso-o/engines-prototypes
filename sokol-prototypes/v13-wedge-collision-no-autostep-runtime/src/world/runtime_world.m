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
    int p0_x;
    int p0_y;
    int p0_z;
    int p1_x;
    int p1_y;
    int p1_z;
    int p2_x;
    int p2_y;
    int p2_z;
    int normal_x;
    int normal_y;
    int normal_z;
} VoxelTriangle;

static Vec3 world_point_from_voxel(int x, int y, int z, int size_x, int size_z, float voxel_size, float world_y_offset) {
    return vec3_make(
        ((float)x - ((float)size_x * 0.5f)) * voxel_size,
        ((float)y * voxel_size) + world_y_offset,
        ((float)z - ((float)size_z * 0.5f)) * voxel_size
    );
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

static bool voxel_triangle_from_array(NSArray* source, VoxelTriangle* out_triangle) {
    if (![source isKindOfClass:[NSArray class]] || [source count] != 12) {
        return false;
    }
    out_triangle->p0_x = [source[0] intValue];
    out_triangle->p0_y = [source[1] intValue];
    out_triangle->p0_z = [source[2] intValue];
    out_triangle->p1_x = [source[3] intValue];
    out_triangle->p1_y = [source[4] intValue];
    out_triangle->p1_z = [source[5] intValue];
    out_triangle->p2_x = [source[6] intValue];
    out_triangle->p2_y = [source[7] intValue];
    out_triangle->p2_z = [source[8] intValue];
    out_triangle->normal_x = [source[9] intValue];
    out_triangle->normal_y = [source[10] intValue];
    out_triangle->normal_z = [source[11] intValue];
    return true;
}

static void append_runtime_quad(RuntimeWorld* world, int* vertex_cursor, int* index_cursor, const ProjectSettings* settings, const char* material_key, VoxelQuad quad) {
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
    Color4 base_color = {0};
    if (!project_settings_material_color(settings, material_key, &base_color)) {
        abort();
    }
    const float shade = project_settings_face_shade_for_normal(settings, quad.normal_x, quad.normal_y, quad.normal_z);
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

static void append_runtime_triangle(RuntimeWorld* world, int* vertex_cursor, int* index_cursor, const ProjectSettings* settings, const char* material_key, VoxelTriangle triangle) {
    const Vec3 p0 = world_point_from_voxel(
        triangle.p0_x, triangle.p0_y, triangle.p0_z,
        world->size_x, world->size_z, world->voxel_size, world->world_y_offset
    );
    const Vec3 p1 = world_point_from_voxel(
        triangle.p1_x, triangle.p1_y, triangle.p1_z,
        world->size_x, world->size_z, world->voxel_size, world->world_y_offset
    );
    const Vec3 p2 = world_point_from_voxel(
        triangle.p2_x, triangle.p2_y, triangle.p2_z,
        world->size_x, world->size_z, world->voxel_size, world->world_y_offset
    );
    Color4 base_color = {0};
    if (!project_settings_material_color(settings, material_key, &base_color)) {
        abort();
    }
    const float shade = project_settings_face_shade_for_normal(settings, triangle.normal_x, triangle.normal_y, triangle.normal_z);
    const float r = base_color.r * shade;
    const float g = base_color.g * shade;
    const float b = base_color.b * shade;
    const uint32_t base_index = (uint32_t)(*vertex_cursor);

    world->vertices[*vertex_cursor + 0] = (Vertex){ p0.x, p0.y, p0.z, r, g, b, base_color.a };
    world->vertices[*vertex_cursor + 1] = (Vertex){ p1.x, p1.y, p1.z, r, g, b, base_color.a };
    world->vertices[*vertex_cursor + 2] = (Vertex){ p2.x, p2.y, p2.z, r, g, b, base_color.a };
    world->indices[*index_cursor + 0] = base_index + 0;
    world->indices[*index_cursor + 1] = base_index + 1;
    world->indices[*index_cursor + 2] = base_index + 2;
    *vertex_cursor += 3;
    *index_cursor += 3;
}

bool runtime_world_load(const char* artifact_path, const ProjectSettings* settings, RuntimeWorld* out_world) {
    memset(out_world, 0, sizeof(*out_world));

    @autoreleasepool {
        NSString* file_path = [NSString stringWithUTF8String:artifact_path];
        NSData* data = [NSData dataWithContentsOfFile:file_path];
        if (data == nil) {
            return false;
        }

        NSError* error = nil;
        NSDictionary* payload = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
        if (![payload isKindOfClass:[NSDictionary class]]) {
            return false;
        }

        NSArray* dimensions = payload[@"dimensions"];
        NSDictionary* spawn = payload[@"spawn"];
        NSArray* materials = payload[@"materials"];
        NSDictionary* quads_by_material = payload[@"quads"];
        NSDictionary* triangles_by_material = payload[@"triangles"];
        NSDictionary* collision_shapes = payload[@"collision_shapes"];
        NSArray* boxes = collision_shapes[@"boxes"];
        NSArray* wedges = collision_shapes[@"wedges"];
        if (![dimensions isKindOfClass:[NSArray class]] || [dimensions count] != 3) {
            return false;
        }
        if (![spawn isKindOfClass:[NSDictionary class]] ||
            ![materials isKindOfClass:[NSArray class]] ||
            ![quads_by_material isKindOfClass:[NSDictionary class]] ||
            ![triangles_by_material isKindOfClass:[NSDictionary class]] ||
            ![boxes isKindOfClass:[NSArray class]] ||
            ![wedges isKindOfClass:[NSArray class]]) {
            return false;
        }

        out_world->size_x = [dimensions[0] intValue];
        out_world->size_y = [dimensions[1] intValue];
        out_world->size_z = [dimensions[2] intValue];
        out_world->voxel_size = [payload[@"voxel_size"] floatValue];
        out_world->world_y_offset = [payload[@"world_y_offset"] floatValue];
        out_world->box_count = (int)[boxes count];
        out_world->wedge_count = (int)[wedges count];

        NSArray* map_default = spawn[@"map_default"];
        NSArray* override_position = spawn[@"override_position"];
        if (![map_default isKindOfClass:[NSArray class]] || [map_default count] != 3 ||
            ![override_position isKindOfClass:[NSArray class]] || [override_position count] != 3) {
            return false;
        }
        out_world->spawn.map_default = vec3_make([map_default[0] floatValue], [map_default[1] floatValue], [map_default[2] floatValue]);
        out_world->spawn.override_enabled = settings->spawn.override_enabled;
        out_world->spawn.override_position = settings->spawn.override_position;

        int total_quads = 0;
        int total_triangles = 0;
        for (NSString* material in materials) {
            NSArray* material_quads = quads_by_material[material];
            NSArray* material_triangles = triangles_by_material[material];
            if ([material_quads isKindOfClass:[NSArray class]]) {
                total_quads += (int)[material_quads count];
            }
            if ([material_triangles isKindOfClass:[NSArray class]]) {
                total_triangles += (int)[material_triangles count];
            }
        }

        out_world->vertex_count = (total_quads * 4) + (total_triangles * 3);
        out_world->index_count = (total_quads * 6) + (total_triangles * 3);
        out_world->vertices = (Vertex*)malloc((size_t)out_world->vertex_count * sizeof(Vertex));
        out_world->indices = (uint32_t*)malloc((size_t)out_world->index_count * sizeof(uint32_t));
        out_world->boxes = (CollisionBox*)malloc((size_t)out_world->box_count * sizeof(CollisionBox));
        out_world->wedges = (CollisionWedge*)malloc((size_t)out_world->wedge_count * sizeof(CollisionWedge));
        if (!out_world->vertices || !out_world->indices || !out_world->boxes || !out_world->wedges) {
            return false;
        }

        int vertex_cursor = 0;
        int index_cursor = 0;
        for (NSString* material in materials) {
            const char* material_key = [material UTF8String];
            NSArray* material_quads = quads_by_material[material];
            if ([material_quads isKindOfClass:[NSArray class]]) {
                for (NSArray* source_quad in material_quads) {
                    VoxelQuad quad = {0};
                    if (!voxel_quad_from_array(source_quad, &quad)) {
                        return false;
                    }
                    append_runtime_quad(out_world, &vertex_cursor, &index_cursor, settings, material_key, quad);
                }
            }
            NSArray* material_triangles = triangles_by_material[material];
            if ([material_triangles isKindOfClass:[NSArray class]]) {
                for (NSArray* source_triangle in material_triangles) {
                    VoxelTriangle triangle = {0};
                    if (!voxel_triangle_from_array(source_triangle, &triangle)) {
                        return false;
                    }
                    append_runtime_triangle(out_world, &vertex_cursor, &index_cursor, settings, material_key, triangle);
                }
            }
        }

        for (int i = 0; i < out_world->box_count; i++) {
            NSArray* source_box = boxes[(NSUInteger)i];
            if (![source_box isKindOfClass:[NSArray class]] || [source_box count] != 6) {
                return false;
            }
            const int x = [source_box[0] intValue];
            const int y = [source_box[1] intValue];
            const int z = [source_box[2] intValue];
            const int width = [source_box[3] intValue];
            const int height = [source_box[4] intValue];
            const int depth = [source_box[5] intValue];
            const Vec3 min_corner = world_point_from_voxel(x, y, z, out_world->size_x, out_world->size_z, out_world->voxel_size, out_world->world_y_offset);
            out_world->boxes[i] = (CollisionBox){
                .min_x = min_corner.x,
                .min_y = min_corner.y,
                .min_z = min_corner.z,
                .max_x = min_corner.x + ((float)width * out_world->voxel_size),
                .max_y = min_corner.y + ((float)height * out_world->voxel_size),
                .max_z = min_corner.z + ((float)depth * out_world->voxel_size),
            };
        }

        for (int i = 0; i < out_world->wedge_count; i++) {
            NSArray* source_wedge = wedges[(NSUInteger)i];
            if (![source_wedge isKindOfClass:[NSArray class]] || [source_wedge count] != 4) {
                return false;
            }
            const int x = [source_wedge[0] intValue];
            const int y = [source_wedge[1] intValue];
            const int z = [source_wedge[2] intValue];
            const int type_id = [source_wedge[3] intValue];
            const Vec3 min_corner = world_point_from_voxel(x, y, z, out_world->size_x, out_world->size_z, out_world->voxel_size, out_world->world_y_offset);
            out_world->wedges[i] = (CollisionWedge){
                .cell_x = x,
                .cell_y = y,
                .cell_z = z,
                .type_id = type_id,
                .min_x = min_corner.x,
                .min_y = min_corner.y,
                .min_z = min_corner.z,
                .max_x = min_corner.x + out_world->voxel_size,
                .max_y = min_corner.y + out_world->voxel_size,
                .max_z = min_corner.z + out_world->voxel_size,
            };
        }
    }

    return true;
}

void runtime_world_release(RuntimeWorld* world) {
    free(world->vertices);
    free(world->indices);
    free(world->boxes);
    free(world->wedges);
    memset(world, 0, sizeof(*world));
}
