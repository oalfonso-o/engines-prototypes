using Godot;

namespace Canuter
{
    public partial class Main : Node2D
    {
        private Crosshair? _crosshair;
        private PlayerController? _player;
        private GameHud? _gameHud;
        private VisionSystem? _visionSystem;

        public override void _Ready()
        {
            _crosshair = GetNodeOrNull<Crosshair>("Hud/Crosshair");
            _gameHud = GetNodeOrNull<GameHud>("Hud/GameHud");
            _visionSystem = GetNodeOrNull<VisionSystem>("VisionSystem");
            SetGameplayCursorActive(true);

            var map = GetNodeOrNull<MapView>("Map");
            _player = GetNodeOrNull<PlayerController>("Player");
            if (_player == null)
            {
                return;
            }

            var spawnPosition = map?.GetFirstAllySpawnWorldPosition();
            if (spawnPosition != null)
            {
                _player.GlobalPosition = spawnPosition.Value;
            }
            _gameHud?.BindPlayer(_player);
            if (_visionSystem != null)
            {
                _visionSystem.BindPlayer(_player);
                _gameHud?.BindVisionSystem(_visionSystem);
                map?.BindVisionSystem(_visionSystem);
            }
        }

        public override void _Notification(int what)
        {
            if (what == NotificationWMMouseEnter || what == NotificationWMWindowFocusIn)
            {
                SetGameplayCursorActive(true);
            }
            else if (what == NotificationWMMouseExit || what == NotificationWMWindowFocusOut)
            {
                SetGameplayCursorActive(false);
            }
        }

        public override void _ExitTree()
        {
            Input.MouseMode = Input.MouseModeEnum.Visible;
        }

        private void SetGameplayCursorActive(bool active)
        {
            Input.MouseMode = active ? Input.MouseModeEnum.Hidden : Input.MouseModeEnum.Visible;

            if (_crosshair != null)
            {
                _crosshair.Visible = active;
            }
        }
    }
}
