using Godot;

namespace Canuter
{
    public partial class Crosshair : Control
    {
        private static readonly Color OutlineColor = new(0.05f, 0.05f, 0.05f, 0.95f);
        private static readonly Color HintColor = new(0.94f, 0.94f, 0.94f, 0.70f);

        public override void _Ready()
        {
            MouseFilter = MouseFilterEnum.Ignore;
            ZIndex = 100;
            ProcessMode = ProcessModeEnum.Always;
        }

        public override void _Process(double delta)
        {
            QueueRedraw();
        }

        public override void _Draw()
        {
            DrawCenterForwardHint();
        }

        private void DrawCenterForwardHint()
        {
            var viewport = GetViewportRect().Size;
            var center = viewport * 0.5f;
            var start = center + new Vector2(0.0f, -26.0f);
            var end = center + new Vector2(0.0f, -10.0f);

            DrawLine(start, end, OutlineColor, 4.0f);
            DrawLine(start, end, HintColor, 2.0f);
            DrawCircle(center, 2.5f, new Color(HintColor.R, HintColor.G, HintColor.B, 0.85f));
        }
    }
}
