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
            _pauseMenuState = new PauseMenuState();

            if (_pauseMenuOverlay != null)
            {
                _pauseMenuOverlay.SettingsRequested += OnPauseSettingsRequested;
                _pauseMenuOverlay.BackRequested += OnPauseBackRequested;
                _pauseMenuOverlay.HeadingSensitivityChanged += OnHeadingSensitivityChanged;
                _pauseMenuOverlay.Prototype3DMoveSpeedChanged += OnPrototype3DMoveSpeedChanged;
                _pauseMenuOverlay.Prototype3DGravityChanged += OnPrototype3DGravityChanged;
                _pauseMenuOverlay.Prototype3DJumpVelocityChanged += OnPrototype3DJumpVelocityChanged;
                _pauseMenuOverlay.PersistentImpactMarkersChanged += OnPersistentImpactMarkersChanged;
                _pauseMenuOverlay.ExitRequested += OnExitRequested;
            }

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
                _player.BindAimCamera(_cameraRig.GameplayCamera);
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

        public double GetHeadingLockedTurnSensitivity()
        {
            return _settings.HeadingLockedTurnSensitivity;
        }

        public void SetHeadingLockedTurnSensitivity(double sensitivity)
        {
            _settings.SetHeadingLockedTurnSensitivity((float)sensitivity);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        public double GetPrototype3DGravity()
        {
            return _settings.Prototype3DGravity;
        }

        public double GetPrototype3DJumpVelocity()
        {
            return _settings.Prototype3DJumpVelocity;
        }

        public bool GetPersistentImpactMarkersEnabled()
        {
            return _settings.PersistentImpactMarkersEnabled;
        }

        public void SetPersistentImpactMarkersEnabled(bool enabled)
        {
            _settings.SetPersistentImpactMarkersEnabled(enabled);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        public void SetPrototype3DGravity(double gravity)
        {
            _settings.SetPrototype3DGravity((float)gravity);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        public void SetPrototype3DJumpVelocity(double jumpVelocity)
        {
            _settings.SetPrototype3DJumpVelocity((float)jumpVelocity);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        private void ApplyRuntimeState()
        {
            _player?.SetHeadingSensitivity(_settings.HeadingLockedTurnSensitivity);
            _player?.SetMoveSpeed(_settings.Prototype3DMoveSpeed);
            _player?.SetGravity(_settings.Prototype3DGravity);
            _player?.SetJumpVelocity(_settings.Prototype3DJumpVelocity);
            _player?.SetPersistentImpactMarkersEnabled(_settings.PersistentImpactMarkersEnabled);
            _player?.SetGameplayInputEnabled(_pauseMenuState.CurrentScreen == MenuScreen.Closed);
            _pauseMenuOverlay?.ApplyState(
                _pauseMenuState.CurrentScreen,
                _settings.HeadingLockedTurnSensitivity,
                _settings.Prototype3DMoveSpeed,
                _settings.Prototype3DGravity,
                _settings.Prototype3DJumpVelocity,
                _settings.PersistentImpactMarkersEnabled);

            var allowGameplayPointer = _windowActive && _pauseMenuState.CurrentScreen == MenuScreen.Closed;
            Input.MouseMode = allowGameplayPointer ? Input.MouseModeEnum.Captured : Input.MouseModeEnum.Visible;
            if (_crosshair != null)
            {
                _crosshair.Visible = allowGameplayPointer;
            }
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

        private void OnPrototype3DGravityChanged(double gravity)
        {
            _settings.SetPrototype3DGravity((float)gravity);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        private void OnPrototype3DJumpVelocityChanged(double jumpVelocity)
        {
            _settings.SetPrototype3DJumpVelocity((float)jumpVelocity);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        private void OnPersistentImpactMarkersChanged(bool enabled)
        {
            _settings.SetPersistentImpactMarkersEnabled(enabled);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        private void OnExitRequested()
        {
            GetTree().Quit();
        }
    }
}
