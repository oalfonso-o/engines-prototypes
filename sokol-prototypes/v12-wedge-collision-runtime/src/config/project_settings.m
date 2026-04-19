#import <Foundation/Foundation.h>

#include "config/project_settings.h"

#include <string.h>

static bool copy_string(char* destination, size_t destination_size, NSString* source) {
    if (![source isKindOfClass:[NSString class]]) {
        return false;
    }
    const char* utf8 = [source UTF8String];
    if (utf8 == NULL) {
        return false;
    }
    if (strlen(utf8) >= destination_size) {
        return false;
    }
    strcpy(destination, utf8);
    return true;
}

static bool parse_color4(id source, Color4* out_color) {
    if (![source isKindOfClass:[NSArray class]] || [source count] != 4) {
        return false;
    }
    out_color->r = [source[0] floatValue];
    out_color->g = [source[1] floatValue];
    out_color->b = [source[2] floatValue];
    out_color->a = [source[3] floatValue];
    return true;
}

static bool parse_vec3(id source, Vec3* out_vec) {
    if (![source isKindOfClass:[NSArray class]] || [source count] != 3) {
        return false;
    }
    out_vec->x = [source[0] floatValue];
    out_vec->y = [source[1] floatValue];
    out_vec->z = [source[2] floatValue];
    return true;
}

