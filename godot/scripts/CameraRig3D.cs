using Godot;
using NumericVector3 = System.Numerics.Vector3;

namespace Canuter
{
    public partial class CameraRig3D : Node3D
    {
        private const int PitchConstraintIterations = 10;

        [Export]
        public float OrbitDistance { get; set; } = PlayerRuntimeTuning.Prototype3DCameraOrbitDistance;

        [Export]
        public float ZoomRailPitchDegrees { get; set; } = PlayerRuntimeTuning.Prototype3DCameraZoomRailPitchDegrees;

        [Export]
        public float MinOrbitDistance { get; set; } = PlayerRuntimeTuning.Prototype3DCameraMinOrbitDistance;

        [Export]
        public float MaxOrbitDistance { get; set; } = PlayerRuntimeTuning.Prototype3DCameraMaxOrbitDistance;

        [Export]
        public float ZoomStep { get; set; } = PlayerRuntimeTuning.Prototype3DCameraZoomStep;

        [Export]
        public float LookAheadDistance { get; set; } = PlayerRuntimeTuning.Prototype3DCameraLookAheadDistance;

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

            var constrainedPitchDegrees = ConstrainPitchDegreesToKeepPlayerFeetAtOrBelowCrosshair(_player.CurrentPitchDegrees);
            if (!Mathf.IsEqualApprox(constrainedPitchDegrees, _player.CurrentPitchDegrees))
            {
                _player.SetPitchDegrees(constrainedPitchDegrees);
            }

            _player.SetBodyOpacity(PlayerBodyFadeModel3D.ComputeOpacity(
                OrbitDistance,
                MinOrbitDistance,
                MaxOrbitDistance));
            ApplyFrame(ComputeFrame(constrainedPitchDegrees));
        }

        public void BindPlayer(PlayerController3D player)
        {
            _player = player;
        }

        public void SetPitchDegrees(float pitchDegrees)
        {
            ZoomRailPitchDegrees = Mathf.Clamp(pitchDegrees, 0.0f, 90.0f);
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

        public float GetZoomRailPitchDegrees()
        {
            return ZoomRailPitchDegrees;
        }

        public float GetMinOrbitDistance()
        {
            return MinOrbitDistance;
        }

        public float GetMaxOrbitDistance()
        {
            return MaxOrbitDistance;
        }

        public float GetZoomStep()
        {
            return ZoomStep;
        }

        public float GetLookAheadDistance()
        {
            return LookAheadDistance;
        }

        private float ConstrainPitchDegreesToKeepPlayerFeetAtOrBelowCrosshair(float desiredPitchDegrees)
        {
            if (desiredPitchDegrees <= 0.0f)
            {
                return desiredPitchDegrees;
            }

            var viewportHeight = _camera.GetViewport().GetVisibleRect().Size.Y;
            if (viewportHeight <= 0.0f)
            {
                return desiredPitchDegrees;
            }

            var centerY = viewportHeight * 0.5f;
            if (GetLowestBodyPointScreenY(desiredPitchDegrees) >= centerY)
            {
                return desiredPitchDegrees;
            }

            var low = 0.0f;
            var high = desiredPitchDegrees;
            for (var iteration = 0; iteration < PitchConstraintIterations; iteration++)
            {
                var mid = (low + high) * 0.5f;
                if (GetLowestBodyPointScreenY(mid) >= centerY)
                {
                    low = mid;
                }
                else
                {
                    high = mid;
                }
            }

            return low;
        }

        private float GetLowestBodyPointScreenY(float pitchDegrees)
        {
            if (_player == null)
            {
                return 0.0f;
            }

            ApplyFrame(ComputeFrame(pitchDegrees));
            return _camera.UnprojectPosition(_player.GetLowestBodyPointForTesting()).Y;
        }

        private CameraRigFrame3D ComputeFrame(float pitchDegrees)
        {
            if (_player == null)
            {
                return new CameraRigFrame3D(NumericVector3.Zero, NumericVector3.UnitZ);
            }

            return CameraRigModel3D.ComputeFrame(
                new NumericVector3(_player.CurrentShotOrigin3D.X, _player.CurrentShotOrigin3D.Y, _player.CurrentShotOrigin3D.Z),
                new NumericVector3(_player.CurrentForward3D.X, _player.CurrentForward3D.Y, _player.CurrentForward3D.Z),
                ComputeAimDirection(pitchDegrees),
                OrbitDistance,
                LookAheadDistance,
                ZoomRailPitchDegrees);
        }

        private NumericVector3 ComputeAimDirection(float pitchDegrees)
        {
            if (_player == null)
            {
                return NumericVector3.UnitZ;
            }

            var forward = _player.CurrentForward3D;
            var yawRadians = Mathf.Atan2(-forward.X, forward.Z);
            return ThirdPersonAimModel3D.AimDirectionFromYawPitch(yawRadians, pitchDegrees);
        }

        private void ApplyFrame(CameraRigFrame3D frame)
        {
            GlobalPosition = ToGodot(frame.CameraPosition);
            _camera.LookAt(ToGodot(frame.LookTarget), Godot.Vector3.Up);
        }

        private static Godot.Vector3 ToGodot(NumericVector3 value)
        {
            return new Godot.Vector3(value.X, value.Y, value.Z);
        }
    }
}
