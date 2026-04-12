using System.Numerics;

namespace Canuter
{
    public sealed class HeadingLockedViewModeController : IPlayerViewModeController
    {
        public float MouseRadiansPerPixel { get; set; } = PlayerRuntimeTuning.HeadingLockedMouseRadiansPerPixel;

        public PlayerViewMode Mode => PlayerViewMode.HeadingLocked;

        public PlayerPointerPresentation PointerPresentation => new(
            CursorCaptureMode.HiddenCaptured,
            CrosshairMode.CenterForwardHint,
            UsesRelativeMouseInput: true);

        public PlayerViewFrameResult Update(PlayerViewFrameInput input)
        {
            var headingRotation = input.CurrentAimRotation + input.MouseDelta.X * MouseRadiansPerPixel;
            var headingDirection = DirectionFromRotation(headingRotation);
            var velocity = CalculateHeadingLockedVelocity(
                input.CurrentVelocity,
                input.MovementInput,
                headingDirection,
                input.DeltaSeconds);

            return new PlayerViewFrameResult(
                Velocity: velocity,
                AimDirection: headingDirection,
                AimRotation: headingRotation,
                FireDirection: headingDirection,
                CameraRotation: headingRotation + PlayerRuntimeTuning.HeadingLockedCameraUprightOffset,
                CameraFollowOffset: headingDirection * PlayerRuntimeTuning.HeadingLockedCameraLookAheadDistance,
                VisualRotation: headingRotation,
                HurtboxRotation: headingRotation);
        }

        private static Vector2 DirectionFromRotation(float rotation)
        {
            return Vector2.Normalize(new Vector2(-MathF.Sin(rotation), MathF.Cos(rotation)));
        }

        private static Vector2 CalculateHeadingLockedVelocity(Vector2 currentVelocity, Vector2 movementInput, Vector2 forward, double delta)
        {
            var right = new Vector2(-forward.Y, forward.X);
            var currentStrafeSpeed = Vector2.Dot(currentVelocity, right);
            var currentForwardSpeed = Vector2.Dot(currentVelocity, forward);
            var targetStrafeSpeed = movementInput.X * PlayerRuntimeTuning.MoveSpeed;
            var targetForwardSpeed = -movementInput.Y * PlayerRuntimeTuning.MoveSpeed;

            var nextStrafeSpeed = MoveAxisToward(
                currentStrafeSpeed,
                targetStrafeSpeed,
                movementInput.X,
                delta,
                allowFastTurnaround: true);
            var nextForwardSpeed = MoveAxisToward(
                currentForwardSpeed,
                targetForwardSpeed,
                movementInput.Y,
                delta,
                allowFastTurnaround: false);

            return right * nextStrafeSpeed + forward * nextForwardSpeed;
        }

        private static float MoveAxisToward(float current, float target, float inputAxis, double delta, bool allowFastTurnaround)
        {
            var acceleration = PlayerRuntimeTuning.MoveAcceleration;
            var deceleration = PlayerRuntimeTuning.MoveDeceleration;

            if (MathF.Abs(inputAxis) <= 0.0001f)
            {
                return MoveToward(current, 0.0f, (float)delta * deceleration);
            }

            if (allowFastTurnaround &&
                MathF.Abs(current) > 0.0001f &&
                MathF.Sign(current) != MathF.Sign(target))
            {
                acceleration = PlayerRuntimeTuning.HeadingLockedStrafeTurnaroundAcceleration;
            }

            return MoveToward(current, target, (float)delta * acceleration);
        }

        private static float MoveToward(float current, float target, float maxDelta)
        {
            var delta = target - current;
            if (MathF.Abs(delta) <= maxDelta)
            {
                return target;
            }

            return current + MathF.Sign(delta) * maxDelta;
        }
    }
}
