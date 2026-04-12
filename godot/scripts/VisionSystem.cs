using Godot;

namespace Canuter
{
    public partial class VisionSystem : Node2D
    {
        private const int TextureSize = 512;
        private const float FadeStart = 0.82f;

        private PlayerController? _player;
        private PointLight2D? _visionLight;
        private ImageTexture? _visionTexture;

        public override void _Ready()
        {
            _visionLight = GetNode<PointLight2D>("VisionLight");
            _visionTexture = CreateVisionTexture();
            _visionLight.Texture = _visionTexture;
            _visionLight.ShadowEnabled = true;
        }

        public override void _Process(double delta)
        {
            if (_player == null || _visionLight == null)
            {
                return;
            }

            GlobalPosition = _player.GlobalPosition;
            Rotation = _player.CurrentAimRotation;

            var radius = GetVisionRadiusFromCamera();
            var diameter = radius * 2.0f;
            _visionLight.TextureScale = diameter / TextureSize;
        }

        public void BindPlayer(PlayerController player)
        {
            _player = player;
            GlobalPosition = player.GlobalPosition;
        }

        public bool CanSeeWorldPoint(Vector2 point)
        {
            if (_player == null)
            {
                return false;
            }

            if (!IsWithinCamera(point))
            {
                return false;
            }

            var toPoint = point - _player.GlobalPosition;
            if (toPoint.LengthSquared() <= 0.0001f)
            {
                return true;
            }

            var direction = toPoint.Normalized();
            if (_player.CurrentAimDirection.Dot(direction) < 0.0f)
            {
                return false;
            }

            var query = PhysicsRayQueryParameters2D.Create(_player.GlobalPosition, point);
            query.CollideWithBodies = true;
            query.CollideWithAreas = true;
            query.Exclude = new Godot.Collections.Array<Rid> { _player.GetRid(), _player.HurtboxRid };
            var result = GetWorld2D().DirectSpaceState.IntersectRay(query);
            if (result.Count == 0)
            {
                return true;
            }

            if (result["collider"].AsGodotObject() is DummyTarget dummyTarget)
            {
                return dummyTarget.GlobalPosition.DistanceTo(point) < 1.0f;
            }

            return false;
        }

        private bool IsWithinCamera(Vector2 point)
        {
            if (_player == null)
            {
                return false;
            }

            var camera = _player.GameplayCamera;
            var viewport = GetViewportRect().Size;
            var zoom = camera.Zoom;
            var halfWorld = new Vector2(viewport.X * 0.5f / zoom.X, viewport.Y * 0.5f / zoom.Y);
            var delta = point - camera.GetScreenCenterPosition();
            return Mathf.Abs(delta.X) <= halfWorld.X && Mathf.Abs(delta.Y) <= halfWorld.Y;
        }

        private float GetVisionRadiusFromCamera()
        {
            if (_player == null)
            {
                return 512.0f;
            }

            var camera = _player.GameplayCamera;
            var viewport = GetViewportRect().Size;
            var zoom = camera.Zoom;
            var halfWorld = new Vector2(viewport.X * 0.5f / zoom.X, viewport.Y * 0.5f / zoom.Y);
            return halfWorld.Length();
        }

        private static ImageTexture CreateVisionTexture()
        {
            var image = Image.CreateEmpty(TextureSize, TextureSize, false, Image.Format.Rgba8);
            var center = new Vector2(TextureSize * 0.5f, TextureSize * 0.5f);
            var maxRadius = TextureSize * 0.5f;

            for (var y = 0; y < TextureSize; y++)
            {
                for (var x = 0; x < TextureSize; x++)
                {
                    var offset = new Vector2(x, y) - center;
                    var radius = offset.Length();
                    if (radius > maxRadius || radius < 1.0f)
                    {
                        image.SetPixel(x, y, Colors.Transparent);
                        continue;
                    }

                    var angle = Mathf.Wrap(offset.Angle() - Mathf.Pi / 2.0f, -Mathf.Pi, Mathf.Pi);
                    if (Mathf.Abs(angle) > Mathf.Pi * 0.5f)
                    {
                        image.SetPixel(x, y, Colors.Transparent);
                        continue;
                    }

                    var normalizedRadius = radius / maxRadius;
                    var alpha = normalizedRadius < FadeStart
                        ? 1.0f
                        : Mathf.Clamp(1.0f - ((normalizedRadius - FadeStart) / (1.0f - FadeStart)), 0.0f, 1.0f);

                    image.SetPixel(x, y, new Color(1.0f, 1.0f, 1.0f, alpha));
                }
            }

            return ImageTexture.CreateFromImage(image);
        }
    }
}
