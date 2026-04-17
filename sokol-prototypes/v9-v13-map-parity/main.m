#define SOKOL_METAL
#define SOKOL_IMPL

#include "app/game_app.h"
#include "sokol/sokol_gfx.h"
#include "sokol/sokol_glue.h"
#include "sokol/sokol_log.h"

sapp_desc sokol_main(int argc, char* argv[]) {
    (void) argc;
    (void) argv;
    return game_app_make_desc();
}
