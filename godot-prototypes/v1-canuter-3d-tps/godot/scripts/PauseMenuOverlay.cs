using System;
using Godot;

namespace Canuter
{
    public partial class PauseMenuOverlay : Control
    {
        [Signal]
        public delegate void SettingsRequestedEventHandler();

        [Signal]
        public delegate void BackRequestedEventHandler();

        [Signal]
        public delegate void LoadDefaultsRequestedEventHandler();

        [Signal]
        public delegate void HeadingSensitivityChangedEventHandler(double sensitivity);

        [Signal]
        public delegate void Prototype3DMoveSpeedChangedEventHandler(double moveSpeed);

        [Signal]
        public delegate void Prototype3DGravityChangedEventHandler(double gravity);

        [Signal]
        public delegate void Prototype3DJumpVelocityChangedEventHandler(double jumpVelocity);

        [Signal]
        public delegate void Prototype3DCameraOrbitDistanceChangedEventHandler(double orbitDistance);

        [Signal]
        public delegate void Prototype3DCameraZoomRailPitchDegreesChangedEventHandler(double zoomRailPitchDegrees);

        [Signal]
        public delegate void Prototype3DCameraMinOrbitDistanceChangedEventHandler(double minOrbitDistance);

        [Signal]
        public delegate void Prototype3DCameraMaxOrbitDistanceChangedEventHandler(double maxOrbitDistance);

        [Signal]
        public delegate void Prototype3DCameraZoomStepChangedEventHandler(double zoomStep);

        [Signal]
        public delegate void Prototype3DCameraLookAheadDistanceChangedEventHandler(double lookAheadDistance);

        [Signal]
        public delegate void Prototype3DCameraFovChangedEventHandler(double fov);

        [Signal]
        public delegate void PersistentImpactMarkersChangedEventHandler(bool enabled);

        [Signal]
        public delegate void ExitRequestedEventHandler();

        private VBoxContainer _pauseContent = null!;
        private ScrollContainer _settingsScroll = null!;
        private VBoxContainer _settingsContent = null!;
        private SpinBox _headingSensitivitySpinBox = null!;
        private SpinBox _prototype3DMoveSpeedSpinBox = null!;
        private SpinBox _prototype3DGravitySpinBox = null!;
        private SpinBox _prototype3DJumpVelocitySpinBox = null!;
        private SpinBox _prototype3DCameraOrbitDistanceSpinBox = null!;
        private SpinBox _prototype3DCameraZoomRailPitchDegreesSpinBox = null!;
        private SpinBox _prototype3DCameraMinOrbitDistanceSpinBox = null!;
        private SpinBox _prototype3DCameraMaxOrbitDistanceSpinBox = null!;
        private SpinBox _prototype3DCameraZoomStepSpinBox = null!;
        private SpinBox _prototype3DCameraLookAheadDistanceSpinBox = null!;
        private SpinBox _prototype3DCameraFovSpinBox = null!;
        private CheckBox _persistentImpactMarkersCheckBox = null!;
        private bool _isApplyingState;

