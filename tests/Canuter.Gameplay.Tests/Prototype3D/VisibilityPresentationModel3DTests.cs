namespace Canuter.Gameplay.Tests.Prototype3D;

public sealed class VisibilityPresentationModel3DTests
{
    [Fact]
    public void RearHemisphereIsAlwaysReadable()
    {
        var state = VisibilityPresentationModel3D.Classify(
            isInFrontHemisphere: false,
            passesVisibilityChecks: false);

        Assert.Equal(VisibilityPresentationState3D.RearReadable, state);
    }

    [Fact]
    public void FrontHemisphereUsesVisibilityChecks()
    {
        Assert.Equal(
            VisibilityPresentationState3D.FrontVisible,
            VisibilityPresentationModel3D.Classify(true, true));
        Assert.Equal(
            VisibilityPresentationState3D.FrontHiddenKnown,
            VisibilityPresentationModel3D.Classify(true, false));
    }
}
