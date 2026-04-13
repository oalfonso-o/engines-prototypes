namespace Canuter.Gameplay.Tests.Menu;

public sealed class GameSettingsTests
{
    [Fact]
    public void DefaultsToCurrentHeadingLockedTurnSensitivity()
    {
        var settings = new GameSettings();

        Assert.Equal(0.001f, settings.HeadingLockedTurnSensitivity, 6);
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

        Assert.Equal(20.0f, settings.Prototype3DMoveSpeed, 6);
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

        Assert.Equal(50.0f, settings.Prototype3DGravity, 6);
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

        Assert.Equal(20.0f, settings.Prototype3DJumpVelocity, 6);
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
    public void DefaultsToCurrentPrototype3DCameraSettings()
    {
        var settings = new GameSettings();

        Assert.Equal(PlayerRuntimeTuning.Prototype3DCameraOrbitDistance, settings.Prototype3DCameraOrbitDistance, 6);
        Assert.Equal(PlayerRuntimeTuning.Prototype3DCameraMinOrbitDistance, settings.Prototype3DCameraMinOrbitDistance, 6);
        Assert.Equal(PlayerRuntimeTuning.Prototype3DCameraMaxOrbitDistance, settings.Prototype3DCameraMaxOrbitDistance, 6);
        Assert.Equal(PlayerRuntimeTuning.Prototype3DCameraZoomRailPitchDegrees, settings.Prototype3DCameraZoomRailPitchDegrees, 6);
        Assert.Equal(PlayerRuntimeTuning.Prototype3DCameraZoomStep, settings.Prototype3DCameraZoomStep, 6);
        Assert.Equal(PlayerRuntimeTuning.Prototype3DCameraLookAheadDistance, settings.Prototype3DCameraLookAheadDistance, 6);
        Assert.Equal(PlayerRuntimeTuning.Prototype3DCameraFov, settings.Prototype3DCameraFov, 6);
    }

    [Fact]
    public void Prototype3DCameraOrbitDistanceIsClampedIntoCurrentRange()
    {
        var settings = new GameSettings();

        settings.SetPrototype3DCameraOrbitDistance(1000.0f);
        Assert.Equal(PlayerRuntimeTuning.Prototype3DCameraMaxOrbitDistance, settings.Prototype3DCameraOrbitDistance, 6);

        settings.SetPrototype3DCameraOrbitDistance(-1.0f);
        Assert.Equal(PlayerRuntimeTuning.Prototype3DCameraMinOrbitDistance, settings.Prototype3DCameraOrbitDistance, 6);
    }

    [Fact]
    public void Prototype3DCameraMinAndMaxDistancesStayOrdered()
    {
        var settings = new GameSettings();

        settings.SetPrototype3DCameraMinOrbitDistance(25.0f);
        settings.SetPrototype3DCameraMaxOrbitDistance(10.0f);

        Assert.Equal(10.0f, settings.Prototype3DCameraMinOrbitDistance, 6);
        Assert.Equal(10.0f, settings.Prototype3DCameraMaxOrbitDistance, 6);
        Assert.Equal(10.0f, settings.Prototype3DCameraOrbitDistance, 6);
    }

    [Fact]
    public void Prototype3DCameraOtherSettingsAreClamped()
    {
        var settings = new GameSettings();

        settings.SetPrototype3DCameraZoomRailPitchDegrees(1000.0f);
        settings.SetPrototype3DCameraZoomStep(0.01f);
        settings.SetPrototype3DCameraLookAheadDistance(1000.0f);
        settings.SetPrototype3DCameraFov(1000.0f);

        Assert.Equal(GameSettings.MaxPrototype3DCameraZoomRailPitchDegrees, settings.Prototype3DCameraZoomRailPitchDegrees, 6);
        Assert.Equal(GameSettings.MinPrototype3DCameraZoomStep, settings.Prototype3DCameraZoomStep, 6);
        Assert.Equal(GameSettings.MaxPrototype3DCameraLookAheadDistance, settings.Prototype3DCameraLookAheadDistance, 6);
        Assert.Equal(GameSettings.MaxPrototype3DCameraFov, settings.Prototype3DCameraFov, 6);
    }

    [Fact]
    public void PersistentImpactMarkersDefaultsToDisabledAndCanBeEnabled()
    {
        var settings = new GameSettings();

        Assert.True(settings.PersistentImpactMarkersEnabled);

        settings.SetPersistentImpactMarkersEnabled(false);

        Assert.False(settings.PersistentImpactMarkersEnabled);
    }
}
