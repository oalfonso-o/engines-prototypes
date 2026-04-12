using System.Collections.Generic;
using Godot;

namespace Canuter
{
    public partial class GameHud : Control
    {
        private static readonly Color PanelFill = new(0.07f, 0.07f, 0.07f, 0.78f);
        private static readonly Color PanelStroke = new(0.95f, 0.95f, 0.95f, 0.16f);
        private static readonly Color PrimaryText = new(0.97f, 0.97f, 0.97f, 1.0f);
        private static readonly Color SecondaryText = new(0.82f, 0.82f, 0.82f, 0.92f);
        private static readonly Color Accent = new(0.95f, 0.80f, 0.24f, 1.0f);
        private static readonly Color SlotFill = new(0.12f, 0.12f, 0.12f, 0.88f);
        private static readonly Color SlotSelected = new(0.22f, 0.20f, 0.12f, 0.96f);
        private static readonly Color MinimapFill = new(0.08f, 0.08f, 0.08f, 0.72f);
        private static readonly Color MinimapStroke = new(0.92f, 0.92f, 0.92f, 0.30f);
        private static readonly Color FriendlyMarker = new(0.35f, 0.74f, 1.0f, 1.0f);
        private static readonly Color EnemyMarker = new(0.92f, 0.24f, 0.20f, 1.0f);

        private PlayerController? _player;
        private VisionSystem? _visionSystem;

        public override void _Ready()
        {
            MouseFilter = MouseFilterEnum.Ignore;
            SetAnchorsPreset(LayoutPreset.FullRect);
            QueueRedraw();
        }

        public void BindPlayer(PlayerController player)
        {
            _player = player;
            QueueRedraw();
        }

        public void BindVisionSystem(VisionSystem visionSystem)
        {
            _visionSystem = visionSystem;
            QueueRedraw();
        }

        public override void _Process(double delta)
        {
            QueueRedraw();
        }

        public override void _Draw()
        {
            if (_player == null)
            {
                return;
            }

            DrawBottomPanels();
            DrawMinimap();
        }

        private void DrawBottomPanels()
        {
            var viewport = GetViewportRect().Size;
            var hpRect = new Rect2(20, viewport.Y - 82, 220, 54);
            var ammoRect = new Rect2(viewport.X - 280, viewport.Y - 100, 260, 72);
            var slotsRect = new Rect2(viewport.X - 280, viewport.Y - 164, 260, 52);

            DrawPanel(hpRect);
            DrawPanel(ammoRect);
            DrawWeaponSlots(slotsRect);

            var font = GetThemeDefaultFont();
            var small = 15;
            var medium = 18;
            var big = 26;

            DrawString(font, hpRect.Position + new Vector2(16, 21), "HP", HorizontalAlignment.Left, -1, small, SecondaryText);
            DrawString(font, hpRect.Position + new Vector2(16, 46), $"{_player!.CurrentHealth}/{_player.MaxHealth}", HorizontalAlignment.Left, -1, big, PrimaryText);

            DrawString(font, ammoRect.Position + new Vector2(16, 21), _player.EquippedWeaponDefinition.DisplayName.ToUpperInvariant(), HorizontalAlignment.Left, -1, small, SecondaryText);

            var ammoText = _player.EquippedWeaponDefinition.UsesMagazine
                ? $"{_player.EquippedAmmoInMagazine}/{_player.EquippedReserveAmmo}"
                : "MELEE";

            var ammoColor = _player.IsReloading ? Accent : PrimaryText;
            DrawString(font, ammoRect.Position + new Vector2(16, 48), ammoText, HorizontalAlignment.Left, -1, big, ammoColor);
            if (_player.IsReloading)
            {
                DrawString(font, ammoRect.Position + new Vector2(150, 48), "RELOADING", HorizontalAlignment.Left, -1, medium, Accent);
            }
        }

