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
        private float _lastThirdPersonOrbitDistance = PlayerRuntimeTuning.Prototype3DCameraOrbitDistance;

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
                _pauseMenuOverlay.LoadDefaultsRequested += OnLoadDefaultsRequested;
                _pauseMenuOverlay.HeadingSensitivityChanged += OnHeadingSensitivityChanged;
                _pauseMenuOverlay.Prototype3DMoveSpeedChanged += OnPrototype3DMoveSpeedChanged;
                _pauseMenuOverlay.Prototype3DGravityChanged += OnPrototype3DGravityChanged;
                _pauseMenuOverlay.Prototype3DJumpVelocityChanged += OnPrototype3DJumpVelocityChanged;
                _pauseMenuOverlay.Prototype3DCameraOrbitDistanceChanged += OnPrototype3DCameraOrbitDistanceChanged;
                _pauseMenuOverlay.Prototype3DCameraZoomRailPitchDegreesChanged += OnPrototype3DCameraZoomRailPitchDegreesChanged;
                _pauseMenuOverlay.Prototype3DCameraMinOrbitDistanceChanged += OnPrototype3DCameraMinOrbitDistanceChanged;
                _pauseMenuOverlay.Prototype3DCameraMaxOrbitDistanceChanged += OnPrototype3DCameraMaxOrbitDistanceChanged;
                _pauseMenuOverlay.Prototype3DCameraZoomStepChanged += OnPrototype3DCameraZoomStepChanged;
                _pauseMenuOverlay.Prototype3DCameraLookAheadDistanceChanged += OnPrototype3DCameraLookAheadDistanceChanged;
                _pauseMenuOverlay.Prototype3DCameraFovChanged += OnPrototype3DCameraFovChanged;
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
                    SyncOrbitDistanceFromRig();
                    GetViewport().SetInputAsHandled();
                    return;
                }

                if (mouseButton.ButtonIndex == MouseButton.WheelDown)
                {
                    _cameraRig.AdjustOrbitDistance(1);
                    SyncOrbitDistanceFromRig();
                    GetViewport().SetInputAsHandled();
                    return;
                }
            }

            if (@event is not InputEventKey keyEvent || !keyEvent.Pressed || keyEvent.Echo)
            {
                return;
            }

            if (keyEvent.Keycode == Key.V &&
                _pauseMenuState.CurrentScreen == MenuScreen.Closed &&
                _cameraRig != null)
            {
                TogglePerspectiveView();
                GetViewport().SetInputAsHandled();
                return;
            }

            if (keyEvent.Keycode != Key.Escape)
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

        public double GetPrototype3DCameraOrbitDistance()
        {
            return _settings.Prototype3DCameraOrbitDistance;
        }

        public double GetPrototype3DCameraZoomRailPitchDegrees()
        {
            return _settings.Prototype3DCameraZoomRailPitchDegrees;
        }

        public double GetPrototype3DCameraMinOrbitDistance()
        {
            return _settings.Prototype3DCameraMinOrbitDistance;
        }

        public double GetPrototype3DCameraMaxOrbitDistance()
        {
            return _settings.Prototype3DCameraMaxOrbitDistance;
        }

        public double GetPrototype3DCameraZoomStep()
        {
            return _settings.Prototype3DCameraZoomStep;
        }

        public double GetPrototype3DCameraLookAheadDistance()
        {
            return _settings.Prototype3DCameraLookAheadDistance;
        }

        public double GetPrototype3DCameraFov()
        {
            return _settings.Prototype3DCameraFov;
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

        public void SetPrototype3DCameraOrbitDistance(double orbitDistance)
        {
            _settings.SetPrototype3DCameraOrbitDistance((float)orbitDistance);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        public void SetPrototype3DCameraZoomRailPitchDegrees(double zoomRailPitchDegrees)
        {
            _settings.SetPrototype3DCameraZoomRailPitchDegrees((float)zoomRailPitchDegrees);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        public void SetPrototype3DCameraMinOrbitDistance(double minOrbitDistance)
        {
            _settings.SetPrototype3DCameraMinOrbitDistance((float)minOrbitDistance);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        public void SetPrototype3DCameraMaxOrbitDistance(double maxOrbitDistance)
        {
            _settings.SetPrototype3DCameraMaxOrbitDistance((float)maxOrbitDistance);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        public void SetPrototype3DCameraZoomStep(double zoomStep)
        {
            _settings.SetPrototype3DCameraZoomStep((float)zoomStep);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        public void SetPrototype3DCameraLookAheadDistance(double lookAheadDistance)
        {
            _settings.SetPrototype3DCameraLookAheadDistance((float)lookAheadDistance);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        public void SetPrototype3DCameraFov(double fov)
        {
            _settings.SetPrototype3DCameraFov((float)fov);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        public void SetPrototype3DJumpVelocity(double jumpVelocity)
        {
            _settings.SetPrototype3DJumpVelocity((float)jumpVelocity);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        public void ResetRuntimeSettingsToDefaults()
        {
            _settings.ResetToDefaults();
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
            if (_cameraRig != null)
            {
                _cameraRig.MinOrbitDistance = _settings.Prototype3DCameraMinOrbitDistance;
                _cameraRig.MaxOrbitDistance = _settings.Prototype3DCameraMaxOrbitDistance;
                _cameraRig.OrbitDistance = float.Clamp(
                    _settings.Prototype3DCameraOrbitDistance,
                    _cameraRig.MinOrbitDistance,
                    _cameraRig.MaxOrbitDistance);
                _cameraRig.ZoomRailPitchDegrees = _settings.Prototype3DCameraZoomRailPitchDegrees;
                _cameraRig.ZoomStep = _settings.Prototype3DCameraZoomStep;
                _cameraRig.LookAheadDistance = _settings.Prototype3DCameraLookAheadDistance;
                _cameraRig.GameplayCamera.Fov = _settings.Prototype3DCameraFov;
                _lastThirdPersonOrbitDistance = float.Clamp(
                    _lastThirdPersonOrbitDistance,
                    _cameraRig.MinOrbitDistance,
                    _cameraRig.MaxOrbitDistance);
                RememberThirdPersonOrbitDistance(_cameraRig.GetOrbitDistance());
            }
            _pauseMenuOverlay?.ApplyState(
                _pauseMenuState.CurrentScreen,
                _settings);

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

        private void OnLoadDefaultsRequested()
        {
            ResetRuntimeSettingsToDefaults();
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

        private void OnPrototype3DCameraOrbitDistanceChanged(double orbitDistance)
        {
            _settings.SetPrototype3DCameraOrbitDistance((float)orbitDistance);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        private void OnPrototype3DCameraZoomRailPitchDegreesChanged(double zoomRailPitchDegrees)
        {
            _settings.SetPrototype3DCameraZoomRailPitchDegrees((float)zoomRailPitchDegrees);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        private void OnPrototype3DCameraMinOrbitDistanceChanged(double minOrbitDistance)
        {
            _settings.SetPrototype3DCameraMinOrbitDistance((float)minOrbitDistance);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        private void OnPrototype3DCameraMaxOrbitDistanceChanged(double maxOrbitDistance)
        {
            _settings.SetPrototype3DCameraMaxOrbitDistance((float)maxOrbitDistance);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        private void OnPrototype3DCameraZoomStepChanged(double zoomStep)
        {
            _settings.SetPrototype3DCameraZoomStep((float)zoomStep);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        private void OnPrototype3DCameraLookAheadDistanceChanged(double lookAheadDistance)
        {
            _settings.SetPrototype3DCameraLookAheadDistance((float)lookAheadDistance);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        private void OnPrototype3DCameraFovChanged(double fov)
        {
            _settings.SetPrototype3DCameraFov((float)fov);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        private void OnPersistentImpactMarkersChanged(bool enabled)
        {
            _settings.SetPersistentImpactMarkersEnabled(enabled);
            _settingsStore.Save(_settings);
            ApplyRuntimeState();
        }

        private void SyncOrbitDistanceFromRig()
        {
            if (_cameraRig == null)
            {
                return;
            }

            var orbitDistance = _cameraRig.GetOrbitDistance();
            RememberThirdPersonOrbitDistance(orbitDistance);
            _settings.SetPrototype3DCameraOrbitDistance(orbitDistance);
            _settingsStore.Save(_settings);
        }

        private void TogglePerspectiveView()
        {
            if (_cameraRig == null)
            {
                return;
            }

            if (IsFirstPersonViewActive())
            {
                var restoreDistance = float.Clamp(
                    _lastThirdPersonOrbitDistance,
                    _cameraRig.MinOrbitDistance,
                    _cameraRig.MaxOrbitDistance);
                if (restoreDistance <= _cameraRig.MinOrbitDistance + 0.001f)
                {
                    restoreDistance = float.Clamp(
                        PlayerRuntimeTuning.Prototype3DCameraOrbitDistance,
                        _cameraRig.MinOrbitDistance,
                        _cameraRig.MaxOrbitDistance);
                }

                _cameraRig.OrbitDistance = restoreDistance;
            }
            else
            {
                RememberThirdPersonOrbitDistance(_cameraRig.GetOrbitDistance());
                _cameraRig.OrbitDistance = _cameraRig.MinOrbitDistance;
            }

            SyncOrbitDistanceFromRig();
        }

        private bool IsFirstPersonViewActive()
        {
            if (_cameraRig == null)
            {
                return false;
            }

            return _cameraRig.GetOrbitDistance() <= _cameraRig.MinOrbitDistance + 0.001f;
        }

        private void RememberThirdPersonOrbitDistance(float orbitDistance)
        {
            if (_cameraRig == null)
            {
                return;
            }

            if (orbitDistance > _cameraRig.MinOrbitDistance + 0.001f)
            {
                _lastThirdPersonOrbitDistance = orbitDistance;
            }
        }

        private void OnExitRequested()
        {
            GetTree().Quit();
        }
    }
}
