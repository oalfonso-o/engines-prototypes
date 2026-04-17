APP := build/v4-single-cube-runtime
ROOT_SOKOL := ../v1-basic-fps-cube

.PHONY: preprocess build run

preprocess:
	python3 tools/preprocess_runtime.py

build: preprocess
	mkdir -p build
	clang -std=c11 -O2 -Wall -Wextra -fobjc-arc -I"$(ROOT_SOKOL)" main.m -o "$(APP)" -framework Cocoa -framework QuartzCore -framework Metal -framework MetalKit

run: build
	"./$(APP)"
