using Godot;

namespace Canuter
{
    public partial class Crosshair : Control
    {
        private static readonly Color OutlineColor = new(0.05f, 0.05f, 0.05f, 0.95f);
        private static readonly Color HintColor = new(0.94f, 0.94f, 0.94f, 0.80f);

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
            DrawCenteredCrosshair();
        }

        private void DrawCenteredCrosshair()
        {
            var viewport = GetViewportRect().Size;
            var center = viewport * 0.5f;
            DrawCrosshairArm(center + new Vector2(-12.0f, 0.0f), center + new Vector2(-4.0f, 0.0f));
            DrawCrosshairArm(center + new Vector2(4.0f, 0.0f), center + new Vector2(12.0f, 0.0f));
            DrawCrosshairArm(center + new Vector2(0.0f, -12.0f), center + new Vector2(0.0f, -4.0f));
            DrawCrosshairArm(center + new Vector2(0.0f, 4.0f), center + new Vector2(0.0f, 12.0f));
            DrawCircle(center, 1.8f, OutlineColor);
            DrawCircle(center, 1.0f, HintColor);
        }

        private void DrawCrosshairArm(Vector2 start, Vector2 end)
        {
            DrawLine(start, end, OutlineColor, 4.0f);
            DrawLine(start, end, HintColor, 2.0f);
        }
    }
}
