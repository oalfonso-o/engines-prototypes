using System.Collections.Generic;
using System.Numerics;

namespace Canuter.Gameplay.Tests.Prototype3D;

public sealed class CameraRigModel3DTests
{
    [Fact]
    public void ZoomMovesAlongFixedRailTowardPlayerAnchor()
    {
        var farFrame = CameraRigModel3D.ComputeFrame(
            playerAnchorPosition: new Vector3(10.0f, 1.2f, 20.0f),
            playerForward: Vector3.UnitZ,
            aimDirection: ThirdPersonAimModel3D.AimDirectionFromYawPitch(0.0f, 30.0f),
            orbitDistance: 10.0f,
            lookAheadDistance: 10.0f,
            railPitchDegrees: 40.0f);
        var nearFrame = CameraRigModel3D.ComputeFrame(
            playerAnchorPosition: new Vector3(10.0f, 1.2f, 20.0f),
            playerForward: Vector3.UnitZ,
            aimDirection: ThirdPersonAimModel3D.AimDirectionFromYawPitch(0.0f, 30.0f),
            orbitDistance: 4.0f,
            lookAheadDistance: 10.0f,
            railPitchDegrees: 40.0f);
        var expectedRailDirection = Vector3.Normalize(new Vector3(0.0f, MathF.Sin(40.0f * MathF.PI / 180.0f), -MathF.Cos(40.0f * MathF.PI / 180.0f)));

        Assert.Equal(expectedRailDirection, Vector3.Normalize(farFrame.CameraPosition - new Vector3(10.0f, 1.2f, 20.0f)), new Vector3EqualityComparer(0.0001f));
        Assert.Equal(expectedRailDirection, Vector3.Normalize(nearFrame.CameraPosition - new Vector3(10.0f, 1.2f, 20.0f)), new Vector3EqualityComparer(0.0001f));
        Assert.True(Vector3.Distance(new Vector3(10.0f, 1.2f, 20.0f), nearFrame.CameraPosition) < Vector3.Distance(new Vector3(10.0f, 1.2f, 20.0f), farFrame.CameraPosition));
    }

    [Fact]
    public void LookTargetUsesAimDirectionInsteadOfZoomRailDirection()
    {
        var aimDirection = ThirdPersonAimModel3D.AimDirectionFromYawPitch(0.0f, 10.0f);
        var frame = CameraRigModel3D.ComputeFrame(
            playerAnchorPosition: new Vector3(5.0f, 1.1f, -2.0f),
            playerForward: Vector3.UnitZ,
            aimDirection: aimDirection,
            orbitDistance: 18.0f,
            lookAheadDistance: 6.0f,
            railPitchDegrees: 55.0f);

        Assert.Equal(
            new Vector3(5.0f, 1.1f, -2.0f) + aimDirection * 6.0f,
            frame.LookTarget,
            new Vector3EqualityComparer(0.0001f));
        Assert.NotEqual(
            Vector3.Normalize(frame.LookTarget - new Vector3(5.0f, 1.1f, -2.0f)),
            Vector3.Normalize(frame.CameraPosition - new Vector3(5.0f, 1.1f, -2.0f)));
    }

    [Fact]
    public void ZeroForwardFallsBackToForwardZoomRail()
    {
        var frame = CameraRigModel3D.ComputeFrame(
            playerAnchorPosition: new Vector3(0.0f, 1.0f, 0.0f),
            playerForward: Vector3.Zero,
            aimDirection: Vector3.Zero,
            orbitDistance: 10.0f,
            lookAheadDistance: 4.0f,
            railPitchDegrees: 30.0f);

        Assert.Equal(new Vector3(0.0f, 6.0f, -8.660254f), frame.CameraPosition, new Vector3EqualityComparer(0.0001f));
        Assert.Equal(new Vector3(0.0f, 1.0f, 4.0f), frame.LookTarget, new Vector3EqualityComparer(0.0001f));
    }

    private sealed class Vector3EqualityComparer(float tolerance) : IEqualityComparer<Vector3>
    {
        public bool Equals(Vector3 x, Vector3 y)
        {
            return MathF.Abs(x.X - y.X) <= tolerance &&
                   MathF.Abs(x.Y - y.Y) <= tolerance &&
                   MathF.Abs(x.Z - y.Z) <= tolerance;
        }

        public int GetHashCode(Vector3 obj)
        {
            return obj.GetHashCode();
        }
    }
}
