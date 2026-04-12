using NumericVector2 = System.Numerics.Vector2;
using NumericVector3 = System.Numerics.Vector3;
using System.Collections.Generic;
using Godot;

namespace Canuter
{
    public partial class PlayerController3D : CharacterBody3D
    {
        private const float DefaultShotOriginHeight = 1.25f;
        private const float MinAimPitchDegrees = -89.0f;
        private const float MaxAimPitchDegrees = 90.0f;
        private Area3D _hurtbox = null!;
        private MeshInstance3D _bodyMesh = null!;
        private StandardMaterial3D _bodyMaterial = null!;
        private CollisionShape3D _movementCollider = null!;
        private Marker3D _firePoint = null!;
        private MeshInstance3D _tracerMesh = null!;
        private Node3D _impactRoot = null!;
        private readonly List<ImpactMarkerEntry> _transientImpactMarkers = new();
        private readonly Dictionary<string, WeaponState> _weaponStates = new();
        private WeaponState _equippedWeapon = null!;
        private Vector2 _currentHorizontalForward2D = Vector2.Up;
        private float _currentYawRadians;
        private float _currentPitchDegrees = PlayerRuntimeTuning.Prototype3DCameraPitchDegrees;
        private Vector2 _pendingMouseDelta;
        private bool _gameplayInputEnabled = true;
        private float _headingSensitivity = PlayerRuntimeTuning.HeadingLockedMouseRadiansPerPixel;
        private float _moveSpeed = PlayerRuntimeTuning.Prototype3DMoveSpeed;
        private double _tracerRemaining;
        private bool _pendingAutoReloadOnPrimaryRelease;
        private bool _pendingJump;
        private bool _persistentImpactMarkersEnabled;
        private Camera3D? _aimCamera;
        private float _gravity = PlayerRuntimeTuning.Prototype3DGravity;
        private float _jumpVelocity = PlayerRuntimeTuning.Prototype3DJumpVelocity;
        private Color _bodyBaseColor;
        private float _bodyOpacity = 1.0f;

        private sealed class ImpactMarkerEntry
        {
            public MeshInstance3D Mesh { get; }
            public double RemainingSeconds { get; set; }

            public ImpactMarkerEntry(MeshInstance3D mesh, double remainingSeconds)
            {
                Mesh = mesh;
                RemainingSeconds = remainingSeconds;
            }
        }

        public WeaponDefinition EquippedWeaponDefinition => _equippedWeapon.Definition;
        public int EquippedAmmoInMagazine => _equippedWeapon.AmmoInMagazine;
        public int EquippedReserveAmmo => _equippedWeapon.ReserveAmmo;
        public bool IsReloading => _equippedWeapon.IsReloading;
        public int MaxHealth => 100;
        public int CurrentHealth => 100;
        public Vector3 CurrentForward3D => new(_currentHorizontalForward2D.X, 0.0f, _currentHorizontalForward2D.Y);
        public Vector3 CurrentAimForward3D => ToGodot3(ThirdPersonAimModel3D.AimDirectionFromYawPitch(_currentYawRadians, _currentPitchDegrees));
        public Vector3 CurrentShotOrigin3D => GetShotOrigin();
        public Vector2 CurrentAimDirection2D => _currentHorizontalForward2D;
        public float CurrentAimRotation => _currentYawRadians;
        public float CurrentPitchDegrees => _currentPitchDegrees;
        public float CurrentMinimapRotation => _currentYawRadians + Mathf.Pi;
        public Rid HurtboxRid => _hurtbox.GetRid();
        public Vector3 VisibilityOrigin => GlobalPosition + Vector3.Up * 0.9f;

