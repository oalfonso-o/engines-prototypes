namespace Canuter
{
    public sealed class GameSettings
    {
        public const float MinHeadingLockedTurnSensitivity = 0.001f;
        public const float MaxHeadingLockedTurnSensitivity = 0.02f;
        public const float MinPrototype3DMoveSpeed = 8.0f;
        public const float MaxPrototype3DMoveSpeed = 60.0f;
        public const float MinPrototype3DCameraPitchDegrees = 0.0f;
        public const float MaxPrototype3DCameraPitchDegrees = 90.0f;

        public PlayerViewMode ViewMode { get; private set; } = PlayerViewMode.TopDownFixed;
        public float HeadingLockedTurnSensitivity { get; private set; } = PlayerRuntimeTuning.HeadingLockedMouseRadiansPerPixel;
        public float Prototype3DMoveSpeed { get; private set; } = PlayerRuntimeTuning.Prototype3DMoveSpeed;
        public float Prototype3DCameraPitchDegrees { get; private set; } = PlayerRuntimeTuning.Prototype3DCameraPitchDegrees;

        public void SetViewMode(PlayerViewMode viewMode)
        {
            ViewMode = viewMode;
        }

        public void SetHeadingLockedTurnSensitivity(float sensitivity)
        {
            HeadingLockedTurnSensitivity = float.Clamp(
                sensitivity,
                MinHeadingLockedTurnSensitivity,
                MaxHeadingLockedTurnSensitivity);
        }

        public void SetPrototype3DMoveSpeed(float moveSpeed)
        {
            Prototype3DMoveSpeed = float.Clamp(
                moveSpeed,
                MinPrototype3DMoveSpeed,
                MaxPrototype3DMoveSpeed);
        }

        public void SetPrototype3DCameraPitchDegrees(float pitchDegrees)
        {
            Prototype3DCameraPitchDegrees = float.Clamp(
                pitchDegrees,
                MinPrototype3DCameraPitchDegrees,
                MaxPrototype3DCameraPitchDegrees);
        }
    }
}
