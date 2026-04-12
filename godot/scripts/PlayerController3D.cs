using NumericVector2 = System.Numerics.Vector2;
using System.Collections.Generic;
using Godot;

namespace Canuter
{
    public partial class PlayerController3D : CharacterBody3D
    {
        private Area3D _hurtbox = null!;
        private MeshInstance3D _bodyMesh = null!;
        private Marker3D _firePoint = null!;
        private MeshInstance3D _tracerMesh = null!;
        private readonly Dictionary<string, WeaponState> _weaponStates = new();
        private WeaponState _equippedWeapon = null!;
        private Vector2 _currentAimDirection2D = Vector2.Up;
        private float _currentAimRotation;
        private Vector2 _pendingMouseDelta;
        private bool _gameplayInputEnabled = true;
        private float _headingSensitivity = PlayerRuntimeTuning.HeadingLockedMouseRadiansPerPixel;
        private float _moveSpeed = PlayerRuntimeTuning.Prototype3DMoveSpeed;
        private double _tracerRemaining;

        public WeaponDefinition EquippedWeaponDefinition => _equippedWeapon.Definition;
        public int EquippedAmmoInMagazine => _equippedWeapon.AmmoInMagazine;
        public int EquippedReserveAmmo => _equippedWeapon.ReserveAmmo;
        public bool IsReloading => _equippedWeapon.IsReloading;
        public int MaxHealth => 100;
        public int CurrentHealth => 100;
        public Vector3 CurrentForward3D => new(_currentAimDirection2D.X, 0.0f, _currentAimDirection2D.Y);
        public Vector2 CurrentAimDirection2D => _currentAimDirection2D;
        public float CurrentAimRotation => _currentAimRotation;
        public float CurrentMinimapRotation => _currentAimRotation + Mathf.Pi;
        public Rid HurtboxRid => _hurtbox.GetRid();
        public Vector3 VisibilityOrigin => GlobalPosition + Vector3.Up * 0.9f;

        public override void _Ready()
        {
            _hurtbox = GetNode<Area3D>("Hurtbox");
            _bodyMesh = GetNode<MeshInstance3D>("BodyMesh");
            _firePoint = GetNode<Marker3D>("FirePoint");
            _tracerMesh = CreateTracerMesh();
            EnsureInputMap();
            EquipWeapon(WeaponCatalog.Rifle01);
            ApplyMeshRotation();
        }

        public override void _Process(double delta)
        {
            if (!_gameplayInputEnabled)
            {
                return;
            }

            _equippedWeapon.Tick(delta);

            if (_tracerRemaining > 0.0)
            {
                _tracerRemaining = Mathf.Max(0.0, _tracerRemaining - delta);
                if (_tracerRemaining <= 0.0)
                {
                    _tracerMesh.Visible = false;
                }
            }
        }

        public override void _PhysicsProcess(double delta)
        {
            if (!_gameplayInputEnabled)
            {
                Velocity = Vector3.Zero;
                MoveAndSlide();
                _pendingMouseDelta = Vector2.Zero;
                return;
            }

            var input = Input.GetVector("move_left", "move_right", "move_up", "move_down");
            _currentAimRotation = HeadingLockedMovementModel3D.UpdateHeadingRotation(
                _currentAimRotation,
                _pendingMouseDelta.X,
                _headingSensitivity);
            _currentAimDirection2D = ToGodot(HeadingLockedMovementModel3D.DirectionFromRotation(_currentAimRotation));

            var planarVelocity = HeadingLockedMovementModel3D.CalculateVelocity(
                new NumericVector2(Velocity.X, Velocity.Z),
                ToNumeric2(input),
                ToNumeric(_currentAimDirection2D),
                delta,
                _moveSpeed);

            Velocity = new Vector3(planarVelocity.X, 0.0f, planarVelocity.Y);
            MoveAndSlide();
            ApplyMeshRotation();
            _pendingMouseDelta = Vector2.Zero;

            if (_equippedWeapon.Definition.FireMode == WeaponFireMode.FullAuto && Input.IsMouseButtonPressed(MouseButton.Left))
            {
                TryUseEquippedWeapon();
            }
        }

