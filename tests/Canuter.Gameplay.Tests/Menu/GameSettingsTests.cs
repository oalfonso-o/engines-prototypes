namespace Canuter.Gameplay.Tests.Menu;

public sealed class GameSettingsTests
{
    [Fact]
    public void DefaultsToTopDownFixedViewMode()
    {
        var settings = new GameSettings();

        Assert.Equal(PlayerViewMode.TopDownFixed, settings.ViewMode);
    }

    [Fact]
    public void CanSwitchToHeadingLockedViewMode()
    {
        var settings = new GameSettings();

        settings.SetViewMode(PlayerViewMode.HeadingLocked);

        Assert.Equal(PlayerViewMode.HeadingLocked, settings.ViewMode);
    }
}
