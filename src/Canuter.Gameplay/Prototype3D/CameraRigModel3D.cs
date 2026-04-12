using System.Numerics;

namespace Canuter
{
    public readonly record struct CameraRigFrame3D(Vector3 CameraPosition, Vector3 LookTarget);

    public static class CameraRigModel3D
    {
        public static CameraRigFrame3D ComputeFrame(
            Vector3 playerAnchorPosition,
            Vector3 playerForward,
            Vector3 aimDirection,
            float orbitDistance,
            float lookAheadDistance,
            float railPitchDegrees)
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

            if (aimDirection.LengthSquared() <= float.Epsilon)
            {
                aimDirection = Vector3.UnitZ;
            }
            else
            {
                aimDirection = Vector3.Normalize(aimDirection);
            }

            var railPitchRadians = railPitchDegrees * (MathF.PI / 180.0f);
            var railDirection = Vector3.Normalize(
                (-horizontalForward * MathF.Cos(railPitchRadians)) +
                (Vector3.UnitY * MathF.Sin(railPitchRadians)));
            var cameraPosition = playerAnchorPosition + railDirection * orbitDistance;
            var lookTarget = playerAnchorPosition + aimDirection * lookAheadDistance;
            return new CameraRigFrame3D(cameraPosition, lookTarget);
        }
    }
}
