PYTHON ?= python3

SVG_ASSET_ID ?= char_base_gearbox_01
SVG_BASE_ROOT := game-assets/source/generated/svg

.PHONY: help install-tools test-gameplay test-godot-integration render-svg-south-idle render-svg-south-move preview-svg-south-move sheet-svg-south-move validate-svg-south

GODOT_BIN ?= /Applications/Godot_mono.app/Contents/MacOS/Godot

help:
	@echo "Targets:"
	@echo "  make install-tools        Install Python dependencies for the current SVG pipeline"
	@echo "  make test-gameplay        Run the C# gameplay characterization tests"
	@echo "  make test-godot-integration Run the Godot headless integration checks for the default 3D runtime"
	@echo "  make render-svg-south-idle Rasterize the south idle SVG base to PNG"
	@echo "  make render-svg-south-move Rasterize the south move SVG sequence to PNG"
	@echo "  make preview-svg-south-move Build an animated GIF preview from south move PNGs"
	@echo "  make sheet-svg-south-move Build a PNG spritesheet + JSON metadata from south move PNGs"
	@echo "  make validate-svg-south   Render south idle/move, build the move preview GIF and spritesheet"

install-tools:
	$(PYTHON) -m pip install -r tools/requirements.txt

test-gameplay:
	dotnet test tests/Canuter.Gameplay.Tests/Canuter.Gameplay.Tests.csproj

test-godot-integration:
	dotnet build godot/canuter.csproj
	"$(GODOT_BIN)" --headless --path godot --script res://tests/integration_runner_3d.gd

render-svg-south-idle:
	$(PYTHON) tools/render_svg_sequence.py $(SVG_BASE_ROOT)/raw/$(SVG_ASSET_ID)/idle/south $(SVG_BASE_ROOT)/rendered/$(SVG_ASSET_ID)/idle/south

render-svg-south-move:
	$(PYTHON) tools/render_svg_sequence.py $(SVG_BASE_ROOT)/raw/$(SVG_ASSET_ID)/move/south $(SVG_BASE_ROOT)/rendered/$(SVG_ASSET_ID)/move/south

preview-svg-south-move: render-svg-south-move
	$(PYTHON) tools/build_svg_preview.py $(SVG_BASE_ROOT)/rendered/$(SVG_ASSET_ID)/move/south $(SVG_BASE_ROOT)/previews/$(SVG_ASSET_ID)/move_south.gif --duration 180 --scale 2

sheet-svg-south-move: render-svg-south-move
	$(PYTHON) tools/build_png_spritesheet.py $(SVG_BASE_ROOT)/rendered/$(SVG_ASSET_ID)/move/south $(SVG_BASE_ROOT)/sheets/$(SVG_ASSET_ID)/move_south.png $(SVG_BASE_ROOT)/sheets/$(SVG_ASSET_ID)/move_south.json --fps 6

validate-svg-south: render-svg-south-idle preview-svg-south-move sheet-svg-south-move
