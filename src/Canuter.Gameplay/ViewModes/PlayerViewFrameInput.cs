using System.Numerics;

namespace Canuter
{
    public readonly record struct PlayerViewFrameInput(
        Vector2 ActorPosition,
        Vector2 CurrentVelocity,
        Vector2 MovementInput,
        Vector2 MouseWorldPosition,
        Vector2 CurrentAimDirection,
        float CurrentAimRotation,
        double DeltaSeconds,
        Vector2 MouseDelta = default);
}