        public override void _Ready()
        {
            ProcessMode = ProcessModeEnum.Always;
            SetAnchorsPreset(LayoutPreset.FullRect);

            _pauseContent = GetNode<VBoxContainer>("Panel/Root/PauseContent");
            _settingsScroll = GetNode<ScrollContainer>("Panel/Root/SettingsScroll");
            _settingsContent = GetNode<VBoxContainer>("Panel/Root/SettingsScroll/SettingsContent");
            _headingSensitivitySpinBox = GetNode<SpinBox>("Panel/Root/SettingsScroll/SettingsContent/HeadingSensitivitySpinBox");
            _prototype3DMoveSpeedSpinBox = GetNode<SpinBox>("Panel/Root/SettingsScroll/SettingsContent/Prototype3DMoveSpeedSpinBox");
            _prototype3DGravitySpinBox = GetNode<SpinBox>("Panel/Root/SettingsScroll/SettingsContent/Prototype3DGravitySpinBox");
            _prototype3DJumpVelocitySpinBox = GetNode<SpinBox>("Panel/Root/SettingsScroll/SettingsContent/Prototype3DJumpVelocitySpinBox");
            _prototype3DCameraOrbitDistanceSpinBox = GetNode<SpinBox>("Panel/Root/SettingsScroll/SettingsContent/Prototype3DCameraOrbitDistanceSpinBox");
            _prototype3DCameraZoomRailPitchDegreesSpinBox = GetNode<SpinBox>("Panel/Root/SettingsScroll/SettingsContent/Prototype3DCameraZoomRailPitchDegreesSpinBox");
            _prototype3DCameraMinOrbitDistanceSpinBox = GetNode<SpinBox>("Panel/Root/SettingsScroll/SettingsContent/Prototype3DCameraMinOrbitDistanceSpinBox");
            _prototype3DCameraMaxOrbitDistanceSpinBox = GetNode<SpinBox>("Panel/Root/SettingsScroll/SettingsContent/Prototype3DCameraMaxOrbitDistanceSpinBox");
            _prototype3DCameraZoomStepSpinBox = GetNode<SpinBox>("Panel/Root/SettingsScroll/SettingsContent/Prototype3DCameraZoomStepSpinBox");
            _prototype3DCameraLookAheadDistanceSpinBox = GetNode<SpinBox>("Panel/Root/SettingsScroll/SettingsContent/Prototype3DCameraLookAheadDistanceSpinBox");
            _prototype3DCameraFovSpinBox = GetNode<SpinBox>("Panel/Root/SettingsScroll/SettingsContent/Prototype3DCameraFovSpinBox");
            _persistentImpactMarkersCheckBox = GetNode<CheckBox>("Panel/Root/SettingsScroll/SettingsContent/PersistentImpactMarkersCheckBox");

            var settingsButton = GetNode<Button>("Panel/Root/PauseContent/SettingsButton");
            var exitButton = GetNode<Button>("Panel/Root/PauseContent/ExitButton");
            var loadDefaultsButton = GetNode<Button>("Panel/Root/SettingsScroll/SettingsContent/LoadDefaultsButton");
            var backButton = GetNode<Button>("Panel/Root/SettingsScroll/SettingsContent/BackButton");

            settingsButton.Pressed += () => EmitSignal(SignalName.SettingsRequested);
            exitButton.Pressed += () => EmitSignal(SignalName.ExitRequested);
            loadDefaultsButton.Pressed += () => EmitSignal(SignalName.LoadDefaultsRequested);
            backButton.Pressed += () => EmitSignal(SignalName.BackRequested);

            _headingSensitivitySpinBox.MinValue = GameSettings.MinHeadingLockedTurnSensitivity;
            _headingSensitivitySpinBox.MaxValue = GameSettings.MaxHeadingLockedTurnSensitivity;
            _headingSensitivitySpinBox.Step = 0.0001f;
            _headingSensitivitySpinBox.ValueChanged += OnHeadingSensitivityChanged;
            _prototype3DMoveSpeedSpinBox.MinValue = GameSettings.MinPrototype3DMoveSpeed;
            _prototype3DMoveSpeedSpinBox.MaxValue = GameSettings.MaxPrototype3DMoveSpeed;
            _prototype3DMoveSpeedSpinBox.Step = 0.5f;
            _prototype3DMoveSpeedSpinBox.ValueChanged += OnPrototype3DMoveSpeedChanged;
            _prototype3DGravitySpinBox.MinValue = GameSettings.MinPrototype3DGravity;
            _prototype3DGravitySpinBox.MaxValue = GameSettings.MaxPrototype3DGravity;
            _prototype3DGravitySpinBox.Step = 0.5f;
            _prototype3DGravitySpinBox.ValueChanged += OnPrototype3DGravityChanged;
            _prototype3DJumpVelocitySpinBox.MinValue = GameSettings.MinPrototype3DJumpVelocity;
            _prototype3DJumpVelocitySpinBox.MaxValue = GameSettings.MaxPrototype3DJumpVelocity;
            _prototype3DJumpVelocitySpinBox.Step = 0.25f;
            _prototype3DJumpVelocitySpinBox.ValueChanged += OnPrototype3DJumpVelocityChanged;
            _prototype3DCameraOrbitDistanceSpinBox.MinValue = GameSettings.MinPrototype3DCameraOrbitDistance;
            _prototype3DCameraOrbitDistanceSpinBox.MaxValue = GameSettings.MaxPrototype3DCameraOrbitDistance;
            _prototype3DCameraOrbitDistanceSpinBox.Step = 0.25f;
            _prototype3DCameraOrbitDistanceSpinBox.ValueChanged += OnPrototype3DCameraOrbitDistanceChanged;
            _prototype3DCameraZoomRailPitchDegreesSpinBox.MinValue = GameSettings.MinPrototype3DCameraZoomRailPitchDegrees;
            _prototype3DCameraZoomRailPitchDegreesSpinBox.MaxValue = GameSettings.MaxPrototype3DCameraZoomRailPitchDegrees;
            _prototype3DCameraZoomRailPitchDegreesSpinBox.Step = 1.0f;
            _prototype3DCameraZoomRailPitchDegreesSpinBox.ValueChanged += OnPrototype3DCameraZoomRailPitchDegreesChanged;
            _prototype3DCameraMinOrbitDistanceSpinBox.MinValue = GameSettings.MinPrototype3DCameraOrbitDistance;
            _prototype3DCameraMinOrbitDistanceSpinBox.MaxValue = GameSettings.MaxPrototype3DCameraOrbitDistance;
            _prototype3DCameraMinOrbitDistanceSpinBox.Step = 0.25f;
            _prototype3DCameraMinOrbitDistanceSpinBox.ValueChanged += OnPrototype3DCameraMinOrbitDistanceChanged;
            _prototype3DCameraMaxOrbitDistanceSpinBox.MinValue = GameSettings.MinPrototype3DCameraOrbitDistance;
            _prototype3DCameraMaxOrbitDistanceSpinBox.MaxValue = GameSettings.MaxPrototype3DCameraOrbitDistance;
            _prototype3DCameraMaxOrbitDistanceSpinBox.Step = 0.5f;
            _prototype3DCameraMaxOrbitDistanceSpinBox.ValueChanged += OnPrototype3DCameraMaxOrbitDistanceChanged;
            _prototype3DCameraZoomStepSpinBox.MinValue = GameSettings.MinPrototype3DCameraZoomStep;
            _prototype3DCameraZoomStepSpinBox.MaxValue = GameSettings.MaxPrototype3DCameraZoomStep;
            _prototype3DCameraZoomStepSpinBox.Step = 0.1f;
            _prototype3DCameraZoomStepSpinBox.ValueChanged += OnPrototype3DCameraZoomStepChanged;
            _prototype3DCameraLookAheadDistanceSpinBox.MinValue = GameSettings.MinPrototype3DCameraLookAheadDistance;
            _prototype3DCameraLookAheadDistanceSpinBox.MaxValue = GameSettings.MaxPrototype3DCameraLookAheadDistance;
            _prototype3DCameraLookAheadDistanceSpinBox.Step = 0.5f;
            _prototype3DCameraLookAheadDistanceSpinBox.ValueChanged += OnPrototype3DCameraLookAheadDistanceChanged;
            _prototype3DCameraFovSpinBox.MinValue = GameSettings.MinPrototype3DCameraFov;
            _prototype3DCameraFovSpinBox.MaxValue = GameSettings.MaxPrototype3DCameraFov;
            _prototype3DCameraFovSpinBox.Step = 1.0f;
            _prototype3DCameraFovSpinBox.ValueChanged += OnPrototype3DCameraFovChanged;
            _persistentImpactMarkersCheckBox.Toggled += OnPersistentImpactMarkersToggled;
        }

