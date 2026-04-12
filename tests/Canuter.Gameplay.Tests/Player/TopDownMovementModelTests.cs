using System.Numerics;

namespace Canuter.Gameplay.Tests.Player;

public sealed class TopDownMovementModelTests
{
    [Fact]
    public void MovementAcceleratesTowardTargetVelocity()
    {
        var velocity = TopDownMovementModel.CalculateVelocity(Vector2.Zero, new Vector2(1.0f, 0.0f), 0.1);

        Assert.Equal(new Vector2(300.0f, 0.0f), velocity);
    }

    [Fact]
    public void MovementSnapsToTargetWhenStepExceedsRemainingDistance()
    {
        var velocity = TopDownMovementModel.CalculateVelocity(new Vector2(650.0f, 0.0f), new Vector2(1.0f, 0.0f), 0.1);

        Assert.Equal(new Vector2(PlayerRuntimeTuning.MoveSpeed, 0.0f), velocity);
    }

    [Fact]
    public void MovementDeceleratesBackToZeroWithoutInput()
    {
        var velocity = TopDownMovementModel.CalculateVelocity(new Vector2(300.0f, 0.0f), Vector2.Zero, 0.01);

        Assert.Equal(new Vector2(160.0f, 0.0f), velocity);
    }

    [Fact]
    public void DiagonalInputUsesSameCurrentPrototypeTuning()
    {
        var input = Vector2.Normalize(new Vector2(1.0f, -1.0f));
        var velocity = TopDownMovementModel.CalculateVelocity(Vector2.Zero, input, 0.1);

        Assert.Equal(new Vector2(212.13203f, -212.13203f), velocity, new Vector2Comparer(0.0001f));
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
