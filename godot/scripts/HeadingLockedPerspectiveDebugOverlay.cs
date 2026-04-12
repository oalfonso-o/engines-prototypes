using System;
using System.Collections.Generic;
using NumericVector2 = System.Numerics.Vector2;
using Godot;

namespace Canuter
{
    public partial class HeadingLockedPerspectiveDebugOverlay : Control
    {
        private static readonly Color HorizonColor = new(0.78f, 0.94f, 1.0f, 0.48f);
        private static readonly Color VisibleFloorFill = new(0.86f, 0.78f, 0.65f, 0.92f);
        private static readonly Color RearFloorTint = new(0.76f, 0.80f, 0.86f, 0.22f);
        private static readonly Color HiddenFloorFill = new(0.04f, 0.05f, 0.07f, 0.78f);
        private static readonly Color HiddenWallTopFill = new(0.22f, 0.22f, 0.23f, 0.90f);
        private static readonly Color HiddenWallSideFill = new(0.15f, 0.15f, 0.16f, 0.90f);
        private static readonly Color HiddenWallOutline = new(0.05f, 0.05f, 0.06f, 0.92f);
        private static readonly Color FloorGridColor = new(0.72f, 0.90f, 1.0f, 0.18f);
        private static readonly Color WallSliceFill = new(0.24f, 0.24f, 0.23f, 0.98f);
        private static readonly Color WallSliceOutline = new(0.02f, 0.02f, 0.02f, 0.95f);
        private static readonly Color ProjectedTargetFill = new(0.92f, 0.24f, 0.20f, 0.92f);
        private static readonly Color ProjectedTargetOutline = new(0.08f, 0.05f, 0.05f, 0.95f);
        private static readonly Color PlayerAnchorFill = new(0.10f, 0.10f, 0.10f, 0.92f);
        private static readonly Color PlayerAnchorAccent = new(0.95f, 0.95f, 0.95f, 0.95f);

        private PlayerController? _player;
        private MapView? _map;
        private VisionSystem? _visionSystem;

        public override void _Ready()
        {
            MouseFilter = MouseFilterEnum.Ignore;
            ProcessMode = ProcessModeEnum.Always;
            ZIndex = 80;
        }

        public override void _Process(double delta)
        {
            Visible = _player != null && _player.CurrentViewMode == PlayerViewMode.HeadingLocked;
            if (Visible)
            {
                QueueRedraw();
            }
        }

        public void BindPlayer(PlayerController player)
        {
            _player = player;
            QueueRedraw();
        }

        public void BindMap(MapView map)
        {
            _map = map;
            QueueRedraw();
        }

        public void BindVisionSystem(VisionSystem visionSystem)
        {
            _visionSystem = visionSystem;
            QueueRedraw();
        }

        public override void _Draw()
        {
            if (_player == null || _player.CurrentViewMode != PlayerViewMode.HeadingLocked || _map == null)
            {
                return;
            }

            var viewport = GetViewportRect().Size;
            var playerScreen = GetViewport().GetCanvasTransform() * _player.GlobalPosition;
            var anchor = new NumericVector2(playerScreen.X, playerScreen.Y);
            var horizonY = viewport.Y * PlayerRuntimeTuning.HeadingLockedPerspectiveHorizonRatio;
            var falloff = PlayerRuntimeTuning.HeadingLockedPerspectiveDepthFalloff;
            var actorPosition = new NumericVector2(_player.GlobalPosition.X, _player.GlobalPosition.Y);
            var forward = new NumericVector2(_player.CurrentAimDirection.X, _player.CurrentAimDirection.Y);
            var rays = BuildRayHits(actorPosition, forward, anchor, horizonY, falloff);

            DrawRearHemisphereFloor(actorPosition, forward, anchor, horizonY, falloff, viewport);
            DrawVisibilityFanBackground(anchor, rays);
            DrawHiddenWallLayout(actorPosition, forward, anchor, horizonY, falloff, viewport);
            DrawVisibleFloor(anchor, rays);
            DrawWallSlices(rays);
            DrawVisibleRayGrid(anchor, rays);
            DrawProjectedTargets(anchor, horizonY, falloff, viewport);
            DrawLine(new Vector2(0.0f, horizonY), new Vector2(viewport.X, horizonY), HorizonColor, 2.0f);
            DrawPlayerAnchor(new Vector2(anchor.X, anchor.Y));
        }

