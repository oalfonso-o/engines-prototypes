using System.Numerics;

namespace Canuter.Gameplay.Tests.ViewModes;

public sealed class HeadingLockedProjectionModelTests
{
    [Fact]
    public void DepthZeroProjectsToPlayerAnchor()
    {
        var projected = HeadingLockedProjectionModel.ProjectPoint(
            new Vector2(640.0f, 520.0f),
            180.0f,
            360.0f,
            new Vector2(96.0f, 0.0f));

        Assert.Equal(new Vector2(736.0f, 520.0f), projected);
    }

    [Fact]
    public void GreaterDepthMovesPointTowardHorizonAndCenterline()
    {
        var near = HeadingLockedProjectionModel.ProjectPoint(
            new Vector2(640.0f, 520.0f),
            180.0f,
            360.0f,
            new Vector2(128.0f, 64.0f));
        var far = HeadingLockedProjectionModel.ProjectPoint(
            new Vector2(640.0f, 520.0f),
            180.0f,
            360.0f,
            new Vector2(128.0f, 640.0f));

        Assert.True(far.Y < near.Y, "Farther depth should move the point upward toward the horizon.");
        Assert.True(MathF.Abs(far.X - 640.0f) < MathF.Abs(near.X - 640.0f), "Farther depth should compress lateral distance toward the center.");
    }

    [Fact]
    public void SymmetricLateralPointsRemainSymmetricAroundCenter()
    {
        var left = HeadingLockedProjectionModel.ProjectPoint(
            new Vector2(640.0f, 520.0f),
            180.0f,
            360.0f,
            new Vector2(-192.0f, 240.0f));
        var right = HeadingLockedProjectionModel.ProjectPoint(
            new Vector2(640.0f, 520.0f),
            180.0f,
            360.0f,
            new Vector2(192.0f, 240.0f));

        Assert.Equal(640.0f - left.X, right.X - 640.0f, 4);
        Assert.Equal(left.Y, right.Y, 4);
    }

    [Fact]
    public void NegativeDepthIsClampedToPlayerPlane()
    {
        var projected = HeadingLockedProjectionModel.ProjectPoint(
            new Vector2(640.0f, 520.0f),
            180.0f,
            360.0f,
            new Vector2(-48.0f, -100.0f));

        Assert.Equal(new Vector2(592.0f, 520.0f), projected);
    }

    [Fact]
    public void WorldPointConvertsToHeadingLocalCoordinates()
    {
        var local = HeadingLockedProjectionModel.WorldToHeadingLocal(
            Vector2.Zero,
            Vector2.UnitY,
            new Vector2(96.0f, 240.0f));

        Assert.Equal(new Vector2(-96.0f, 240.0f), local);
    }

    [Fact]
    public void WorldToHeadingLocalRespectsRotatedHeading()
    {
        var local = HeadingLockedProjectionModel.WorldToHeadingLocal(
            new Vector2(100.0f, 100.0f),
            new Vector2(-1.0f, 0.0f),
            new Vector2(-220.0f, 36.0f));

        Assert.Equal(new Vector2(64.0f, 320.0f), local, new Vector2Comparer(0.0001f));
    }

    [Fact]
    public void ElevatedProjectionMovesPointUpFromGroundProjection()
    {
        var ground = HeadingLockedProjectionModel.ProjectPoint(
            new Vector2(640.0f, 520.0f),
            180.0f,
            360.0f,
            new Vector2(64.0f, 180.0f));
        var elevated = HeadingLockedProjectionModel.ProjectElevatedPoint(
            new Vector2(640.0f, 520.0f),
            180.0f,
            360.0f,
            new Vector2(64.0f, 180.0f),
            96.0f);

        Assert.Equal(ground.X, elevated.X, 4);
        Assert.True(elevated.Y < ground.Y, "Elevated projection should move upward on screen.");
    }

    [Fact]
    public void ElevatedProjectionShrinksWithDepth()
    {
        var nearGround = HeadingLockedProjectionModel.ProjectPoint(
            new Vector2(640.0f, 520.0f),
            180.0f,
            360.0f,
            new Vector2(0.0f, 60.0f));
        var nearTop = HeadingLockedProjectionModel.ProjectElevatedPoint(
            new Vector2(640.0f, 520.0f),
            180.0f,
            360.0f,
            new Vector2(0.0f, 60.0f),
            96.0f);
        var farGround = HeadingLockedProjectionModel.ProjectPoint(
            new Vector2(640.0f, 520.0f),
            180.0f,
            360.0f,
            new Vector2(0.0f, 600.0f));
        var farTop = HeadingLockedProjectionModel.ProjectElevatedPoint(
            new Vector2(640.0f, 520.0f),
            180.0f,
            360.0f,
            new Vector2(0.0f, 600.0f),
            96.0f);

        var nearLift = nearGround.Y - nearTop.Y;
        var farLift = farGround.Y - farTop.Y;
        Assert.True(nearLift > farLift, "Wall height should appear shorter as depth increases.");
    }

