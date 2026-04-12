using Godot;

namespace Canuter
{
    public sealed class GameSettingsStore
    {
        private const string SettingsPath = "user://runtime_settings.cfg";
        private const string GameplaySection = "gameplay";
        private const string HeadingSensitivityKey = "heading_locked_turn_sensitivity";
        private const string Prototype3DMoveSpeedKey = "prototype_3d_move_speed";
        private const string Prototype3DCameraPitchDegreesKey = "prototype_3d_camera_pitch_degrees";

        public void LoadInto(GameSettings settings)
        {
            var config = new ConfigFile();
            var error = config.Load(SettingsPath);
            if (error != Error.Ok)
            {
                return;
            }

            if (config.HasSectionKey(GameplaySection, HeadingSensitivityKey))
            {
                settings.SetHeadingLockedTurnSensitivity((float)(double)config.GetValue(
                    GameplaySection,
                    HeadingSensitivityKey,
                    (double)PlayerRuntimeTuning.HeadingLockedMouseRadiansPerPixel));
            }

            if (config.HasSectionKey(GameplaySection, Prototype3DMoveSpeedKey))
            {
                settings.SetPrototype3DMoveSpeed((float)(double)config.GetValue(
                    GameplaySection,
                    Prototype3DMoveSpeedKey,
                    (double)PlayerRuntimeTuning.Prototype3DMoveSpeed));
            }

            if (config.HasSectionKey(GameplaySection, Prototype3DCameraPitchDegreesKey))
            {
                settings.SetPrototype3DCameraPitchDegrees((float)(double)config.GetValue(
                    GameplaySection,
                    Prototype3DCameraPitchDegreesKey,
                    (double)PlayerRuntimeTuning.Prototype3DCameraPitchDegrees));
            }
        }

        public void Save(GameSettings settings)
        {
            var config = new ConfigFile();
            config.SetValue(GameplaySection, HeadingSensitivityKey, settings.HeadingLockedTurnSensitivity);
            config.SetValue(GameplaySection, Prototype3DMoveSpeedKey, settings.Prototype3DMoveSpeed);
            config.SetValue(GameplaySection, Prototype3DCameraPitchDegreesKey, settings.Prototype3DCameraPitchDegrees);
            config.Save(SettingsPath);
        }

        public static string GetGlobalSettingsPath()
        {
            return ProjectSettings.GlobalizePath(SettingsPath);
        }
    }
}
