using Godot;

namespace Canuter
{
    public partial class DummyTarget : Area2D
    {
        private static readonly Color AliveColor = new(0.78f, 0.22f, 0.22f, 0.95f);
        private static readonly Color HitColor = new(1.0f, 0.82f, 0.22f, 1.0f);
        private static readonly Color OutlineColor = new(0.10f, 0.10f, 0.10f, 1.0f);

        private int _health = 100;
        private double _flashRemaining;

        public override void _Ready()
        {
            Monitoring = true;
            Monitorable = true;
            AddToGroup("damageable_targets");

            var shape = new CollisionShape2D
            {
                Shape = new CircleShape2D
                {
                    Radius = 22.0f,
                },
            };
            AddChild(shape);
            QueueRedraw();
        }

        public override void _Process(double delta)
        {
            if (_flashRemaining <= 0.0)
            {
                return;
            }

            _flashRemaining = Mathf.Max(0.0, _flashRemaining - delta);
            QueueRedraw();
        }

        public override void _Draw()
        {
            var fill = _flashRemaining > 0.0 ? HitColor : AliveColor;
            DrawCircle(Vector2.Zero, 22.0f, fill);
            DrawCircle(Vector2.Zero, 22.0f, OutlineColor, false, 3.0f);
            DrawLine(new Vector2(-10, 0), new Vector2(10, 0), OutlineColor, 3.0f);
            DrawLine(new Vector2(0, -10), new Vector2(0, 10), OutlineColor, 3.0f);
        }

        public void ApplyDamage(int amount)
        {
            _health -= amount;
            _flashRemaining = 0.12f;
            QueueRedraw();

            if (_health <= 0)
            {
                QueueFree();
            }
        }
    }
}
