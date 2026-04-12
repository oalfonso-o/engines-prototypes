using NumericVector2 = System.Numerics.Vector2;
using Godot;

namespace Canuter
{
    public partial class VisionSystem3D : Node3D
    {
        [Export]
        public float MaxFrontVisionDistance { get; set; } = 56.0f;

        private PlayerController3D? _player;

        public void BindPlayer(PlayerController3D player)
        {
            _player = player;
        }

        public bool CanSeeWorldPoint(Vector3 point, ulong expectedColliderId = 0)
        {
            var state = ClassifyWorldPoint(point, expectedColliderId);
            return state != VisibilityPresentationState3D.FrontHiddenKnown;
        }

        public VisibilityPresentationState3D ClassifyWorldPoint(Vector3 point, ulong expectedColliderId = 0)
        {
            if (_player == null)
            {
                return VisibilityPresentationState3D.FrontHiddenKnown;
            }

            var playerPosition = _player.GlobalPosition;
            var delta = point - playerPosition;
            var horizontal = new Vector3(delta.X, 0.0f, delta.Z);
            if (horizontal.LengthSquared() <= 0.0001f)
            {
                return VisibilityPresentationState3D.FrontVisible;
            }

            var horizontalForward = _player.CurrentForward3D;
            horizontalForward.Y = 0.0f;
            horizontalForward = horizontalForward.Normalized();
            var isInFrontHemisphere = horizontalForward.Dot(horizontal.Normalized()) >= 0.0f;

            if (!isInFrontHemisphere)
            {
                return VisibilityPresentationState3D.RearReadable;
            }

            if (horizontal.Length() > MaxFrontVisionDistance)
            {
                return VisibilityPresentationState3D.FrontHiddenKnown;
            }

            var query = PhysicsRayQueryParameters3D.Create(_player.VisibilityOrigin, point);
            query.CollideWithBodies = true;
            query.CollideWithAreas = true;
            query.Exclude = new Godot.Collections.Array<Rid> { _player.GetRid(), _player.HurtboxRid };
            var result = GetWorld3D().DirectSpaceState.IntersectRay(query);

            var passesVisibilityChecks = result.Count == 0;
            if (!passesVisibilityChecks && expectedColliderId != 0)
            {
                passesVisibilityChecks = result["collider"].AsGodotObject()?.GetInstanceId() == expectedColliderId;
            }

            return VisibilityPresentationModel3D.Classify(isInFrontHemisphere, passesVisibilityChecks);
        }

        public NumericVector2 GetPlayerHorizontalPosition()
        {
            if (_player == null)
            {
                return NumericVector2.Zero;
            }

            return new NumericVector2(_player.GlobalPosition.X, _player.GlobalPosition.Z);
        }
    }
}
