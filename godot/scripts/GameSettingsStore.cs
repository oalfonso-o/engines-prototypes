using Godot;

namespace Canuter
{
    public sealed class GameSettingsStore
    {
        private const string SettingsPath = "user://runtime_settings.cfg";
        private const string GameplaySection = "gameplay";
        private const string ViewModeKey = "view_mode";
        private const string HeadingSensitivityKey = "heading_locked_turn_sensitivity";

        public void LoadInto(GameSettings settings)
        {
            var config = new ConfigFile();
            var error = config.Load(SettingsPath);
            if (error != Error.Ok)
            {
                return;
            }

            if (config.HasSectionKey(GameplaySection, ViewModeKey))
            {
                settings.SetViewMode((PlayerViewMode)(int)config.GetValue(GameplaySection, ViewModeKey, (int)PlayerViewMode.TopDownFixed));
            }

            if (config.HasSectionKey(GameplaySection, HeadingSensitivityKey))
            {
                settings.SetHeadingLockedTurnSensitivity((float)(double)config.GetValue(
                    GameplaySection,
                    HeadingSensitivityKey,
                    (double)PlayerRuntimeTuning.HeadingLockedMouseRadiansPerPixel));
            }
        }

        public void Save(GameSettings settings)
        {
            var config = new ConfigFile();
            config.SetValue(GameplaySection, ViewModeKey, (int)settings.ViewMode);
            config.SetValue(GameplaySection, HeadingSensitivityKey, settings.HeadingLockedTurnSensitivity);
            config.Save(SettingsPath);
        }

        public static string GetGlobalSettingsPath()
        {
            return ProjectSettings.GlobalizePath(SettingsPath);
        }
    }
}
