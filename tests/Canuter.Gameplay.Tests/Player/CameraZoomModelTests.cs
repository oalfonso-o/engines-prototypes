namespace Canuter.Gameplay.Tests.Player;

public sealed class CameraZoomModelTests
{
    [Fact]
    public void ZoomInClampsToCurrentMaximum()
    {
        var zoom = CameraZoomModel.ZoomIn(0.95f);

        Assert.Equal(PlayerRuntimeTuning.MaxZoom, zoom, 6);
    }

    [Fact]
    public void ZoomOutClampsToCurrentMinimum()
    {
        var zoom = CameraZoomModel.ZoomOut(0.35f);

        Assert.Equal(PlayerRuntimeTuning.MinZoom, zoom, 6);
    }

    [Fact]
    public void ZoomStepMatchesCurrentPrototypeIncrement()
    {
        var zoomIn = CameraZoomModel.ZoomIn(PlayerRuntimeTuning.DefaultZoom);
        var zoomOut = CameraZoomModel.ZoomOut(PlayerRuntimeTuning.DefaultZoom);

        Assert.Equal(0.92f, zoomIn, 6);
        Assert.Equal(0.72f, zoomOut, 6);
    }
}
