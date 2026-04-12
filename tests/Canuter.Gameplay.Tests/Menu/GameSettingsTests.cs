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

    [Fact]
    public void DefaultsToCurrentHeadingLockedTurnSensitivity()
    {
        var settings = new GameSettings();

        Assert.Equal(PlayerRuntimeTuning.HeadingLockedMouseRadiansPerPixel, settings.HeadingLockedTurnSensitivity, 6);
    }

    [Fact]
    public void HeadingLockedTurnSensitivityIsClamped()
    {
        var settings = new GameSettings();

        settings.SetHeadingLockedTurnSensitivity(0.5f);
        Assert.Equal(GameSettings.MaxHeadingLockedTurnSensitivity, settings.HeadingLockedTurnSensitivity, 6);

        settings.SetHeadingLockedTurnSensitivity(0.0001f);
        Assert.Equal(GameSettings.MinHeadingLockedTurnSensitivity, settings.HeadingLockedTurnSensitivity, 6);
    }
}
