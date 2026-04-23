PHASER_V1_DIR := phaser-prototypes/v1-code-arena

.PHONY: \
	run \
	resetseed

run:
	cd "$(PHASER_V1_DIR)" && npm run dev

resetseed:
	cd "$(PHASER_V1_DIR)" && npm run reset-editor-db
