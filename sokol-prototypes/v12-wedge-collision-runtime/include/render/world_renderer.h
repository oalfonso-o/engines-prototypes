#pragma once

#include "sokol/sokol_gfx.h"

#include "config/project_settings.h"
#include "shared/math3d.h"
#include "world/runtime_world.h"

typedef struct {
    float mvp[16];
} FrameUniforms;

typedef struct {
    sg_pass_action pass_action;
    sg_pipeline pipeline;
    sg_bindings bindings;
    sg_shader shader;
    sg_buffer vertex_buffer;
    sg_buffer index_buffer;
    int index_count;
} WorldRenderer;

void world_renderer_init(WorldRenderer* renderer, const RuntimeWorld* world, Color4 clear_color);
void world_renderer_draw(const WorldRenderer* renderer, Mat4 mvp, sg_swapchain swapchain);
