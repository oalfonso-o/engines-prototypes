GODOT ?= /Applications/Godot_mono.app/Contents/MacOS/Godot
V2_ISO3D_PATH := godot-prototypes/v2-iso3d
V2_ISO3D_TEST := res://tests/integration_runner.gd
V3_ISO3D_PATH := godot-prototypes/v3-iso3d-targeting
V3_ISO3D_TEST := res://tests/integration_runner.gd
V4_ISO3D_PATH := godot-prototypes/v4-iso3d-moba-like
V4_ISO3D_TEST := res://tests/integration_runner.gd
V5_CHARACTER_PATH := godot-prototypes/v5-character-prototype
V5_CHARACTER_TEST := res://tests/integration_runner.gd
V6_CHARACTER_PATH := godot-prototypes/v6-character-prototype
V6_CHARACTER_TEST := res://tests/runner.gd
V7_FPS_PATH := godot-prototypes/v7-fps-prototype
V7_FPS_TEST := res://tests/runner.gd
V8_FPS_PATH := godot-prototypes/v8-fps-prototype
V8_FPS_GUT_CONFIG := res://.gutconfig.json
V8_FPS_BUILD_DIR := build/v8-fps/mac
V8_FPS_MAC_APP := $(V8_FPS_BUILD_DIR)/canuter-v8-fps.app
V9_SPACE_PATH := godot-prototypes/v9-space-survival-prototype
V9_SPACE_GUT_CONFIG := res://.gutconfig.json
V10_WALL_LAB_PATH := godot-prototypes/v10-doom-wall-lab

.PHONY: help edit-v2-iso3d run-v2-iso3d test-v2-iso3d edit-v3-iso3d run-v3-iso3d test-v3-iso3d edit-v4-iso3d run-v4-iso3d test-v4-iso3d edit-v5-character run-v5-character test-v5-character edit-v6-character run-v6-character test-v6-character edit-v7-fps run-v7-fps test-v7-fps edit-v8-fps run-v8-fps test-v8-fps run-built-v8-fps-mac edit-v9-space run-v9-space test-v9-space edit-v10-wall-lab run-v10-wall-lab

help:
	@printf "Available targets:\n"
	@printf "  make edit-v2-iso3d  Open v2-iso3d in the Godot editor\n"
	@printf "  make run-v2-iso3d   Run the v2-iso3d prototype\n"
	@printf "  make test-v2-iso3d  Run the v2-iso3d headless integration check\n"
	@printf "  make edit-v3-iso3d  Open v3-iso3d-targeting in the Godot editor\n"
	@printf "  make run-v3-iso3d   Run the v3-iso3d-targeting prototype\n"
	@printf "  make test-v3-iso3d  Run the v3-iso3d-targeting headless integration check\n"
	@printf "  make edit-v4-iso3d  Open v4-iso3d-moba-like in the Godot editor\n"
	@printf "  make run-v4-iso3d   Run the v4-iso3d-moba-like prototype\n"
	@printf "  make test-v4-iso3d  Run the v4-iso3d-moba-like headless integration check\n"
	@printf "  make edit-v5-character  Open the v5-character-prototype sandbox in the Godot editor\n"
	@printf "  make run-v5-character   Run the v5-character-prototype sandbox\n"
	@printf "  make test-v5-character  Run the v5-character-prototype headless integration check\n"
	@printf "  make edit-v6-character  Open the v6-character-prototype sandbox in the Godot editor\n"
	@printf "  make run-v6-character   Run the v6-character-prototype sandbox\n"
	@printf "  make test-v6-character  Run the v6-character-prototype headless integration check\n"
	@printf "  make edit-v7-fps        Open the v7-fps-prototype sandbox in the Godot editor\n"
	@printf "  make run-v7-fps         Run the v7-fps-prototype sandbox\n"
	@printf "  make test-v7-fps        Run the v7-fps-prototype headless integration check\n"
	@printf "  make edit-v8-fps        Open the v8-fps-prototype sandbox in the Godot editor\n"
	@printf "  make run-v8-fps         Run the v8-fps-prototype sandbox\n"
	@printf "  make test-v8-fps        Run the v8-fps-prototype GUT suite headlessly\n"
	@printf "  make run-built-v8-fps-mac  Export the v8-fps-prototype macOS app and open it locally\n"
	@printf "  make edit-v9-space      Open the v9-space-survival-prototype in the Godot editor\n"
	@printf "  make run-v9-space       Run the v9-space-survival-prototype\n"
	@printf "  make test-v9-space      Run the v9-space-survival-prototype GUT suite headlessly\n"
	@printf "  make edit-v10-wall-lab  Open the v10-doom-wall-lab in the Godot editor\n"
	@printf "  make run-v10-wall-lab   Run the v10-doom-wall-lab comparison scene\n"

