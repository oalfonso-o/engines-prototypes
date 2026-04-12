using System.Numerics;

namespace Canuter.Gameplay.Tests.Prototype3D;

public sealed class HeadingLockedMovementModel3DTests
{
    [Fact]
    public void HeadingUsesSharedSensitivityFormula()
    {
        var rotation = HeadingLockedMovementModel3D.UpdateHeadingRotation(0.0f, -10.0f, 0.0035f);

        Assert.Equal(-0.035f, rotation, 6);
    }

    [Fact]
    public void ForwardMovementUsesHeadingSpace()
    {
        var velocity = HeadingLockedMovementModel3D.CalculateVelocity(
            currentVelocity: Vector2.Zero,
            movementInput: new Vector2(0.0f, -1.0f),
            forward: Vector2.UnitY,
            deltaSeconds: 0.1,
            moveSpeed: PlayerRuntimeTuning.Prototype3DMoveSpeed);

        Assert.Equal(new Vector2(0.0f, PlayerRuntimeTuning.Prototype3DMoveAcceleration * 0.1f), velocity);
    }

    [Fact]
    public void PositiveStrafeInputMovesTowardScreenRightForDefaultForward()
    {
        var velocity = HeadingLockedMovementModel3D.CalculateVelocity(
            currentVelocity: Vector2.Zero,
            movementInput: new Vector2(1.0f, 0.0f),
            forward: Vector2.UnitY,
            deltaSeconds: 0.1,
            moveSpeed: PlayerRuntimeTuning.Prototype3DMoveSpeed);

        Assert.Equal(new Vector2(-PlayerRuntimeTuning.Prototype3DMoveAcceleration * 0.1f, 0.0f), velocity);
    }

    [Fact]
    public void StrafeReversalCrossesThroughZeroQuickly()
    {
        var firstFrame = HeadingLockedMovementModel3D.CalculateVelocity(
            currentVelocity: new Vector2(-PlayerRuntimeTuning.Prototype3DMoveSpeed, 0.0f),
            movementInput: new Vector2(-1.0f, 0.0f),
            forward: Vector2.UnitY,
            deltaSeconds: 0.1,
            moveSpeed: PlayerRuntimeTuning.Prototype3DMoveSpeed);
        var secondFrame = HeadingLockedMovementModel3D.CalculateVelocity(
            currentVelocity: firstFrame,
            movementInput: new Vector2(-1.0f, 0.0f),
            forward: Vector2.UnitY,
            deltaSeconds: 0.1,
            moveSpeed: PlayerRuntimeTuning.Prototype3DMoveSpeed);

        Assert.True(firstFrame.X > -0.001f);
        Assert.True(secondFrame.X > 0.0f);
    }

    [Fact]
    public void VelocityIsBoundedByPrototypeMoveSpeed()
    {
        var velocity = HeadingLockedMovementModel3D.CalculateVelocity(
            currentVelocity: new Vector2(50.0f, 50.0f),
            movementInput: new Vector2(0.0f, 0.0f),
            forward: Vector2.UnitY,
            deltaSeconds: 2.0,
            moveSpeed: PlayerRuntimeTuning.Prototype3DMoveSpeed);

        Assert.True(velocity.Length() < 0.001f);
    }
}