        public void ApplyState(MenuScreen screen, GameSettings settings)
        {
            Visible = screen != MenuScreen.Closed;
            _pauseContent.Visible = screen == MenuScreen.Pause;
            _settingsScroll.Visible = screen == MenuScreen.Settings;

            _isApplyingState = true;
            try
            {
                _headingSensitivitySpinBox.Value = settings.HeadingLockedTurnSensitivity;
                _prototype3DMoveSpeedSpinBox.Value = settings.Prototype3DMoveSpeed;
                _prototype3DGravitySpinBox.Value = settings.Prototype3DGravity;
                _prototype3DJumpVelocitySpinBox.Value = settings.Prototype3DJumpVelocity;
                _prototype3DCameraOrbitDistanceSpinBox.Value = settings.Prototype3DCameraOrbitDistance;
                _prototype3DCameraZoomRailPitchDegreesSpinBox.Value = settings.Prototype3DCameraZoomRailPitchDegrees;
                _prototype3DCameraMinOrbitDistanceSpinBox.Value = settings.Prototype3DCameraMinOrbitDistance;
                _prototype3DCameraMaxOrbitDistanceSpinBox.Value = settings.Prototype3DCameraMaxOrbitDistance;
                _prototype3DCameraZoomStepSpinBox.Value = settings.Prototype3DCameraZoomStep;
                _prototype3DCameraLookAheadDistanceSpinBox.Value = settings.Prototype3DCameraLookAheadDistance;
                _prototype3DCameraFovSpinBox.Value = settings.Prototype3DCameraFov;
                _persistentImpactMarkersCheckBox.ButtonPressed = settings.PersistentImpactMarkersEnabled;
                _settingsScroll.ScrollVertical = 0;
            }
            finally
            {
                _isApplyingState = false;
            }
        }

