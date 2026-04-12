using System.Numerics;

namespace Canuter
{
    public static class ThirdPersonAimModel3D
    {
        public static float UpdateYawRadians(float currentYaw, float mouseDeltaX, float radiansPerPixel)
        {
            return currentYaw + mouseDeltaX * radiansPerPixel;
        }

        public static float UpdatePitchDegrees(float currentPitchDegrees, float mouseDeltaY, float radiansPerPixel, float minPitchDegrees, float maxPitchDegrees)
        {
            var deltaDegrees = mouseDeltaY * radiansPerPixel * (180.0f / MathF.PI);
            return float.Clamp(currentPitchDegrees + deltaDegrees, minPitchDegrees, maxPitchDegrees);
        }

        public static Vector2 HorizontalForwardFromYaw(float yawRadians)
        {
            return Vector2.Normalize(new Vector2(-MathF.Sin(yawRadians), MathF.Cos(yawRadians)));
        }

        public static Vector3 AimDirectionFromYawPitch(float yawRadians, float pitchDegrees)
        {
            var horizontalForward = HorizontalForwardFromYaw(yawRadians);
            var pitchRadians = pitchDegrees * (MathF.PI / 180.0f);
            var cos = MathF.Cos(pitchRadians);
            var sin = MathF.Sin(pitchRadians);

            return Vector3.Normalize(new Vector3(
                horizontalForward.X * cos,
                -sin,
                horizontalForward.Y * cos));
        }
    }
}
