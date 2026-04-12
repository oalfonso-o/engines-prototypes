namespace Canuter
{
    public static class PlayerBodyFadeModel3D
    {
        public const float MinOpacityAtMinZoom = 0.2f;
        public const float FadeRangeFraction = 0.25f;

        public static float ComputeOpacity(float orbitDistance, float minOrbitDistance, float maxOrbitDistance)
        {
            var minDistance = MathF.Min(minOrbitDistance, maxOrbitDistance);
            var maxDistance = MathF.Max(minOrbitDistance, maxOrbitDistance);
            var clampedDistance = float.Clamp(orbitDistance, minDistance, maxDistance);
            var distanceRange = maxDistance - minDistance;

            if (distanceRange <= float.Epsilon)
            {
                return MinOpacityAtMinZoom;
            }

            var fadeStartDistance = minDistance + (distanceRange * FadeRangeFraction);
            if (clampedDistance >= fadeStartDistance)
            {
                return 1.0f;
            }

            var fadeProgress = (fadeStartDistance - clampedDistance) / (fadeStartDistance - minDistance);
            return 1.0f - (fadeProgress * (1.0f - MinOpacityAtMinZoom));
        }
    }
}
