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

    [Fact]
    public void DefaultsToCurrentPrototype3DMoveSpeed()
    {
        var settings = new GameSettings();

        Assert.Equal(PlayerRuntimeTuning.Prototype3DMoveSpeed, settings.Prototype3DMoveSpeed, 6);
    }

    [Fact]
    public void Prototype3DMoveSpeedIsClamped()
    {
        var settings = new GameSettings();

        settings.SetPrototype3DMoveSpeed(1000.0f);
        Assert.Equal(GameSettings.MaxPrototype3DMoveSpeed, settings.Prototype3DMoveSpeed, 6);

        settings.SetPrototype3DMoveSpeed(0.1f);
        Assert.Equal(GameSettings.MinPrototype3DMoveSpeed, settings.Prototype3DMoveSpeed, 6);
    }

    [Fact]
    public void DefaultsToCurrentPrototype3DCameraPitch()
    {
        var settings = new GameSettings();

        Assert.Equal(PlayerRuntimeTuning.Prototype3DCameraPitchDegrees, settings.Prototype3DCameraPitchDegrees, 6);
    }

    [Fact]
    public void Prototype3DCameraPitchIsClamped()
    {
        var settings = new GameSettings();

        settings.SetPrototype3DCameraPitchDegrees(120.0f);
        Assert.Equal(GameSettings.MaxPrototype3DCameraPitchDegrees, settings.Prototype3DCameraPitchDegrees, 6);

        settings.SetPrototype3DCameraPitchDegrees(-5.0f);
        Assert.Equal(GameSettings.MinPrototype3DCameraPitchDegrees, settings.Prototype3DCameraPitchDegrees, 6);
    }
}
