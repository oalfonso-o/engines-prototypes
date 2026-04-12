using Godot;

namespace Canuter
{
    public partial class Main : Node2D
    {
        private Crosshair? _crosshair;
        private PlayerController? _player;
        private GameHud? _gameHud;
        private VisionSystem? _visionSystem;
        private HeadingLockedPerspectiveDebugOverlay? _perspectiveDebugOverlay;
        private PauseMenuOverlay? _pauseMenuOverlay;
        private readonly GameSettings _settings = new();
        private readonly GameSettingsStore _settingsStore = new();
        private PauseMenuState _pauseMenuState = null!;
        private readonly TopDownFixedViewModeController _topDownFixedController = new();
        private readonly HeadingLockedViewModeController _headingLockedController = new();
        private bool _windowActive = true;

        public override void _Ready()
        {
            ProcessMode = ProcessModeEnum.Always;
            SetProcessUnhandledInput(true);

            _crosshair = GetNodeOrNull<Crosshair>("Hud/Crosshair");
            _gameHud = GetNodeOrNull<GameHud>("Hud/GameHud");
            _perspectiveDebugOverlay = GetNodeOrNull<HeadingLockedPerspectiveDebugOverlay>("Hud/HeadingLockedPerspectiveDebugOverlay");
            _pauseMenuOverlay = GetNodeOrNull<PauseMenuOverlay>("Hud/PauseMenuOverlay");
            _visionSystem = GetNodeOrNull<VisionSystem>("VisionSystem");
            _settingsStore.LoadInto(_settings);
            _pauseMenuState = new PauseMenuState(_settings);

            if (_pauseMenuOverlay != null)
            {
                _pauseMenuOverlay.SettingsRequested += OnPauseSettingsRequested;
                _pauseMenuOverlay.BackRequested += OnPauseBackRequested;
                _pauseMenuOverlay.ViewModeSelected += OnPauseViewModeSelected;
                _pauseMenuOverlay.HeadingSensitivityChanged += OnHeadingSensitivityChanged;
            }

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
                _perspectiveDebugOverlay?.BindVisionSystem(_visionSystem);
            }

            if (map != null)
            {
                _perspectiveDebugOverlay?.BindMap(map);
            }
            _perspectiveDebugOverlay?.BindPlayer(_player);

            ApplyRuntimeState();
        }

        public override void _UnhandledInput(InputEvent @event)
        {
            if (@event is not InputEventKey keyEvent || !keyEvent.Pressed || keyEvent.Echo || keyEvent.Keycode != Key.Escape)
            {
                return;
            }

            _pauseMenuState.TogglePause();
            ApplyRuntimeState();
            GetViewport().SetInputAsHandled();
        }

        public override void _Notification(int what)
        {
            if (what == NotificationWMMouseEnter || what == NotificationWMWindowFocusIn)
            {
                _windowActive = true;
                ApplyRuntimeState();
            }
            else if (what == NotificationWMMouseExit || what == NotificationWMWindowFocusOut)
            {
                _windowActive = false;
                ApplyRuntimeState();
            }
        }

        public override void _ExitTree()
        {
            Input.MouseMode = Input.MouseModeEnum.Visible;
        }

        public void SetViewModeById(long viewModeId)
        {
            _settings.SetViewMode((PlayerViewMode)viewModeId);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        public long GetPauseScreenId()
        {
            return (long)_pauseMenuState.CurrentScreen;
        }

        public long GetCurrentViewModeId()
        {
            return (long)_settings.ViewMode;
        }

        public void SetHeadingLockedTurnSensitivity(double sensitivity)
        {
            _settings.SetHeadingLockedTurnSensitivity((float)sensitivity);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        public double GetHeadingLockedTurnSensitivity()
        {
            return _settings.HeadingLockedTurnSensitivity;
        }

        private void ApplyRuntimeState()
        {
            _headingLockedController.MouseRadiansPerPixel = _settings.HeadingLockedTurnSensitivity;
            var controller = GetActiveViewModeController();
            var isHeadingLocked = _settings.ViewMode == PlayerViewMode.HeadingLocked;
            _player?.SetViewModeController(controller);
            _player?.SetGameplayInputEnabled(_pauseMenuState.CurrentScreen == MenuScreen.Closed);
            _crosshair?.SetPresentation(controller.PointerPresentation);
            _pauseMenuOverlay?.ApplyState(_pauseMenuState.CurrentScreen, _settings.ViewMode, _settings.HeadingLockedTurnSensitivity);
            var map = GetNodeOrNull<CanvasItem>("Map");
            if (map != null)
            {
                map.Visible = !isHeadingLocked;
            }

            var allowGameplayPointer = _windowActive && _pauseMenuState.CurrentScreen == MenuScreen.Closed;
            if (!allowGameplayPointer)
            {
                Input.MouseMode = Input.MouseModeEnum.Visible;
            }
            else
            {
                Input.MouseMode = controller.PointerPresentation.CursorCaptureMode switch
                {
                    CursorCaptureMode.HiddenCaptured => Input.MouseModeEnum.Captured,
                    CursorCaptureMode.HiddenFree => Input.MouseModeEnum.Hidden,
                    _ => Input.MouseModeEnum.Hidden,
                };
            }

            if (_crosshair != null)
            {
                _crosshair.Visible = allowGameplayPointer;
            }
        }

        private IPlayerViewModeController GetActiveViewModeController()
        {
            return _settings.ViewMode == PlayerViewMode.HeadingLocked
                ? _headingLockedController
                : _topDownFixedController;
        }

        private void OnPauseSettingsRequested()
        {
            _pauseMenuState.OpenSettings();
            ApplyRuntimeState();
        }

        private void OnPauseBackRequested()
        {
            _pauseMenuState.GoBack();
            ApplyRuntimeState();
        }

        private void OnPauseViewModeSelected(long viewMode)
        {
            _pauseMenuState.SelectViewMode((PlayerViewMode)viewMode);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        private void OnHeadingSensitivityChanged(double sensitivity)
        {
            _settings.SetHeadingLockedTurnSensitivity((float)sensitivity);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }
    }
}
