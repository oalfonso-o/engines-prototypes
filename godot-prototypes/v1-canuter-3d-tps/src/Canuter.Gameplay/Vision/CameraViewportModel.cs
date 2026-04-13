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
}
