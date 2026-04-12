using System.Numerics;

namespace Canuter.Gameplay.Tests.Hud;

public sealed class MinimapProjectorTests
{
    [Fact]
    public void MarkerProjectsRelativeToViewportCenter()
    {
        var viewport = new CameraViewport(new Vector2(100.0f, 200.0f), new Vector2(50.0f, 25.0f));

        var projection = MinimapProjector.ProjectMarker(
            viewport,
            minimapCenter: new Vector2(300.0f, 100.0f),
            minimapRadius: 88.0f,
            targetWorldPosition: new Vector2(125.0f, 212.5f));

        Assert.NotNull(projection);
        Assert.Equal(new Vector2(330.8f, 130.8f), projection!.Value.MarkerPosition, new Vector2Comparer(0.001f));
    }

    [Fact]
    public void MarkerProjectsRelativeToPlayerUpWhenMinimapRotationMatchesCamera()
    {
        var viewport = new CameraViewport(Vector2.Zero, new Vector2(50.0f, 50.0f));

        var projection = MinimapProjector.ProjectMarker(
            viewport,
            minimapCenter: new Vector2(300.0f, 100.0f),
            minimapRadius: 88.0f,
            targetWorldPosition: new Vector2(0.0f, 25.0f),
            minimapRotation: MathF.PI);

        Assert.NotNull(projection);
        Assert.Equal(new Vector2(300.0f, 69.2f), projection!.Value.MarkerPosition, new Vector2Comparer(0.001f));
    }

    [Fact]
    public void MarkerOutsideViewportIsNotProjected()
    {
        var viewport = new CameraViewport(Vector2.Zero, new Vector2(50.0f, 50.0f));

        var projection = MinimapProjector.ProjectMarker(
            viewport,
            minimapCenter: Vector2.Zero,
            minimapRadius: 88.0f,
            targetWorldPosition: new Vector2(51.0f, 0.0f));

        Assert.Null(projection);
    }

    [Fact]
    public void OrientationMarkersRotateWithMinimapRotation()
    {
        var center = new Vector2(300.0f, 100.0f);
        const float radius = 88.0f;

        var northMarker = MinimapProjector.ProjectOrientationMarker(center, radius, MinimapOrientationMarker.North, MathF.PI);
        var eastMarker = MinimapProjector.ProjectOrientationMarker(center, radius, MinimapOrientationMarker.East, MathF.PI);
        var southMarker = MinimapProjector.ProjectOrientationMarker(center, radius, MinimapOrientationMarker.South, MathF.PI);
        var westMarker = MinimapProjector.ProjectOrientationMarker(center, radius, MinimapOrientationMarker.West, MathF.PI);

        Assert.Equal(new Vector2(300.0f, 188.0f), northMarker, new Vector2Comparer(0.001f));
        Assert.Equal(new Vector2(212.0f, 100.0f), eastMarker, new Vector2Comparer(0.001f));
        Assert.Equal(new Vector2(300.0f, 12.0f), southMarker, new Vector2Comparer(0.001f));
        Assert.Equal(new Vector2(388.0f, 100.0f), westMarker, new Vector2Comparer(0.001f));
    }

    [Fact]
    public void PlayerMarkerPointsInWorldForwardDirectionForNorthUpMinimap()
    {
        var center = new Vector2(300.0f, 100.0f);
        var marker = MinimapProjector.ProjectPlayerMarker(center, new Vector2(1.0f, 0.0f));

        Assert.Equal(new Vector2(310.0f, 100.0f), marker.Tip, new Vector2Comparer(0.001f));
        Assert.Equal(new Vector2(296.0f, 95.5f), marker.LeftBase, new Vector2Comparer(0.001f));
        Assert.Equal(new Vector2(296.0f, 104.5f), marker.RightBase, new Vector2Comparer(0.001f));
    }

    [Fact]
    public void PlayerMarkerStaysPointingUpWhenMinimapRotatesWithHeadingLockedCamera()
    {
        var center = new Vector2(300.0f, 100.0f);
        var marker = MinimapProjector.ProjectPlayerMarker(center, new Vector2(0.0f, 1.0f), MathF.PI);

        Assert.Equal(new Vector2(300.0f, 90.0f), marker.Tip, new Vector2Comparer(0.001f));
        Assert.Equal(new Vector2(295.5f, 104.0f), marker.LeftBase, new Vector2Comparer(0.001f));
        Assert.Equal(new Vector2(304.5f, 104.0f), marker.RightBase, new Vector2Comparer(0.001f));
    }

    [Fact]
    public void MarkerThatFallsOutsideMinimapCircleIsRejected()
    {
        var viewport = new CameraViewport(Vector2.Zero, new Vector2(1.0f, 1.0f));

        var projection = MinimapProjector.ProjectMarker(
            viewport,
            minimapCenter: Vector2.Zero,
            minimapRadius: 20.0f,
            targetWorldPosition: new Vector2(1.0f, 1.0f));

        Assert.Null(projection);
    }

    private sealed class Vector2Comparer(float tolerance) : IEqualityComparer<Vector2>
    {
        public bool Equals(Vector2 x, Vector2 y)
        {
            return MathF.Abs(x.X - y.X) <= tolerance && MathF.Abs(x.Y - y.Y) <= tolerance;
        }

        public int GetHashCode(Vector2 obj)
        {
            return HashCode.Combine(obj.X, obj.Y);
        }
    }
}
