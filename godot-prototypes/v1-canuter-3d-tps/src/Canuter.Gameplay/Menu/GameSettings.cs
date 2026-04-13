namespace Canuter
{
    public sealed class GameSettings
    {
        public const float MinHeadingLockedTurnSensitivity = 0.0001f;
        public const float MaxHeadingLockedTurnSensitivity = 0.02f;
        public const float MinPrototype3DMoveSpeed = 8.0f;
        public const float MaxPrototype3DMoveSpeed = 60.0f;
        public const float MinPrototype3DGravity = 5.0f;
        public const float MaxPrototype3DGravity = 80.0f;
        public const float MinPrototype3DJumpVelocity = 2.0f;
        public const float MaxPrototype3DJumpVelocity = 30.0f;
        public const float MinPrototype3DCameraOrbitDistance = 0.05f;
        public const float MaxPrototype3DCameraOrbitDistance = 80.0f;
        public const float MinPrototype3DCameraZoomRailPitchDegrees = 0.0f;
        public const float MaxPrototype3DCameraZoomRailPitchDegrees = 89.0f;
        public const float MinPrototype3DCameraZoomStep = 0.1f;
        public const float MaxPrototype3DCameraZoomStep = 10.0f;
        public const float MinPrototype3DCameraLookAheadDistance = 1.0f;
        public const float MaxPrototype3DCameraLookAheadDistance = 120.0f;
        public const float MinPrototype3DCameraFov = 20.0f;
        public const float MaxPrototype3DCameraFov = 110.0f;

        public float HeadingLockedTurnSensitivity { get; private set; } = PlayerRuntimeTuning.HeadingLockedMouseRadiansPerPixel;
        public float Prototype3DMoveSpeed { get; private set; } = PlayerRuntimeTuning.Prototype3DMoveSpeed;
        public float Prototype3DGravity { get; private set; } = PlayerRuntimeTuning.Prototype3DGravity;
        public float Prototype3DJumpVelocity { get; private set; } = PlayerRuntimeTuning.Prototype3DJumpVelocity;
        public float Prototype3DCameraMinOrbitDistance { get; private set; } = PlayerRuntimeTuning.Prototype3DCameraMinOrbitDistance;
        public float Prototype3DCameraMaxOrbitDistance { get; private set; } = PlayerRuntimeTuning.Prototype3DCameraMaxOrbitDistance;
        public float Prototype3DCameraOrbitDistance { get; private set; } = PlayerRuntimeTuning.Prototype3DCameraOrbitDistance;
        public float Prototype3DCameraZoomRailPitchDegrees { get; private set; } = PlayerRuntimeTuning.Prototype3DCameraZoomRailPitchDegrees;
        public float Prototype3DCameraZoomStep { get; private set; } = PlayerRuntimeTuning.Prototype3DCameraZoomStep;
        public float Prototype3DCameraLookAheadDistance { get; private set; } = PlayerRuntimeTuning.Prototype3DCameraLookAheadDistance;
        public float Prototype3DCameraFov { get; private set; } = PlayerRuntimeTuning.Prototype3DCameraFov;
        public bool PersistentImpactMarkersEnabled { get; private set; } = PlayerRuntimeTuning.Prototype3DPersistentImpactMarkersEnabled;

        public void ResetToDefaults()
        {
            HeadingLockedTurnSensitivity = PlayerRuntimeTuning.HeadingLockedMouseRadiansPerPixel;
            Prototype3DMoveSpeed = PlayerRuntimeTuning.Prototype3DMoveSpeed;
            Prototype3DGravity = PlayerRuntimeTuning.Prototype3DGravity;
            Prototype3DJumpVelocity = PlayerRuntimeTuning.Prototype3DJumpVelocity;
            Prototype3DCameraMinOrbitDistance = PlayerRuntimeTuning.Prototype3DCameraMinOrbitDistance;
            Prototype3DCameraMaxOrbitDistance = PlayerRuntimeTuning.Prototype3DCameraMaxOrbitDistance;
            Prototype3DCameraOrbitDistance = PlayerRuntimeTuning.Prototype3DCameraOrbitDistance;
            Prototype3DCameraZoomRailPitchDegrees = PlayerRuntimeTuning.Prototype3DCameraZoomRailPitchDegrees;
            Prototype3DCameraZoomStep = PlayerRuntimeTuning.Prototype3DCameraZoomStep;
            Prototype3DCameraLookAheadDistance = PlayerRuntimeTuning.Prototype3DCameraLookAheadDistance;
            Prototype3DCameraFov = PlayerRuntimeTuning.Prototype3DCameraFov;
            PersistentImpactMarkersEnabled = PlayerRuntimeTuning.Prototype3DPersistentImpactMarkersEnabled;
        }

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

        public void SetPrototype3DCameraOrbitDistance(float orbitDistance)
        {
            Prototype3DCameraOrbitDistance = float.Clamp(
                orbitDistance,
                Prototype3DCameraMinOrbitDistance,
                Prototype3DCameraMaxOrbitDistance);
        }

        public void SetPrototype3DCameraMinOrbitDistance(float minOrbitDistance)
        {
            Prototype3DCameraMinOrbitDistance = float.Clamp(
                minOrbitDistance,
                MinPrototype3DCameraOrbitDistance,
                MaxPrototype3DCameraOrbitDistance);

            if (Prototype3DCameraMaxOrbitDistance < Prototype3DCameraMinOrbitDistance)
            {
                Prototype3DCameraMaxOrbitDistance = Prototype3DCameraMinOrbitDistance;
            }

            SetPrototype3DCameraOrbitDistance(Prototype3DCameraOrbitDistance);
        }

        public void SetPrototype3DCameraMaxOrbitDistance(float maxOrbitDistance)
        {
            Prototype3DCameraMaxOrbitDistance = float.Clamp(
                maxOrbitDistance,
                MinPrototype3DCameraOrbitDistance,
                MaxPrototype3DCameraOrbitDistance);

            if (Prototype3DCameraMinOrbitDistance > Prototype3DCameraMaxOrbitDistance)
            {
                Prototype3DCameraMinOrbitDistance = Prototype3DCameraMaxOrbitDistance;
            }

            SetPrototype3DCameraOrbitDistance(Prototype3DCameraOrbitDistance);
        }

        public void SetPrototype3DCameraZoomRailPitchDegrees(float zoomRailPitchDegrees)
        {
            Prototype3DCameraZoomRailPitchDegrees = float.Clamp(
                zoomRailPitchDegrees,
                MinPrototype3DCameraZoomRailPitchDegrees,
                MaxPrototype3DCameraZoomRailPitchDegrees);
        }

        public void SetPrototype3DCameraZoomStep(float zoomStep)
        {
            Prototype3DCameraZoomStep = float.Clamp(
                zoomStep,
                MinPrototype3DCameraZoomStep,
                MaxPrototype3DCameraZoomStep);
        }

        public void SetPrototype3DCameraLookAheadDistance(float lookAheadDistance)
        {
            Prototype3DCameraLookAheadDistance = float.Clamp(
                lookAheadDistance,
                MinPrototype3DCameraLookAheadDistance,
                MaxPrototype3DCameraLookAheadDistance);
        }

        public void SetPrototype3DCameraFov(float fov)
        {
            Prototype3DCameraFov = float.Clamp(
                fov,
                MinPrototype3DCameraFov,
                MaxPrototype3DCameraFov);
        }

        public void SetPersistentImpactMarkersEnabled(bool enabled)
        {
            PersistentImpactMarkersEnabled = enabled;
        }
    }
}
