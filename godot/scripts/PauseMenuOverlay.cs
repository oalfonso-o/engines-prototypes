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

        private VBoxContainer _pauseContent = null!;
        private VBoxContainer _settingsContent = null!;
        private OptionButton _viewModeOption = null!;
        private bool _isApplyingState;

        public override void _Ready()
        {
            ProcessMode = ProcessModeEnum.Always;
            SetAnchorsPreset(LayoutPreset.FullRect);

            _pauseContent = GetNode<VBoxContainer>("Panel/Root/PauseContent");
            _settingsContent = GetNode<VBoxContainer>("Panel/Root/SettingsContent");
            _viewModeOption = GetNode<OptionButton>("Panel/Root/SettingsContent/ViewModeOption");

            var settingsButton = GetNode<Button>("Panel/Root/PauseContent/SettingsButton");
            var backButton = GetNode<Button>("Panel/Root/SettingsContent/BackButton");

            settingsButton.Pressed += () => EmitSignal(SignalName.SettingsRequested);
            backButton.Pressed += () => EmitSignal(SignalName.BackRequested);

            _viewModeOption.Clear();
            _viewModeOption.AddItem("TopDown Fixed", (int)PlayerViewMode.TopDownFixed);
            _viewModeOption.AddItem("Heading Locked", (int)PlayerViewMode.HeadingLocked);
            _viewModeOption.ItemSelected += OnViewModeItemSelected;
        }

        public void ApplyState(MenuScreen screen, PlayerViewMode viewMode)
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
    }
}
