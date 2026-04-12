namespace Canuter
{
    public sealed class TopDownFixedViewModeController : IPlayerViewModeController
    {
        public PlayerViewMode Mode => PlayerViewMode.TopDownFixed;

        public PlayerPointerPresentation PointerPresentation => new(
            CursorCaptureMode.HiddenFree,
            CrosshairMode.FreeMouse,
            UsesRelativeMouseInput: false);

        public PlayerViewFrameResult Update(PlayerViewFrameInput input)
        {
            var velocity = TopDownMovementModel.CalculateVelocity(
                input.CurrentVelocity,
                input.MovementInput,
                input.DeltaSeconds);

            var aimState = TopDownAimModel.Update(
                input.ActorPosition,
                input.MouseWorldPosition,
                input.CurrentAimDirection,
                input.CurrentAimRotation);

            return new PlayerViewFrameResult(
                Velocity: velocity,
                AimDirection: aimState.Direction,
                AimRotation: aimState.Rotation,
                FireDirection: aimState.Direction,
                CameraRotation: 0.0f,
                CameraFollowOffset: System.Numerics.Vector2.Zero,
                VisualRotation: aimState.Rotation,
                HurtboxRotation: aimState.Rotation);
        }
    }
}
