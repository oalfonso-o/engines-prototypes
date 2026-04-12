namespace Canuter
{
    public enum CursorCaptureMode
    {
        HiddenFree,
        HiddenCaptured,
    }

    public enum CrosshairMode
    {
        FreeMouse,
        CenterForwardHint,
    }

    public readonly record struct PlayerPointerPresentation(
        CursorCaptureMode CursorCaptureMode,
        CrosshairMode CrosshairMode,
        bool UsesRelativeMouseInput);
}
