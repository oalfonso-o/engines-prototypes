using System.Numerics;

namespace Canuter.Gameplay.Tests.Vision;

public sealed class VisionEvaluatorTests
{
    private static readonly CameraViewport Viewport = new(Vector2.Zero, new Vector2(100.0f, 100.0f));

    [Fact]
    public void PointOutsideCameraBoundsIsNotVisible()
    {
        var visible = VisionEvaluator.CanSeeWorldPoint(
            playerPosition: Vector2.Zero,
            facingDirection: Vector2.UnitY,
            point: new Vector2(150.0f, 0.0f),
            viewport: Viewport,
            occlusion: VisionOcclusion.Clear);

        Assert.False(visible);
    }

    [Fact]
    public void PointAtPlayerPositionIsVisible()
    {
        var visible = VisionEvaluator.CanSeeWorldPoint(
            playerPosition: Vector2.Zero,
            facingDirection: Vector2.UnitY,
            point: Vector2.Zero,
            viewport: Viewport,
            occlusion: VisionOcclusion.Blocked);

        Assert.True(visible);
    }

    [Fact]
    public void PointBehindFacingDirectionIsNotVisible()
    {
        var visible = VisionEvaluator.CanSeeWorldPoint(
            playerPosition: Vector2.Zero,
            facingDirection: Vector2.UnitY,
            point: new Vector2(0.0f, -10.0f),
            viewport: Viewport,
            occlusion: VisionOcclusion.Clear);

        Assert.False(visible);
    }

    [Fact]
    public void PointInFrontWithClearOcclusionIsVisible()
    {
        var visible = VisionEvaluator.CanSeeWorldPoint(
            playerPosition: Vector2.Zero,
            facingDirection: Vector2.UnitY,
            point: new Vector2(0.0f, 10.0f),
            viewport: Viewport,
            occlusion: VisionOcclusion.Clear);

        Assert.True(visible);
    }

    [Fact]
    public void BlockedPointIsNotVisible()
    {
        var visible = VisionEvaluator.CanSeeWorldPoint(
            playerPosition: Vector2.Zero,
            facingDirection: Vector2.UnitY,
            point: new Vector2(0.0f, 10.0f),
            viewport: Viewport,
            occlusion: VisionOcclusion.Blocked);

        Assert.False(visible);
    }

    [Fact]
    public void TargetHitAtPointCountsAsVisible()
    {
        var visible = VisionEvaluator.CanSeeWorldPoint(
            playerPosition: Vector2.Zero,
            facingDirection: Vector2.UnitY,
            point: new Vector2(0.0f, 10.0f),
            viewport: Viewport,
            occlusion: VisionOcclusion.TargetAtPoint);

        Assert.True(visible);
    }
}
