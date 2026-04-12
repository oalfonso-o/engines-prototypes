using System;
using System.Numerics;

namespace Canuter
{
    public readonly record struct HeadingLockedRaySample(float RelativeAngle, Vector2 LocalDirection);

    public static class HeadingLockedVisibilityFanModel
    {
        public static HeadingLockedRaySample[] CreateRaySamples(int rayCount, float fieldOfViewRadians)
        {
            if (rayCount < 2)
            {
                throw new ArgumentOutOfRangeException(nameof(rayCount), "At least two rays are required.");
            }

            if (fieldOfViewRadians <= 0.0f)
            {
                throw new ArgumentOutOfRangeException(nameof(fieldOfViewRadians), "Field of view must be positive.");
            }

            var samples = new HeadingLockedRaySample[rayCount];
            var halfFov = fieldOfViewRadians * 0.5f;
            var step = fieldOfViewRadians / (rayCount - 1);

            for (var i = 0; i < rayCount; i++)
            {
                var angle = -halfFov + step * i;
                samples[i] = new HeadingLockedRaySample(angle, LocalDirectionFromRelativeAngle(angle));
            }

            return samples;
        }

        public static Vector2 LocalDirectionFromRelativeAngle(float relativeAngle)
        {
            return Vector2.Normalize(new Vector2(MathF.Sin(relativeAngle), MathF.Cos(relativeAngle)));
        }
    }
}
