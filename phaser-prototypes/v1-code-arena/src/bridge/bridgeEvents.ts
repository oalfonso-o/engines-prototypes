export interface IntroCompletedEvent {
  type: "introCompleted";
}

export interface CampaignPauseRequestedEvent {
  type: "campaignPauseRequested";
}

export interface MainMenuRequestedEvent {
  type: "mainMenuRequested";
}

export interface EditorExitRequestedEvent {
  type: "editorExitRequested";
}

export type GameEvent =
  | IntroCompletedEvent
  | CampaignPauseRequestedEvent
  | MainMenuRequestedEvent
  | EditorExitRequestedEvent;

export type GameEventMap = {
  introCompleted: IntroCompletedEvent;
  campaignPauseRequested: CampaignPauseRequestedEvent;
  mainMenuRequested: MainMenuRequestedEvent;
  editorExitRequested: EditorExitRequestedEvent;
};
