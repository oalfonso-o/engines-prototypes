PYTHON ?= python3

GOOD_SPEC := game-assets/specs/characters/char_good_rifleman_01.spec.json
GOOD_ASSET_ID := char_good_rifleman_01
GOOD_ANIMATION ?= move
GOOD_DIRECTION ?= south
SVG_ASSET_ID ?= char_base_gearbox_01
SVG_BASE_ROOT := game-assets/source/generated/svg
SVG_DIRECTIONS := south southwest west northwest north northeast east southeast

.PHONY: help install-tools prompt-good plan-good generate-good-preview build-good-preview try-good render-svg-south-idle render-svg-south-move preview-svg-south-move sheet-svg-south-move validate-svg-south derive-svg-move-all render-svg-idle-all render-svg-move-all sheet-svg-idle-all sheet-svg-move-all build-svg-all

help:
	@echo "Targets:"
	@echo "  make install-tools        Install Python dependencies for the asset pipeline"
	@echo "  make prompt-good          Build prompt + plan + manifest for the first good character"
	@echo "  make plan-good            Print a dry-run of the image generation plan"
	@echo "  make generate-good-preview Generate a small preview set with OpenAI"
	@echo "  make build-good-preview   Build an Aseprite sheet for the preview frames"
	@echo "  make try-good             End-to-end first try: prompt + generate preview + build sheet"
	@echo "  make render-svg-south-idle Rasterize the south idle SVG base to PNG"
	@echo "  make render-svg-south-move Rasterize the south move SVG sequence to PNG"
	@echo "  make preview-svg-south-move Build an animated GIF preview from south move PNGs"
	@echo "  make sheet-svg-south-move Build a PNG spritesheet + JSON metadata from south move PNGs"
	@echo "  make validate-svg-south   Render south idle/move, build the move preview GIF and spritesheet"
	@echo "  make derive-svg-move-all  Derive the 8 move directions from the south canonical SVG frames"
	@echo "  make render-svg-idle-all  Rasterize idle SVG frames for all 8 directions"
	@echo "  make render-svg-move-all  Rasterize move SVG frames for all 8 directions"
	@echo "  make sheet-svg-idle-all   Build idle spritesheets + JSON for all 8 directions"
	@echo "  make sheet-svg-move-all   Build move spritesheets + JSON for all 8 directions"
	@echo "  make build-svg-all        Derive, render and sheet the full idle+move direction set"

install-tools:
	$(PYTHON) -m pip install -r tools/requirements.txt

prompt-good:
	$(PYTHON) tools/asset_prompt_builder.py $(GOOD_SPEC)

plan-good:
	$(PYTHON) tools/generate_images.py $(GOOD_SPEC) --animation $(GOOD_ANIMATION) --direction $(GOOD_DIRECTION) --limit 2 --dry-run

generate-good-preview: prompt-good
	$(PYTHON) tools/generate_images.py $(GOOD_SPEC) --animation $(GOOD_ANIMATION) --direction $(GOOD_DIRECTION) --limit 2

build-good-preview:
	$(PYTHON) tools/build_aseprite.py $(GOOD_SPEC) --animation $(GOOD_ANIMATION) --direction $(GOOD_DIRECTION)

try-good: generate-good-preview build-good-preview

render-svg-south-idle:
	$(PYTHON) tools/render_svg_sequence.py game-assets/source/generated/svg/raw/char_base_gearbox_01/idle/south game-assets/source/generated/svg/rendered/char_base_gearbox_01/idle/south

render-svg-south-move:
	$(PYTHON) tools/render_svg_sequence.py game-assets/source/generated/svg/raw/char_base_gearbox_01/move/south game-assets/source/generated/svg/rendered/char_base_gearbox_01/move/south

preview-svg-south-move: render-svg-south-move
	$(PYTHON) tools/build_svg_preview.py game-assets/source/generated/svg/rendered/char_base_gearbox_01/move/south game-assets/source/generated/svg/previews/char_base_gearbox_01/move_south.gif --duration 180 --scale 2

sheet-svg-south-move: render-svg-south-move
	$(PYTHON) tools/build_png_spritesheet.py game-assets/source/generated/svg/rendered/char_base_gearbox_01/move/south game-assets/source/generated/svg/sheets/char_base_gearbox_01/move_south.png game-assets/source/generated/svg/sheets/char_base_gearbox_01/move_south.json --fps 6

validate-svg-south: render-svg-south-idle preview-svg-south-move sheet-svg-south-move

derive-svg-move-all:
	$(PYTHON) tools/derive_svg_directions.py $(SVG_BASE_ROOT)/raw/$(SVG_ASSET_ID)/move south

render-svg-idle-all:
	@for dir in $(SVG_DIRECTIONS); do \
		$(PYTHON) tools/render_svg_sequence.py $(SVG_BASE_ROOT)/raw/$(SVG_ASSET_ID)/idle/$$dir $(SVG_BASE_ROOT)/rendered/$(SVG_ASSET_ID)/idle/$$dir || exit 1; \
	done

render-svg-move-all: derive-svg-move-all
	@for dir in $(SVG_DIRECTIONS); do \
		$(PYTHON) tools/render_svg_sequence.py $(SVG_BASE_ROOT)/raw/$(SVG_ASSET_ID)/move/$$dir $(SVG_BASE_ROOT)/rendered/$(SVG_ASSET_ID)/move/$$dir || exit 1; \
	done

sheet-svg-idle-all: render-svg-idle-all
	@for dir in $(SVG_DIRECTIONS); do \
		$(PYTHON) tools/build_png_spritesheet.py $(SVG_BASE_ROOT)/rendered/$(SVG_ASSET_ID)/idle/$$dir $(SVG_BASE_ROOT)/sheets/$(SVG_ASSET_ID)/idle_$$dir.png $(SVG_BASE_ROOT)/sheets/$(SVG_ASSET_ID)/idle_$$dir.json --fps 1 || exit 1; \
	done

sheet-svg-move-all: render-svg-move-all
	@for dir in $(SVG_DIRECTIONS); do \
		$(PYTHON) tools/build_png_spritesheet.py $(SVG_BASE_ROOT)/rendered/$(SVG_ASSET_ID)/move/$$dir $(SVG_BASE_ROOT)/sheets/$(SVG_ASSET_ID)/move_$$dir.png $(SVG_BASE_ROOT)/sheets/$(SVG_ASSET_ID)/move_$$dir.json --fps 6 || exit 1; \
	done

build-svg-all: sheet-svg-idle-all sheet-svg-move-all
