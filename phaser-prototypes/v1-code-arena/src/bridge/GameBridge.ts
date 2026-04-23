import type { GameCommand } from "./bridgeCommands";
import type { EditorPreviewState } from "./bridgeCommands";
import type { SupportedLocale } from "../app/routing/appState";
import type { GameEvent, GameEventMap } from "./bridgeEvents";
import type { PrototypeSettings } from "../settings/prototypeSettings";

export interface GameRuntimeHandle {
  handleCommand(command: GameCommand): void;
}

type EventListener<TEvent extends GameEvent> = (event: TEvent) => void;

export class GameBridge {
  private runtime: GameRuntimeHandle | null = null;
  private readonly pendingCommands: GameCommand[] = [];
  private readonly listeners: Record<keyof GameEventMap, Set<(event: GameEvent) => void>> = {
    introCompleted: new Set(),
    campaignPauseRequested: new Set(),
    mainMenuRequested: new Set(),
    editorExitRequested: new Set(),
  };

  attachRuntime(runtime: GameRuntimeHandle): void {
    this.runtime = runtime;
    this.pendingCommands.splice(0).forEach((command) => runtime.handleCommand(command));
  }

  showIntro(): void {
    this.dispatch({ type: "showIntro" });
  }

  showMainMenu(): void {
    this.dispatch({ type: "showMainMenu" });
  }

  startCampaign(): void {
    this.dispatch({ type: "startCampaign" });
  }

  resumeCampaign(): void {
    this.dispatch({ type: "resumeCampaign" });
  }

  returnToMainMenu(): void {
    this.dispatch({ type: "returnToMainMenu" });
  }

  showEditor(): void {
    this.dispatch({ type: "showEditor" });
  }

  setLocale(locale: SupportedLocale): void {
    this.dispatch({ type: "setLocale", locale });
  }

  setPauseOverlayVisible(visible: boolean): void {
    this.dispatch({ type: "setPauseOverlayVisible", visible });
  }

  setEditorPreviewState(state: EditorPreviewState): void {
    this.dispatch({ type: "setEditorPreviewState", state });
  }

  setPrototypeSettings(settings: PrototypeSettings): void {
    this.dispatch({ type: "setPrototypeSettings", settings });
  }

  on<TEventName extends keyof GameEventMap>(
    eventName: TEventName,
    listener: EventListener<GameEventMap[TEventName]>,
  ): () => void {
    this.listeners[eventName].add(listener as (event: GameEvent) => void);
    return () => {
      this.listeners[eventName].delete(listener as (event: GameEvent) => void);
    };
  }

  emit<TEventName extends keyof GameEventMap>(eventName: TEventName, event: GameEventMap[TEventName]): void {
    this.listeners[eventName].forEach((listener) => {
      listener(event);
    });
  }

  private dispatch(command: GameCommand): void {
    if (!this.runtime) {
      this.pendingCommands.push(command);
      return;
    }

    this.runtime.handleCommand(command);
  }
}