        private List<RayHit> BuildRayHits(NumericVector2 actorPosition, NumericVector2 forward, NumericVector2 anchor, float horizonY, float falloff)
        {
            var samples = HeadingLockedVisibilityFanModel.CreateRaySamples(
                PlayerRuntimeTuning.HeadingLockedPerspectiveRayCount,
                PlayerRuntimeTuning.HeadingLockedPerspectiveFieldOfViewRadians);

            var hits = new List<RayHit>(samples.Length);
            var right = new NumericVector2(-forward.Y, forward.X);

            foreach (var sample in samples)
            {
                var worldDirection = NumericVector2.Normalize(right * sample.LocalDirection.X + forward * sample.LocalDirection.Y);
                var worldEnd = actorPosition + worldDirection * PlayerRuntimeTuning.HeadingLockedPerspectiveMaxDepth;
                var hitWorld = worldEnd;
                var blocked = false;

                var query = PhysicsRayQueryParameters2D.Create(
                    new Vector2(actorPosition.X, actorPosition.Y),
                    new Vector2(worldEnd.X, worldEnd.Y));
                query.CollideWithBodies = true;
                query.CollideWithAreas = false;
                query.Exclude = new Godot.Collections.Array<Rid> { _player!.GetRid(), _player.HurtboxRid };
                var result = GetWorld2D().DirectSpaceState.IntersectRay(query);
                ulong colliderId = 0;
                if (result.Count > 0)
                {
                    blocked = true;
                    hitWorld = new NumericVector2(((Vector2)result["position"]).X, ((Vector2)result["position"]).Y);
                    colliderId = result["collider"].AsGodotObject()?.GetInstanceId() ?? 0;
                }

                var localHit = blocked
                    ? HeadingLockedProjectionModel.WorldToHeadingLocal(actorPosition, forward, hitWorld)
                    : sample.LocalDirection * PlayerRuntimeTuning.HeadingLockedPerspectiveMaxDepth;

                if (localHit.Y < -PlayerRuntimeTuning.HeadingLockedPerspectiveBehindCullDepth)
                {
                    localHit = sample.LocalDirection * PlayerRuntimeTuning.HeadingLockedPerspectiveBehindCullDepth;
                }

                hits.Add(new RayHit(
                    sample.RelativeAngle,
                    sample.LocalDirection,
                    localHit,
                    HeadingLockedProjectionModel.ProjectPoint(anchor, horizonY, falloff, localHit),
                    HeadingLockedProjectionModel.ProjectElevatedPoint(anchor, horizonY, falloff, localHit, PlayerRuntimeTuning.HeadingLockedPerspectiveWallHeight),
                    blocked,
                    colliderId));
            }

            return hits;
        }

        private void DrawRearHemisphereFloor(
            NumericVector2 actorPosition,
            NumericVector2 forward,
            NumericVector2 anchor,
            float horizonY,
            float falloff,
            Vector2 viewport)
        {
            if (_map == null)
            {
                return;
            }

            var projectedFloors = new List<ProjectedFloorCell>();
            foreach (var cell in _map.GetFloorCells())
            {
                var corners = _map.GetCellWorldCorners(cell);
                var localCorners = new NumericVector2[corners.Length];
                var center = NumericVector2.Zero;

                for (var i = 0; i < corners.Length; i++)
                {
                    var localCorner = HeadingLockedProjectionModel.WorldToHeadingLocal(
                        actorPosition,
                        forward,
                        new NumericVector2(corners[i].X, corners[i].Y));

                    localCorners[i] = localCorner;
                    center += localCorner;
                }

                center /= localCorners.Length;
                if (!HeadingLockedProjectionModel.IsInRearHemisphere(center))
                {
                    continue;
                }

                var projected = HeadingLockedProjectionModel.ProjectRearQuad(
                    anchor,
                    viewport.Y,
                    PlayerRuntimeTuning.HeadingLockedPerspectiveRearDepthFalloff,
                    PlayerRuntimeTuning.HeadingLockedPerspectiveRearLateralExpand,
                    localCorners);
                var minX = float.MaxValue;
                var maxX = float.MinValue;
                var minY = float.MaxValue;
                var maxY = float.MinValue;
                for (var i = 0; i < projected.Length; i++)
                {
                    minX = MathF.Min(minX, projected[i].X);
                    maxX = MathF.Max(maxX, projected[i].X);
                    minY = MathF.Min(minY, projected[i].Y);
                    maxY = MathF.Max(maxY, projected[i].Y);
                }

                if (maxX < -96.0f || minX > viewport.X + 96.0f || maxY < -96.0f || minY > viewport.Y + 96.0f)
                {
                    continue;
                }

                var floorColor = _map.GetProjectedFloorColor(cell);
                projectedFloors.Add(new ProjectedFloorCell(
                    Array.ConvertAll(projected, ToGodot),
                    new Color(
                        Mathf.Lerp(floorColor.R, RearFloorTint.R, 0.58f),
                        Mathf.Lerp(floorColor.G, RearFloorTint.G, 0.58f),
                        Mathf.Lerp(floorColor.B, RearFloorTint.B, 0.58f),
                        0.82f),
                    center.Y));
            }

            projectedFloors.Sort(static (a, b) => a.Depth.CompareTo(b.Depth));
            foreach (var floor in projectedFloors)
            {
                DrawColoredPolygon(floor.Polygon, floor.Fill);
            }
        }

