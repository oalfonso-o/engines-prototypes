#include "render/world_renderer.h"

#include "sokol/sokol_glue.h"

#include <string.h>

static const char* vertex_shader_source =
    "#include <metal_stdlib>\n"
    "using namespace metal;\n"
    "struct vs_in {\n"
    "  float3 position [[attribute(0)]];\n"
    "  float4 color [[attribute(1)]];\n"
    "};\n"
    "struct vs_out {\n"
    "  float4 position [[position]];\n"
    "  float4 color;\n"
    "};\n"
    "struct params {\n"
    "  float4x4 mvp;\n"
    "};\n"
    "vertex vs_out vs_main(vs_in in [[stage_in]], constant params& p [[buffer(0)]]) {\n"
    "  vs_out out;\n"
    "  out.position = p.mvp * float4(in.position, 1.0);\n"
    "  out.color = in.color;\n"
    "  return out;\n"
    "}\n";

static const char* fragment_shader_source =
    "#include <metal_stdlib>\n"
    "using namespace metal;\n"
    "struct fs_in {\n"
    "  float4 color;\n"
    "};\n"
    "fragment float4 fs_main(fs_in in [[stage_in]]) {\n"
    "  return in.color;\n"
    "}\n";

void world_renderer_init(WorldRenderer* renderer, const RuntimeWorld* world, Color4 clear_color) {
    memset(renderer, 0, sizeof(*renderer));
    renderer->index_count = world->index_count;

    renderer->vertex_buffer = sg_make_buffer(&(sg_buffer_desc){
        .usage.vertex_buffer = true,
        .data = {
            .ptr = world->vertices,
            .size = (size_t)world->vertex_count * sizeof(Vertex),
        },
    });
    renderer->index_buffer = sg_make_buffer(&(sg_buffer_desc){
        .usage.index_buffer = true,
        .data = {
            .ptr = world->indices,
            .size = (size_t)world->index_count * sizeof(uint32_t),
        },
    });
    renderer->shader = sg_make_shader(&(sg_shader_desc){
        .vertex_func = { .source = vertex_shader_source, .entry = "vs_main" },
        .fragment_func = { .source = fragment_shader_source, .entry = "fs_main" },
        .uniform_blocks[0] = {
            .stage = SG_SHADERSTAGE_VERTEX,
            .size = sizeof(FrameUniforms),
            .msl_buffer_n = 0,
        },
    });
    renderer->pipeline = sg_make_pipeline(&(sg_pipeline_desc){
        .shader = renderer->shader,
        .layout = {
            .buffers[0].stride = sizeof(Vertex),
            .attrs = {
                [0].format = SG_VERTEXFORMAT_FLOAT3,
                [1].format = SG_VERTEXFORMAT_FLOAT4,
                [1].offset = 3 * sizeof(float),
            },
        },
        .index_type = SG_INDEXTYPE_UINT32,
        .depth = {
            .write_enabled = true,
            .compare = SG_COMPAREFUNC_LESS_EQUAL,
        },
        .cull_mode = SG_CULLMODE_BACK,
        .face_winding = SG_FACEWINDING_CCW,
    });
    renderer->bindings.vertex_buffers[0] = renderer->vertex_buffer;
    renderer->bindings.index_buffer = renderer->index_buffer;
    renderer->pass_action = (sg_pass_action){
        .colors[0] = {
            .load_action = SG_LOADACTION_CLEAR,
            .clear_value = { clear_color.r, clear_color.g, clear_color.b, clear_color.a },
        },
        .depth = {
            .load_action = SG_LOADACTION_CLEAR,
            .clear_value = 1.0f,
        },
    };
}

void world_renderer_draw(const WorldRenderer* renderer, Mat4 mvp, sg_swapchain swapchain) {
    FrameUniforms uniforms = {0};
    memcpy(uniforms.mvp, mvp.m, sizeof(mvp.m));

    sg_begin_pass(&(sg_pass){
        .action = renderer->pass_action,
        .swapchain = swapchain,
    });
    sg_apply_pipeline(renderer->pipeline);
    sg_apply_bindings(&renderer->bindings);
    sg_apply_uniforms(0, &SG_RANGE(uniforms));
    sg_draw(0, renderer->index_count, 1);
    sg_end_pass();
    sg_commit();
}
