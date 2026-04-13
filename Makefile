GODOT ?= /Applications/Godot_mono.app/Contents/MacOS/Godot
V2_ISO3D_PATH := godot-prototypes/v2-iso3d
V2_ISO3D_TEST := res://tests/integration_runner.gd

.PHONY: help edit-v2-iso3d run-v2-iso3d test-v2-iso3d

help:
	@printf "Available targets:\n"
	@printf "  make edit-v2-iso3d  Open v2-iso3d in the Godot editor\n"
	@printf "  make run-v2-iso3d   Run the v2-iso3d prototype\n"
	@printf "  make test-v2-iso3d  Run the v2-iso3d headless integration check\n"

edit-v2-iso3d:
	"$(GODOT)" --path "$(V2_ISO3D_PATH)" -e

run-v2-iso3d:
	"$(GODOT)" --path "$(V2_ISO3D_PATH)"

test-v2-iso3d:
	"$(GODOT)" --headless --path "$(V2_ISO3D_PATH)" --script "$(V2_ISO3D_TEST)"
