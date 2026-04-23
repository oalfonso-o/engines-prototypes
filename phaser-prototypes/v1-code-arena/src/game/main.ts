import * as Phaser from "phaser";
import type { i18n as I18nInstance } from "i18next";
import type { GameRuntimeHandle } from "../bridge/GameBridge";
import type { GameCommand } from "../bridge/bridgeCommands";
import { AudioService } from "./audio/AudioService";
import type { SupportedLocale } from "../app/routing/appState";
import type { EditorPreviewScene } from "./scenes/EditorPreviewScene";
import { BootScene } from "./scenes/BootScene";
import { CampaignScene } from "./scenes/CampaignScene";
import { EditorPreviewScene as EditorPreviewSceneClass } from "./scenes/EditorPreviewScene";
import { IntroScene } from "./scenes/IntroScene";
import { MenuBackgroundScene } from "./scenes/MenuBackgroundScene";
import { SCENE_KEYS } from "./scenes/sceneKeys";
import type { PrototypeSettings } from "../settings/prototypeSettings";
import type { GameBridge } from "../bridge/GameBridge";
import { GameTranslator } from "./i18n/GameTranslator";
import type { RuntimeContentCatalog } from "./content/runtimeContent";
import { resetRuntimeDebugState, setRuntimeDebugState } from "./runtimeDebug";
import { ActionExecutor } from "./runtime/ActionExecutor";
import { SceneRuntimeController } from "./runtime/SceneRuntimeController";

export interface CreatedGameRuntime {
  game: Phaser.Game;
  destroy(): void;
}

class GameRuntime implements GameRuntimeHandle {
  readonly game: Phaser.Game;
  private readonly audio: AudioService;
  private readonly introScene: IntroScene;
  private readonly menuScene: MenuBackgroundScene;
  private readonly campaignScene: CampaignScene;
  private readonly editorScene: EditorPreviewSceneClass;
  private bootReady = false;
  private readonly queuedCommands: GameCommand[] = [];
  private currentLocale: SupportedLocale;
  private readonly sceneRuntimeController: SceneRuntimeController;
  private readonly actionExecutor: ActionExecutor;

