using System.Numerics;

namespace Canuter
{
    public static class TopDownMovementModel
    {
        public static Vector2 CalculateVelocity(Vector2 currentVelocity, Vector2 input, double delta)
        {
            var targetVelocity = input * PlayerRuntimeTuning.MoveSpeed;
            var step = (float)delta * (input.LengthSquared() > PlayerRuntimeTuning.AimDeadzoneSquared
                ? PlayerRuntimeTuning.MoveAcceleration
                : PlayerRuntimeTuning.MoveDeceleration);

            return MoveToward(currentVelocity, targetVelocity, step);
        }

        private static Vector2 MoveToward(Vector2 current, Vector2 target, float maxDelta)
        {
            var delta = target - current;
            var distance = delta.Length();
            if (distance <= maxDelta || distance <= float.Epsilon)
            {
                return target;
            }

            return current + delta / distance * maxDelta;
        }
    }
}