        private void DrawVisibilityFanBackground(NumericVector2 anchor, List<RayHit> hits)
        {
            if (hits.Count < 2)
            {
                return;
            }

            foreach (var pair in EnumerateAdjacentPairs(hits))
            {
                var nearLeft = ToGodot(pair.Left.ProjectedGround);
                var nearRight = ToGodot(pair.Right.ProjectedGround);
                var farLeft = Project(anchor, pair.Left.LocalDirection * PlayerRuntimeTuning.HeadingLockedPerspectiveMaxDepth);
                var farRight = Project(anchor, pair.Right.LocalDirection * PlayerRuntimeTuning.HeadingLockedPerspectiveMaxDepth);

                var occludedBand = new[]
                {
                    nearLeft,
                    nearRight,
                    farRight,
                    farLeft,
                };

                DrawColoredPolygon(occludedBand, HiddenFloorFill);
            }
        }

        private void DrawHiddenWallLayout(
            NumericVector2 actorPosition,
            NumericVector2 forward,
            NumericVector2 anchor,
            float horizonY,
            float falloff,
            Vector2 viewport)
        {
            if (_map == null)
            {
                return;
            }

            var projectedWalls = new List<ProjectedHiddenWall>();
            foreach (var cell in _map.GetWallCells())
            {
                var corners = _map.GetCellWorldCorners(cell);
                var localCorners = new NumericVector2[corners.Length];
                var maxDepth = float.MinValue;
                var center = NumericVector2.Zero;

                for (var i = 0; i < corners.Length; i++)
                {
                    var localCorner = HeadingLockedProjectionModel.WorldToHeadingLocal(
                        actorPosition,
                        forward,
                        new NumericVector2(corners[i].X, corners[i].Y));

                    localCorners[i] = localCorner;
                    center += localCorner;
                    maxDepth = MathF.Max(maxDepth, localCorner.Y);
                }

                center /= localCorners.Length;

                var isRearHemisphere = HeadingLockedProjectionModel.IsInRearHemisphere(center);
                var projectedGround = isRearHemisphere
                    ? HeadingLockedProjectionModel.ProjectRearQuad(
                        anchor,
                        viewport.Y,
                        PlayerRuntimeTuning.HeadingLockedPerspectiveRearDepthFalloff,
                        PlayerRuntimeTuning.HeadingLockedPerspectiveRearLateralExpand,
                        localCorners)
                    : HeadingLockedProjectionModel.ProjectQuad(anchor, horizonY, falloff, localCorners);
                var projectedTop = isRearHemisphere
                    ? HeadingLockedProjectionModel.ProjectRearElevatedQuad(
                        anchor,
                        viewport.Y,
                        PlayerRuntimeTuning.HeadingLockedPerspectiveRearDepthFalloff,
                        PlayerRuntimeTuning.HeadingLockedPerspectiveRearLateralExpand,
                        localCorners,
                        PlayerRuntimeTuning.HeadingLockedPerspectiveWallHeight)
                    : HeadingLockedProjectionModel.ProjectElevatedQuad(
                        anchor,
                        horizonY,
                        falloff,
                        localCorners,
                        PlayerRuntimeTuning.HeadingLockedPerspectiveWallHeight);

                var minX = float.MaxValue;
                var maxX = float.MinValue;
                var minY = float.MaxValue;
                var maxY = float.MinValue;
                for (var i = 0; i < projectedGround.Length; i++)
                {
                    minX = MathF.Min(minX, projectedGround[i].X);
                    maxX = MathF.Max(maxX, projectedGround[i].X);
                    minY = MathF.Min(minY, projectedTop[i].Y);
                    maxY = MathF.Max(maxY, projectedGround[i].Y);
                }

                if (maxX < -96.0f || minX > viewport.X + 96.0f || maxY < -96.0f || minY > viewport.Y + 96.0f)
                {
                    continue;
                }

                var sideFaces = new List<Vector2[]>();
                for (var i = 0; i < localCorners.Length; i++)
                {
                    var next = (i + 1) % localCorners.Length;
                    var edgeMidpoint = (localCorners[i] + localCorners[next]) * 0.5f;
                    var outward = edgeMidpoint - center;
                    if (!HeadingLockedProjectionModel.IsFaceVisibleToCamera(edgeMidpoint, outward))
                    {
                        continue;
                    }

                    sideFaces.Add(new[]
                    {
                        ToGodot(projectedGround[i]),
                        ToGodot(projectedGround[next]),
                        ToGodot(projectedTop[next]),
                        ToGodot(projectedTop[i]),
                    });
                }

                projectedWalls.Add(new ProjectedHiddenWall(
                    ProjectedTop: Array.ConvertAll(projectedTop, ToGodot),
                    SideFaces: sideFaces,
                    Depth: maxDepth));
            }

            projectedWalls.Sort(static (a, b) => b.Depth.CompareTo(a.Depth));

            foreach (var wall in projectedWalls)
            {
                foreach (var face in wall.SideFaces)
                {
                    DrawColoredPolygon(face, HiddenWallSideFill);
                    DrawPolyline(face, HiddenWallOutline, 1.5f, true);
                }

                DrawColoredPolygon(wall.ProjectedTop, HiddenWallTopFill);
                DrawPolyline(wall.ProjectedTop, HiddenWallOutline, 1.5f, true);
            }
        }