  constructor(
    parent: HTMLElement,
    settings: PrototypeSettings,
    runtimeContent: RuntimeContentCatalog,
    bridge: GameBridge,
    i18n: I18nInstance,
    initialLocale: SupportedLocale,
  ) {
    const translator = new GameTranslator(i18n);
    this.sceneRuntimeController = new SceneRuntimeController(runtimeContent);
    this.actionExecutor = new ActionExecutor(this.sceneRuntimeController);
    const bootScene = new BootScene(runtimeContent.textures, runtimeContent.animations, () => this.handleBootReady());
    this.introScene = new IntroScene(bridge, settings.intro);
    this.menuScene = new MenuBackgroundScene(settings);
    this.campaignScene = new CampaignScene(
      settings,
      this.sceneRuntimeController.getCurrentScene(),
      bridge,
      translator,
      (actionId) => this.handleRuntimeAction(actionId),
    );
    this.editorScene = new EditorPreviewSceneClass(translator);
    this.currentLocale = initialLocale;

    resetRuntimeDebugState();
    setRuntimeDebugState({
      gameId: this.sceneRuntimeController.getGameId(),
      sceneId: null,
      entryPointId: null,
      phase: "booting",
      surface: null,
      phaserSceneKey: SCENE_KEYS.boot,
    });

    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: settings.world.view_width,
      height: settings.world.view_height,
      backgroundColor: settings.world.background_color,
      pixelArt: true,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: settings.player.movement.gravity_y },
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [bootScene, this.introScene, this.menuScene, this.campaignScene, this.editorScene],
    });

    this.audio = new AudioService(this.game, settings.audio);
  }

  handleCommand(command: GameCommand): void {
    if (!this.bootReady) {
      this.queuedCommands.push(command);
      return;
    }

    switch (command.type) {
      case "showIntro":
        this.stopNonPersistentScenes();
        this.game.scene.start(SCENE_KEYS.intro);
        setRuntimeDebugState({
          phase: "running",
          surface: "intro",
          phaserSceneKey: SCENE_KEYS.intro,
          sceneId: null,
          entryPointId: null,
        });
        return;
      case "showMainMenu":
        this.stopScene(SCENE_KEYS.intro);
        this.stopScene(SCENE_KEYS.campaign);
        this.stopScene(SCENE_KEYS.editorPreview);
        this.audio.restoreMusic();
        this.audio.playMusic("music.menu");
        this.game.scene.start(SCENE_KEYS.menuBackground);
        setRuntimeDebugState({
          phase: "running",
          surface: "main_menu",
          phaserSceneKey: SCENE_KEYS.menuBackground,
          sceneId: null,
          entryPointId: null,
        });
        return;
      case "startCampaign":
        this.stopScene(SCENE_KEYS.intro);
        this.stopScene(SCENE_KEYS.menuBackground);
        this.stopScene(SCENE_KEYS.editorPreview);
        this.audio.restoreMusic();
        this.audio.playMusic("music.campaign");
        this.campaignScene.applyRuntimeScene(this.sceneRuntimeController.resetToEntryScene());
        this.game.scene.start(SCENE_KEYS.campaign);
        const runtimeScene = this.sceneRuntimeController.getCurrentScene();
        setRuntimeDebugState({
          phase: "running",
          surface: "campaign",
          phaserSceneKey: SCENE_KEYS.campaign,
          sceneId: runtimeScene.sceneId,
          entryPointId: runtimeScene.entryPointId,
        });
        return;
      case "resumeCampaign":
        if (this.game.scene.isPaused(SCENE_KEYS.campaign)) {
          this.game.scene.resume(SCENE_KEYS.campaign);
        }
        this.audio.restoreMusic();
        return;
      case "returnToMainMenu":
        this.stopScene(SCENE_KEYS.campaign);
        this.audio.restoreMusic();
        this.handleCommand({ type: "showMainMenu" });
        return;
      case "showEditor":
        this.stopScene(SCENE_KEYS.intro);
        this.stopScene(SCENE_KEYS.menuBackground);
        this.stopScene(SCENE_KEYS.campaign);
        this.audio.restoreMusic();
        this.audio.playMusic("music.menu");
        this.game.scene.start(SCENE_KEYS.editorPreview);
        setRuntimeDebugState({
          phase: "running",
          surface: "editor",
          phaserSceneKey: SCENE_KEYS.editorPreview,
          sceneId: null,
          entryPointId: null,
        });
        return;
      case "setLocale":
        this.currentLocale = command.locale;
        if (this.game.scene.isActive(SCENE_KEYS.editorPreview)) {
          this.getEditorPreviewScene()?.refreshLocale();
        }
        return;
      case "setPauseOverlayVisible":
        if (
          !this.game.scene.isActive(SCENE_KEYS.campaign)
          && !this.game.scene.isPaused(SCENE_KEYS.campaign)
        ) {
          return;
        }

        if (command.visible) {
          if (!this.game.scene.isPaused(SCENE_KEYS.campaign)) {
            this.game.scene.pause(SCENE_KEYS.campaign);
          }
          this.audio.duckMusic();
          return;
        }

        if (this.game.scene.isPaused(SCENE_KEYS.campaign)) {
          this.game.scene.resume(SCENE_KEYS.campaign);
        }
        this.audio.restoreMusic();
        return;
      case "setEditorPreviewState":
        this.getEditorPreviewScene()?.setPreviewState(command.state);
        return;
      case "setPrototypeSettings":
        this.applyPrototypeSettings(command.settings);
        return;
    }
  }

  destroy(): void {
    resetRuntimeDebugState();
    this.game.destroy(true);
  }

  private handleBootReady(): void {
    this.bootReady = true;
    setRuntimeDebugState({
      gameId: this.sceneRuntimeController.getGameId(),
      phase: "running",
      phaserSceneKey: SCENE_KEYS.boot,
    });
    this.queuedCommands.splice(0).forEach((command) => this.handleCommand(command));
    this.handleCommand({ type: "setLocale", locale: this.currentLocale });
  }

  private applyPrototypeSettings(settings: PrototypeSettings): void {
    this.audio.applySettings(settings.audio);
    this.game.scale.resize(settings.world.view_width, settings.world.view_height);
    this.game.canvas.style.backgroundColor = settings.world.background_color;

    this.introScene.applySettings(settings.intro);
    this.menuScene.applySettings(settings);
    this.campaignScene.applySettings(settings);
    this.editorScene.applySettings();
  }

  private stopNonPersistentScenes(): void {
    this.stopScene(SCENE_KEYS.menuBackground);
    this.stopScene(SCENE_KEYS.campaign);
    this.stopScene(SCENE_KEYS.editorPreview);
  }

  private stopScene(sceneKey: string): void {
    if (this.game.scene.isActive(sceneKey) || this.game.scene.isPaused(sceneKey)) {
      this.game.scene.stop(sceneKey);
    }
  }

  private getEditorPreviewScene(): EditorPreviewScene | null {
    const scene = this.game.scene.getScene(SCENE_KEYS.editorPreview);
    return scene instanceof EditorPreviewSceneClass ? scene : null;
  }

  private handleRuntimeAction(actionId: string): void {
    const transition = this.actionExecutor.execute(actionId);
    if (!transition) {
      return;
    }

    setRuntimeDebugState({
      phase: "transitioning",
      surface: "campaign",
      phaserSceneKey: SCENE_KEYS.campaign,
      sceneId: transition.scene.sceneId,
      entryPointId: transition.entryPointId,
    });
    this.campaignScene.applyRuntimeScene(
      transition.scene,
      transition.transitionStyle,
      () => {
        setRuntimeDebugState({
          phase: "running",
          surface: "campaign",
          phaserSceneKey: SCENE_KEYS.campaign,
          sceneId: transition.scene.sceneId,
          entryPointId: transition.entryPointId,
        });
      },
    );
  }
}

export function createGameRuntime(
  parent: HTMLElement,
  settings: PrototypeSettings,
  runtimeContent: RuntimeContentCatalog,
  bridge: GameBridge,
  i18n: I18nInstance,
  locale: SupportedLocale,
): CreatedGameRuntime {
  const runtime = new GameRuntime(parent, settings, runtimeContent, bridge, i18n, locale);
  bridge.attachRuntime(runtime);
  return {
    game: runtime.game,
    destroy: () => runtime.destroy(),
  };
}
