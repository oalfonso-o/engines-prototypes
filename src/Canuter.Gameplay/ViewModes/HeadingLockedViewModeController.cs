using System.Numerics;

namespace Canuter
{
    public sealed class HeadingLockedViewModeController : IPlayerViewModeController
    {
        public PlayerViewMode Mode => PlayerViewMode.HeadingLocked;

        public PlayerPointerPresentation PointerPresentation => new(
            CursorCaptureMode.HiddenCaptured,
            CrosshairMode.CenterForwardHint,
            UsesRelativeMouseInput: true);

        public PlayerViewFrameResult Update(PlayerViewFrameInput input)
        {
            var headingRotation = input.CurrentAimRotation + input.MouseDelta.X * PlayerRuntimeTuning.HeadingLockedMouseRadiansPerPixel;
            var headingDirection = DirectionFromRotation(headingRotation);
            var movementInput = RotateMovementInputIntoWorld(input.MovementInput, headingDirection);
            var velocity = TopDownMovementModel.CalculateVelocity(
                input.CurrentVelocity,
                movementInput,
                input.DeltaSeconds);

            return new PlayerViewFrameResult(
                Velocity: velocity,
                AimDirection: headingDirection,
                AimRotation: headingRotation,
                FireDirection: headingDirection,
                CameraRotation: headingRotation + PlayerRuntimeTuning.HeadingLockedCameraUprightOffset,
                VisualRotation: headingRotation,
                HurtboxRotation: headingRotation);
        }

        private static Vector2 DirectionFromRotation(float rotation)
        {
            return Vector2.Normalize(new Vector2(-MathF.Sin(rotation), MathF.Cos(rotation)));
        }

        private static Vector2 RotateMovementInputIntoWorld(Vector2 movementInput, Vector2 forward)
        {
            var right = new Vector2(-forward.Y, forward.X);
            return right * movementInput.X + forward * -movementInput.Y;
        }
    }
}
