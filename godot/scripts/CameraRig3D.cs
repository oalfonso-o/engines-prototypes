using Godot;
using NumericVector3 = System.Numerics.Vector3;

namespace Canuter
{
    public partial class CameraRig3D : Node3D
    {
        [Export]
        public float OrbitDistance { get; set; } = PlayerRuntimeTuning.Prototype3DCameraOrbitDistance;

        [Export]
        public float PitchDegrees { get; set; } = PlayerRuntimeTuning.Prototype3DCameraPitchDegrees;

        [Export]
        public float MinOrbitDistance { get; set; } = PlayerRuntimeTuning.Prototype3DCameraMinOrbitDistance;

        [Export]
        public float MaxOrbitDistance { get; set; } = PlayerRuntimeTuning.Prototype3DCameraMaxOrbitDistance;

        [Export]
        public float ZoomStep { get; set; } = PlayerRuntimeTuning.Prototype3DCameraZoomStep;

        [Export]
        public float LookAheadDistance { get; set; } = 5.5f;

        [Export]
        public float LookHeight { get; set; } = 1.15f;

        private Camera3D _camera = null!;
        private PlayerController3D? _player;

        public Camera3D GameplayCamera => _camera;

        public override void _Ready()
        {
            _camera = GetNode<Camera3D>("Camera3D");
        }

        public override void _Process(double delta)
        {
            if (_player == null || _camera == null)
            {
                return;
            }

            var frame = CameraRigModel3D.ComputeFrame(
                new NumericVector3(_player.GlobalPosition.X, _player.GlobalPosition.Y, _player.GlobalPosition.Z),
                new NumericVector3(_player.CurrentForward3D.X, _player.CurrentForward3D.Y, _player.CurrentForward3D.Z),
                OrbitDistance,
                PitchDegrees,
                LookAheadDistance,
                LookHeight);

            GlobalPosition = ToGodot(frame.CameraPosition);
            _camera.LookAt(ToGodot(frame.LookTarget), Godot.Vector3.Up);
        }

        public void BindPlayer(PlayerController3D player)
        {
            _player = player;
        }

        public void SetPitchDegrees(float pitchDegrees)
        {
            PitchDegrees = Mathf.Clamp(pitchDegrees, 0.0f, 90.0f);
        }

        public void AdjustOrbitDistance(int direction)
        {
            if (direction == 0)
            {
                return;
            }

            OrbitDistance = Mathf.Clamp(
                OrbitDistance + direction * ZoomStep,
                MinOrbitDistance,
                MaxOrbitDistance);
        }

        public float GetOrbitDistance()
        {
            return OrbitDistance;
        }

        private static Godot.Vector3 ToGodot(NumericVector3 value)
        {
            return new Godot.Vector3(value.X, value.Y, value.Z);
        }
    }
}
