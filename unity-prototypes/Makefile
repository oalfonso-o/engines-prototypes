empty :=
space := $(empty) $(empty)

UNITY_VERSION ?= 6000.0.73f1
UNITY_ARCH ?= arm64
UNITY_HUB ?= /Applications/Unity$(space)Hub.app/Contents/MacOS/Unity$(space)Hub
UNITY_EDITOR ?= /Applications/Unity/Hub/Editor/$(UNITY_VERSION)/Unity.app/Contents/MacOS/Unity

UNITY_V1_PATH := $(CURDIR)/v1-code-arena
UNITY_V1_BOOTSTRAP_METHOD := Canuter.UnityV1.Editor.ProjectBootstrap.EnsureProjectReady
UNITY_V1_BUILD_METHOD := Canuter.UnityV1.Editor.ProjectBootstrap.BuildMacPlayer
UNITY_V1_BUILD_APP := $(UNITY_V1_PATH)/Builds/Mac/CanuterUnityV1.app

.PHONY: doctor check-editor bootstrap-v1 open-v1 run-v1 build-v1 play-v1

doctor:
	@echo "Unity Hub path: $(UNITY_HUB)"
	@if [ -x "$(UNITY_HUB)" ]; then echo "Unity Hub: ok"; else echo "Unity Hub: missing"; fi
	@echo "Unity Editor path: $(UNITY_EDITOR)"
	@if [ -x "$(UNITY_EDITOR)" ]; then echo "Unity Editor: ok"; else echo "Unity Editor: missing"; fi
	@echo "Expected editor version: $(UNITY_VERSION)"
	@echo "Expected architecture: $(UNITY_ARCH)"

check-editor:
	@test -x "$(UNITY_EDITOR)" || { \
		echo "Unity Editor not found at $(UNITY_EDITOR)"; \
		echo "Install Unity $(UNITY_VERSION) ($(UNITY_ARCH)) and rerun."; \
		exit 1; \
	}

bootstrap-v1: check-editor
	"$(UNITY_EDITOR)" -quit -batchmode -projectPath "$(UNITY_V1_PATH)" -executeMethod "$(UNITY_V1_BOOTSTRAP_METHOD)" -logFile -

open-v1: check-editor
	"$(UNITY_EDITOR)" -projectPath "$(UNITY_V1_PATH)"

run-v1:
	$(MAKE) bootstrap-v1
	$(MAKE) open-v1

build-v1: check-editor
	"$(UNITY_EDITOR)" -quit -batchmode -projectPath "$(UNITY_V1_PATH)" -executeMethod "$(UNITY_V1_BUILD_METHOD)" -logFile -

play-v1:
	$(MAKE) build-v1
	open "$(UNITY_V1_BUILD_APP)"
