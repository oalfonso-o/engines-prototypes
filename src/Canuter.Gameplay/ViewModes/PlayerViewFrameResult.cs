using System.Numerics;

namespace Canuter
{
    public readonly record struct PlayerViewFrameResult(
        Vector2 Velocity,
        Vector2 AimDirection,
        float AimRotation,
        Vector2 FireDirection,
        float CameraRotation,
        Vector2 CameraFollowOffset,
        float VisualRotation,
        float HurtboxRotation);
}