        public override void _Input(InputEvent @event)
        {
            if (@event is InputEventKey keyEvent && keyEvent.Pressed && !keyEvent.Echo)
            {
                if (!_gameplayInputEnabled)
                {
                    return;
                }

                if (InputMap.EventIsAction(keyEvent, "reload_weapon"))
                {
                    _equippedWeapon.TryStartReload();
                    return;
                }

                if (InputMap.EventIsAction(keyEvent, "weapon_slot_1"))
                {
                    EquipWeapon(WeaponCatalog.Rifle01);
                    return;
                }

                if (InputMap.EventIsAction(keyEvent, "weapon_slot_2"))
                {
                    EquipWeapon(WeaponCatalog.Pistol01);
                    return;
                }

                if (InputMap.EventIsAction(keyEvent, "weapon_slot_3"))
                {
                    EquipWeapon(WeaponCatalog.Knife01);
                    return;
                }
            }

            if (@event is InputEventMouseMotion mouseMotion)
            {
                _pendingMouseDelta += mouseMotion.Relative;
            }

            if (@event is not InputEventMouseButton mouseButton || !mouseButton.Pressed || !_gameplayInputEnabled)
            {
                return;
            }

            if (mouseButton.ButtonIndex == MouseButton.Left)
            {
                TryUseEquippedWeapon();
            }
        }

        public void SetHeadingSensitivity(float sensitivity)
        {
            _headingSensitivity = sensitivity;
        }

        public void SetMoveSpeed(float moveSpeed)
        {
            _moveSpeed = moveSpeed;
        }

        public void SetGameplayInputEnabled(bool enabled)
        {
            _gameplayInputEnabled = enabled;
            if (!enabled)
            {
                Velocity = Vector3.Zero;
            }
        }

        public void AddMouseDeltaForTesting(Vector2 delta)
        {
            _pendingMouseDelta += delta;
        }

        private void ApplyMeshRotation()
        {
            Rotation = new Vector3(0.0f, _currentAimRotation, 0.0f);
        }

        private void TryUseEquippedWeapon()
        {
            if (_equippedWeapon.Definition.FireMode == WeaponFireMode.Melee)
            {
                TryUseMeleeWeapon();
                return;
            }

            if (_equippedWeapon.Definition.FireMode == WeaponFireMode.FullAuto && !Input.IsMouseButtonPressed(MouseButton.Left))
            {
                return;
            }

            if (!_equippedWeapon.TryConsumeShot())
            {
                return;
            }

            var origin = _firePoint.GlobalPosition;
            var direction = CurrentForward3D.Normalized();
            var maxDistance = PrototypeRangeTo3D(_equippedWeapon.Definition.Range);
            var target = origin + direction * maxDistance;
            var query = PhysicsRayQueryParameters3D.Create(origin, target);
            query.CollideWithBodies = true;
            query.CollideWithAreas = true;
            query.Exclude = new Godot.Collections.Array<Rid> { GetRid(), HurtboxRid };
            var result = GetWorld3D().DirectSpaceState.IntersectRay(query);
            var tracerEnd = target;
            if (result.Count == 0)
            {
                ShowTracer(origin, tracerEnd);
                return;
            }

            tracerEnd = (Vector3)result["position"];
            ShowTracer(origin, tracerEnd);

            if (result["collider"].AsGodotObject() is DummyTarget3D dummyTarget)
            {
                dummyTarget.ApplyDamage(_equippedWeapon.Definition.Damage);
            }
        }

        private void TryUseMeleeWeapon()
        {
            if (!_equippedWeapon.TryConsumeShot())
            {
                return;
            }

            var space = GetWorld3D().DirectSpaceState;
            var shape = new SphereShape3D
            {
                Radius = 0.9f,
            };
            var transform = Transform3D.Identity.Translated(GlobalPosition + Vector3.Up * 0.9f + CurrentForward3D * 1.0f);
            var query = new PhysicsShapeQueryParameters3D
            {
                Shape = shape,
                Transform = transform,
                CollideWithAreas = true,
                CollideWithBodies = false,
            };
            query.Exclude = new Godot.Collections.Array<Rid> { GetRid(), HurtboxRid };
            var results = space.IntersectShape(query, 8);
            foreach (var hit in results)
            {
                if (hit["collider"].AsGodotObject() is DummyTarget3D dummyTarget)
                {
                    dummyTarget.ApplyDamage(_equippedWeapon.Definition.Damage);
                }
            }
        }

