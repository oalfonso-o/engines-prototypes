namespace Canuter
{
    public readonly record struct PlayerPostureState3D(
        float CurrentValue,
        float StartValue,
        float TargetValue,
        float ElapsedSeconds,
        PlayerPosture3D RequestedPosture);
}
