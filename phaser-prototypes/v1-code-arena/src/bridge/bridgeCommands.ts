import type { SupportedLocale } from "../app/routing/appState";
import type { PrototypeSettings } from "../settings/prototypeSettings";

export type EditorPreviewState =
  | { kind: "hidden" }
  | { kind: "ambient-grid" };

export interface ShowIntroCommand {
  type: "showIntro";
}

export interface ShowMainMenuCommand {
  type: "showMainMenu";
}

export interface StartCampaignCommand {
  type: "startCampaign";
}

export interface ResumeCampaignCommand {
  type: "resumeCampaign";
}

export interface ReturnToMainMenuCommand {
  type: "returnToMainMenu";
}

export interface ShowEditorCommand {
  type: "showEditor";
}

export interface SetLocaleCommand {
  type: "setLocale";
  locale: SupportedLocale;
}

export interface SetPauseOverlayVisibleCommand {
  type: "setPauseOverlayVisible";
  visible: boolean;
}

export interface SetEditorPreviewStateCommand {
  type: "setEditorPreviewState";
  state: EditorPreviewState;
}

export interface SetPrototypeSettingsCommand {
  type: "setPrototypeSettings";
  settings: PrototypeSettings;
}

export type GameCommand =
  | ShowIntroCommand
  | ShowMainMenuCommand
  | StartCampaignCommand
  | ResumeCampaignCommand
  | ReturnToMainMenuCommand
  | ShowEditorCommand
  | SetLocaleCommand
  | SetPauseOverlayVisibleCommand
  | SetEditorPreviewStateCommand
  | SetPrototypeSettingsCommand;
