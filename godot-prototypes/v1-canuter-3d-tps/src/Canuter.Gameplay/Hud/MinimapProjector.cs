using System.Numerics;

namespace Canuter
{
    public readonly record struct MinimapProjection(Vector2 MarkerPosition);
    public readonly record struct MinimapPlayerMarker(Vector2 Tip, Vector2 LeftBase, Vector2 RightBase);
    public enum MinimapOrientationMarker
    {
        North,
        East,
        South,
        West,
    }

    public static class MinimapProjector
    {
        public static MinimapProjection? ProjectMarker(
            CameraViewport viewport,
            Vector2 minimapCenter,
            float minimapRadius,
            Vector2 targetWorldPosition,
            float minimapRotation = 0.0f)
        {
            if (!viewport.Contains(targetWorldPosition))
            {
                return null;
            }

            var delta = targetWorldPosition - viewport.Center;
            var rotatedDelta = Rotate(delta, minimapRotation);
            var normalized = new Vector2(rotatedDelta.X / viewport.HalfWorldSize.X, rotatedDelta.Y / viewport.HalfWorldSize.Y);
            var marker = minimapCenter + new Vector2(normalized.X * minimapRadius * 0.70f, normalized.Y * minimapRadius * 0.70f);
            if ((marker - minimapCenter).Length() > minimapRadius - 10.0f)
            {
                return null;
            }

            return new MinimapProjection(marker);
        }

        public static Vector2 ProjectOrientationMarker(
            Vector2 minimapCenter,
            float minimapRadius,
            MinimapOrientationMarker marker,
            float minimapRotation = 0.0f)
        {
            var baseDirection = marker switch
            {
                MinimapOrientationMarker.North => new Vector2(0.0f, -1.0f),
                MinimapOrientationMarker.East => new Vector2(1.0f, 0.0f),
                MinimapOrientationMarker.South => new Vector2(0.0f, 1.0f),
                MinimapOrientationMarker.West => new Vector2(-1.0f, 0.0f),
                _ => Vector2.Zero,
            };

            var rotatedDirection = Rotate(baseDirection, minimapRotation);
            return minimapCenter + rotatedDirection * minimapRadius;
        }

        public static MinimapPlayerMarker ProjectPlayerMarker(
            Vector2 minimapCenter,
            Vector2 playerForwardDirection,
            float minimapRotation = 0.0f,
            float tipDistance = 10.0f,
            float baseDistance = 4.0f,
            float baseHalfWidth = 4.5f)
        {
            var forward = playerForwardDirection.LengthSquared() <= float.Epsilon
                ? new Vector2(0.0f, -1.0f)
                : Vector2.Normalize(playerForwardDirection);
            var rotatedForward = Rotate(forward, minimapRotation);
            var right = new Vector2(-rotatedForward.Y, rotatedForward.X);
            var tip = minimapCenter + rotatedForward * tipDistance;
            var baseCenter = minimapCenter - rotatedForward * baseDistance;

            return new MinimapPlayerMarker(
                Tip: tip,
                LeftBase: baseCenter - right * baseHalfWidth,
                RightBase: baseCenter + right * baseHalfWidth);
        }

        private static Vector2 Rotate(Vector2 value, float rotation)
        {
            var sin = MathF.Sin(rotation);
            var cos = MathF.Cos(rotation);
            return new Vector2(
                value.X * cos - value.Y * sin,
                value.X * sin + value.Y * cos);
        }
    }
}
