#pragma once

#include "config/project_settings.h"
#include "player/player_controller.h"
#include "sokol/sokol_app.h"
#include "world/runtime_world.h"

typedef struct {
    ProjectSettings settings;
    RuntimeWorld world;
    PlayerState player;
    PlayerInputState input;
    PlayerControllerConfig player_config;
    bool mouse_captured;
} GameAppState;

extern GameAppState game_app;

sapp_desc game_app_make_desc(void);
