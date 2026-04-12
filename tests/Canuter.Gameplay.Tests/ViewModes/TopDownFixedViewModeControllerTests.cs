using System.Numerics;

namespace Canuter.Gameplay.Tests.ViewModes;

public sealed class TopDownFixedViewModeControllerTests
{
    [Fact]
    public void ReportsTopDownFixedModeAndCurrentPointerPresentation()
    {
        IPlayerViewModeController controller = new TopDownFixedViewModeController();

        Assert.Equal(PlayerViewMode.TopDownFixed, controller.Mode);
        Assert.Equal(CursorCaptureMode.HiddenFree, controller.PointerPresentation.CursorCaptureMode);
        Assert.Equal(CrosshairMode.FreeMouse, controller.PointerPresentation.CrosshairMode);
        Assert.False(controller.PointerPresentation.UsesRelativeMouseInput);
    }

    [Fact]
    public void UpdateMatchesCurrentTopDownMovementAndAimBehavior()
    {
        var controller = new TopDownFixedViewModeController();
        var result = controller.Update(new PlayerViewFrameInput(
            ActorPosition: new Vector2(100.0f, 50.0f),
            CurrentVelocity: Vector2.Zero,
            MovementInput: new Vector2(1.0f, 0.0f),
            MouseWorldPosition: new Vector2(100.0f, 150.0f),
            CurrentAimDirection: Vector2.UnitY,
            CurrentAimRotation: 0.0f,
            DeltaSeconds: 0.1));

        Assert.Equal(new Vector2(300.0f, 0.0f), result.Velocity);
        Assert.Equal(new Vector2(0.0f, 1.0f), result.AimDirection);
        Assert.Equal(0.0f, result.AimRotation, 6);
        Assert.Equal(new Vector2(0.0f, 1.0f), result.FireDirection);
        Assert.Equal(0.0f, result.CameraRotation, 6);
        Assert.Equal(Vector2.Zero, result.CameraFollowOffset);
        Assert.Equal(result.AimRotation, result.VisualRotation, 6);
        Assert.Equal(result.AimRotation, result.HurtboxRotation, 6);
    }

    [Fact]
    public void UpdateKeepsPreviousAimWhenMouseIsInsideAimDeadzone()
    {
        var controller = new TopDownFixedViewModeController();
        var previousDirection = Vector2.Normalize(new Vector2(-2.0f, 5.0f));
        const float previousRotation = 0.73f;

        var result = controller.Update(new PlayerViewFrameInput(
            ActorPosition: Vector2.Zero,
            CurrentVelocity: new Vector2(30.0f, 0.0f),
            MovementInput: Vector2.Zero,
            MouseWorldPosition: new Vector2(0.001f, 0.001f),
            CurrentAimDirection: previousDirection,
            CurrentAimRotation: previousRotation,
            DeltaSeconds: 0.016));

        Assert.Equal(previousDirection, result.AimDirection);
        Assert.Equal(previousRotation, result.AimRotation, 6);
        Assert.Equal(previousDirection, result.FireDirection);
        Assert.Equal(0.0f, result.CameraRotation, 6);
        Assert.Equal(Vector2.Zero, result.CameraFollowOffset);
    }

    [Fact]
    public void TopDownFixedUsesAbsoluteMouseWorldPositionForAim()
    {
        var controller = new TopDownFixedViewModeController();

        var leftAim = controller.Update(new PlayerViewFrameInput(
            ActorPosition: Vector2.Zero,
            CurrentVelocity: Vector2.Zero,
            MovementInput: Vector2.Zero,
            MouseWorldPosition: new Vector2(-10.0f, 0.0f),
            CurrentAimDirection: Vector2.UnitY,
            CurrentAimRotation: 0.0f,
            DeltaSeconds: 0.016));

        var rightAim = controller.Update(new PlayerViewFrameInput(
            ActorPosition: Vector2.Zero,
            CurrentVelocity: Vector2.Zero,
            MovementInput: Vector2.Zero,
            MouseWorldPosition: new Vector2(10.0f, 0.0f),
            CurrentAimDirection: Vector2.UnitY,
            CurrentAimRotation: 0.0f,
            DeltaSeconds: 0.016));

        Assert.Equal(new Vector2(-1.0f, 0.0f), leftAim.AimDirection);
        Assert.Equal(MathF.PI / 2.0f, leftAim.AimRotation, 6);
        Assert.Equal(new Vector2(1.0f, 0.0f), rightAim.AimDirection);
        Assert.Equal(-MathF.PI / 2.0f, rightAim.AimRotation, 6);
    }
}
