namespace Canuter
{
    public enum MenuScreen
    {
        Closed,
        Pause,
        Settings,
    }

    public sealed class PauseMenuState
    {
        private readonly GameSettings _settings;

        public PauseMenuState(GameSettings settings)
        {
            _settings = settings;
        }

        public MenuScreen CurrentScreen { get; private set; } = MenuScreen.Closed;

        public void TogglePause()
        {
            CurrentScreen = CurrentScreen == MenuScreen.Closed
                ? MenuScreen.Pause
                : MenuScreen.Closed;
        }

        public void OpenSettings()
        {
            if (CurrentScreen != MenuScreen.Pause)
            {
                return;
            }

            CurrentScreen = MenuScreen.Settings;
        }

        public void GoBack()
        {
            if (CurrentScreen != MenuScreen.Settings)
            {
                return;
            }

            CurrentScreen = MenuScreen.Pause;
        }

        public void SelectViewMode(PlayerViewMode viewMode)
        {
            if (CurrentScreen != MenuScreen.Settings)
            {
                return;
            }

            _settings.SetViewMode(viewMode);
        }
    }
}