        private void EquipWeapon(WeaponDefinition definition)
        {
            if (!_weaponStates.TryGetValue(definition.WeaponId, out var state))
            {
                state = new WeaponState(definition);
                _weaponStates[definition.WeaponId] = state;
            }

            _equippedWeapon = state;
        }

        private static float PrototypeRangeTo3D(float prototypeRange)
        {
            return prototypeRange / 64.0f * 4.0f;
        }

        private void ShowTracer(Vector3 origin, Vector3 end)
        {
            var direction = end - origin;
            var length = direction.Length();
            if (length <= 0.01f)
            {
                return;
            }

            if (_tracerMesh.Mesh is BoxMesh boxMesh)
            {
                boxMesh.Size = new Vector3(0.05f, 0.05f, length);
            }

            _tracerMesh.GlobalPosition = origin.Lerp(end, 0.5f);
            _tracerMesh.LookAt(end, Vector3.Up);
            _tracerMesh.Visible = true;
            _tracerRemaining = 0.05;
        }

        private MeshInstance3D CreateTracerMesh()
        {
            var mesh = new MeshInstance3D
            {
                TopLevel = true,
                Visible = false,
                CastShadow = GeometryInstance3D.ShadowCastingSetting.Off,
                Mesh = new BoxMesh
                {
                    Size = new Vector3(0.05f, 0.05f, 1.0f),
                },
                MaterialOverride = new StandardMaterial3D
                {
                    ShadingMode = BaseMaterial3D.ShadingModeEnum.Unshaded,
                    AlbedoColor = new Color(0.98f, 0.83f, 0.25f, 1.0f),
                    EmissionEnabled = true,
                    Emission = new Color(0.98f, 0.83f, 0.25f, 1.0f),
                },
            };

            AddChild(mesh);
            return mesh;
        }

        private static void EnsureInputMap()
        {
            EnsureAction("move_up", Key.W, Key.Up);
            EnsureAction("move_down", Key.S, Key.Down);
            EnsureAction("move_left", Key.A, Key.Left);
            EnsureAction("move_right", Key.D, Key.Right);
            EnsureAction("reload_weapon", Key.R);
            EnsureAction("weapon_slot_1", Key.Key1);
            EnsureAction("weapon_slot_2", Key.Key2);
            EnsureAction("weapon_slot_3", Key.Key3);
        }

        private static void EnsureAction(StringName actionName, Key primary, Key secondary)
        {
            if (!InputMap.HasAction(actionName))
            {
                InputMap.AddAction(actionName);
            }

            if (!HasKeyEvent(actionName, primary))
            {
                InputMap.ActionAddEvent(actionName, CreateKeyEvent(primary));
            }

            if (!HasKeyEvent(actionName, secondary))
            {
                InputMap.ActionAddEvent(actionName, CreateKeyEvent(secondary));
            }
        }

        private static void EnsureAction(StringName actionName, Key primary)
        {
            if (!InputMap.HasAction(actionName))
            {
                InputMap.AddAction(actionName);
            }

            if (!HasKeyEvent(actionName, primary))
            {
                InputMap.ActionAddEvent(actionName, CreateKeyEvent(primary));
            }
        }

        private static bool HasKeyEvent(StringName actionName, Key keycode)
        {
            foreach (var @event in InputMap.ActionGetEvents(actionName))
            {
                if (@event is InputEventKey keyEvent && keyEvent.Keycode == keycode)
                {
                    return true;
                }
            }

            return false;
        }

        private static InputEventKey CreateKeyEvent(Key keycode)
        {
            return new InputEventKey
            {
                Keycode = keycode,
                PhysicalKeycode = keycode,
            };
        }

        private static NumericVector2 ToNumeric(Vector2 value)
        {
            return new NumericVector2(value.X, value.Y);
        }

        private static NumericVector2 ToNumeric2(Vector3 value)
        {
            return new NumericVector2(value.X, value.Z);
        }

        private static NumericVector2 ToNumeric2(Vector2 value)
        {
            return new NumericVector2(value.X, value.Y);
        }

        private static Vector2 ToGodot(NumericVector2 value)
        {
            return new Vector2(value.X, value.Y);
        }
    }
}
