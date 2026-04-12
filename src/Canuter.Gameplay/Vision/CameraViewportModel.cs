using System.Numerics;

namespace Canuter
{
    public readonly record struct CameraViewport(Vector2 Center, Vector2 HalfWorldSize)
    {
        public bool Contains(Vector2 point)
        {
            var delta = point - Center;
            return MathF.Abs(delta.X) <= HalfWorldSize.X && MathF.Abs(delta.Y) <= HalfWorldSize.Y;
        }

        public float Radius => HalfWorldSize.Length();
    }

    public static class CameraViewportModel
    {
        public static CameraViewport Create(Vector2 center, Vector2 viewportPixels, Vector2 zoom)
        {
            var halfWorldSize = new Vector2(
                viewportPixels.X * 0.5f / zoom.X,
                viewportPixels.Y * 0.5f / zoom.Y
            );

            return new CameraViewport(center, halfWorldSize);
        }
    }
}
