using System.Numerics;

namespace Canuter
{
    public enum VisionOcclusion
    {
        Clear,
        Blocked,
        TargetAtPoint,
    }

    public static class VisionEvaluator
    {
        public static bool CanSeeWorldPoint(
            Vector2 playerPosition,
            Vector2 facingDirection,
            Vector2 point,
            CameraViewport viewport,
            VisionOcclusion occlusion)
        {
            if (!viewport.Contains(point))
            {
                return false;
            }

            var toPoint = point - playerPosition;
            if (toPoint.LengthSquared() <= PlayerRuntimeTuning.AimDeadzoneSquared)
            {
                return true;
            }

            var direction = Vector2.Normalize(toPoint);
            if (Vector2.Dot(facingDirection, direction) < 0.0f)
            {
                return false;
            }

            return occlusion is VisionOcclusion.Clear or VisionOcclusion.TargetAtPoint;
        }
    }
}
