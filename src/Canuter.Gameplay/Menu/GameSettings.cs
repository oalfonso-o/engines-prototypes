namespace Canuter
{
    public sealed class GameSettings
    {
        public const float MinHeadingLockedTurnSensitivity = 0.001f;
        public const float MaxHeadingLockedTurnSensitivity = 0.02f;

        public PlayerViewMode ViewMode { get; private set; } = PlayerViewMode.TopDownFixed;
        public float HeadingLockedTurnSensitivity { get; private set; } = PlayerRuntimeTuning.HeadingLockedMouseRadiansPerPixel;

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
    }
}
