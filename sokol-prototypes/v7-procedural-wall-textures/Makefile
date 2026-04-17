APP := build/v7-procedural-wall-textures
ROOT_SOKOL := ../v1-basic-fps-cube

.PHONY: build run

build:
	mkdir -p build
	clang -std=c11 -O2 -Wall -Wextra -fobjc-arc -I"$(ROOT_SOKOL)" main.m -o "$(APP)" -framework Cocoa -framework QuartzCore -framework Metal -framework MetalKit

run: build
	"./$(APP)"
