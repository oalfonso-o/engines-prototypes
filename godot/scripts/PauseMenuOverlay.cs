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
        public delegate void ViewModeSelectedEventHandler(long viewMode);

        [Signal]
        public delegate void HeadingSensitivityChangedEventHandler(double sensitivity);

        [Signal]
        public delegate void Prototype3DMoveSpeedChangedEventHandler(double moveSpeed);

        [Signal]
        public delegate void Prototype3DCameraPitchChangedEventHandler(double pitchDegrees);

        [Signal]
        public delegate void ExitRequestedEventHandler();

        private VBoxContainer _pauseContent = null!;
        private VBoxContainer _settingsContent = null!;
        private OptionButton _viewModeOption = null!;
        private SpinBox _headingSensitivitySpinBox = null!;
        private SpinBox _prototype3DMoveSpeedSpinBox = null!;
        private SpinBox _prototype3DCameraPitchSpinBox = null!;
        private bool _isApplyingState;

        public override void _Ready()
        {
            ProcessMode = ProcessModeEnum.Always;
            SetAnchorsPreset(LayoutPreset.FullRect);

            _pauseContent = GetNode<VBoxContainer>("Panel/Root/PauseContent");
            _settingsContent = GetNode<VBoxContainer>("Panel/Root/SettingsContent");
            _viewModeOption = GetNode<OptionButton>("Panel/Root/SettingsContent/ViewModeOption");
            _headingSensitivitySpinBox = GetNode<SpinBox>("Panel/Root/SettingsContent/HeadingSensitivitySpinBox");
            _prototype3DMoveSpeedSpinBox = GetNode<SpinBox>("Panel/Root/SettingsContent/Prototype3DMoveSpeedSpinBox");
            _prototype3DCameraPitchSpinBox = GetNode<SpinBox>("Panel/Root/SettingsContent/Prototype3DCameraPitchSpinBox");

            var settingsButton = GetNode<Button>("Panel/Root/PauseContent/SettingsButton");
            var exitButton = GetNode<Button>("Panel/Root/PauseContent/ExitButton");
            var backButton = GetNode<Button>("Panel/Root/SettingsContent/BackButton");

            settingsButton.Pressed += () => EmitSignal(SignalName.SettingsRequested);
            exitButton.Pressed += () => EmitSignal(SignalName.ExitRequested);
            backButton.Pressed += () => EmitSignal(SignalName.BackRequested);

            _viewModeOption.Clear();
            _viewModeOption.AddItem("TopDown Fixed", (int)PlayerViewMode.TopDownFixed);
            _viewModeOption.AddItem("Heading Locked", (int)PlayerViewMode.HeadingLocked);
            _viewModeOption.ItemSelected += OnViewModeItemSelected;
            _headingSensitivitySpinBox.MinValue = GameSettings.MinHeadingLockedTurnSensitivity;
            _headingSensitivitySpinBox.MaxValue = GameSettings.MaxHeadingLockedTurnSensitivity;
            _headingSensitivitySpinBox.Step = 0.0005f;
            _headingSensitivitySpinBox.ValueChanged += OnHeadingSensitivityChanged;
            _prototype3DMoveSpeedSpinBox.MinValue = GameSettings.MinPrototype3DMoveSpeed;
            _prototype3DMoveSpeedSpinBox.MaxValue = GameSettings.MaxPrototype3DMoveSpeed;
            _prototype3DMoveSpeedSpinBox.Step = 0.5f;
            _prototype3DMoveSpeedSpinBox.ValueChanged += OnPrototype3DMoveSpeedChanged;
            _prototype3DCameraPitchSpinBox.MinValue = GameSettings.MinPrototype3DCameraPitchDegrees;
            _prototype3DCameraPitchSpinBox.MaxValue = GameSettings.MaxPrototype3DCameraPitchDegrees;
            _prototype3DCameraPitchSpinBox.Step = 1.0f;
            _prototype3DCameraPitchSpinBox.ValueChanged += OnPrototype3DCameraPitchChanged;
        }

        public void ApplyState(MenuScreen screen, PlayerViewMode viewMode, float headingLockedTurnSensitivity, float prototype3DMoveSpeed, float prototype3DCameraPitchDegrees)
        {
            Visible = screen != MenuScreen.Closed;
            _pauseContent.Visible = screen == MenuScreen.Pause;
            _settingsContent.Visible = screen == MenuScreen.Settings;

            _isApplyingState = true;
            try
            {
                for (var i = 0; i < _viewModeOption.ItemCount; i++)
                {
                    if (_viewModeOption.GetItemId(i) != (int)viewMode)
                    {
                        continue;
                    }

                    _viewModeOption.Select(i);
                    break;
                }

                _headingSensitivitySpinBox.Value = headingLockedTurnSensitivity;
                _prototype3DMoveSpeedSpinBox.Value = prototype3DMoveSpeed;
                _prototype3DCameraPitchSpinBox.Value = prototype3DCameraPitchDegrees;
            }
            finally
            {
                _isApplyingState = false;
            }
        }

        private void OnViewModeItemSelected(long index)
        {
            if (_isApplyingState)
            {
                return;
            }

            var itemId = _viewModeOption.GetItemId((int)index);
            EmitSignal(SignalName.ViewModeSelected, itemId);
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

        private void OnPrototype3DCameraPitchChanged(double value)
        {
            if (_isApplyingState)
            {
                return;
            }

            EmitSignal(SignalName.Prototype3DCameraPitchChanged, value);
        }
    }
}
