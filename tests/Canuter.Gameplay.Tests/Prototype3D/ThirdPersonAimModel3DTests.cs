using System.Numerics;

namespace Canuter.Gameplay.Tests.Prototype3D;

public sealed class ThirdPersonAimModel3DTests
{
    [Fact]
    public void MouseDeltaXUpdatesYawWithSharedSensitivity()
    {
        var yaw = ThirdPersonAimModel3D.UpdateYawRadians(0.0f, -10.0f, 0.0035f);

        Assert.Equal(-0.035f, yaw, 6);
    }

    [Fact]
    public void MouseDeltaYLowersPitchWhenMovingMouseUp()
    {
        var pitch = ThirdPersonAimModel3D.UpdatePitchDegrees(
            currentPitchDegrees: 40.0f,
            mouseDeltaY: -10.0f,
            radiansPerPixel: 0.0035f,
            minPitchDegrees: 0.0f,
            maxPitchDegrees: 90.0f);

        Assert.True(pitch < 40.0f);
    }

    [Fact]
    public void PitchIsClampedIntoSupportedRange()
    {
        var low = ThirdPersonAimModel3D.UpdatePitchDegrees(10.0f, 5000.0f, 0.0035f, 0.0f, 90.0f);
        var high = ThirdPersonAimModel3D.UpdatePitchDegrees(80.0f, -5000.0f, 0.0035f, 0.0f, 90.0f);

        Assert.Equal(90.0f, low, 6);
        Assert.Equal(0.0f, high, 6);
    }

    [Fact]
    public void AimDirectionUsesYawAndPitch()
    {
        var aim = ThirdPersonAimModel3D.AimDirectionFromYawPitch(0.0f, 30.0f);

        Assert.Equal(0.0f, aim.X, 6);
        Assert.True(aim.Y < 0.0f);
        Assert.True(aim.Z > 0.0f);
    }

    [Fact]
    public void HorizontalForwardIgnoresPitch()
    {
        var horizontal = ThirdPersonAimModel3D.HorizontalForwardFromYaw(MathF.PI * 0.5f);

        Assert.Equal(-1.0f, horizontal.X, 6);
        Assert.Equal(0.0f, horizontal.Y, 6);
    }
}