        private void OnHeadingSensitivityChanged(double value)
        {
            if (_isApplyingState)
            {
                return;
            }

            EmitSignal(SignalName.HeadingSensitivityChanged, value);
        }

        private void OnPrototype3DMoveSpeedChanged(double value)
        {
            if (_isApplyingState)
            {
                return;
            }

            EmitSignal(SignalName.Prototype3DMoveSpeedChanged, value);
        }

        private void OnPrototype3DGravityChanged(double value)
        {
            if (_isApplyingState)
            {
                return;
            }

            EmitSignal(SignalName.Prototype3DGravityChanged, value);
        }

        private void OnPrototype3DJumpVelocityChanged(double value)
        {
            if (_isApplyingState)
            {
                return;
            }

            EmitSignal(SignalName.Prototype3DJumpVelocityChanged, value);
        }

        private void OnPrototype3DCameraOrbitDistanceChanged(double value)
        {
            if (_isApplyingState)
            {
                return;
            }

            EmitSignal(SignalName.Prototype3DCameraOrbitDistanceChanged, value);
        }

        private void OnPrototype3DCameraZoomRailPitchDegreesChanged(double value)
        {
            if (_isApplyingState)
            {
                return;
            }

            EmitSignal(SignalName.Prototype3DCameraZoomRailPitchDegreesChanged, value);
        }

        private void OnPrototype3DCameraMinOrbitDistanceChanged(double value)
        {
            if (_isApplyingState)
            {
                return;
            }

            EmitSignal(SignalName.Prototype3DCameraMinOrbitDistanceChanged, value);
        }

        private void OnPrototype3DCameraMaxOrbitDistanceChanged(double value)
        {
            if (_isApplyingState)
            {
                return;
            }

            EmitSignal(SignalName.Prototype3DCameraMaxOrbitDistanceChanged, value);
        }

        private void OnPrototype3DCameraZoomStepChanged(double value)
        {
            if (_isApplyingState)
            {
                return;
            }

            EmitSignal(SignalName.Prototype3DCameraZoomStepChanged, value);
        }

        private void OnPrototype3DCameraLookAheadDistanceChanged(double value)
        {
            if (_isApplyingState)
            {
                return;
            }

            EmitSignal(SignalName.Prototype3DCameraLookAheadDistanceChanged, value);
        }

        private void OnPrototype3DCameraFovChanged(double value)
        {
            if (_isApplyingState)
            {
                return;
            }

            EmitSignal(SignalName.Prototype3DCameraFovChanged, value);
        }

        private void OnPersistentImpactMarkersToggled(bool pressed)
        {
            if (_isApplyingState)
            {
                return;
            }

            EmitSignal(SignalName.PersistentImpactMarkersChanged, pressed);
        }
    }
}
