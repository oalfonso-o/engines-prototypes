namespace Canuter
{
    public sealed class GameSettings
    {
        public PlayerViewMode ViewMode { get; private set; } = PlayerViewMode.TopDownFixed;

        public void SetViewMode(PlayerViewMode viewMode)
        {
            ViewMode = viewMode;
        }
    }
}
