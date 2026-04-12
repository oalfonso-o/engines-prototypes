using Godot;

namespace Canuter
{
    public sealed class GameSettingsStore
    {
        private const string SettingsPath = "user://runtime_settings.cfg";
        private const string GameplaySection = "gameplay";
        private const string MetaSection = "meta";
        private const string SchemaVersionKey = "schema_version";
        private const int CurrentSchemaVersion = 2;
        private const string HeadingSensitivityKey = "heading_locked_turn_sensitivity";
        private const string Prototype3DMoveSpeedKey = "prototype_3d_move_speed";
        private const string Prototype3DGravityKey = "prototype_3d_gravity";
        private const string Prototype3DJumpVelocityKey = "prototype_3d_jump_velocity";
        private const string Prototype3DCameraOrbitDistanceKey = "prototype_3d_camera_orbit_distance";
        private const string Prototype3DCameraZoomRailPitchDegreesKey = "prototype_3d_camera_zoom_rail_pitch_degrees";
        private const string Prototype3DCameraMinOrbitDistanceKey = "prototype_3d_camera_min_orbit_distance";
        private const string Prototype3DCameraMaxOrbitDistanceKey = "prototype_3d_camera_max_orbit_distance";
        private const string Prototype3DCameraZoomStepKey = "prototype_3d_camera_zoom_step";
        private const string Prototype3DCameraLookAheadDistanceKey = "prototype_3d_camera_look_ahead_distance";
        private const string Prototype3DCameraFovKey = "prototype_3d_camera_fov";
        private const string PersistentImpactMarkersEnabledKey = "persistent_impact_markers_enabled";

        public void LoadInto(GameSettings settings)
        {
            var config = new ConfigFile();
            var error = config.Load(SettingsPath);
            if (error != Error.Ok)
            {
                Save(settings);
                return;
            }

            var schemaVersion = (int)(long)config.GetValue(MetaSection, SchemaVersionKey, 0L);
            if (schemaVersion != CurrentSchemaVersion)
            {
                DirAccess.RemoveAbsolute(GetGlobalSettingsPath());
                Save(settings);
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

            if (config.HasSectionKey(GameplaySection, Prototype3DCameraMinOrbitDistanceKey))
            {
                settings.SetPrototype3DCameraMinOrbitDistance((float)(double)config.GetValue(
                    GameplaySection,
                    Prototype3DCameraMinOrbitDistanceKey,
                    (double)PlayerRuntimeTuning.Prototype3DCameraMinOrbitDistance));
            }

            if (config.HasSectionKey(GameplaySection, Prototype3DCameraMaxOrbitDistanceKey))
            {
                settings.SetPrototype3DCameraMaxOrbitDistance((float)(double)config.GetValue(
                    GameplaySection,
                    Prototype3DCameraMaxOrbitDistanceKey,
                    (double)PlayerRuntimeTuning.Prototype3DCameraMaxOrbitDistance));
            }

            if (config.HasSectionKey(GameplaySection, Prototype3DCameraOrbitDistanceKey))
            {
                settings.SetPrototype3DCameraOrbitDistance((float)(double)config.GetValue(
                    GameplaySection,
                    Prototype3DCameraOrbitDistanceKey,
                    (double)PlayerRuntimeTuning.Prototype3DCameraOrbitDistance));
            }

            if (config.HasSectionKey(GameplaySection, Prototype3DCameraZoomRailPitchDegreesKey))
            {
                settings.SetPrototype3DCameraZoomRailPitchDegrees((float)(double)config.GetValue(
                    GameplaySection,
                    Prototype3DCameraZoomRailPitchDegreesKey,
                    (double)PlayerRuntimeTuning.Prototype3DCameraZoomRailPitchDegrees));
            }

            if (config.HasSectionKey(GameplaySection, Prototype3DCameraZoomStepKey))
            {
                settings.SetPrototype3DCameraZoomStep((float)(double)config.GetValue(
                    GameplaySection,
                    Prototype3DCameraZoomStepKey,
                    (double)PlayerRuntimeTuning.Prototype3DCameraZoomStep));
            }

            if (config.HasSectionKey(GameplaySection, Prototype3DCameraLookAheadDistanceKey))
            {
                settings.SetPrototype3DCameraLookAheadDistance((float)(double)config.GetValue(
                    GameplaySection,
                    Prototype3DCameraLookAheadDistanceKey,
                    (double)PlayerRuntimeTuning.Prototype3DCameraLookAheadDistance));
            }

            if (config.HasSectionKey(GameplaySection, Prototype3DCameraFovKey))
            {
                settings.SetPrototype3DCameraFov((float)(double)config.GetValue(
                    GameplaySection,
                    Prototype3DCameraFovKey,
                    (double)PlayerRuntimeTuning.Prototype3DCameraFov));
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
            config.SetValue(MetaSection, SchemaVersionKey, CurrentSchemaVersion);
            config.SetValue(GameplaySection, HeadingSensitivityKey, settings.HeadingLockedTurnSensitivity);
            config.SetValue(GameplaySection, Prototype3DMoveSpeedKey, settings.Prototype3DMoveSpeed);
            config.SetValue(GameplaySection, Prototype3DGravityKey, settings.Prototype3DGravity);
            config.SetValue(GameplaySection, Prototype3DJumpVelocityKey, settings.Prototype3DJumpVelocity);
            config.SetValue(GameplaySection, Prototype3DCameraOrbitDistanceKey, settings.Prototype3DCameraOrbitDistance);
            config.SetValue(GameplaySection, Prototype3DCameraZoomRailPitchDegreesKey, settings.Prototype3DCameraZoomRailPitchDegrees);
            config.SetValue(GameplaySection, Prototype3DCameraMinOrbitDistanceKey, settings.Prototype3DCameraMinOrbitDistance);
            config.SetValue(GameplaySection, Prototype3DCameraMaxOrbitDistanceKey, settings.Prototype3DCameraMaxOrbitDistance);
            config.SetValue(GameplaySection, Prototype3DCameraZoomStepKey, settings.Prototype3DCameraZoomStep);
            config.SetValue(GameplaySection, Prototype3DCameraLookAheadDistanceKey, settings.Prototype3DCameraLookAheadDistance);
            config.SetValue(GameplaySection, Prototype3DCameraFovKey, settings.Prototype3DCameraFov);
            config.SetValue(GameplaySection, PersistentImpactMarkersEnabledKey, settings.PersistentImpactMarkersEnabled);
            config.Save(SettingsPath);
        }

        public static string GetGlobalSettingsPath()
        {
            return ProjectSettings.GlobalizePath(SettingsPath);
        }
    }
}
