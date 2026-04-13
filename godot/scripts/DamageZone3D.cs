using Godot;

namespace Canuter
{
    public interface IDamageZoneOwner3D
    {
        void ApplyDamage(int baseDamage, DamageZoneType3D zoneType);
    }

    public partial class DamageZone3D : Area3D
    {
        private IDamageZoneOwner3D? _owner;

        public DamageZoneType3D ZoneType { get; private set; } = DamageZoneType3D.Torso;

        public override void _Ready()
        {
            Monitoring = true;
            Monitorable = true;
            CollisionLayer = 1;
            CollisionMask = 1;
        }

        public void Configure(IDamageZoneOwner3D owner, DamageZoneType3D zoneType, Shape3D shape, Vector3 localPosition)
        {
            _owner = owner;
            ZoneType = zoneType;
            Position = localPosition;

            CollisionShape3D? collision = null;
            foreach (var child in GetChildren())
            {
                if (child is CollisionShape3D existing)
                {
                    collision = existing;
                    break;
                }
            }

            collision ??= new CollisionShape3D();
            collision.Shape = shape;
            if (collision.GetParent() == null)
            {
                AddChild(collision);
            }
        }

        public void ApplyDamage(int baseDamage)
        {
            _owner?.ApplyDamage(baseDamage, ZoneType);
        }
    }
}
