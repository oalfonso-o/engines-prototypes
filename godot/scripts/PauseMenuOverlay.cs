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

        private VBoxContainer _pauseContent = null!;
        private VBoxContainer _settingsContent = null!;
        private OptionButton _viewModeOption = null!;
        private SpinBox _headingSensitivitySpinBox = null!;
        private bool _isApplyingState;

        public override void _Ready()
        {
            ProcessMode = ProcessModeEnum.Always;
            SetAnchorsPreset(LayoutPreset.FullRect);

            _pauseContent = GetNode<VBoxContainer>("Panel/Root/PauseContent");
            _settingsContent = GetNode<VBoxContainer>("Panel/Root/SettingsContent");
            _viewModeOption = GetNode<OptionButton>("Panel/Root/SettingsContent/ViewModeOption");
            _headingSensitivitySpinBox = GetNode<SpinBox>("Panel/Root/SettingsContent/HeadingSensitivitySpinBox");

            var settingsButton = GetNode<Button>("Panel/Root/PauseContent/SettingsButton");
            var backButton = GetNode<Button>("Panel/Root/SettingsContent/BackButton");

            settingsButton.Pressed += () => EmitSignal(SignalName.SettingsRequested);
            backButton.Pressed += () => EmitSignal(SignalName.BackRequested);

            _viewModeOption.Clear();
            _viewModeOption.AddItem("TopDown Fixed", (int)PlayerViewMode.TopDownFixed);
            _viewModeOption.AddItem("Heading Locked", (int)PlayerViewMode.HeadingLocked);
            _viewModeOption.ItemSelected += OnViewModeItemSelected;
            _headingSensitivitySpinBox.MinValue = GameSettings.MinHeadingLockedTurnSensitivity;
            _headingSensitivitySpinBox.MaxValue = GameSettings.MaxHeadingLockedTurnSensitivity;
            _headingSensitivitySpinBox.Step = 0.0005f;
            _headingSensitivitySpinBox.ValueChanged += OnHeadingSensitivityChanged;
        }

        public void ApplyState(MenuScreen screen, PlayerViewMode viewMode, float headingLockedTurnSensitivity)
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
    }
}
