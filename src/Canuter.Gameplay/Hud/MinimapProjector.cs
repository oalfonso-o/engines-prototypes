using System.Numerics;

namespace Canuter
{
    public readonly record struct MinimapProjection(Vector2 MarkerPosition);

    public static class MinimapProjector
    {
        public static MinimapProjection? ProjectMarker(
            CameraViewport viewport,
            Vector2 minimapCenter,
            float minimapRadius,
            Vector2 targetWorldPosition)
        {
            if (!viewport.Contains(targetWorldPosition))
            {
                return null;
            }

            var delta = targetWorldPosition - viewport.Center;
            var normalized = new Vector2(delta.X / viewport.HalfWorldSize.X, delta.Y / viewport.HalfWorldSize.Y);
            var marker = minimapCenter + new Vector2(normalized.X * minimapRadius * 0.70f, normalized.Y * minimapRadius * 0.70f);
            if ((marker - minimapCenter).Length() > minimapRadius - 10.0f)
            {
                return null;
            }

            return new MinimapProjection(marker);
        }
    }
}
