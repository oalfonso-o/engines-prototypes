using Godot;

namespace Canuter
{
    public sealed class GameSettingsStore
    {
        private const string SettingsPath = "user://runtime_settings.cfg";
        private const string GameplaySection = "gameplay";
        private const string HeadingSensitivityKey = "heading_locked_turn_sensitivity";
        private const string Prototype3DMoveSpeedKey = "prototype_3d_move_speed";
        private const string Prototype3DGravityKey = "prototype_3d_gravity";
        private const string Prototype3DJumpVelocityKey = "prototype_3d_jump_velocity";
        private const string PersistentImpactMarkersEnabledKey = "persistent_impact_markers_enabled";

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

            if (config.HasSectionKey(GameplaySection, Prototype3DGravityKey))
            {
                settings.SetPrototype3DGravity((float)(double)config.GetValue(
                    GameplaySection,
                    Prototype3DGravityKey,
                    (double)PlayerRuntimeTuning.Prototype3DGravity));
            }

            if (config.HasSectionKey(GameplaySection, Prototype3DJumpVelocityKey))
            {
                settings.SetPrototype3DJumpVelocity((float)(double)config.GetValue(
                    GameplaySection,
                    Prototype3DJumpVelocityKey,
                    (double)PlayerRuntimeTuning.Prototype3DJumpVelocity));
            }

            if (config.HasSectionKey(GameplaySection, PersistentImpactMarkersEnabledKey))
            {
                settings.SetPersistentImpactMarkersEnabled((bool)config.GetValue(
                    GameplaySection,
                    PersistentImpactMarkersEnabledKey,
                    false));
            }
        }

        public void Save(GameSettings settings)
        {
            var config = new ConfigFile();
            config.SetValue(GameplaySection, HeadingSensitivityKey, settings.HeadingLockedTurnSensitivity);
            config.SetValue(GameplaySection, Prototype3DMoveSpeedKey, settings.Prototype3DMoveSpeed);
            config.SetValue(GameplaySection, Prototype3DGravityKey, settings.Prototype3DGravity);
            config.SetValue(GameplaySection, Prototype3DJumpVelocityKey, settings.Prototype3DJumpVelocity);
            config.SetValue(GameplaySection, PersistentImpactMarkersEnabledKey, settings.PersistentImpactMarkersEnabled);
            config.Save(SettingsPath);
        }

        public static string GetGlobalSettingsPath()
        {
            return ProjectSettings.GlobalizePath(SettingsPath);
        }
    }
}
