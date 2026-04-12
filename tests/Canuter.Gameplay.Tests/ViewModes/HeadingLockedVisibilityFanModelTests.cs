using System.Numerics;

namespace Canuter.Gameplay.Tests.ViewModes;

public sealed class HeadingLockedVisibilityFanModelTests
{
    [Fact]
    public void RaySamplesCoverWholeFieldOfViewIncludingCenter()
    {
        var samples = HeadingLockedVisibilityFanModel.CreateRaySamples(5, MathF.PI);

        Assert.Equal(-MathF.PI * 0.5f, samples[0].RelativeAngle, 5);
        Assert.Equal(0.0f, samples[2].RelativeAngle, 5);
        Assert.Equal(MathF.PI * 0.5f, samples[4].RelativeAngle, 5);
        Assert.Equal(Vector2.UnitY, samples[2].LocalDirection, new Vector2Comparer(0.0001f));
    }

    [Fact]
    public void LocalDirectionsRotateSymmetricallyAroundForward()
    {
        var left = HeadingLockedVisibilityFanModel.LocalDirectionFromRelativeAngle(MathF.PI * 0.25f);
        var right = HeadingLockedVisibilityFanModel.LocalDirectionFromRelativeAngle(-MathF.PI * 0.25f);

        Assert.Equal(left.X, -right.X, 4);
        Assert.Equal(left.Y, right.Y, 4);
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
