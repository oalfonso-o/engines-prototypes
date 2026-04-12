namespace Canuter
{
    public enum VisibilityPresentationState3D
    {
        FrontVisible,
        FrontHiddenKnown,
        RearReadable,
    }

    public static class VisibilityPresentationModel3D
    {
        public static VisibilityPresentationState3D Classify(bool isInFrontHemisphere, bool passesVisibilityChecks)
        {
            if (!isInFrontHemisphere)
            {
                return VisibilityPresentationState3D.RearReadable;
            }

            return passesVisibilityChecks
                ? VisibilityPresentationState3D.FrontVisible
                : VisibilityPresentationState3D.FrontHiddenKnown;
        }
    }
}
