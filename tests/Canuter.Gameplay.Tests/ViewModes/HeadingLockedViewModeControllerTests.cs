using System.Numerics;

namespace Canuter.Gameplay.Tests.ViewModes;

public sealed class HeadingLockedViewModeControllerTests
{
    [Fact]
    public void ReportsHeadingLockedModeAndCapturedPointerPresentation()
    {
        IPlayerViewModeController controller = new HeadingLockedViewModeController();

        Assert.Equal(PlayerViewMode.HeadingLocked, controller.Mode);
        Assert.Equal(CursorCaptureMode.HiddenCaptured, controller.PointerPresentation.CursorCaptureMode);
        Assert.Equal(CrosshairMode.CenterForwardHint, controller.PointerPresentation.CrosshairMode);
        Assert.True(controller.PointerPresentation.UsesRelativeMouseInput);
    }

    [Fact]
    public void HorizontalMouseDeltaUpdatesHeadingAndCameraRotation()
    {
        var controller = new HeadingLockedViewModeController();

        var result = controller.Update(new PlayerViewFrameInput(
            ActorPosition: Vector2.Zero,
            CurrentVelocity: Vector2.Zero,
            MovementInput: Vector2.Zero,
            MouseWorldPosition: Vector2.Zero,
            CurrentAimDirection: Vector2.UnitY,
            CurrentAimRotation: 0.0f,
            DeltaSeconds: 0.016,
            MouseDelta: new Vector2(-10.0f, 5.0f)));

        var expectedRotation = -10.0f * PlayerRuntimeTuning.HeadingLockedMouseRadiansPerPixel;
        Assert.Equal(expectedRotation, result.AimRotation, 6);
        Assert.Equal(new Vector2(-MathF.Sin(expectedRotation), MathF.Cos(expectedRotation)), result.AimDirection, new Vector2Comparer(0.0001f));
        Assert.Equal(result.AimDirection, result.FireDirection, new Vector2Comparer(0.0001f));
        Assert.Equal(MathF.PI + expectedRotation, result.CameraRotation, 6);
        Assert.Equal(result.AimDirection * PlayerRuntimeTuning.HeadingLockedCameraLookAheadDistance, result.CameraFollowOffset, new Vector2Comparer(0.0001f));
        Assert.Equal(result.AimRotation, result.VisualRotation, 6);
        Assert.Equal(result.AimRotation, result.HurtboxRotation, 6);
    }

    [Fact]
    public void ForwardMovementUsesCurrentHeadingInsteadOfWorldUp()
    {
        var controller = new HeadingLockedViewModeController();

        var result = controller.Update(new PlayerViewFrameInput(
            ActorPosition: Vector2.Zero,
            CurrentVelocity: Vector2.Zero,
            MovementInput: new Vector2(0.0f, -1.0f),
            MouseWorldPosition: Vector2.Zero,
            CurrentAimDirection: Vector2.UnitY,
            CurrentAimRotation: 0.0f,
            DeltaSeconds: 0.1));

        Assert.Equal(new Vector2(0.0f, 300.0f), result.Velocity);
    }

    [Fact]
    public void StrafeMovementIsRelativeToHeading()
    {
        var controller = new HeadingLockedViewModeController();

        var result = controller.Update(new PlayerViewFrameInput(
            ActorPosition: Vector2.Zero,
            CurrentVelocity: Vector2.Zero,
            MovementInput: new Vector2(1.0f, 0.0f),
            MouseWorldPosition: Vector2.Zero,
            CurrentAimDirection: new Vector2(-1.0f, 0.0f),
            CurrentAimRotation: MathF.PI / 2.0f,
            DeltaSeconds: 0.1));

        Assert.Equal(new Vector2(0.0f, -300.0f), result.Velocity, new Vector2Comparer(0.0001f));
    }

    [Fact]
    public void LeftStrafeMovesOppositeOfRightStrafe()
    {
        var controller = new HeadingLockedViewModeController();

        var result = controller.Update(new PlayerViewFrameInput(
            ActorPosition: Vector2.Zero,
            CurrentVelocity: Vector2.Zero,
            MovementInput: new Vector2(-1.0f, 0.0f),
            MouseWorldPosition: Vector2.Zero,
            CurrentAimDirection: Vector2.UnitY,
            CurrentAimRotation: 0.0f,
            DeltaSeconds: 0.1));

        Assert.Equal(new Vector2(300.0f, 0.0f), result.Velocity);
    }

    [Fact]
    public void VerticalMouseDeltaDoesNotAffectHeading()
    {
        var controller = new HeadingLockedViewModeController();

        var result = controller.Update(new PlayerViewFrameInput(
            ActorPosition: Vector2.Zero,
            CurrentVelocity: Vector2.Zero,
            MovementInput: Vector2.Zero,
            MouseWorldPosition: Vector2.Zero,
            CurrentAimDirection: Vector2.UnitY,
            CurrentAimRotation: 0.0f,
            DeltaSeconds: 0.016,
            MouseDelta: new Vector2(0.0f, 20.0f)));

        Assert.Equal(Vector2.UnitY, result.AimDirection);
        Assert.Equal(0.0f, result.AimRotation, 6);
        Assert.Equal(MathF.PI, result.CameraRotation, 6);
        Assert.Equal(new Vector2(0.0f, PlayerRuntimeTuning.HeadingLockedCameraLookAheadDistance), result.CameraFollowOffset, new Vector2Comparer(0.0001f));
    }

    [Fact]
    public void CameraFollowOffsetLooksAheadAlongHeading()
    {
        var controller = new HeadingLockedViewModeController();

        var result = controller.Update(new PlayerViewFrameInput(
            ActorPosition: Vector2.Zero,
            CurrentVelocity: Vector2.Zero,
            MovementInput: Vector2.Zero,
            MouseWorldPosition: Vector2.Zero,
            CurrentAimDirection: new Vector2(-1.0f, 0.0f),
            CurrentAimRotation: MathF.PI / 2.0f,
            DeltaSeconds: 0.016));

        Assert.Equal(new Vector2(-PlayerRuntimeTuning.HeadingLockedCameraLookAheadDistance, 0.0f), result.CameraFollowOffset, new Vector2Comparer(0.0001f));
    }

    [Fact]
    public void OppositeStrafeDirectionReversesQuicklyInHeadingLockedMode()
    {
        var controller = new HeadingLockedViewModeController();

        var firstFrame = controller.Update(new PlayerViewFrameInput(
            ActorPosition: Vector2.Zero,
            CurrentVelocity: new Vector2(-720.0f, 0.0f),
            MovementInput: new Vector2(-1.0f, 0.0f),
            MouseWorldPosition: Vector2.Zero,
            CurrentAimDirection: Vector2.UnitY,
            CurrentAimRotation: 0.0f,
            DeltaSeconds: 0.016));

        var secondFrame = controller.Update(new PlayerViewFrameInput(
            ActorPosition: Vector2.Zero,
            CurrentVelocity: firstFrame.Velocity,
            MovementInput: new Vector2(-1.0f, 0.0f),
            MouseWorldPosition: Vector2.Zero,
            CurrentAimDirection: Vector2.UnitY,
            CurrentAimRotation: 0.0f,
            DeltaSeconds: 0.016));

        Assert.Equal(new Vector2(-240.0f, 0.0f), firstFrame.Velocity, new Vector2Comparer(0.0001f));
        Assert.True(secondFrame.Velocity.X > 0.0f, "HeadingLocked strafe reversal should cross through zero within two physics frames");
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
