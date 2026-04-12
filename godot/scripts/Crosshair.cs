using Godot;

namespace Canuter
{
    public partial class Crosshair : Control
    {
        private static readonly Color OutlineColor = new(0.05f, 0.05f, 0.05f, 0.95f);
        private static readonly Color CrosshairColor = new(0.94f, 0.94f, 0.94f, 1.0f);

        public override void _Ready()
        {
            MouseFilter = MouseFilterEnum.Ignore;
            ZIndex = 100;
        }

        public override void _Process(double delta)
        {
            QueueRedraw();
        }

        public override void _Draw()
        {
            var center = GetViewport().GetMousePosition();
            const float gap = 8.0f;
            const float arm = 10.0f;
            const float outlineWidth = 4.0f;
            const float innerWidth = 2.0f;

            DrawCrosshair(center, gap, arm, outlineWidth, OutlineColor);
            DrawCrosshair(center, gap, arm, innerWidth, CrosshairColor);
            DrawArc(center, 3.0f, 0.0f, Mathf.Tau, 16, CrosshairColor, innerWidth, true);
        }

        private void DrawCrosshair(Vector2 center, float gap, float arm, float width, Color color)
        {
            DrawLine(center + new Vector2(-gap - arm, 0), center + new Vector2(-gap, 0), color, width);
            DrawLine(center + new Vector2(gap, 0), center + new Vector2(gap + arm, 0), color, width);
            DrawLine(center + new Vector2(0, -gap - arm), center + new Vector2(0, -gap), color, width);
            DrawLine(center + new Vector2(0, gap), center + new Vector2(0, gap + arm), color, width);
        }
    }
}
