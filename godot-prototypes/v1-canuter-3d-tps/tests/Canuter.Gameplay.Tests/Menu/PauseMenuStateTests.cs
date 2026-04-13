namespace Canuter.Gameplay.Tests.Menu;

public sealed class PauseMenuStateTests
{
    [Fact]
    public void StartsClosed()
    {
        var state = new PauseMenuState();

        Assert.Equal(MenuScreen.Closed, state.CurrentScreen);
    }

    [Fact]
    public void EscapeOpensPauseMenuFromClosedState()
    {
        var state = new PauseMenuState();

        state.TogglePause();

        Assert.Equal(MenuScreen.Pause, state.CurrentScreen);
    }

    [Fact]
    public void EscapeClosesPauseMenuWhenPauseScreenIsOpen()
    {
        var state = new PauseMenuState();
        state.TogglePause();

        state.TogglePause();

        Assert.Equal(MenuScreen.Closed, state.CurrentScreen);
    }

    [Fact]
    public void CanOpenSettingsFromPauseScreen()
    {
        var state = new PauseMenuState();
        state.TogglePause();

        state.OpenSettings();

        Assert.Equal(MenuScreen.Settings, state.CurrentScreen);
    }

    [Fact]
    public void OpeningSettingsWhileClosedDoesNothing()
    {
        var state = new PauseMenuState();

        state.OpenSettings();

        Assert.Equal(MenuScreen.Closed, state.CurrentScreen);
    }

    [Fact]
    public void BackFromSettingsReturnsToPauseScreen()
    {
        var state = new PauseMenuState();
        state.TogglePause();
        state.OpenSettings();

        state.GoBack();

        Assert.Equal(MenuScreen.Pause, state.CurrentScreen);
    }

    [Fact]
    public void EscapeClosesMenuEvenWhenSettingsScreenIsOpen()
    {
        var state = new PauseMenuState();
        state.TogglePause();
        state.OpenSettings();

        state.TogglePause();

        Assert.Equal(MenuScreen.Closed, state.CurrentScreen);
    }
}
