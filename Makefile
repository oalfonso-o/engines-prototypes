PHASER_V1_DIR := phaser-prototypes/v1-code-arena

.PHONY: \
	install-phaser-v1 \
	run-phaser-v1 \
	build-phaser-v1

install-phaser-v1:
	cd "$(PHASER_V1_DIR)" && npm install

run-phaser-v1:
	cd "$(PHASER_V1_DIR)" && npm run dev

build-phaser-v1:
	cd "$(PHASER_V1_DIR)" && npm run build
