using System;
using System.Numerics;

namespace Canuter
{
    public static class HeadingLockedProjectionModel
    {
        public static Vector2 WorldVectorToHeadingLocal(Vector2 forward, Vector2 worldVector)
        {
            var right = new Vector2(-forward.Y, forward.X);
            return new Vector2(
                Vector2.Dot(worldVector, right),
                Vector2.Dot(worldVector, forward));
        }

        public static Vector2 WorldToHeadingLocal(Vector2 actorPosition, Vector2 forward, Vector2 worldPoint)
        {
            var relative = worldPoint - actorPosition;
            return WorldVectorToHeadingLocal(forward, relative);
        }

        public static bool IsInFrontHemisphere(Vector2 localPoint)
        {
            return localPoint.Y >= 0.0f;
        }

        public static bool IsInRearHemisphere(Vector2 localPoint)
        {
            return localPoint.Y < 0.0f;
        }

        public static Vector2 ProjectPoint(Vector2 screenAnchor, float horizonY, float depthFalloff, Vector2 localPoint)
        {
            var scale = CalculateScale(depthFalloff, localPoint.Y);

            return new Vector2(
                screenAnchor.X + localPoint.X * scale,
                horizonY + (screenAnchor.Y - horizonY) * scale);
        }

        public static Vector2 ProjectElevatedPoint(Vector2 screenAnchor, float horizonY, float depthFalloff, Vector2 localPoint, float wallHeight)
        {
            var projected = ProjectPoint(screenAnchor, horizonY, depthFalloff, localPoint);
            var scale = CalculateScale(depthFalloff, localPoint.Y);
            return new Vector2(projected.X, projected.Y - wallHeight * scale);
        }

        public static Vector2 ProjectRearPoint(Vector2 screenAnchor, float screenBottomY, float rearDepthFalloff, float rearLateralExpand, Vector2 localPoint)
        {
            if (rearDepthFalloff <= 0.0f)
            {
                throw new ArgumentOutOfRangeException(nameof(rearDepthFalloff), "Rear depth falloff must be positive.");
            }

            var rearDepth = MathF.Max(0.0f, -localPoint.Y);
            var t = rearDepth / (rearDepthFalloff + rearDepth);
            var lateralScale = 1.0f + rearLateralExpand * t;

            return new Vector2(
                screenAnchor.X + localPoint.X * lateralScale,
                screenAnchor.Y + (screenBottomY - screenAnchor.Y) * t);
        }

        public static Vector2 ProjectRearElevatedPoint(Vector2 screenAnchor, float screenBottomY, float rearDepthFalloff, float rearLateralExpand, Vector2 localPoint, float wallHeight)
        {
            var projected = ProjectRearPoint(screenAnchor, screenBottomY, rearDepthFalloff, rearLateralExpand, localPoint);
            var rearDepth = MathF.Max(0.0f, -localPoint.Y);
            var heightScale = rearDepthFalloff / (rearDepthFalloff + rearDepth);
            return new Vector2(projected.X, projected.Y - wallHeight * heightScale);
        }

        public static Vector2[] ProjectQuad(Vector2 screenAnchor, float horizonY, float depthFalloff, Vector2[] localCorners)
        {
            if (localCorners == null)
            {
                throw new ArgumentNullException(nameof(localCorners));
            }

            var projected = new Vector2[localCorners.Length];
            for (var i = 0; i < localCorners.Length; i++)
            {
                projected[i] = ProjectPoint(screenAnchor, horizonY, depthFalloff, localCorners[i]);
            }

            return projected;
        }

        public static Vector2[] ProjectElevatedQuad(Vector2 screenAnchor, float horizonY, float depthFalloff, Vector2[] localCorners, float wallHeight)
        {
            if (localCorners == null)
            {
                throw new ArgumentNullException(nameof(localCorners));
            }

            var projected = new Vector2[localCorners.Length];
            for (var i = 0; i < localCorners.Length; i++)
            {
                projected[i] = ProjectElevatedPoint(screenAnchor, horizonY, depthFalloff, localCorners[i], wallHeight);
            }

            return projected;
        }

        public static Vector2[] ProjectRearQuad(Vector2 screenAnchor, float screenBottomY, float rearDepthFalloff, float rearLateralExpand, Vector2[] localCorners)
        {
            if (localCorners == null)
            {
                throw new ArgumentNullException(nameof(localCorners));
            }

            var projected = new Vector2[localCorners.Length];
            for (var i = 0; i < localCorners.Length; i++)
            {
                projected[i] = ProjectRearPoint(screenAnchor, screenBottomY, rearDepthFalloff, rearLateralExpand, localCorners[i]);
            }

            return projected;
        }

        public static Vector2[] ProjectRearElevatedQuad(Vector2 screenAnchor, float screenBottomY, float rearDepthFalloff, float rearLateralExpand, Vector2[] localCorners, float wallHeight)
        {
            if (localCorners == null)
            {
                throw new ArgumentNullException(nameof(localCorners));
            }

            var projected = new Vector2[localCorners.Length];
            for (var i = 0; i < localCorners.Length; i++)
            {
                projected[i] = ProjectRearElevatedPoint(screenAnchor, screenBottomY, rearDepthFalloff, rearLateralExpand, localCorners[i], wallHeight);
            }

            return projected;
        }

        public static int FindNearestEdgeStartIndex(Vector2[] localCorners)
        {
            if (localCorners.Length != 4)
            {
                throw new ArgumentException("Expected exactly four corners.", nameof(localCorners));
            }

            var nearestEdge = 0;
            var nearestDepth = float.MaxValue;

            for (var i = 0; i < localCorners.Length; i++)
            {
                var next = (i + 1) % localCorners.Length;
                var averageDepth = (localCorners[i].Y + localCorners[next].Y) * 0.5f;
                if (averageDepth < nearestDepth)
                {
                    nearestDepth = averageDepth;
                    nearestEdge = i;
                }
            }

            return nearestEdge;
        }

        public static bool IsFaceVisibleToCamera(Vector2 faceMidpointLocal, Vector2 outwardNormalLocal)
        {
            if (faceMidpointLocal.LengthSquared() <= float.Epsilon || outwardNormalLocal.LengthSquared() <= float.Epsilon)
            {
                return false;
            }

            var toCamera = Vector2.Normalize(-faceMidpointLocal);
            var normal = Vector2.Normalize(outwardNormalLocal);
            return Vector2.Dot(toCamera, normal) > 0.05f;
        }

        private static float CalculateScale(float depthFalloff, float depth)
        {
            if (depthFalloff <= 0.0f)
            {
                throw new ArgumentOutOfRangeException(nameof(depthFalloff), "Depth falloff must be positive.");
            }

            var clampedDepth = MathF.Max(0.0f, depth);
            return depthFalloff / (depthFalloff + clampedDepth);
        }
    }
}
