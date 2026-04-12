using System.Numerics;

namespace Canuter.Gameplay.Tests.Vision;

public sealed class CameraViewportModelTests
{
    [Fact]
    public void CameraViewportMatchesCurrentWorldHalfExtents()
    {
        var viewport = CameraViewportModel.Create(
            center: new Vector2(100.0f, 200.0f),
            viewportPixels: new Vector2(1280.0f, 720.0f),
            zoom: new Vector2(0.82f, 0.82f));

        Assert.Equal(new Vector2(780.4878f, 439.02438f), viewport.HalfWorldSize, new Vector2Comparer(0.001f));
    }

    [Fact]
    public void CameraViewportContainsPointsUsingAxisAlignedBounds()
    {
        var viewport = new CameraViewport(new Vector2(500.0f, 500.0f), new Vector2(100.0f, 50.0f));

        Assert.True(viewport.Contains(new Vector2(600.0f, 550.0f)));
        Assert.False(viewport.Contains(new Vector2(601.0f, 500.0f)));
        Assert.False(viewport.Contains(new Vector2(500.0f, 551.0f)));
    }

    [Fact]
    public void CameraViewportRadiusUsesHalfWorldDiagonal()
    {
        var viewport = new CameraViewport(Vector2.Zero, new Vector2(3.0f, 4.0f));

        Assert.Equal(5.0f, viewport.Radius, 6);
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
