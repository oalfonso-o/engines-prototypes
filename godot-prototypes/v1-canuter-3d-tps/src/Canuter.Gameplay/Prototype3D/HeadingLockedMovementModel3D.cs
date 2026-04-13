using System.Numerics;

namespace Canuter
{
    public static class HeadingLockedMovementModel3D
    {
        public static float UpdateHeadingRotation(float currentRotation, float mouseDeltaX, float radiansPerPixel)
        {
            return currentRotation + mouseDeltaX * radiansPerPixel;
        }

        public static Vector2 DirectionFromRotation(float rotation)
        {
            return Vector2.Normalize(new Vector2(-MathF.Sin(rotation), MathF.Cos(rotation)));
        }

        public static Vector2 CalculateVelocity(Vector2 currentVelocity, Vector2 movementInput, Vector2 forward, double deltaSeconds, float moveSpeed)
        {
            var right = new Vector2(-forward.Y, forward.X);
            var speedScale = moveSpeed / PlayerRuntimeTuning.Prototype3DMoveSpeed;
            var acceleration = PlayerRuntimeTuning.Prototype3DMoveAcceleration * speedScale;
            var deceleration = PlayerRuntimeTuning.Prototype3DMoveDeceleration * speedScale;
            var turnaroundAcceleration = PlayerRuntimeTuning.Prototype3DStrafeTurnaroundAcceleration * speedScale;
            var currentStrafeSpeed = Vector2.Dot(currentVelocity, right);
            var currentForwardSpeed = Vector2.Dot(currentVelocity, forward);
            var targetStrafeSpeed = movementInput.X * moveSpeed;
            var targetForwardSpeed = -movementInput.Y * moveSpeed;

            var nextStrafeSpeed = MoveAxisToward(
                currentStrafeSpeed,
                targetStrafeSpeed,
                movementInput.X,
                deltaSeconds,
                allowFastTurnaround: true,
                acceleration,
                deceleration,
                turnaroundAcceleration);
            var nextForwardSpeed = MoveAxisToward(
                currentForwardSpeed,
                targetForwardSpeed,
                movementInput.Y,
                deltaSeconds,
                allowFastTurnaround: false,
                acceleration,
                deceleration,
                turnaroundAcceleration);

            return right * nextStrafeSpeed + forward * nextForwardSpeed;
        }

        private static float MoveAxisToward(
            float current,
            float target,
            float inputAxis,
            double delta,
            bool allowFastTurnaround,
            float acceleration,
            float deceleration,
            float turnaroundAcceleration)
        {
            if (MathF.Abs(inputAxis) <= 0.0001f)
            {
                return MoveToward(current, 0.0f, (float)delta * deceleration);
            }

            if (allowFastTurnaround &&
                MathF.Abs(current) > 0.0001f &&
                MathF.Sign(current) != MathF.Sign(target))
            {
                acceleration = turnaroundAcceleration;
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
