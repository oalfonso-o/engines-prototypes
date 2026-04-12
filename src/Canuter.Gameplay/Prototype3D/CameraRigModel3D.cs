using System.Numerics;

namespace Canuter
{
    public readonly record struct CameraRigFrame3D(Vector3 CameraPosition, Vector3 LookTarget);

    public static class CameraRigModel3D
    {
        public static CameraRigFrame3D ComputeFrame(
            Vector3 playerPosition,
            Vector3 playerForward,
            float orbitDistance,
            float pitchDegrees,
            float lookAheadDistance,
            float lookHeight)
        {
            var horizontalForward = new Vector3(playerForward.X, 0.0f, playerForward.Z);
            if (horizontalForward.LengthSquared() <= float.Epsilon)
            {
                horizontalForward = Vector3.UnitZ;
            }
            else
            {
                horizontalForward = Vector3.Normalize(horizontalForward);
            }

            var pitchRadians = pitchDegrees * (MathF.PI / 180.0f);
            var horizontalDistance = orbitDistance * MathF.Cos(pitchRadians);
            var verticalHeight = orbitDistance * MathF.Sin(pitchRadians);
            var cameraPosition = playerPosition - horizontalForward * horizontalDistance + Vector3.UnitY * verticalHeight;
            var aimDirection = ThirdPersonAimModel3D.AimDirectionFromYawPitch(
                MathF.Atan2(-horizontalForward.X, horizontalForward.Z),
                pitchDegrees);
            var lookTarget = playerPosition + Vector3.UnitY * lookHeight + aimDirection * lookAheadDistance;
            return new CameraRigFrame3D(cameraPosition, lookTarget);
        }
    }
}
