namespace Canuter
{
    public sealed class GameSettings
    {
        public const float MinHeadingLockedTurnSensitivity = 0.001f;
        public const float MaxHeadingLockedTurnSensitivity = 0.02f;
        public const float MinPrototype3DMoveSpeed = 8.0f;
        public const float MaxPrototype3DMoveSpeed = 60.0f;
        public const float MinPrototype3DGravity = 5.0f;
        public const float MaxPrototype3DGravity = 80.0f;
        public const float MinPrototype3DJumpVelocity = 2.0f;
        public const float MaxPrototype3DJumpVelocity = 30.0f;

        public float HeadingLockedTurnSensitivity { get; private set; } = PlayerRuntimeTuning.HeadingLockedMouseRadiansPerPixel;
        public float Prototype3DMoveSpeed { get; private set; } = PlayerRuntimeTuning.Prototype3DMoveSpeed;
        public float Prototype3DGravity { get; private set; } = PlayerRuntimeTuning.Prototype3DGravity;
        public float Prototype3DJumpVelocity { get; private set; } = PlayerRuntimeTuning.Prototype3DJumpVelocity;
        public bool PersistentImpactMarkersEnabled { get; private set; }

        public void SetHeadingLockedTurnSensitivity(float sensitivity)
        {
            HeadingLockedTurnSensitivity = float.Clamp(
                sensitivity,
                MinHeadingLockedTurnSensitivity,
                MaxHeadingLockedTurnSensitivity);
        }

        public void SetPrototype3DMoveSpeed(float moveSpeed)
        {
            Prototype3DMoveSpeed = float.Clamp(
                moveSpeed,
                MinPrototype3DMoveSpeed,
                MaxPrototype3DMoveSpeed);
        }

        public void SetPrototype3DGravity(float gravity)
        {
            Prototype3DGravity = float.Clamp(
                gravity,
                MinPrototype3DGravity,
                MaxPrototype3DGravity);
        }

        public void SetPrototype3DJumpVelocity(float jumpVelocity)
        {
            Prototype3DJumpVelocity = float.Clamp(
                jumpVelocity,
                MinPrototype3DJumpVelocity,
                MaxPrototype3DJumpVelocity);
        }

        public void SetPersistentImpactMarkersEnabled(bool enabled)
        {
            PersistentImpactMarkersEnabled = enabled;
        }
    }
}
