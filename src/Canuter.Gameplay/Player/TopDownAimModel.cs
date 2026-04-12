using System.Numerics;

namespace Canuter
{
    public readonly record struct AimState(Vector2 Direction, float Rotation, bool Changed);

    public static class TopDownAimModel
    {
        public static AimState Update(Vector2 actorPosition, Vector2 targetWorldPosition, Vector2 currentDirection, float currentRotation)
        {
            var aimVector = targetWorldPosition - actorPosition;
            if (aimVector.LengthSquared() <= PlayerRuntimeTuning.AimDeadzoneSquared)
            {
                return new AimState(currentDirection, currentRotation, false);
            }

            var direction = Vector2.Normalize(aimVector);
            var rotation = MathF.Atan2(aimVector.Y, aimVector.X) - MathF.PI / 2.0f;
            return new AimState(direction, rotation, true);
        }
    }
}