        public override void _Ready()
        {
            _movementCollider = GetNode<CollisionShape3D>("MovementCollider");
            _hurtbox = GetNode<Area3D>("Hurtbox");
            _bodyMesh = GetNode<MeshInstance3D>("BodyMesh");
            _bodyMaterial = CreateBodyMaterialInstance();
            _bodyBaseColor = _bodyMaterial.AlbedoColor;
            _firePoint = GetNode<Marker3D>("FirePoint");
            _tracerMesh = CreateTracerMesh();
            _impactRoot = new Node3D();
            AddChild(_impactRoot);
            EnsureInputMap();
            EquipWeapon(WeaponCatalog.Rifle01);
            SyncBodyLayout();
            SyncFirePointToShotOrigin();
            ApplyMeshRotation();
            SetBodyOpacity(1.0f);
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

            for (var index = _transientImpactMarkers.Count - 1; index >= 0; index--)
            {
                var marker = _transientImpactMarkers[index];
                marker.RemainingSeconds = Mathf.Max(0.0, marker.RemainingSeconds - delta);
                if (marker.RemainingSeconds <= 0.0)
                {
                    marker.Mesh.QueueFree();
                    _transientImpactMarkers.RemoveAt(index);
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
                _pendingAutoReloadOnPrimaryRelease = false;
                return;
            }

            var input = Input.GetVector("move_left", "move_right", "move_up", "move_down");
            var verticalVelocity = Velocity.Y;
            if (CanJumpFromCurrentState())
            {
                if (verticalVelocity < 0.0f)
                {
                    verticalVelocity = 0.0f;
                }

                if (Input.IsActionJustPressed("jump"))
                {
                    _pendingJump = true;
                }

                if (_pendingJump)
                {
                    verticalVelocity = _jumpVelocity;
                    _pendingJump = false;
                }
            }
            else
            {
                verticalVelocity -= _gravity * (float)delta;
            }

            _currentYawRadians = ThirdPersonAimModel3D.UpdateYawRadians(
                _currentYawRadians,
                _pendingMouseDelta.X,
                _headingSensitivity);
            _currentPitchDegrees = ThirdPersonAimModel3D.UpdatePitchDegrees(
                _currentPitchDegrees,
                _pendingMouseDelta.Y,
                _headingSensitivity,
                MinAimPitchDegrees,
                MaxAimPitchDegrees);
            _currentHorizontalForward2D = ToGodot(ThirdPersonAimModel3D.HorizontalForwardFromYaw(_currentYawRadians));

            var planarVelocity = HeadingLockedMovementModel3D.CalculateVelocity(
                new NumericVector2(Velocity.X, Velocity.Z),
                ToNumeric2(input),
                ToNumeric(_currentHorizontalForward2D),
                delta,
                _moveSpeed);

            Velocity = new Vector3(planarVelocity.X, verticalVelocity, planarVelocity.Y);
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
                    TryStartReload();
                    return;
                }

                if (InputMap.EventIsAction(keyEvent, "jump"))
                {
                    _pendingJump = true;
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

            if (@event is InputEventMouseMotion mouseMotion && _gameplayInputEnabled)
            {
                _pendingMouseDelta += mouseMotion.Relative;
            }

            if (@event is not InputEventMouseButton mouseButton || !_gameplayInputEnabled)
            {
                return;
            }

            if (mouseButton.ButtonIndex != MouseButton.Left)
            {
                return;
            }

            if (mouseButton.Pressed)
            {
                TryUseEquippedWeapon();
                return;
            }

            if (_pendingAutoReloadOnPrimaryRelease)
            {
                TryStartReload();
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

        public void SetGravity(float gravity)
        {
            _gravity = gravity;
        }

        public void SetJumpVelocity(float jumpVelocity)
        {
            _jumpVelocity = jumpVelocity;
        }

        public void SetPersistentImpactMarkersEnabled(bool enabled)
        {
            _persistentImpactMarkersEnabled = enabled;
        }

        public void SetBodyOpacity(float opacity)
        {
            _bodyOpacity = Mathf.Clamp(opacity, PlayerBodyFadeModel3D.MinOpacityAtMinZoom, 1.0f);
            var color = _bodyBaseColor;
            color.A = _bodyBaseColor.A * _bodyOpacity;
            _bodyMaterial.AlbedoColor = color;
            _bodyMaterial.Transparency = _bodyOpacity >= 0.999f
                ? BaseMaterial3D.TransparencyEnum.Disabled
                : BaseMaterial3D.TransparencyEnum.Alpha;
        }

        public void SetPitchDegrees(float pitchDegrees)
        {
            _currentPitchDegrees = float.Clamp(pitchDegrees, MinAimPitchDegrees, MaxAimPitchDegrees);
        }

        public void SetGameplayInputEnabled(bool enabled)
        {
            _gameplayInputEnabled = enabled;
            if (!enabled)
            {
                Velocity = Vector3.Zero;
                _pendingAutoReloadOnPrimaryRelease = false;
            }
        }

        public void AddMouseDeltaForTesting(Vector2 delta)
        {
            _pendingMouseDelta += delta;
        }

        public void SetEquippedAmmoForTesting(int ammoInMagazine, int reserveAmmo)
        {
            _equippedWeapon.SetAmmoForTesting(ammoInMagazine, reserveAmmo);
        }

        public int GetEquippedAmmoInMagazineForTesting()
        {
            return _equippedWeapon.AmmoInMagazine;
        }

        public bool GetIsReloadingForTesting()
        {
            return _equippedWeapon.IsReloading;
        }

        public float GetCurrentPitchDegreesForTesting()
        {
            return _currentPitchDegrees;
        }

        public float GetHeightForTesting()
        {
            return GlobalPosition.Y;
        }

        public float GetVerticalVelocityForTesting()
        {
            return Velocity.Y;
        }

        public bool GetIsOnFloorForTesting()
        {
            return IsOnFloor();
        }

        public Vector3 GetCurrentAimForward3DForTesting()
        {
            return CurrentAimForward3D;
        }

        public Vector3 GetFirePointPositionForTesting()
        {
            return GetShotOrigin();
        }

        public Vector3 GetLowestBodyPointForTesting()
        {
            return GetLowestBodyPoint();
        }

        public Vector3 GetCurrentShotDirectionForTesting(float maxDistance)
        {
            var aimPoint = ResolveAimPoint(maxDistance);
            return (aimPoint - GetShotOrigin()).Normalized();
        }

        public bool GetImpactMarkerVisibleForTesting()
        {
            return _impactRoot.GetChildCount() > 0;
        }

        public float GetBodyOpacityForTesting()
        {
            return _bodyOpacity;
        }

        public Vector3 GetImpactMarkerPositionForTesting()
        {
            if (_impactRoot.GetChildCount() == 0)
            {
                return Vector3.Zero;
            }

            return ((Node3D)_impactRoot.GetChild(_impactRoot.GetChildCount() - 1)).GlobalPosition;
        }

        public void FireEquippedWeaponForTesting()
        {
            TryUseEquippedWeapon(ignoreFullAutoHeldCheck: true);
        }

        public void RequestJumpForTesting()
        {
            _pendingJump = true;
        }

        public void BindAimCamera(Camera3D camera)
        {
            _aimCamera = camera;
        }

        private bool CanJumpFromCurrentState()
        {
            return IsOnFloor();
        }

        private void ApplyMeshRotation()
        {
            Rotation = new Vector3(0.0f, _currentYawRadians, 0.0f);
            SyncFirePointToShotOrigin();
        }

        private void SyncBodyLayout()
        {
            var capsuleHalfHeight = GetCapsuleHalfHeight();
            var colliderOffset = new Vector3(0.0f, capsuleHalfHeight, 0.0f);
            _movementCollider.Position = colliderOffset;
            _hurtbox.Position = colliderOffset;
            _bodyMesh.Position = colliderOffset;

            if (_movementCollider.Shape is CapsuleShape3D capsule && _bodyMesh.Mesh is CapsuleMesh bodyCapsuleMesh)
            {
                bodyCapsuleMesh.Radius = capsule.Radius;
                bodyCapsuleMesh.Height = capsule.Height;
            }
        }

        private StandardMaterial3D CreateBodyMaterialInstance()
        {
            var sourceMaterial = _bodyMesh.MaterialOverride as StandardMaterial3D;
            var material = sourceMaterial != null
                ? (StandardMaterial3D)sourceMaterial.Duplicate()
                : new StandardMaterial3D();
            _bodyMesh.MaterialOverride = material;
            return material;
        }

        private void TryUseEquippedWeapon()
        {
            TryUseEquippedWeapon(ignoreFullAutoHeldCheck: false);
        }

        private void TryUseEquippedWeapon(bool ignoreFullAutoHeldCheck)
        {
            if (_equippedWeapon.Definition.FireMode == WeaponFireMode.Melee)
            {
                TryUseMeleeWeapon();
                return;
            }

            if (!ignoreFullAutoHeldCheck &&
                _equippedWeapon.Definition.FireMode == WeaponFireMode.FullAuto &&
                !Input.IsMouseButtonPressed(MouseButton.Left))
            {
                return;
            }

            if (!_equippedWeapon.TryConsumeShot())
            {
                QueueAutoReloadIfMagazineEmpty();
                return;
            }

            QueueAutoReloadIfMagazineEmpty();

            var origin = GetShotOrigin();
            var maxDistance = PrototypeRangeTo3D(_equippedWeapon.Definition.Range);
            var aimPoint = ResolveAimPoint(maxDistance);
            var direction = (aimPoint - origin).Normalized();
            if (direction.LengthSquared() <= 0.0001f)
            {
                direction = CurrentAimForward3D.Normalized();
            }
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
            ShowImpactMarker(tracerEnd, result.ContainsKey("normal") ? (Vector3)result["normal"] : Vector3.Zero);

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
            _pendingAutoReloadOnPrimaryRelease = false;
        }

        private void QueueAutoReloadIfMagazineEmpty()
        {
            if (!_equippedWeapon.Definition.UsesMagazine || _equippedWeapon.AmmoInMagazine > 0 || _equippedWeapon.ReserveAmmo <= 0)
            {
                return;
            }

            _pendingAutoReloadOnPrimaryRelease = true;
        }

        private void TryStartReload()
        {
            if (_equippedWeapon.TryStartReload())
            {
                _pendingAutoReloadOnPrimaryRelease = false;
            }
        }

        private static float PrototypeRangeTo3D(float prototypeRange)
        {
            return prototypeRange / 64.0f * 8.0f;
        }

        private Vector3 ResolveAimPoint(float maxDistance)
        {
            if (_aimCamera == null)
            {
                return _firePoint.GlobalPosition + CurrentAimForward3D * maxDistance;
            }

            var viewportCenter = _aimCamera.GetViewport().GetVisibleRect().Size * 0.5f;
            var rayOrigin = _aimCamera.ProjectRayOrigin(viewportCenter);
            var rayNormal = _aimCamera.ProjectRayNormal(viewportCenter);
            var rayTarget = rayOrigin + rayNormal * maxDistance;
            var query = PhysicsRayQueryParameters3D.Create(rayOrigin, rayTarget);
            query.CollideWithBodies = true;
            query.CollideWithAreas = true;
            query.Exclude = new Godot.Collections.Array<Rid> { GetRid(), HurtboxRid };
            var result = GetWorld3D().DirectSpaceState.IntersectRay(query);
            return result.Count == 0 ? rayTarget : (Vector3)result["position"];
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

        private void ShowImpactMarker(Vector3 position, Vector3 normal)
        {
            var offsetNormal = normal.LengthSquared() > 0.0001f ? normal.Normalized() : Vector3.Up;
            var impactMesh = CreateImpactMesh();
            _impactRoot.AddChild(impactMesh);
            impactMesh.GlobalPosition = position + offsetNormal * 0.03f;
            impactMesh.Visible = true;

            if (!_persistentImpactMarkersEnabled)
            {
                _transientImpactMarkers.Add(new ImpactMarkerEntry(impactMesh, 0.12));
            }
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

        private MeshInstance3D CreateImpactMesh()
        {
            return new MeshInstance3D
            {
                TopLevel = true,
                Visible = false,
                CastShadow = GeometryInstance3D.ShadowCastingSetting.Off,
                Mesh = new SphereMesh
                {
                    Radius = 0.12f,
                    Height = 0.24f,
                },
                MaterialOverride = new StandardMaterial3D
                {
                    ShadingMode = BaseMaterial3D.ShadingModeEnum.Unshaded,
                    Transparency = BaseMaterial3D.TransparencyEnum.Alpha,
                    AlbedoColor = new Color(0.98f, 0.88f, 0.18f, 0.45f),
                    EmissionEnabled = true,
                    Emission = new Color(0.98f, 0.88f, 0.18f, 1.0f),
                },
            };
        }

        private Vector3 GetShotOrigin()
        {
            return GlobalPosition + Vector3.Up * GetShotOriginHeight();
        }

        private Vector3 GetLowestBodyPoint()
        {
            return GlobalPosition + Vector3.Up * GetLowestBodyPointHeight();
        }

        private float GetCapsuleHalfHeight()
        {
            if (_movementCollider?.Shape is CapsuleShape3D capsule)
            {
                return capsule.Height * 0.5f;
            }

            return DefaultShotOriginHeight;
        }

        private float GetShotOriginHeight()
        {
            if (_movementCollider?.Shape is CapsuleShape3D capsule)
            {
                return _movementCollider.Position.Y + capsule.Height * 0.5f;
            }

            return DefaultShotOriginHeight;
        }

        private float GetLowestBodyPointHeight()
        {
            if (_movementCollider?.Shape is CapsuleShape3D capsule)
            {
                return _movementCollider.Position.Y - capsule.Height * 0.5f;
            }

            return 0.0f;
        }

        private void SyncFirePointToShotOrigin()
        {
            _firePoint.Position = new Vector3(0.0f, GetShotOriginHeight(), 0.0f);
        }

        private static void EnsureInputMap()
        {
            EnsureAction("move_up", Key.W, Key.Up);
            EnsureAction("move_down", Key.S, Key.Down);
            EnsureAction("move_left", Key.A, Key.Left);
            EnsureAction("move_right", Key.D, Key.Right);
            EnsureAction("jump", Key.Space);
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

        private static Vector3 ToGodot3(NumericVector3 value)
        {
            return new Vector3(value.X, value.Y, value.Z);
        }
    }
}
