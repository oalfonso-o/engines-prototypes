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
