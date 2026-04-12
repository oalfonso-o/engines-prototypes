namespace Canuter.Gameplay.Tests.Prototype3D;

public sealed class PlayerBodyFadeModel3DTests
{
    [Fact]
    public void KeepsFullOpacityOutsideCloseZoomBand()
    {
        var opacity = PlayerBodyFadeModel3D.ComputeOpacity(
            orbitDistance: 12.0f,
            minOrbitDistance: 0.6f,
            maxOrbitDistance: 10.0f);

        Assert.Equal(1.0f, opacity, 6);
    }

    [Fact]
    public void ReachesTwentyPercentOpacityAtMinimumZoomDistance()
    {
        var opacity = PlayerBodyFadeModel3D.ComputeOpacity(
            orbitDistance: 0.6f,
            minOrbitDistance: 0.6f,
            maxOrbitDistance: 10.0f);

        Assert.Equal(0.2f, opacity, 6);
    }

    [Fact]
    public void InterpolatesOpacityAcrossCloseZoomBand()
    {
        var opacity = PlayerBodyFadeModel3D.ComputeOpacity(
            orbitDistance: 1.775f,
            minOrbitDistance: 0.6f,
            maxOrbitDistance: 10.0f);

        Assert.Equal(0.6f, opacity, 4);
    }
}
