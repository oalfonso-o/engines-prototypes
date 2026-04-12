namespace Canuter
{
    public interface IPlayerViewModeController
    {
        PlayerViewMode Mode { get; }
        PlayerPointerPresentation PointerPresentation { get; }
        PlayerViewFrameResult Update(PlayerViewFrameInput input);
    }
}