    [Fact]
    public void NearestEdgeUsesLowestAverageDepth()
    {
        var corners = new[]
        {
            new Vector2(-32.0f, 100.0f),
            new Vector2(32.0f, 100.0f),
            new Vector2(32.0f, 164.0f),
            new Vector2(-32.0f, 164.0f),
        };

        var edgeStart = HeadingLockedProjectionModel.FindNearestEdgeStartIndex(corners);

        Assert.Equal(0, edgeStart);
    }

    [Fact]
    public void WorldVectorTransformsIntoHeadingLocalBasis()
    {
        var local = HeadingLockedProjectionModel.WorldVectorToHeadingLocal(
            new Vector2(-1.0f, 0.0f),
            new Vector2(0.0f, -1.0f));

        Assert.Equal(new Vector2(1.0f, 0.0f), local);
    }

    [Fact]
    public void FaceVisibilityPrefersNormalsFacingCamera()
    {
        var visible = HeadingLockedProjectionModel.IsFaceVisibleToCamera(
            new Vector2(0.0f, 120.0f),
            new Vector2(0.0f, -1.0f));
        var hidden = HeadingLockedProjectionModel.IsFaceVisibleToCamera(
            new Vector2(0.0f, 120.0f),
            new Vector2(0.0f, 1.0f));

        Assert.True(visible);
        Assert.False(hidden);
    }

    [Fact]
    public void FrontHemisphereIncludesForwardPlane()
    {
        Assert.True(HeadingLockedProjectionModel.IsInFrontHemisphere(new Vector2(12.0f, 0.0f)));
        Assert.True(HeadingLockedProjectionModel.IsInFrontHemisphere(new Vector2(-64.0f, 180.0f)));
    }

    [Fact]
    public void RearHemisphereUsesNegativeDepth()
    {
        Assert.True(HeadingLockedProjectionModel.IsInRearHemisphere(new Vector2(0.0f, -0.01f)));
        Assert.False(HeadingLockedProjectionModel.IsInRearHemisphere(new Vector2(0.0f, 0.0f)));
    }

    [Fact]
    public void ElevatedQuadPreservesCornerOrderAndLiftsEachCorner()
    {
        var localGround = new[]
        {
            new Vector2(-32.0f, 80.0f),
            new Vector2(32.0f, 80.0f),
            new Vector2(32.0f, 144.0f),
            new Vector2(-32.0f, 144.0f),
        };

        var ground = HeadingLockedProjectionModel.ProjectQuad(
            new Vector2(640.0f, 520.0f),
            180.0f,
            360.0f,
            localGround);
        var top = HeadingLockedProjectionModel.ProjectElevatedQuad(
            new Vector2(640.0f, 520.0f),
            180.0f,
            360.0f,
            localGround,
            96.0f);

        Assert.Equal(ground.Length, top.Length);
        for (var i = 0; i < ground.Length; i++)
        {
            Assert.Equal(ground[i].X, top[i].X, 4);
            Assert.True(top[i].Y < ground[i].Y, $"Corner {i} should lift upward for the roof quad.");
        }
    }

    [Fact]
    public void RearProjectionMovesBehindPointsBelowAnchor()
    {
        var projected = HeadingLockedProjectionModel.ProjectRearPoint(
            new Vector2(640.0f, 520.0f),
            720.0f,
            220.0f,
            0.35f,
            new Vector2(64.0f, -180.0f));

        Assert.True(projected.Y > 520.0f);
        Assert.True(projected.X > 640.0f);
    }

    [Fact]
    public void FartherRearProjectionMovesLowerAndWider()
    {
        var near = HeadingLockedProjectionModel.ProjectRearPoint(
            new Vector2(640.0f, 520.0f),
            720.0f,
            220.0f,
            0.35f,
            new Vector2(96.0f, -80.0f));
        var far = HeadingLockedProjectionModel.ProjectRearPoint(
            new Vector2(640.0f, 520.0f),
            720.0f,
            220.0f,
            0.35f,
            new Vector2(96.0f, -480.0f));

        Assert.True(far.Y > near.Y, "Farther rear depth should move lower on screen.");
        Assert.True(MathF.Abs(far.X - 640.0f) > MathF.Abs(near.X - 640.0f), "Farther rear depth should expand lateral distance.");
    }

    private sealed class Vector2Comparer(float tolerance) : IEqualityComparer<Vector2>
    {
        public bool Equals(Vector2 x, Vector2 y)
        {
            return MathF.Abs(x.X - y.X) <= tolerance && MathF.Abs(x.Y - y.Y) <= tolerance;
        }

        public int GetHashCode(Vector2 obj)
        {
            return HashCode.Combine(obj.X, obj.Y);
        }
    }
}
