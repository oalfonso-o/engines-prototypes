APP := build/v11-wedge-visual-runtime
ROOT_SOKOL := ../v1-basic-fps-cube

.PHONY: preprocess build run

preprocess:
	python3 tools/preprocess_runtime.py

build:
	mkdir -p build
	clang -std=c11 -O2 -Wall -Wextra -fobjc-arc -I"$(ROOT_SOKOL)" -Iinclude \
		main.m \
		src/app/game_app.c \
		src/player/player_controller.c \
		src/render/world_renderer.c \
		src/shared/math3d.c \
		src/world/runtime_world.m \
		-o "$(APP)" \
		-framework Cocoa -framework QuartzCore -framework Metal -framework MetalKit

run: build
	"./$(APP)"
