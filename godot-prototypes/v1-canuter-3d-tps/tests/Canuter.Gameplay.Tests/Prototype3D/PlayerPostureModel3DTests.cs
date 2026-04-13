namespace Canuter.Gameplay.Tests.Prototype3D;

public sealed class PlayerPostureModel3DTests
{
    [Fact]
    public void ResolveRequestedPostureGivesPronePriorityOverCrouch()
    {
        var posture = PlayerPostureModel3D.ResolveRequestedPosture(crouchPressed: true, pronePressed: true);

        Assert.Equal(PlayerPosture3D.Prone, posture);
    }

    [Fact]
    public void CrouchTransitionUsesHalfSecondToReachHalfwayTarget()
    {
        var state = PlayerPostureModel3D.CreateInitialState();
        state = PlayerPostureModel3D.Retarget(state, PlayerPosture3D.Crouch);
        state = PlayerPostureModel3D.Advance(state, 0.5f);

        Assert.Equal(0.5f, state.CurrentValue, 6);
    }

    [Fact]
    public void ProneTransitionUsesHalfSecondToReachFullTarget()
    {
        var state = PlayerPostureModel3D.CreateInitialState();
        state = PlayerPostureModel3D.Retarget(state, PlayerPosture3D.Prone);
        state = PlayerPostureModel3D.Advance(state, 0.5f);

        Assert.Equal(1.0f, state.CurrentValue, 6);
    }

    [Fact]
    public void RetargetingFromProneToCrouchRestartsFromCurrentValue()
    {
        var state = PlayerPostureModel3D.CreateInitialState();
        state = PlayerPostureModel3D.Retarget(state, PlayerPosture3D.Prone);
        state = PlayerPostureModel3D.Advance(state, 0.25f);
        state = PlayerPostureModel3D.Retarget(state, PlayerPosture3D.Crouch);
        state = PlayerPostureModel3D.Advance(state, 0.5f);

        Assert.Equal(0.5f, state.CurrentValue, 6);
    }

    [Theory]
    [InlineData(PlayerPosture3D.Stand, false, 1.0f)]
    [InlineData(PlayerPosture3D.Stand, true, 0.55f)]
    [InlineData(PlayerPosture3D.Crouch, false, 0.55f)]
    [InlineData(PlayerPosture3D.Prone, false, 0.25f)]
    public void InstantMoveSpeedMultiplierUsesRequestedPosture(PlayerPosture3D posture, bool slowWalkPressed, float expectedMultiplier)
    {
        var multiplier = PlayerPostureModel3D.GetInstantMoveSpeedMultiplier(posture, slowWalkPressed);

        Assert.Equal(expectedMultiplier, multiplier, 6);
    }
}
