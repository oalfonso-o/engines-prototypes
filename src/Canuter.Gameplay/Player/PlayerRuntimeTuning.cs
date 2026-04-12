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
    }
}
