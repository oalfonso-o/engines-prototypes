namespace Canuter.Gameplay.Tests.Menu;

public sealed class PauseMenuStateTests
{
    [Fact]
    public void StartsClosed()
    {
        var settings = new GameSettings();
        var state = new PauseMenuState(settings);

        Assert.Equal(MenuScreen.Closed, state.CurrentScreen);
    }

    [Fact]
    public void EscapeOpensPauseMenuFromClosedState()
    {
        var state = new PauseMenuState(new GameSettings());

        state.TogglePause();

        Assert.Equal(MenuScreen.Pause, state.CurrentScreen);
    }

    [Fact]
    public void EscapeClosesPauseMenuWhenPauseScreenIsOpen()
    {
        var state = new PauseMenuState(new GameSettings());
        state.TogglePause();

        state.TogglePause();

        Assert.Equal(MenuScreen.Closed, state.CurrentScreen);
    }

    [Fact]
    public void CanOpenSettingsFromPauseScreen()
    {
        var state = new PauseMenuState(new GameSettings());
        state.TogglePause();

        state.OpenSettings();

        Assert.Equal(MenuScreen.Settings, state.CurrentScreen);
    }

    [Fact]
    public void OpeningSettingsWhileClosedDoesNothing()
    {
        var state = new PauseMenuState(new GameSettings());

        state.OpenSettings();

        Assert.Equal(MenuScreen.Closed, state.CurrentScreen);
    }

    [Fact]
    public void BackFromSettingsReturnsToPauseScreen()
    {
        var state = new PauseMenuState(new GameSettings());
        state.TogglePause();
        state.OpenSettings();

        state.GoBack();

        Assert.Equal(MenuScreen.Pause, state.CurrentScreen);
    }

    [Fact]
    public void SelectingViewModeInSettingsUpdatesSettings()
    {
        var settings = new GameSettings();
        var state = new PauseMenuState(settings);
        state.TogglePause();
        state.OpenSettings();

        state.SelectViewMode(PlayerViewMode.HeadingLocked);

        Assert.Equal(PlayerViewMode.HeadingLocked, settings.ViewMode);
        Assert.Equal(MenuScreen.Settings, state.CurrentScreen);
    }

    [Fact]
    public void SelectingViewModeOutsideSettingsDoesNothing()
    {
        var settings = new GameSettings();
        var state = new PauseMenuState(settings);

        state.SelectViewMode(PlayerViewMode.HeadingLocked);

        Assert.Equal(PlayerViewMode.TopDownFixed, settings.ViewMode);
        Assert.Equal(MenuScreen.Closed, state.CurrentScreen);
    }

    [Fact]
    public void EscapeClosesMenuEvenWhenSettingsScreenIsOpen()
    {
        var state = new PauseMenuState(new GameSettings());
        state.TogglePause();
        state.OpenSettings();

        state.TogglePause();

        Assert.Equal(MenuScreen.Closed, state.CurrentScreen);
    }
}
