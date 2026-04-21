SOK_V1_PATH := v1-basic-fps-cube
SOK_V1_APP := $(SOK_V1_PATH)/build/v1-basic-fps-cube
SOK_V2_PATH := v2-fixed-camera-cube
SOK_V2_APP := $(SOK_V2_PATH)/build/v2-fixed-camera-cube
SOK_V3_PATH := v3-voxel-runtime-pipeline
SOK_V3_APP := $(SOK_V3_PATH)/build/v3-voxel-runtime-pipeline
SOK_V4_PATH := v4-single-cube-runtime
SOK_V5_PATH := v5-v3-map-v4-runtime
SOK_V6_PATH := v6-basic-particles
SOK_V7_PATH := v7-procedural-wall-textures
SOK_V8_PATH := v8-voxel-collision-runtime
SOK_V9_PATH := v9-v13-map-parity
SOK_V10_PATH := v10-voxel-ccw-culling-contract
SOK_V11_PATH := v11-wedge-visual-runtime
SOK_V12_PATH := v12-wedge-collision-runtime
SOK_V13_PATH := v13-wedge-collision-no-autostep-runtime
SOK_V14_PATH := v14-v10-settings-runtime

.PHONY: \
	run-v1 \
	run-v2 \
	run-v3 \
	run-v4 \
	run-v5 \
	run-v6 \
	run-v7 \
	run-v8 \
	run-v9 \
	run-v10 \
	run-v11 \
	run-v12 \
	run-v13 \
	run-v14

run-v1:
	mkdir -p "$(SOK_V1_PATH)/build"
	clang -std=c11 -O2 -Wall -Wextra -fobjc-arc "$(SOK_V1_PATH)/main.m" -o "$(SOK_V1_APP)" -framework Cocoa -framework QuartzCore -framework Metal -framework MetalKit
	"$(SOK_V1_APP)"

run-v2:
	mkdir -p "$(SOK_V2_PATH)/build"
	clang -std=c11 -O2 -Wall -Wextra -fobjc-arc -I"$(SOK_V1_PATH)" "$(SOK_V2_PATH)/main.m" -o "$(SOK_V2_APP)" -framework Cocoa -framework QuartzCore -framework Metal -framework MetalKit
	"$(SOK_V2_APP)"

run-v3:
	python3 "$(SOK_V3_PATH)/tools/preprocess_runtime.py"
	mkdir -p "$(SOK_V3_PATH)/build"
	clang -std=c11 -O2 -Wall -Wextra -fobjc-arc -I"$(SOK_V1_PATH)" "$(SOK_V3_PATH)/main.m" -o "$(SOK_V3_APP)" -framework Cocoa -framework QuartzCore -framework Metal -framework MetalKit
	"$(SOK_V3_APP)"

run-v4:
	$(MAKE) -C "$(SOK_V4_PATH)" run

run-v5:
	$(MAKE) -C "$(SOK_V5_PATH)" run

run-v6:
	$(MAKE) -C "$(SOK_V6_PATH)" run

run-v7:
	$(MAKE) -C "$(SOK_V7_PATH)" run

run-v8:
	$(MAKE) -C "$(SOK_V8_PATH)" run

run-v9:
	$(MAKE) -C "$(SOK_V9_PATH)" run

run-v10:
	$(MAKE) -C "$(SOK_V10_PATH)" run

run-v11:
	$(MAKE) -C "$(SOK_V11_PATH)" run

run-v12:
	$(MAKE) -C "$(SOK_V12_PATH)" run

run-v13:
	$(MAKE) -C "$(SOK_V13_PATH)" run

run-v14:
	$(MAKE) -C "$(SOK_V14_PATH)" run
