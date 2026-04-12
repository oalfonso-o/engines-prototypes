namespace Canuter.Gameplay.Tests.Menu;

public sealed class GameSettingsTests
{
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
    public void DefaultsToCurrentPrototype3DGravity()
    {
        var settings = new GameSettings();

        Assert.Equal(PlayerRuntimeTuning.Prototype3DGravity, settings.Prototype3DGravity, 6);
    }

    [Fact]
    public void Prototype3DGravityIsClamped()
    {
        var settings = new GameSettings();

        settings.SetPrototype3DGravity(120.0f);
        Assert.Equal(GameSettings.MaxPrototype3DGravity, settings.Prototype3DGravity, 6);

        settings.SetPrototype3DGravity(-5.0f);
        Assert.Equal(GameSettings.MinPrototype3DGravity, settings.Prototype3DGravity, 6);
    }

    [Fact]
    public void DefaultsToCurrentPrototype3DJumpVelocity()
    {
        var settings = new GameSettings();

        Assert.Equal(PlayerRuntimeTuning.Prototype3DJumpVelocity, settings.Prototype3DJumpVelocity, 6);
    }

    [Fact]
    public void Prototype3DJumpVelocityIsClamped()
    {
        var settings = new GameSettings();

        settings.SetPrototype3DJumpVelocity(1000.0f);
        Assert.Equal(GameSettings.MaxPrototype3DJumpVelocity, settings.Prototype3DJumpVelocity, 6);

        settings.SetPrototype3DJumpVelocity(0.1f);
        Assert.Equal(GameSettings.MinPrototype3DJumpVelocity, settings.Prototype3DJumpVelocity, 6);
    }

    [Fact]
    public void PersistentImpactMarkersDefaultsToDisabledAndCanBeEnabled()
    {
        var settings = new GameSettings();

        Assert.False(settings.PersistentImpactMarkersEnabled);

        settings.SetPersistentImpactMarkersEnabled(true);

        Assert.True(settings.PersistentImpactMarkersEnabled);
    }
}
