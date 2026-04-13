namespace Canuter
{
    public static class PlayerRuntimeTuning
    {
        public const float MoveSpeed = 720.0f;
        public const float MoveAcceleration = 3000.0f;
        public const float MoveDeceleration = 14000.0f;
        public const float DefaultZoom = 0.82f;
        public const float MinZoom = 1.0f / 3.0f;
        public const float MaxZoom = 1.0f;
        public const float ZoomStep = 0.1f;
        public const float AimDeadzoneSquared = 0.0001f;
        public const float MovingAnimationThresholdSquared = 16.0f;
        public const float HeadingLockedMouseRadiansPerPixel = 0.001f;
        public const float HeadingLockedCameraUprightOffset = MathF.PI;
        public const float HeadingLockedCameraLookAheadDistance = 240.0f;
        public const float HeadingLockedStrafeTurnaroundAcceleration = 30000.0f;
        public const float HeadingLockedPerspectiveHorizonRatio = 0.28f;
        public const float HeadingLockedPerspectiveDepthFalloff = 360.0f;
        public const float HeadingLockedPerspectiveFieldOfViewRadians = MathF.PI;
        public const int HeadingLockedPerspectiveRayCount = 181;
        public const int HeadingLockedPerspectiveGridHalfLanes = 8;
        public const float HeadingLockedPerspectiveLaneWidth = 64.0f;
        public const float HeadingLockedPerspectiveMaxDepth = 1400.0f;
        public const float HeadingLockedPerspectiveBehindCullDepth = 48.0f;
        public const float HeadingLockedPerspectiveRearDepthFalloff = 220.0f;
        public const float HeadingLockedPerspectiveRearLateralExpand = 0.35f;
        public const float HeadingLockedPerspectiveWallHeight = 96.0f;
        public const float HeadingLockedPerspectiveTargetHeight = 72.0f;
        public const float HeadingLockedPerspectiveTargetRadius = 22.0f;
        public const float HeadingLockedPerspectiveMaxWallSliceDepthDelta = 140.0f;
        public const float Prototype3DMoveSpeed = 20.0f;
        public const float Prototype3DMoveAcceleration = 132.0f;
        public const float Prototype3DMoveDeceleration = 192.0f;
        public const float Prototype3DStrafeTurnaroundAcceleration = 420.0f;
        public const float Prototype3DGravity = 50.0f;
        public const float Prototype3DJumpVelocity = 20.0f;
        public const float Prototype3DPostureTransitionSeconds = 0.5f;
        public const float Prototype3DCrouchMoveSpeedMultiplier = 0.55f;
        public const float Prototype3DProneMoveSpeedMultiplier = 0.25f;
        public const float Prototype3DCameraPitchDegrees = 40.0f;
        public const float Prototype3DCameraOrbitDistance = 10.0f;
        public const float Prototype3DCameraMinOrbitDistance = 0.6f;
        public const float Prototype3DCameraMaxOrbitDistance = 10.0f;
        public const float Prototype3DCameraZoomStep = 1.0f;
        public const float Prototype3DCameraZoomRailPitchDegrees = 20.0f;
        public const float Prototype3DCameraLookAheadDistance = 100.0f;
        public const float Prototype3DCameraFov = 40.0f;
        public const bool Prototype3DPersistentImpactMarkersEnabled = true;
    }
}
