using NumericVector2 = System.Numerics.Vector2;
using Godot;

namespace Canuter
{
    public partial class GameHud3D : Control
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

        private PlayerController3D? _player;
        private MapView3D? _map;

        public override void _Ready()
        {
            MouseFilter = MouseFilterEnum.Ignore;
            SetAnchorsPreset(LayoutPreset.FullRect);
            QueueRedraw();
        }

        public void BindPlayer(PlayerController3D player)
        {
            _player = player;
        }

        public void BindMap(MapView3D map)
        {
            _map = map;
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
            DrawString(font, hpRect.Position + new Vector2(16, 21), "HP", HorizontalAlignment.Left, -1, 15, SecondaryText);
            DrawString(font, hpRect.Position + new Vector2(16, 46), $"{_player!.CurrentHealth}/{_player.MaxHealth}", HorizontalAlignment.Left, -1, 26, PrimaryText);
            DrawString(font, ammoRect.Position + new Vector2(16, 21), _player.EquippedWeaponDefinition.DisplayName.ToUpperInvariant(), HorizontalAlignment.Left, -1, 15, SecondaryText);

            var ammoText = _player.EquippedWeaponDefinition.UsesMagazine
                ? $"{_player.EquippedAmmoInMagazine}/{_player.EquippedReserveAmmo}"
                : "MELEE";
            var ammoColor = _player.IsReloading ? Accent : PrimaryText;
            DrawString(font, ammoRect.Position + new Vector2(16, 48), ammoText, HorizontalAlignment.Left, -1, 26, ammoColor);
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
            for (var i = 0; i < labels.Length; i++)
            {
                var x = rect.Position.X + 12 + i * (56.0f + 8.0f);
                var slotRect = new Rect2(x, rect.Position.Y + 10, 56.0f, 32.0f);
                var isSelected = labels[i].Item3 != null && labels[i].Item3 == _player!.EquippedWeaponDefinition.Category;
                DrawRect(slotRect, isSelected ? SlotSelected : SlotFill, true);
                DrawRect(slotRect, isSelected ? Accent : PanelStroke, false, 2.0f);
                DrawString(font, slotRect.Position + new Vector2(8, 14), labels[i].Item1, HorizontalAlignment.Left, -1, 12, SecondaryText);
                DrawString(font, slotRect.Position + new Vector2(8, 26), labels[i].Item2, HorizontalAlignment.Left, -1, 11, isSelected ? PrimaryText : SecondaryText);
            }
        }

        private void DrawMinimap()
        {
            if (_map == null)
            {
                return;
            }

            var viewport = GetViewportRect().Size;
            var radius = 88.0f;
            var center = new Vector2(viewport.X - 116, 116);
            var minimapRotation = _player!.CurrentMinimapRotation;

            DrawCircle(center, radius, MinimapFill);
            DrawArc(center, radius, 0.0f, Mathf.Tau, 48, MinimapStroke, 3.0f, true);
            DrawArc(center, radius * 0.72f, 0.0f, Mathf.Tau, 32, new Color(1, 1, 1, 0.08f), 1.5f, true);

            var font = GetThemeDefaultFont();
            DrawOrientationMarker(font, center, radius, minimapRotation, "N", MinimapOrientationMarker.North);
            DrawOrientationMarker(font, center, radius, minimapRotation, "E", MinimapOrientationMarker.East);
            DrawOrientationMarker(font, center, radius, minimapRotation, "S", MinimapOrientationMarker.South);
            DrawOrientationMarker(font, center, radius, minimapRotation, "W", MinimapOrientationMarker.West);
            DrawPlayerMarker(center, minimapRotation);

            var viewportWorld = new CameraViewport(
                new NumericVector2(_player.GlobalPosition.X, _player.GlobalPosition.Z),
                ToNumeric(_map.GetMinimapHalfWorldSize()));

            var targets = GetTree().GetNodesInGroup("damageable_targets");
            foreach (var node in targets)
            {
                if (node is not Node3D target)
                {
                    continue;
                }

                var projection = MinimapProjector.ProjectMarker(
                    viewportWorld,
                    ToNumeric(center),
                    radius,
                    new NumericVector2(target.GlobalPosition.X, target.GlobalPosition.Z),
                    minimapRotation);

                if (projection == null)
                {
                    continue;
                }

                DrawCircle(ToGodot(projection.Value.MarkerPosition), 4.0f, EnemyMarker);
            }
        }

        private void DrawOrientationMarker(Font font, Vector2 center, float radius, float minimapRotation, string label, MinimapOrientationMarker marker)
        {
            var position = ToGodot(MinimapProjector.ProjectOrientationMarker(ToNumeric(center), radius + 14.0f, marker, minimapRotation));
            DrawString(font, position + new Vector2(-6.0f, 5.0f), label, HorizontalAlignment.Left, -1, 14, PrimaryText);
        }

        private void DrawPlayerMarker(Vector2 center, float minimapRotation)
        {
            var marker = MinimapProjector.ProjectPlayerMarker(
                ToNumeric(center),
                new NumericVector2(_player!.CurrentForward3D.X, _player.CurrentForward3D.Z),
                minimapRotation);

            var points = new[]
            {
                ToGodot(marker.Tip),
                ToGodot(marker.RightBase),
                ToGodot(marker.LeftBase),
            };

            DrawColoredPolygon(points, FriendlyMarker);
            DrawPolyline(points, new Color(0.04f, 0.10f, 0.16f, 0.95f), 2.0f, true);
        }

        private void DrawPanel(Rect2 rect)
        {
            DrawRect(rect, PanelFill, true);
            DrawRect(rect, PanelStroke, false, 2.0f);
        }

        private static NumericVector2 ToNumeric(Vector2 value)
        {
            return new NumericVector2(value.X, value.Y);
        }

        private static Vector2 ToGodot(NumericVector2 value)
        {
            return new Vector2(value.X, value.Y);
        }
    }
}
