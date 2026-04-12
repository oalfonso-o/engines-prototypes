using System.Numerics;

namespace Canuter.Gameplay.Tests.Player;

public sealed class TopDownAimModelTests
{
    [Fact]
    public void AimDownKeepsSouthFacingRotationAtZero()
    {
        var result = TopDownAimModel.Update(Vector2.Zero, new Vector2(0.0f, 10.0f), Vector2.UnitY, 0.0f);

        Assert.True(result.Changed);
        Assert.Equal(new Vector2(0.0f, 1.0f), result.Direction);
        Assert.Equal(0.0f, result.Rotation, 6);
    }

    [Fact]
    public void AimRightProducesNegativeHalfPiRotation()
    {
        var result = TopDownAimModel.Update(Vector2.Zero, new Vector2(10.0f, 0.0f), Vector2.UnitY, 0.0f);

        Assert.Equal(new Vector2(1.0f, 0.0f), result.Direction);
        Assert.Equal(-MathF.PI / 2.0f, result.Rotation, 6);
    }

    [Fact]
    public void AimUpProducesPiRotationOffset()
    {
        var result = TopDownAimModel.Update(Vector2.Zero, new Vector2(0.0f, -10.0f), Vector2.UnitY, 0.0f);

        Assert.Equal(new Vector2(0.0f, -1.0f), result.Direction);
        Assert.Equal(-MathF.PI, result.Rotation, 6);
    }

    [Fact]
    public void AimLeftProducesPositiveHalfPiRotation()
    {
        var result = TopDownAimModel.Update(Vector2.Zero, new Vector2(-10.0f, 0.0f), Vector2.UnitY, 0.0f);

        Assert.Equal(new Vector2(-1.0f, 0.0f), result.Direction);
        Assert.Equal(MathF.PI / 2.0f, result.Rotation, 6);
    }

    [Fact]
    public void TinyAimVectorKeepsPreviousAimState()
    {
        var previousDirection = Vector2.Normalize(new Vector2(-2.0f, 5.0f));
        const float previousRotation = 0.73f;

        var result = TopDownAimModel.Update(Vector2.Zero, new Vector2(0.001f, 0.001f), previousDirection, previousRotation);

        Assert.False(result.Changed);
        Assert.Equal(previousDirection, result.Direction);
        Assert.Equal(previousRotation, result.Rotation, 6);
    }
}
