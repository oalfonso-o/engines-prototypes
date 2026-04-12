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
        public const float HeadingLockedMouseRadiansPerPixel = 0.0035f;
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
    }
}
