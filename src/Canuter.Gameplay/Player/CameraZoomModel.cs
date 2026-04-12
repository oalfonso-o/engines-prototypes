namespace Canuter
{
    public static class CameraZoomModel
    {
        public static float ZoomIn(float currentZoom)
        {
            return Clamp(currentZoom + PlayerRuntimeTuning.ZoomStep);
        }

        public static float ZoomOut(float currentZoom)
        {
            return Clamp(currentZoom - PlayerRuntimeTuning.ZoomStep);
        }

        public static float Clamp(float zoom)
        {
            return float.Clamp(zoom, PlayerRuntimeTuning.MinZoom, PlayerRuntimeTuning.MaxZoom);
        }
    }
}