edit-v2-iso3d:
	"$(GODOT)" --path "$(V2_ISO3D_PATH)" -e

run-v2-iso3d:
	"$(GODOT)" --path "$(V2_ISO3D_PATH)"

test-v2-iso3d:
	"$(GODOT)" --headless --path "$(V2_ISO3D_PATH)" --script "$(V2_ISO3D_TEST)"

edit-v3-iso3d:
	"$(GODOT)" --path "$(V3_ISO3D_PATH)" -e

run-v3-iso3d:
	"$(GODOT)" --path "$(V3_ISO3D_PATH)"

test-v3-iso3d:
	"$(GODOT)" --headless --path "$(V3_ISO3D_PATH)" --script "$(V3_ISO3D_TEST)"

edit-v4-iso3d:
	"$(GODOT)" --path "$(V4_ISO3D_PATH)" -e

run-v4-iso3d:
	"$(GODOT)" --path "$(V4_ISO3D_PATH)"

test-v4-iso3d:
	"$(GODOT)" --headless --path "$(V4_ISO3D_PATH)" --script "$(V4_ISO3D_TEST)"

edit-v5-character:
	"$(GODOT)" --path "$(V5_CHARACTER_PATH)" -e

run-v5-character:
	"$(GODOT)" --path "$(V5_CHARACTER_PATH)"

test-v5-character:
	"$(GODOT)" --headless --path "$(V5_CHARACTER_PATH)" --script "$(V5_CHARACTER_TEST)"

edit-v6-character:
	"$(GODOT)" --path "$(V6_CHARACTER_PATH)" -e

run-v6-character:
	"$(GODOT)" --path "$(V6_CHARACTER_PATH)"

test-v6-character:
	"$(GODOT)" --headless --path "$(V6_CHARACTER_PATH)" --script "$(V6_CHARACTER_TEST)"

edit-v7-fps:
	"$(GODOT)" --path "$(V7_FPS_PATH)" -e

run-v7-fps:
	"$(GODOT)" --path "$(V7_FPS_PATH)"

test-v7-fps:
	"$(GODOT)" --headless --path "$(V7_FPS_PATH)" --script "$(V7_FPS_TEST)"

edit-v8-fps:
	"$(GODOT)" --path "$(V8_FPS_PATH)" -e

run-v8-fps:
	"$(GODOT)" --path "$(V8_FPS_PATH)"

test-v8-fps:
	"$(GODOT)" --headless --path "$(V8_FPS_PATH)" --import --quit-after 1
	"$(GODOT)" --headless -d --path "$(V8_FPS_PATH)" -s addons/gut/gut_cmdln.gd -gconfig="$(V8_FPS_GUT_CONFIG)" -gexit

run-built-v8-fps-mac:
	mkdir -p "$(V8_FPS_BUILD_DIR)"
	"$(GODOT)" --headless --path "$(V8_FPS_PATH)" --import --quit-after 1
	"$(GODOT)" --headless --path "$(V8_FPS_PATH)" --export-release "macOS" "$(V8_FPS_MAC_APP)"
	open "$(V8_FPS_MAC_APP)"

edit-v9-space:
	"$(GODOT)" --path "$(V9_SPACE_PATH)" -e

run-v9-space:
	"$(GODOT)" --path "$(V9_SPACE_PATH)"

test-v9-space:
	"$(GODOT)" --headless --path "$(V9_SPACE_PATH)" --import --quit-after 1
	"$(GODOT)" --headless -d --path "$(V9_SPACE_PATH)" -s addons/gut/gut_cmdln.gd -gconfig="$(V9_SPACE_GUT_CONFIG)" -gexit

edit-v10-wall-lab:
	"$(GODOT)" --path "$(V10_WALL_LAB_PATH)" -e

run-v10-wall-lab:
	"$(GODOT)" --path "$(V10_WALL_LAB_PATH)"
