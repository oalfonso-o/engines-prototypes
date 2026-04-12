using System.Collections.Generic;
using System.Numerics;

namespace Canuter.Gameplay.Tests.Prototype3D;

public sealed class CameraRigModel3DTests
{
    [Fact]
    public void CameraSitsBehindPlayerAndLooksAheadAlongForward()
    {
        var frame = CameraRigModel3D.ComputeFrame(
            playerPosition: new Vector3(10.0f, 0.0f, 20.0f),
            playerForward: Vector3.UnitZ,
            orbitDistance: 10.0f,
            pitchDegrees: 30.0f,
            lookAheadDistance: 10.0f,
            lookHeight: 1.2f);

        Assert.Equal(new Vector3(10.0f, 5.0f, 11.339746f), frame.CameraPosition, new Vector3EqualityComparer(0.0001f));
        Assert.Equal(new Vector3(10.0f, 1.2f, 30.0f), frame.LookTarget);
    }

    [Fact]
    public void CameraUsesHorizontalForwardOnly()
    {
        var frame = CameraRigModel3D.ComputeFrame(
            playerPosition: Vector3.Zero,
            playerForward: Vector3.Normalize(new Vector3(1.0f, 1.0f, 0.0f)),
            orbitDistance: 10.0f,
            pitchDegrees: 40.0f,
            lookAheadDistance: 4.0f,
            lookHeight: 1.0f);

        Assert.Equal(10.0f * MathF.Sin(40.0f * MathF.PI / 180.0f), frame.CameraPosition.Y, 4);
        Assert.Equal(1.0f, frame.LookTarget.Y, 4);
        Assert.True(frame.CameraPosition.X < 0.0f);
        Assert.Equal(0.0f, frame.CameraPosition.Z, 4);
    }

    [Fact]
    public void SteeperPitchRaisesCameraAndReducesHorizontalOffset()
    {
        var shallow = CameraRigModel3D.ComputeFrame(
            Vector3.Zero,
            Vector3.UnitZ,
            orbitDistance: 12.0f,
            pitchDegrees: 20.0f,
            lookAheadDistance: 0.0f,
            lookHeight: 0.0f);
        var steep = CameraRigModel3D.ComputeFrame(
            Vector3.Zero,
            Vector3.UnitZ,
            orbitDistance: 12.0f,
            pitchDegrees: 70.0f,
            lookAheadDistance: 0.0f,
            lookHeight: 0.0f);

        Assert.True(steep.CameraPosition.Y > shallow.CameraPosition.Y);
        Assert.True(MathF.Abs(steep.CameraPosition.Z) < MathF.Abs(shallow.CameraPosition.Z));
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
