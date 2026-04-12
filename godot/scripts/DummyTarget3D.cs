using Godot;

namespace Canuter
{
    public partial class DummyTarget3D : Area3D
    {
        private MeshInstance3D _mesh = null!;
        private int _health = 100;

        public override void _Ready()
        {
            Monitoring = true;
            Monitorable = true;
            CollisionLayer = 1;
            CollisionMask = 1;
            AddToGroup("damageable_targets");

            var collision = new CollisionShape3D
            {
                Shape = new CapsuleShape3D
                {
                    Radius = 0.45f,
                    Height = 1.2f,
                },
            };
            AddChild(collision);

            _mesh = new MeshInstance3D
            {
                Mesh = new CapsuleMesh
                {
                    Radius = 0.45f,
                    Height = 2.1f,
                },
            };
            AddChild(_mesh);

            SetPresentation(VisibilityPresentationState3D.FrontVisible);
        }

        public void ApplyDamage(int amount)
        {
            _health -= amount;
            if (_health <= 0)
            {
                QueueFree();
            }
        }

        public void SetPresentation(VisibilityPresentationState3D state)
        {
            if (_mesh == null)
            {
                return;
            }

            var color = state switch
            {
                VisibilityPresentationState3D.FrontVisible => new Color(0.92f, 0.24f, 0.20f, 1.0f),
                VisibilityPresentationState3D.RearReadable => new Color(0.82f, 0.26f, 0.22f, 0.96f),
                _ => new Color(0.38f, 0.18f, 0.18f, 0.90f),
            };

            _mesh.MaterialOverride = new StandardMaterial3D
            {
                ShadingMode = BaseMaterial3D.ShadingModeEnum.Unshaded,
                AlbedoColor = color,
            };
        }
    }
}
