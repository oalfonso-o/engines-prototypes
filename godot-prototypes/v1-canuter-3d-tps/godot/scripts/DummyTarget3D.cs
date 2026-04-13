using System.Collections.Generic;
using Godot;

namespace Canuter
{
    public partial class DummyTarget3D : Node3D, IDamageZoneOwner3D
    {
        private const float FootWidth = 0.22f;
        private const float FootHeight = 0.18f;
        private const float FootDepth = 0.26f;
        private readonly Dictionary<DamageZoneType3D, DamageZone3D> _damageZones = new();
        private readonly List<MeshInstance3D> _visualMeshes = new();
        private MeshInstance3D? _leftFootMesh;
        private MeshInstance3D? _rightFootMesh;
        private int _health = 100;

        public override void _Ready()
        {
            AddToGroup("damageable_targets");
            BuildVisualRig();
            BuildDamageZones();
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

        public void ApplyDamage(int baseDamage, DamageZoneType3D zoneType)
        {
            ApplyDamage(BodyPartDamageModel3D.ComputeDamage(baseDamage, zoneType));
        }

        public int GetHealthForTesting()
        {
            return _health;
        }

        public void SetHealthForTesting(int health)
        {
            _health = health;
        }

        public float GetVisualBottomForTesting()
        {
            return GlobalPosition.Y;
        }

        public bool FeetUsePegMeshesForTesting()
        {
            return _leftFootMesh?.Mesh is BoxMesh && _rightFootMesh?.Mesh is BoxMesh;
        }

        public DamageZone3D GetDamageZoneForTesting(DamageZoneType3D zoneType)
        {
            return _damageZones[zoneType];
        }

        public void ApplyZoneDamageForTesting(string zoneName, int baseDamage)
        {
            var zoneType = zoneName.ToLowerInvariant() switch
            {
                "head" => DamageZoneType3D.Head,
                "torso" => DamageZoneType3D.Torso,
                "left_hand" => DamageZoneType3D.LeftHand,
                "right_hand" => DamageZoneType3D.RightHand,
                "left_foot" => DamageZoneType3D.LeftFoot,
                "right_foot" => DamageZoneType3D.RightFoot,
                _ => DamageZoneType3D.Torso,
            };

            _damageZones[zoneType].ApplyDamage(baseDamage);
        }

        public void SetPresentation(VisibilityPresentationState3D state)
        {
            var color = state switch
            {
                VisibilityPresentationState3D.FrontVisible => new Color(0.92f, 0.24f, 0.20f, 1.0f),
                VisibilityPresentationState3D.RearReadable => new Color(0.82f, 0.26f, 0.22f, 0.96f),
                _ => new Color(0.38f, 0.18f, 0.18f, 0.90f),
            };

            foreach (var mesh in _visualMeshes)
            {
                mesh.MaterialOverride = new StandardMaterial3D
                {
                    ShadingMode = BaseMaterial3D.ShadingModeEnum.Unshaded,
                    AlbedoColor = color,
                };
            }
        }

        private void BuildVisualRig()
        {
            CreateCapsuleMesh("TorsoMesh", new Vector3(0.0f, 0.82f, 0.0f), 0.34f, 1.20f);
            CreateSphereMesh("HeadMesh", new Vector3(0.0f, 1.58f, 0.0f), 0.24f);
            CreateSphereMesh("LeftHandMesh", new Vector3(-0.58f, 0.96f, 0.0f), 0.14f);
            CreateSphereMesh("RightHandMesh", new Vector3(0.58f, 0.96f, 0.0f), 0.14f);
            _leftFootMesh = CreateFootPegMesh("LeftFootMesh", new Vector3(-0.18f, FootHeight * 0.5f, 0.02f));
            _rightFootMesh = CreateFootPegMesh("RightFootMesh", new Vector3(0.18f, FootHeight * 0.5f, 0.02f));
        }

        private void BuildDamageZones()
        {
            AddDamageZone(
                "TorsoZone",
                DamageZoneType3D.Torso,
                new CapsuleShape3D { Radius = 0.34f, Height = 0.95f },
                new Vector3(0.0f, 0.82f, 0.0f));
            AddDamageZone(
                "HeadZone",
                DamageZoneType3D.Head,
                new SphereShape3D { Radius = 0.24f },
                new Vector3(0.0f, 1.58f, 0.0f));
            AddDamageZone(
                "LeftHandZone",
                DamageZoneType3D.LeftHand,
                new SphereShape3D { Radius = 0.16f },
                new Vector3(-0.58f, 0.96f, 0.0f));
            AddDamageZone(
                "RightHandZone",
                DamageZoneType3D.RightHand,
                new SphereShape3D { Radius = 0.16f },
                new Vector3(0.58f, 0.96f, 0.0f));
            AddDamageZone(
                "LeftFootZone",
                DamageZoneType3D.LeftFoot,
                new BoxShape3D { Size = new Vector3(FootWidth, FootHeight, FootDepth) },
                new Vector3(-0.18f, FootHeight * 0.5f, 0.02f));
            AddDamageZone(
                "RightFootZone",
                DamageZoneType3D.RightFoot,
                new BoxShape3D { Size = new Vector3(FootWidth, FootHeight, FootDepth) },
                new Vector3(0.18f, FootHeight * 0.5f, 0.02f));
        }

        private void AddDamageZone(string name, DamageZoneType3D zoneType, Shape3D shape, Vector3 localPosition)
        {
            var zone = new DamageZone3D
            {
                Name = name,
            };
            zone.Configure(this, zoneType, shape, localPosition);
            AddChild(zone);
            _damageZones[zoneType] = zone;
        }

        private void CreateCapsuleMesh(string name, Vector3 localPosition, float radius, float height)
        {
            var mesh = new MeshInstance3D
            {
                Name = name,
                Position = localPosition,
                Mesh = new CapsuleMesh
                {
                    Radius = radius,
                    Height = height,
                },
            };
            AddChild(mesh);
            _visualMeshes.Add(mesh);
        }

        private void CreateSphereMesh(string name, Vector3 localPosition, float radius)
        {
            var mesh = new MeshInstance3D
            {
                Name = name,
                Position = localPosition,
                Mesh = new SphereMesh
                {
                    Radius = radius,
                    Height = radius * 2.0f,
                },
            };
            AddChild(mesh);
            _visualMeshes.Add(mesh);
        }

        private MeshInstance3D CreateFootPegMesh(string name, Vector3 localPosition)
        {
            var mesh = new MeshInstance3D
            {
                Name = name,
                Position = localPosition,
                Mesh = new BoxMesh
                {
                    Size = new Vector3(FootWidth, FootHeight, FootDepth),
                },
            };
            AddChild(mesh);
            _visualMeshes.Add(mesh);
            return mesh;
        }
    }
}
