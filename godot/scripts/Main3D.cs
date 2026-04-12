using Godot;

namespace Canuter
{
    public partial class Main3D : Node3D
    {
        private Crosshair? _crosshair;
        private PlayerController3D? _player;
        private GameHud3D? _gameHud;
        private PauseMenuOverlay? _pauseMenuOverlay;
        private MapView3D? _map;
        private CameraRig3D? _cameraRig;
        private readonly GameSettings _settings = new();
        private readonly GameSettingsStore _settingsStore = new();
        private PauseMenuState _pauseMenuState = null!;
        private bool _windowActive = true;

        public override void _Ready()
        {
            ProcessMode = ProcessModeEnum.Always;
            SetProcessUnhandledInput(true);

            _crosshair = GetNodeOrNull<Crosshair>("Hud/Crosshair");
            _gameHud = GetNodeOrNull<GameHud3D>("Hud/GameHud");
            _pauseMenuOverlay = GetNodeOrNull<PauseMenuOverlay>("Hud/PauseMenuOverlay");
            _map = GetNodeOrNull<MapView3D>("Map");
            _player = GetNodeOrNull<PlayerController3D>("Player");
            _cameraRig = GetNodeOrNull<CameraRig3D>("CameraRig3D");

            _settingsStore.LoadInto(_settings);
            _settings.SetViewMode(PlayerViewMode.HeadingLocked);
            _pauseMenuState = new PauseMenuState(_settings);

            if (_pauseMenuOverlay != null)
            {
                _pauseMenuOverlay.SettingsRequested += OnPauseSettingsRequested;
                _pauseMenuOverlay.BackRequested += OnPauseBackRequested;
                _pauseMenuOverlay.ViewModeSelected += OnPauseViewModeSelected;
                _pauseMenuOverlay.HeadingSensitivityChanged += OnHeadingSensitivityChanged;
                _pauseMenuOverlay.Prototype3DMoveSpeedChanged += OnPrototype3DMoveSpeedChanged;
                _pauseMenuOverlay.Prototype3DCameraPitchChanged += OnPrototype3DCameraPitchChanged;
                _pauseMenuOverlay.ExitRequested += OnExitRequested;
            }

            RestrictPauseMenuToHeadingLocked();

            if (_player != null && _map != null)
            {
                var spawn = _map.GetFirstAllySpawnWorldPosition();
                if (spawn != null)
                {
                    _player.GlobalPosition = spawn.Value;
                }
            }

            if (_cameraRig != null && _player != null)
            {
                _cameraRig.BindPlayer(_player);
            }

            if (_gameHud != null && _player != null)
            {
                _gameHud.BindPlayer(_player);
            }

            if (_gameHud != null && _map != null)
            {
                _gameHud.BindMap(_map);
            }

            ApplyRuntimeState();
        }

        public override void _UnhandledInput(InputEvent @event)
        {
            if (@event is InputEventMouseButton mouseButton &&
                mouseButton.Pressed &&
                _pauseMenuState.CurrentScreen == MenuScreen.Closed &&
                _cameraRig != null)
            {
                if (mouseButton.ButtonIndex == MouseButton.WheelUp)
                {
                    _cameraRig.AdjustOrbitDistance(-1);
                    GetViewport().SetInputAsHandled();
                    return;
                }

                if (mouseButton.ButtonIndex == MouseButton.WheelDown)
                {
                    _cameraRig.AdjustOrbitDistance(1);
                    GetViewport().SetInputAsHandled();
                    return;
                }
            }

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

        public long GetPauseScreenId()
        {
            return (long)_pauseMenuState.CurrentScreen;
        }

        public long GetCurrentViewModeId()
        {
            return (long)PlayerViewMode.HeadingLocked;
        }

        public double GetHeadingLockedTurnSensitivity()
        {
            return _settings.HeadingLockedTurnSensitivity;
        }

        public double GetPrototype3DCameraPitchDegrees()
        {
            return _settings.Prototype3DCameraPitchDegrees;
        }

        public void SetHeadingLockedTurnSensitivity(double sensitivity)
        {
            _settings.SetHeadingLockedTurnSensitivity((float)sensitivity);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        public void SetViewModeById(long viewModeId)
        {
            _settings.SetViewMode(PlayerViewMode.HeadingLocked);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        public void SetPrototype3DCameraPitchDegrees(double pitchDegrees)
        {
            _settings.SetPrototype3DCameraPitchDegrees((float)pitchDegrees);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        private void ApplyRuntimeState()
        {
            _player?.SetHeadingSensitivity(_settings.HeadingLockedTurnSensitivity);
            _player?.SetMoveSpeed(_settings.Prototype3DMoveSpeed);
            _cameraRig?.SetPitchDegrees(_settings.Prototype3DCameraPitchDegrees);
            _player?.SetGameplayInputEnabled(_pauseMenuState.CurrentScreen == MenuScreen.Closed);
            _crosshair?.SetPresentation(new PlayerPointerPresentation(
                CursorCaptureMode.HiddenCaptured,
                CrosshairMode.CenterForwardHint,
                UsesRelativeMouseInput: true));
            _pauseMenuOverlay?.ApplyState(
                _pauseMenuState.CurrentScreen,
                PlayerViewMode.HeadingLocked,
                _settings.HeadingLockedTurnSensitivity,
                _settings.Prototype3DMoveSpeed,
                _settings.Prototype3DCameraPitchDegrees);

            var allowGameplayPointer = _windowActive && _pauseMenuState.CurrentScreen == MenuScreen.Closed;
            Input.MouseMode = allowGameplayPointer ? Input.MouseModeEnum.Captured : Input.MouseModeEnum.Visible;
            if (_crosshair != null)
            {
                _crosshair.Visible = allowGameplayPointer;
            }
        }

        private void RestrictPauseMenuToHeadingLocked()
        {
            var option = GetNodeOrNull<OptionButton>("Hud/PauseMenuOverlay/Panel/Root/SettingsContent/ViewModeOption");
            if (option == null)
            {
                return;
            }

            option.Clear();
            option.AddItem("Heading Locked 3D", (int)PlayerViewMode.HeadingLocked);
            option.Select(0);
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
            _settings.SetViewMode(PlayerViewMode.HeadingLocked);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        private void OnHeadingSensitivityChanged(double sensitivity)
        {
            _settings.SetHeadingLockedTurnSensitivity((float)sensitivity);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        private void OnPrototype3DMoveSpeedChanged(double moveSpeed)
        {
            _settings.SetPrototype3DMoveSpeed((float)moveSpeed);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        private void OnPrototype3DCameraPitchChanged(double pitchDegrees)
        {
            _settings.SetPrototype3DCameraPitchDegrees((float)pitchDegrees);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        private void OnExitRequested()
        {
            GetTree().Quit();
        }
    }
}