bool project_settings_load(const char* settings_path, ProjectSettings* out_settings) {
    memset(out_settings, 0, sizeof(*out_settings));

    @autoreleasepool {
        NSString* file_path = [NSString stringWithUTF8String:settings_path];
        NSData* data = [NSData dataWithContentsOfFile:file_path];
        if (data == nil) {
            return false;
        }

        NSError* error = nil;
        NSDictionary* payload = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
        if (![payload isKindOfClass:[NSDictionary class]]) {
            return false;
        }

        NSDictionary* paths = payload[@"paths"];
        NSDictionary* spawn = payload[@"spawn"];
        NSDictionary* app = payload[@"app"];
        NSDictionary* camera = payload[@"camera"];
        NSDictionary* player = payload[@"player"];
        NSDictionary* materials = payload[@"materials"];
        NSDictionary* render = payload[@"render"];
        NSDictionary* collision = payload[@"collision"];
        NSDictionary* collision_player = collision[@"player"];
        NSDictionary* wedge_type_ids = collision[@"wedge_type_ids"];
        NSDictionary* face_shading = render[@"face_shading"];
        if (![paths isKindOfClass:[NSDictionary class]] ||
            ![spawn isKindOfClass:[NSDictionary class]] ||
            ![app isKindOfClass:[NSDictionary class]] ||
            ![camera isKindOfClass:[NSDictionary class]] ||
            ![player isKindOfClass:[NSDictionary class]] ||
            ![materials isKindOfClass:[NSDictionary class]] ||
            ![render isKindOfClass:[NSDictionary class]] ||
            ![collision isKindOfClass:[NSDictionary class]] ||
            ![collision_player isKindOfClass:[NSDictionary class]] ||
            ![wedge_type_ids isKindOfClass:[NSDictionary class]] ||
            ![face_shading isKindOfClass:[NSDictionary class]]) {
            return false;
        }

        if (!copy_string(out_settings->paths.source_map, sizeof(out_settings->paths.source_map), paths[@"source_map"]) ||
            !copy_string(out_settings->paths.runtime_artifact, sizeof(out_settings->paths.runtime_artifact), paths[@"runtime_artifact"]) ||
            !copy_string(out_settings->paths.debug_artifact, sizeof(out_settings->paths.debug_artifact), paths[@"debug_artifact"]) ||
            !copy_string(out_settings->app.window_title, sizeof(out_settings->app.window_title), app[@"window_title"])) {
            return false;
        }

        out_settings->spawn.override_enabled = [spawn[@"override_enabled"] boolValue];
        out_settings->spawn.ground_search_distance = [spawn[@"ground_search_distance"] floatValue];
        out_settings->app.window_width = [app[@"window_width"] intValue];
        out_settings->app.window_height = [app[@"window_height"] intValue];
        out_settings->app.sample_count = [app[@"sample_count"] intValue];
        out_settings->app.high_dpi = [app[@"high_dpi"] boolValue];
        out_settings->camera.initial_pitch = [camera[@"initial_pitch"] floatValue];
        out_settings->camera.fov_y_degrees = [camera[@"fov_y_degrees"] floatValue];
        out_settings->camera.near_plane = [camera[@"near"] floatValue];
        out_settings->camera.far_plane = [camera[@"far"] floatValue];
        out_settings->player.mouse_sensitivity = [player[@"mouse_sensitivity"] floatValue];
        out_settings->player.move_speed = [player[@"move_speed"] floatValue];
        out_settings->player.radius = [player[@"radius"] floatValue];
        out_settings->player.height = [player[@"height"] floatValue];
        out_settings->player.eye_height = [player[@"eye_height"] floatValue];
        out_settings->player.jump_speed = [player[@"jump_speed"] floatValue];
        out_settings->player.gravity = [player[@"gravity"] floatValue];
        out_settings->player.pitch_limit = [player[@"pitch_limit"] floatValue];
        out_settings->collision.max_auto_step_height = [collision_player[@"max_auto_step_height"] floatValue];
        out_settings->collision.ground_snap_distance = [collision_player[@"ground_snap_distance"] floatValue];
        out_settings->collision.floor_epsilon = [collision_player[@"floor_epsilon"] floatValue];
        out_settings->collision.horizontal_epsilon = [collision_player[@"horizontal_epsilon"] floatValue];
        out_settings->collision.vertical_epsilon = [collision_player[@"vertical_epsilon"] floatValue];
        out_settings->collision.wedge_type_id_pz = [wedge_type_ids[@"wedge_pz"] intValue];
        out_settings->collision.wedge_type_id_px = [wedge_type_ids[@"wedge_px"] intValue];
        out_settings->collision.wedge_type_id_nz = [wedge_type_ids[@"wedge_nz"] intValue];
        out_settings->collision.wedge_type_id_nx = [wedge_type_ids[@"wedge_nx"] intValue];

        if (!parse_vec3(spawn[@"override_position"], &out_settings->spawn.override_position) ||
            !parse_color4(render[@"clear_color"], &out_settings->render.clear_color)) {
            return false;
        }

        out_settings->render.shade_pos_y = [face_shading[@"pos_y"] floatValue];
        out_settings->render.shade_neg_y = [face_shading[@"neg_y"] floatValue];
        out_settings->render.shade_pos_z = [face_shading[@"pos_z"] floatValue];
        out_settings->render.shade_neg_z = [face_shading[@"neg_z"] floatValue];
        out_settings->render.shade_pos_x = [face_shading[@"pos_x"] floatValue];
        out_settings->render.shade_neg_x = [face_shading[@"neg_x"] floatValue];

        NSArray* material_keys = [[materials allKeys] sortedArrayUsingSelector:@selector(compare:)];
        if ([material_keys count] > PROJECT_SETTINGS_MAX_MATERIALS) {
            return false;
        }
        out_settings->material_count = (int)[material_keys count];
        for (int i = 0; i < out_settings->material_count; i++) {
            NSString* key = material_keys[(NSUInteger)i];
            NSDictionary* definition = materials[key];
            if (![definition isKindOfClass:[NSDictionary class]]) {
                return false;
            }
            if (!copy_string(out_settings->materials[i].key, sizeof(out_settings->materials[i].key), key) ||
                !parse_color4(definition[@"color"], &out_settings->materials[i].color)) {
                return false;
            }
        }
    }

    return true;
}

void project_settings_release(ProjectSettings* settings) {
    memset(settings, 0, sizeof(*settings));
}

bool project_settings_material_color(const ProjectSettings* settings, const char* material_key, Color4* out_color) {
    for (int i = 0; i < settings->material_count; i++) {
        if (strcmp(settings->materials[i].key, material_key) == 0) {
            *out_color = settings->materials[i].color;
            return true;
        }
    }
    return false;
}

float project_settings_face_shade_for_normal(const ProjectSettings* settings, int nx, int ny, int nz) {
    if (ny > 0) {
        return settings->render.shade_pos_y;
    }
    if (ny < 0) {
        return settings->render.shade_neg_y;
    }
    if (nz > 0) {
        return settings->render.shade_pos_z;
    }
    if (nz < 0) {
        return settings->render.shade_neg_z;
    }
    if (nx > 0) {
        return settings->render.shade_pos_x;
    }
    return settings->render.shade_neg_x;
}