        private void DrawVisibleFloor(NumericVector2 anchor, List<RayHit> hits)
        {
            if (hits.Count < 2)
            {
                return;
            }

            var apex = new Vector2(anchor.X, anchor.Y);
            foreach (var pair in EnumerateAdjacentPairs(hits))
            {
                DrawColoredPolygon(new[] { apex, ToGodot(pair.Left.ProjectedGround), ToGodot(pair.Right.ProjectedGround) }, VisibleFloorFill);
            }
        }

        private void DrawWallSlices(List<RayHit> hits)
        {
            foreach (var pair in EnumerateAdjacentPairs(hits))
            {
                if (!pair.Left.Blocked || !pair.Right.Blocked)
                {
                    continue;
                }

                if (pair.Left.ColliderId == 0 || pair.Left.ColliderId != pair.Right.ColliderId)
                {
                    continue;
                }

                if (MathF.Abs(pair.Left.LocalHit.Y - pair.Right.LocalHit.Y) > PlayerRuntimeTuning.HeadingLockedPerspectiveMaxWallSliceDepthDelta)
                {
                    continue;
                }

                var face = new[]
                {
                    ToGodot(pair.Left.ProjectedGround),
                    ToGodot(pair.Right.ProjectedGround),
                    ToGodot(pair.Right.ProjectedTop),
                    ToGodot(pair.Left.ProjectedTop),
                };

                DrawColoredPolygon(face, WallSliceFill);
                DrawPolyline(face, WallSliceOutline, 2.0f, true);
            }
        }

        private void DrawVisibleRayGrid(NumericVector2 anchor, List<RayHit> hits)
        {
            var apex = new Vector2(anchor.X, anchor.Y);
            foreach (var hit in hits)
            {
                DrawLine(apex, ToGodot(hit.ProjectedGround), FloorGridColor, 1.0f);
            }
        }

