import { useEffect, useMemo, useState } from "react";
import { stringify } from "yaml";
import { useTranslation } from "react-i18next";
import { PhaserHost } from "../game/shell/PhaserHost";
import { GameBridge } from "../bridge/GameBridge";
import { applyLocale } from "./i18n/i18n";
import type { AppScreen, SupportedLocale } from "./routing/appState";
import { getRuntimeSurface, isPauseOverlayVisible } from "./routing/appState";
import type { PrototypeSettings } from "../settings/prototypeSettings";
import { applyUiTheme } from "../settings/applyUiTheme";
import { MainMenuScreen } from "./screens/MainMenuScreen";
import { OptionsScreen } from "./screens/OptionsScreen";
import { PauseMenuScreen } from "./screens/PauseMenuScreen";
import { EditorScreen } from "./screens/EditorScreen";
import { DebugSettingsPanel } from "./debug/DebugSettingsPanel";
import type { RuntimeContentCatalog } from "../game/content/runtimeContent";

interface AppShellProps {
  settings: PrototypeSettings;
  runtimeContent: RuntimeContentCatalog;
  initialLocale: SupportedLocale;
}

export function AppShell({ settings, runtimeContent, initialLocale }: AppShellProps) {
  const bridge = useMemo(() => new GameBridge(), []);
  const { t } = useTranslation();
  const [screen, setScreen] = useState<AppScreen>("intro");
  const [locale, setLocale] = useState<SupportedLocale>(initialLocale);
  const [runtimeSettings, setRuntimeSettings] = useState<PrototypeSettings>(() => cloneSettings(settings));
  const [savedSettings, setSavedSettings] = useState<PrototypeSettings>(() => cloneSettings(settings));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveError, setSettingsSaveError] = useState<string | null>(null);
  const showDebugTools = import.meta.env.DEV;
  const settingsDirty = JSON.stringify(runtimeSettings) !== JSON.stringify(savedSettings);

  useEffect(() => {
    const unsubscribers = [
      bridge.on("introCompleted", () => setScreen("main_menu")),
      bridge.on("campaignPauseRequested", () => setScreen("campaign_pause")),
      bridge.on("mainMenuRequested", () => setScreen("main_menu")),
      bridge.on("editorExitRequested", () => setScreen("main_menu")),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [bridge]);

  const runtimeSurface = getRuntimeSurface(screen);
  useEffect(() => {
    switch (runtimeSurface) {
      case "intro":
        bridge.showIntro();
        return;
      case "main_menu":
        bridge.showMainMenu();
        return;
      case "campaign":
        bridge.startCampaign();
        return;
      case "editor":
        bridge.showEditor();
        return;
    }
  }, [bridge, runtimeSurface]);

  useEffect(() => {
    bridge.setPauseOverlayVisible(isPauseOverlayVisible(screen));
  }, [bridge, screen]);

  useEffect(() => {
    void applyLocale(locale).then(() => {
      bridge.setLocale(locale);
    });
  }, [bridge, locale]);

  useEffect(() => {
    bridge.setPrototypeSettings(runtimeSettings);
  }, [bridge, runtimeSettings]);

  useEffect(() => {
    applyUiTheme(runtimeSettings);
  }, [runtimeSettings]);

  useEffect(() => {
    if (screen !== "campaign_pause" && !settingsOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        if (settingsOpen) {
          setSettingsOpen(false);
          return;
        }

        if (screen === "campaign_pause") {
          setScreen("campaign");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [screen, settingsOpen]);

  const handleSaveSettings = async (): Promise<void> => {
    if (!showDebugTools) {
      return;
    }

    setIsSavingSettings(true);
    setSettingsSaveError(null);
    try {
      const response = await fetch("/__dev/settings", {
        method: "POST",
        headers: {
          "Content-Type": "text/yaml",
        },
        body: stringify(runtimeSettings),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to persist settings.yaml");
      }

      setSavedSettings(cloneSettings(runtimeSettings));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to persist settings.yaml";
      setSettingsSaveError(message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRevertSettings = (): void => {
    setRuntimeSettings(cloneSettings(savedSettings));
    setSettingsSaveError(null);
  };

  return (
    <div className={`app-shell screen-${screen}`}>
      <PhaserHost bridge={bridge} settings={runtimeSettings} runtimeContent={runtimeContent} locale={locale} />
      <div className="ui-root">
        {showDebugTools && (
          <div className="global-debug-ui">
            <button
              type="button"
              className="gear-button"
              aria-label={t("debug.gear_label")}
              title={t("debug.gear_label")}
              onClick={() => {
                setSettingsOpen((current) => !current);
                setSettingsSaveError(null);
              }}
            >
              ⚙
            </button>
            <DebugSettingsPanel
              isOpen={settingsOpen}
              settings={runtimeSettings}
              isDirty={settingsDirty}
              isSaving={isSavingSettings}
              saveError={settingsSaveError}
              onClose={() => setSettingsOpen(false)}
              onSave={() => {
                void handleSaveSettings();
              }}
              onRevert={handleRevertSettings}
              onSettingsChange={(nextSettings) => {
                setRuntimeSettings(nextSettings);
                setSettingsSaveError(null);
              }}
            />
          </div>
        )}

        {(screen === "main_menu" || screen === "options") && (
          <div className="menu-layer">
            {screen === "main_menu" ? (
              <MainMenuScreen
                onCampaign={() => setScreen("campaign")}
                onEditor={() => setScreen("editor")}
                onOptions={() => setScreen("options")}
              />
            ) : (
              <OptionsScreen
                locale={locale}
                onLocaleChange={setLocale}
                onBack={() => setScreen("main_menu")}
              />
            )}
          </div>
        )}

        {screen === "campaign_pause" && (
          <PauseMenuScreen
            onResume={() => {
              bridge.resumeCampaign();
              setScreen("campaign");
            }}
            onReturnToMainMenu={() => {
              bridge.returnToMainMenu();
              setScreen("main_menu");
            }}
          />
        )}

        {screen === "editor" && (
          <EditorScreen
            bridge={bridge}
            locale={locale}
            onReturnToMainMenu={() => {
              bridge.returnToMainMenu();
              setScreen("main_menu");
            }}
          />
        )}
      </div>
    </div>
  );
}

function cloneSettings(settings: PrototypeSettings): PrototypeSettings {
  return JSON.parse(JSON.stringify(settings)) as PrototypeSettings;
}