        private void DrawWeaponSlots(Rect2 rect)
        {
            DrawPanel(rect);

            var labels = new[]
            {
                ("1", "RIFLE", WeaponCategory.Rifle),
                ("2", "PISTOL", WeaponCategory.Pistol),
                ("3", "KNIFE", WeaponCategory.Knife),
                ("4", "UTIL", (WeaponCategory?)null),
            };

            var font = GetThemeDefaultFont();
            var slotWidth = 56.0f;
            var gap = 8.0f;

            for (var i = 0; i < labels.Length; i++)
            {
                var x = rect.Position.X + 12 + i * (slotWidth + gap);
                var slotRect = new Rect2(x, rect.Position.Y + 10, slotWidth, 32);
                var isSelected = labels[i].Item3 != null && labels[i].Item3 == _player!.EquippedWeaponDefinition.Category;
                DrawRect(slotRect, isSelected ? SlotSelected : SlotFill, true);
                DrawRect(slotRect, isSelected ? Accent : PanelStroke, false, 2.0f);
                DrawString(font, slotRect.Position + new Vector2(8, 14), labels[i].Item1, HorizontalAlignment.Left, -1, 12, SecondaryText);
                DrawString(font, slotRect.Position + new Vector2(8, 26), labels[i].Item2, HorizontalAlignment.Left, -1, 11, isSelected ? PrimaryText : SecondaryText);
            }
        }

        private void DrawMinimap()
        {
            var camera = _player!.GameplayCamera;
            var viewport = GetViewportRect().Size;
            var radius = 88.0f;
            var center = new Vector2(viewport.X - 116, 116);

            DrawCircle(center, radius, MinimapFill);
            DrawArc(center, radius, 0.0f, Mathf.Tau, 48, MinimapStroke, 3.0f, true);
            DrawArc(center, radius * 0.72f, 0.0f, Mathf.Tau, 32, new Color(1, 1, 1, 0.08f), 1.5f, true);

            var font = GetThemeDefaultFont();
            DrawString(font, center + new Vector2(-6, -radius - 10), "N", HorizontalAlignment.Left, -1, 14, PrimaryText);
            DrawString(font, center + new Vector2(-6, radius + 18), "S", HorizontalAlignment.Left, -1, 14, PrimaryText);
            DrawString(font, center + new Vector2(radius + 10, 5), "E", HorizontalAlignment.Left, -1, 14, PrimaryText);
            DrawString(font, center + new Vector2(-radius - 20, 5), "W", HorizontalAlignment.Left, -1, 14, PrimaryText);

            DrawCircle(center, 5.0f, FriendlyMarker);

            var cameraPosition = camera.GlobalPosition;
            var viewportPixels = GetViewportRect().Size;
            var zoom = camera.Zoom;
            var halfWorldSize = new Vector2(viewportPixels.X * 0.5f / zoom.X, viewportPixels.Y * 0.5f / zoom.Y);
            var targets = GetTree().GetNodesInGroup("damageable_targets");

            foreach (var node in targets)
            {
                if (node is not Node2D target)
                {
                    continue;
                }

                var delta = target.GlobalPosition - cameraPosition;
                if (Mathf.Abs(delta.X) > halfWorldSize.X || Mathf.Abs(delta.Y) > halfWorldSize.Y)
                {
                    continue;
                }

                if (_visionSystem != null && !_visionSystem.CanSeeWorldPoint(target.GlobalPosition))
                {
                    continue;
                }

                var normalized = new Vector2(delta.X / halfWorldSize.X, delta.Y / halfWorldSize.Y);
                var marker = center + new Vector2(normalized.X * radius * 0.70f, normalized.Y * radius * 0.70f);
                if ((marker - center).Length() > radius - 10.0f)
                {
                    continue;
                }

                DrawCircle(marker, 4.0f, EnemyMarker);
            }
        }

        private void DrawPanel(Rect2 rect)
        {
            DrawRect(rect, PanelFill, true);
            DrawRect(rect, PanelStroke, false, 2.0f);
        }
    }
}