        private void DrawProjectedTargets(NumericVector2 anchor, float horizonY, float falloff, Vector2 viewport)
        {
            var targets = GetTree().GetNodesInGroup("damageable_targets");
            var actorPosition = new NumericVector2(_player!.GlobalPosition.X, _player.GlobalPosition.Y);
            var forward = new NumericVector2(_player.CurrentAimDirection.X, _player.CurrentAimDirection.Y);
            var projectedTargets = new List<ProjectedTarget>();

            foreach (var node in targets)
            {
                if (node is not Node2D target)
                {
                    continue;
                }

                if (_visionSystem != null && !_visionSystem.CanSeeWorldPoint(target.GlobalPosition))
                {
                    continue;
                }

                var local = HeadingLockedProjectionModel.WorldToHeadingLocal(
                    actorPosition,
                    forward,
                    new NumericVector2(target.GlobalPosition.X, target.GlobalPosition.Y));

                if (local.Y < -PlayerRuntimeTuning.HeadingLockedPerspectiveBehindCullDepth ||
                    local.Y > PlayerRuntimeTuning.HeadingLockedPerspectiveMaxDepth)
                {
                    continue;
                }

                var bottom = Project(anchor, local);
                if (bottom.X < -48.0f || bottom.X > viewport.X + 48.0f || bottom.Y < -48.0f || bottom.Y > viewport.Y + 48.0f)
                {
                    continue;
                }

                var bottomNumeric = new NumericVector2(bottom.X, bottom.Y);
                var top = HeadingLockedProjectionModel.ProjectElevatedPoint(anchor, horizonY, falloff, local, PlayerRuntimeTuning.HeadingLockedPerspectiveTargetHeight);
                var left = HeadingLockedProjectionModel.ProjectPoint(anchor, horizonY, falloff, new NumericVector2(local.X - PlayerRuntimeTuning.HeadingLockedPerspectiveTargetRadius, local.Y));
                var right = HeadingLockedProjectionModel.ProjectPoint(anchor, horizonY, falloff, new NumericVector2(local.X + PlayerRuntimeTuning.HeadingLockedPerspectiveTargetRadius, local.Y));
                var radius = Mathf.Max(3.0f, Mathf.Abs(right.X - left.X) * 0.35f);

                projectedTargets.Add(new ProjectedTarget(top, bottomNumeric, radius, local.Y));
            }

            projectedTargets.Sort(static (a, b) => b.Depth.CompareTo(a.Depth));

            foreach (var target in projectedTargets)
            {
                DrawLine(ToGodot(target.Top), ToGodot(target.Bottom), ProjectedTargetOutline, target.Radius + 4.0f);
                DrawLine(ToGodot(target.Top), ToGodot(target.Bottom), ProjectedTargetFill, target.Radius + 1.5f);
                DrawCircle(ToGodot(target.Top), target.Radius * 0.72f, ProjectedTargetFill);
                DrawCircle(ToGodot(target.Top), target.Radius * 0.72f, ProjectedTargetOutline, false, 2.0f);
                DrawCircle(ToGodot(target.Bottom), target.Radius * 0.88f, new Color(ProjectedTargetFill.R, ProjectedTargetFill.G, ProjectedTargetFill.B, 0.82f));
                DrawCircle(ToGodot(target.Bottom), target.Radius * 0.88f, ProjectedTargetOutline, false, 2.0f);
            }
        }

        private void DrawPlayerAnchor(Vector2 anchor)
        {
            const float shadowRadius = 15.0f;
            var stemTop = anchor + new Vector2(0.0f, -34.0f);
            var stemBottom = anchor + new Vector2(0.0f, -14.0f);

            DrawCircle(anchor + new Vector2(0.0f, 1.0f), shadowRadius, PlayerAnchorFill);
            DrawLine(stemTop, stemBottom, PlayerAnchorFill, 8.0f);
            DrawLine(stemTop, stemBottom, PlayerAnchorAccent, 3.0f);
            DrawCircle(anchor, shadowRadius, new Color(PlayerAnchorAccent.R, PlayerAnchorAccent.G, PlayerAnchorAccent.B, 0.18f), false, 2.0f);
        }

        private static IEnumerable<(RayHit Left, RayHit Right)> EnumerateAdjacentPairs(IReadOnlyList<RayHit> hits)
        {
            for (var i = 0; i < hits.Count - 1; i++)
            {
                yield return (hits[i], hits[i + 1]);
            }
        }

        private Vector2 Project(NumericVector2 anchor, NumericVector2 localPoint)
        {
            var projected = HeadingLockedProjectionModel.ProjectPoint(
                anchor,
                GetViewportRect().Size.Y * PlayerRuntimeTuning.HeadingLockedPerspectiveHorizonRatio,
                PlayerRuntimeTuning.HeadingLockedPerspectiveDepthFalloff,
                localPoint);
            return ToGodot(projected);
        }

        private static Vector2 Project(NumericVector2 anchor, NumericVector2 localPoint, float horizonY, float falloff)
        {
            var projected = HeadingLockedProjectionModel.ProjectPoint(anchor, horizonY, falloff, localPoint);
            return ToGodot(projected);
        }

        private static Vector2 ToGodot(NumericVector2 value)
        {
            return new Vector2(value.X, value.Y);
        }

        private readonly record struct RayHit(
            float RelativeAngle,
            NumericVector2 LocalDirection,
            NumericVector2 LocalHit,
            NumericVector2 ProjectedGround,
            NumericVector2 ProjectedTop,
            bool Blocked,
            ulong ColliderId);

        private readonly record struct ProjectedFloorCell(Vector2[] Polygon, Color Fill, float Depth);
        private readonly record struct ProjectedHiddenWall(Vector2[] ProjectedTop, List<Vector2[]> SideFaces, float Depth);
        private readonly record struct ProjectedTarget(NumericVector2 Top, NumericVector2 Bottom, float Radius, float Depth);
    }
}
