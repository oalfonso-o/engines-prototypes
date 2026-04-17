GODOT ?= /Applications/Godot_mono.app/Contents/MacOS/Godot

GOD_V1_PATH := godot-prototypes/v1-canuter-3d-tps
GOD_V2_PATH := godot-prototypes/v2-iso3d
GOD_V3_PATH := godot-prototypes/v3-iso3d-targeting
GOD_V4_PATH := godot-prototypes/v4-iso3d-moba-like
GOD_V5_PATH := godot-prototypes/v5-character-prototype
GOD_V6_PATH := godot-prototypes/v6-character-prototype
GOD_V7_PATH := godot-prototypes/v7-fps-prototype
GOD_V8_PATH := godot-prototypes/v8-fps-prototype
GOD_V9_PATH := godot-prototypes/v9-space-survival-prototype
GOD_V10_PATH := godot-prototypes/v10-doom-wall-lab
GOD_V11_PATH := godot-prototypes/v11-house-comparison
GOD_V12_PATH := godot-prototypes/v12-voxel-cross-corridor
GOD_V13_PATH := godot-prototypes/v13-preprocessed-voxel-runtime
GOD_V14_PATH := godot-prototypes/v14-ramp-voxel-runtime

PYG_V1_PATH := pygame-prototypes/v1-iso
SOK_V1_PATH := sokol-prototypes/v1-basic-fps-cube
SOK_V1_APP := $(SOK_V1_PATH)/build/v1-basic-fps-cube
SOK_V2_PATH := sokol-prototypes/v2-fixed-camera-cube
SOK_V2_APP := $(SOK_V2_PATH)/build/v2-fixed-camera-cube
SOK_V3_PATH := sokol-prototypes/v3-voxel-runtime-pipeline
SOK_V3_APP := $(SOK_V3_PATH)/build/v3-voxel-runtime-pipeline
SOK_V4_PATH := sokol-prototypes/v4-single-cube-runtime
SOK_V5_PATH := sokol-prototypes/v5-v3-map-v4-runtime
SOK_V6_PATH := sokol-prototypes/v6-basic-particles
SOK_V7_PATH := sokol-prototypes/v7-procedural-wall-textures
SOK_V8_PATH := sokol-prototypes/v8-voxel-collision-runtime
SOK_V9_PATH := sokol-prototypes/v9-v13-map-parity
SOK_V10_PATH := sokol-prototypes/v10-voxel-ccw-culling-contract

.PHONY: \
	run-god-v1 \
	run-god-v2 \
	run-god-v3 \
	run-god-v4 \
	run-god-v5 \
	run-god-v6 \
	run-god-v7 \
	run-god-v8 \
	run-god-v9 \
	run-god-v10 \
	run-god-v11 \
	run-god-v12 \
	run-god-v13 \
	run-god-v14 \
	run-pyg-v1 \
	run-sok-v1 \
	run-sok-v2 \
	run-sok-v3 \
	run-sok-v4 \
	run-sok-v5 \
	run-sok-v6 \
	run-sok-v7 \
	run-sok-v8 \
	run-sok-v9 \
	run-sok-v10

run-god-v1:
	"$(GODOT)" --path "$(GOD_V1_PATH)"

run-god-v2:
	"$(GODOT)" --path "$(GOD_V2_PATH)"

run-god-v3:
	"$(GODOT)" --path "$(GOD_V3_PATH)"

run-god-v4:
	"$(GODOT)" --path "$(GOD_V4_PATH)"

run-god-v5:
	"$(GODOT)" --path "$(GOD_V5_PATH)"

run-god-v6:
	"$(GODOT)" --path "$(GOD_V6_PATH)"

run-god-v7:
	"$(GODOT)" --path "$(GOD_V7_PATH)"

run-god-v8:
	"$(GODOT)" --path "$(GOD_V8_PATH)"

run-god-v9:
	"$(GODOT)" --path "$(GOD_V9_PATH)"

run-god-v10:
	"$(GODOT)" --path "$(GOD_V10_PATH)"

run-god-v11:
	"$(GODOT)" --path "$(GOD_V11_PATH)"

run-god-v12:
	"$(GODOT)" --path "$(GOD_V12_PATH)"

run-god-v13:
	"$(GODOT)" --path "$(GOD_V13_PATH)"

run-god-v14:
	"$(GODOT)" --path "$(GOD_V14_PATH)"

run-pyg-v1:
	cd "$(PYG_V1_PATH)" && if [ -x .venv/bin/python3 ]; then .venv/bin/python3 main.py; else python3 main.py; fi

run-sok-v1:
	mkdir -p "$(SOK_V1_PATH)/build"
	clang -std=c11 -O2 -Wall -Wextra -fobjc-arc "$(SOK_V1_PATH)/main.m" -o "$(SOK_V1_APP)" -framework Cocoa -framework QuartzCore -framework Metal -framework MetalKit
	"$(SOK_V1_APP)"

run-sok-v2:
	mkdir -p "$(SOK_V2_PATH)/build"
	clang -std=c11 -O2 -Wall -Wextra -fobjc-arc -I"$(SOK_V1_PATH)" "$(SOK_V2_PATH)/main.m" -o "$(SOK_V2_APP)" -framework Cocoa -framework QuartzCore -framework Metal -framework MetalKit
	"$(SOK_V2_APP)"

run-sok-v3:
	python3 "$(SOK_V3_PATH)/tools/preprocess_runtime.py"
	mkdir -p "$(SOK_V3_PATH)/build"
	clang -std=c11 -O2 -Wall -Wextra -fobjc-arc -I"$(SOK_V1_PATH)" "$(SOK_V3_PATH)/main.m" -o "$(SOK_V3_APP)" -framework Cocoa -framework QuartzCore -framework Metal -framework MetalKit
	"$(SOK_V3_APP)"

run-sok-v4:
	$(MAKE) -C "$(SOK_V4_PATH)" run

run-sok-v5:
	$(MAKE) -C "$(SOK_V5_PATH)" run

run-sok-v6:
	$(MAKE) -C "$(SOK_V6_PATH)" run

run-sok-v7:
	$(MAKE) -C "$(SOK_V7_PATH)" run

run-sok-v8:
	$(MAKE) -C "$(SOK_V8_PATH)" run

run-sok-v9:
	$(MAKE) -C "$(SOK_V9_PATH)" run

run-sok-v10:
	$(MAKE) -C "$(SOK_V10_PATH)" run
