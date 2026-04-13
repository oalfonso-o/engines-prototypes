using NumericVector2 = System.Numerics.Vector2;
using NumericVector3 = System.Numerics.Vector3;
using System.Collections.Generic;
using Godot;

namespace Canuter
{
    public partial class PlayerController3D : CharacterBody3D, IDamageZoneOwner3D
    {
        private const float MinAimPitchDegrees = -89.0f;
        private const float MaxAimPitchDegrees = 90.0f;
        private const float TorsoRadius = 0.36f;
        private const float TorsoHeight = 1.24f;
        private const float TorsoCenterHeight = 0.84f;
        private const float HeadRadius = 0.24f;
        private const float HeadCenterHeight = 1.58f;
        private const float HandRadius = 0.14f;
        private const float HandCenterHeight = 0.95f;
        private const float HandOffsetX = 0.56f;
        private const float FootWidth = 0.22f;
        private const float FootHeight = 0.18f;
        private const float FootDepth = 0.26f;
        private const float FootCenterHeight = FootHeight * 0.5f;
        private const float FootOffsetX = 0.19f;
        private const int PostureCollisionIterations = 8;
        private const float CollisionValidationLift = 0.05f;
        private Area3D _hurtbox = null!;
        private CollisionShape3D _hurtboxCollision = null!;
        private MeshInstance3D _bodyMesh = null!;
        private MeshInstance3D _headMesh = null!;
        private MeshInstance3D _leftHandMesh = null!;
        private MeshInstance3D _rightHandMesh = null!;
        private MeshInstance3D _leftFootMesh = null!;
        private MeshInstance3D _rightFootMesh = null!;
        private CollisionShape3D _movementCollider = null!;
        private Marker3D _firePoint = null!;
        private MeshInstance3D _tracerMesh = null!;
        private Node3D _impactRoot = null!;
        private readonly List<ImpactMarkerEntry> _transientImpactMarkers = new();
        private readonly Dictionary<string, WeaponState> _weaponStates = new();
        private readonly Dictionary<DamageZoneType3D, DamageZone3D> _damageZones = new();
        private readonly List<StandardMaterial3D> _bodyMaterials = new();
        private WeaponState _equippedWeapon = null!;
        private Vector2 _currentHorizontalForward2D = Vector2.Up;
        private float _currentYawRadians;
        private float _currentPitchDegrees = PlayerRuntimeTuning.Prototype3DCameraPitchDegrees;
        private Vector2 _pendingMouseDelta;
        private bool _gameplayInputEnabled = true;
        private float _headingSensitivity = PlayerRuntimeTuning.HeadingLockedMouseRadiansPerPixel;
        private float _moveSpeed = PlayerRuntimeTuning.Prototype3DMoveSpeed;
        private float _effectiveMoveSpeedMultiplier = 1.0f;
        private double _tracerRemaining;
        private bool _pendingAutoReloadOnPrimaryRelease;
        private bool _pendingJump;
        private bool _persistentImpactMarkersEnabled;
        private Camera3D? _aimCamera;
        private float _gravity = PlayerRuntimeTuning.Prototype3DGravity;
        private float _jumpVelocity = PlayerRuntimeTuning.Prototype3DJumpVelocity;
        private Color _bodyBaseColor;
        private float _bodyOpacity = 1.0f;
        private int _currentHealth = 100;
        private PlayerPostureState3D _postureState = PlayerPostureModel3D.CreateInitialState();
        private ColliderProfile _currentColliderProfile = StandColliderProfile();
        private float _visualAnimationTime;

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
        public int CurrentHealth => _currentHealth;
        public Vector3 CurrentForward3D => new(_currentHorizontalForward2D.X, 0.0f, _currentHorizontalForward2D.Y);
        public Vector3 CurrentAimForward3D => ToGodot3(ThirdPersonAimModel3D.AimDirectionFromYawPitch(_currentYawRadians, _currentPitchDegrees));
        public Vector3 CurrentShotOrigin3D => GetShotOrigin();
        public Vector2 CurrentAimDirection2D => _currentHorizontalForward2D;
        public float CurrentAimRotation => _currentYawRadians;
        public float CurrentPitchDegrees => _currentPitchDegrees;
        public float CurrentMinimapRotation => _currentYawRadians + Mathf.Pi;
        public Rid HurtboxRid => _hurtbox.GetRid();
        public Vector3 VisibilityOrigin => GetShotOrigin();

        public override void _Ready()
        {
            _movementCollider = GetNode<CollisionShape3D>("MovementCollider");
            _hurtbox = GetNode<Area3D>("Hurtbox");
            _hurtboxCollision = _hurtbox.GetNode<CollisionShape3D>("CollisionShape3D");
            _bodyMesh = GetNode<MeshInstance3D>("BodyMesh");
            _firePoint = GetNode<Marker3D>("FirePoint");
            _bodyBaseColor = new Color(0.18f, 0.42f, 0.86f, 1.0f);
            BuildVisualRig();
            BuildDamageZones();
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
            ApplyMeshRotation();
            UpdatePosture((float)delta);

            var planarVelocity = HeadingLockedMovementModel3D.CalculateVelocity(
                new NumericVector2(Velocity.X, Velocity.Z),
                ToNumeric2(input),
                ToNumeric(_currentHorizontalForward2D),
                delta,
                _moveSpeed * _effectiveMoveSpeedMultiplier);

            Velocity = new Vector3(planarVelocity.X, verticalVelocity, planarVelocity.Y);
            MoveAndSlide();
            AdvanceVisualAnimation((float)delta);
            SyncBodyLayout();
            SyncFirePointToShotOrigin();
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
            foreach (var material in _bodyMaterials)
            {
                var color = _bodyBaseColor;
                color.A = _bodyBaseColor.A * _bodyOpacity;
                material.AlbedoColor = color;
                material.Transparency = _bodyOpacity >= 0.999f
                    ? BaseMaterial3D.TransparencyEnum.Disabled
                    : BaseMaterial3D.TransparencyEnum.Alpha;
            }
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

        public bool HasHumanoidRigForTesting()
        {
            return _headMesh != null &&
                   _leftHandMesh != null &&
                   _rightHandMesh != null &&
                   _leftFootMesh != null &&
                   _rightFootMesh != null;
        }

        public float GetVisualTopForTesting()
        {
            return GlobalPosition.Y + InterpolatePose(_postureState.CurrentValue).HeadPosition.Y + HeadRadius;
        }

        public float GetCurrentPostureValueForTesting()
        {
            return _postureState.CurrentValue;
        }

        public int GetRequestedPostureIdForTesting()
        {
            return (int)_postureState.RequestedPosture;
        }

        public float GetEffectiveMoveSpeedForTesting()
        {
            return _moveSpeed * _effectiveMoveSpeedMultiplier;
        }

        public float GetMovementColliderTopForTesting()
        {
            return GlobalPosition.Y + _currentColliderProfile.TopY;
        }

        public float GetMovementColliderFrontForTesting()
        {
            var localFront = new Vector3(0.0f, 0.0f, _currentColliderProfile.FrontZ);
            return ToGlobal(localFront).Z;
        }

        public float GetBodyYawRadiansForTesting()
        {
            return Rotation.Y;
        }

        public bool FeetUsePegMeshesForTesting()
        {
            return _leftFootMesh.Mesh is BoxMesh && _rightFootMesh.Mesh is BoxMesh;
        }

        public Vector3 GetLeftFootPositionForTesting()
        {
            return _leftFootMesh.Position;
        }

        public Vector3 GetRightHandPositionForTesting()
        {
            return _rightHandMesh.Position;
        }

        public Vector3 GetShotOriginLocalPositionForTesting()
        {
            return GetShotOriginLocalPosition();
        }

        public Vector3 GetTorsoRotationDegreesForTesting()
        {
            return _bodyMesh.RotationDegrees;
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

        public void ApplyDamage(int baseDamage, DamageZoneType3D zoneType)
        {
            _currentHealth = Mathf.Max(0, _currentHealth - BodyPartDamageModel3D.ComputeDamage(baseDamage, zoneType));
        }

        private bool CanJumpFromCurrentState()
        {
            return IsOnFloor();
        }

        private void UpdatePosture(float deltaSeconds)
        {
            var requestedPosture = PlayerPostureModel3D.ResolveRequestedPosture(
                Input.IsActionPressed("crouch_posture"),
                Input.IsActionPressed("prone_posture"));
            _effectiveMoveSpeedMultiplier = PlayerPostureModel3D.GetInstantMoveSpeedMultiplier(
                requestedPosture,
                Input.IsActionPressed("slow_walk"));
            var retargetedState = PlayerPostureModel3D.Retarget(_postureState, requestedPosture);
            var advancedState = PlayerPostureModel3D.Advance(retargetedState, deltaSeconds);
            var safePostureValue = ResolveSafePostureValue(_postureState.CurrentValue, advancedState.CurrentValue);
            if (!Mathf.IsEqualApprox(safePostureValue, advancedState.CurrentValue))
            {
                _postureState = advancedState with
                {
                    CurrentValue = safePostureValue,
                    StartValue = safePostureValue,
                    ElapsedSeconds = 0.0f,
                };
            }
            else
            {
                _postureState = advancedState;
            }
            SyncBodyLayout();
            SyncFirePointToShotOrigin();
        }

        private void ApplyMeshRotation()
        {
            Rotation = new Vector3(0.0f, _currentYawRadians, 0.0f);
            SyncFirePointToShotOrigin();
        }

        private void SyncBodyLayout()
        {
            _currentColliderProfile = InterpolateColliderProfile(_postureState.CurrentValue);
            ApplyColliderProfile(_currentColliderProfile);
            ApplyPoseToVisualRig();
            UpdateDamageZoneLayout();
        }

        private void BuildVisualRig()
        {
            _bodyMaterials.Clear();
            CreateBodyMaterialInstance(_bodyMesh);
            _headMesh = CreateBodyPartSphere("HeadMesh");
            _leftHandMesh = CreateBodyPartSphere("LeftHandMesh");
            _rightHandMesh = CreateBodyPartSphere("RightHandMesh");
            _leftFootMesh = CreateFootPegMesh("LeftFootMesh");
            _rightFootMesh = CreateFootPegMesh("RightFootMesh");
        }

        private MeshInstance3D CreateBodyPartSphere(string name)
        {
            var mesh = new MeshInstance3D
            {
                Name = name,
                Mesh = new SphereMesh
                {
                    Radius = 0.1f,
                    Height = 0.2f,
                },
            };
            AddChild(mesh);
            CreateBodyMaterialInstance(mesh);
            return mesh;
        }

        private MeshInstance3D CreateFootPegMesh(string name)
        {
            var mesh = new MeshInstance3D
            {
                Name = name,
                Mesh = new BoxMesh
                {
                    Size = new Vector3(FootWidth, FootHeight, FootDepth),
                },
            };
            AddChild(mesh);
            CreateBodyMaterialInstance(mesh);
            return mesh;
        }

        private StandardMaterial3D CreateBodyMaterialInstance(MeshInstance3D mesh)
        {
            var sourceMaterial = mesh.MaterialOverride as StandardMaterial3D;
            var material = sourceMaterial != null
                ? (StandardMaterial3D)sourceMaterial.Duplicate()
                : new StandardMaterial3D();
            material.ShadingMode = BaseMaterial3D.ShadingModeEnum.Unshaded;
            material.AlbedoColor = _bodyBaseColor;
            mesh.MaterialOverride = material;
            _bodyMaterials.Add(material);
            return material;
        }

        private void BuildDamageZones()
        {
            _damageZones.Clear();

            AddDamageZone("HeadZone", DamageZoneType3D.Head, new SphereShape3D(), new Vector3(0.0f, HeadCenterHeight, 0.0f));
            AddDamageZone("TorsoZone", DamageZoneType3D.Torso, new CapsuleShape3D(), new Vector3(0.0f, TorsoCenterHeight, 0.0f));
            AddDamageZone("LeftHandZone", DamageZoneType3D.LeftHand, new SphereShape3D(), new Vector3(-HandOffsetX, HandCenterHeight, 0.0f));
            AddDamageZone("RightHandZone", DamageZoneType3D.RightHand, new SphereShape3D(), new Vector3(HandOffsetX, HandCenterHeight, 0.0f));
            AddDamageZone("LeftFootZone", DamageZoneType3D.LeftFoot, new SphereShape3D(), new Vector3(-FootOffsetX, FootCenterHeight, 0.0f));
            AddDamageZone("RightFootZone", DamageZoneType3D.RightFoot, new SphereShape3D(), new Vector3(FootOffsetX, FootCenterHeight, 0.0f));
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

        private void UpdateDamageZoneLayout()
        {
            var pose = ApplyProceduralAnimation(InterpolatePose(_postureState.CurrentValue));
            ConfigureDamageZone(DamageZoneType3D.Head, new SphereShape3D { Radius = HeadRadius }, pose.HeadPosition);
            ConfigureDamageZone(DamageZoneType3D.Torso, new CapsuleShape3D { Radius = pose.TorsoRadius, Height = pose.TorsoDamageHeight }, pose.TorsoPosition);
            ConfigureDamageZone(DamageZoneType3D.LeftHand, new SphereShape3D { Radius = HandRadius }, pose.LeftHandPosition);
            ConfigureDamageZone(DamageZoneType3D.RightHand, new SphereShape3D { Radius = HandRadius }, pose.RightHandPosition);
            ConfigureDamageZone(DamageZoneType3D.LeftFoot, new BoxShape3D { Size = new Vector3(FootWidth, FootHeight, FootDepth) }, pose.LeftFootPosition);
            ConfigureDamageZone(DamageZoneType3D.RightFoot, new BoxShape3D { Size = new Vector3(FootWidth, FootHeight, FootDepth) }, pose.RightFootPosition);
        }

        private void ApplyPoseToVisualRig()
        {
            var pose = ApplyProceduralAnimation(InterpolatePose(_postureState.CurrentValue));
            _bodyMesh.Position = pose.TorsoPosition;
            _bodyMesh.RotationDegrees = pose.TorsoRotationDegrees + new Vector3(-_currentPitchDegrees, 0.0f, 0.0f);
            _headMesh.Position = pose.HeadPosition;
            _headMesh.RotationDegrees = new Vector3(-_currentPitchDegrees * 0.35f, 0.0f, 0.0f);
            _leftHandMesh.Position = pose.LeftHandPosition;
            _rightHandMesh.Position = pose.RightHandPosition;
            _leftHandMesh.RotationDegrees = new Vector3(-_currentPitchDegrees * 0.35f, 0.0f, 0.0f);
            _rightHandMesh.RotationDegrees = new Vector3(-_currentPitchDegrees * 0.55f, 0.0f, 0.0f);
            _leftFootMesh.Position = pose.LeftFootPosition;
            _rightFootMesh.Position = pose.RightFootPosition;

            if (_bodyMesh.Mesh is CapsuleMesh torsoMesh)
            {
                torsoMesh.Radius = pose.TorsoRadius;
                torsoMesh.Height = pose.TorsoHeight;
            }

            if (_headMesh.Mesh is SphereMesh headMesh)
            {
                headMesh.Radius = HeadRadius;
                headMesh.Height = HeadRadius * 2.0f;
            }

            if (_leftFootMesh.Mesh is BoxMesh leftFootMesh)
            {
                leftFootMesh.Size = new Vector3(FootWidth, FootHeight, FootDepth);
            }

            if (_rightFootMesh.Mesh is BoxMesh rightFootMesh)
            {
                rightFootMesh.Size = new Vector3(FootWidth, FootHeight, FootDepth);
            }
        }

        private void ConfigureDamageZone(DamageZoneType3D zoneType, Shape3D shape, Vector3 localPosition)
        {
            if (_damageZones.TryGetValue(zoneType, out var zone))
            {
                zone.Configure(this, zoneType, shape, localPosition);
            }
        }

        private static PoseLayout InterpolatePose(float postureValue)
        {
            if (postureValue <= PlayerPostureModel3D.CrouchValue)
            {
                var crouchT = postureValue / PlayerPostureModel3D.CrouchValue;
                return LerpPose(StandPose(), CrouchPose(), crouchT);
            }

            var proneT = (postureValue - PlayerPostureModel3D.CrouchValue) /
                         (PlayerPostureModel3D.ProneValue - PlayerPostureModel3D.CrouchValue);
            return LerpPose(CrouchPose(), PronePose(), proneT);
        }

        private static PoseLayout StandPose()
        {
            return new PoseLayout(
                TorsoPosition: new Vector3(0.0f, TorsoCenterHeight, 0.0f),
                TorsoRotationDegrees: Vector3.Zero,
                TorsoRadius: TorsoRadius,
                TorsoHeight: TorsoHeight,
                TorsoDamageHeight: 0.92f,
                HeadPosition: new Vector3(0.0f, HeadCenterHeight, 0.0f),
                LeftHandPosition: new Vector3(-0.40f, 1.00f, 0.18f),
                RightHandPosition: new Vector3(0.30f, 1.04f, 0.34f),
                LeftFootPosition: new Vector3(-FootOffsetX, FootCenterHeight, 0.02f),
                RightFootPosition: new Vector3(FootOffsetX, FootCenterHeight, 0.02f),
                ShotOriginPosition: new Vector3(0.0f, 1.74f, 0.0f));
        }

        private static PoseLayout CrouchPose()
        {
            return new PoseLayout(
                TorsoPosition: new Vector3(0.0f, 0.60f, 0.0f),
                TorsoRotationDegrees: Vector3.Zero,
                TorsoRadius: 0.44f,
                TorsoHeight: 0.82f,
                TorsoDamageHeight: 0.58f,
                HeadPosition: new Vector3(0.0f, 1.12f, 0.0f),
                LeftHandPosition: new Vector3(-0.38f, 0.76f, 0.20f),
                RightHandPosition: new Vector3(0.28f, 0.80f, 0.34f),
                LeftFootPosition: new Vector3(-0.22f, FootCenterHeight, 0.03f),
                RightFootPosition: new Vector3(0.22f, FootCenterHeight, 0.03f),
                ShotOriginPosition: new Vector3(0.0f, 1.28f, 0.06f));
        }

        private static PoseLayout PronePose()
        {
            return new PoseLayout(
                TorsoPosition: new Vector3(0.0f, 0.28f, 0.40f),
                TorsoRotationDegrees: new Vector3(90.0f, 0.0f, 0.0f),
                TorsoRadius: 0.22f,
                TorsoHeight: 1.05f,
                TorsoDamageHeight: 0.70f,
                HeadPosition: new Vector3(0.0f, 0.30f, 0.95f),
                LeftHandPosition: new Vector3(-0.40f, 0.22f, 0.54f),
                RightHandPosition: new Vector3(0.34f, 0.24f, 0.82f),
                LeftFootPosition: new Vector3(-0.24f, FootCenterHeight, -0.18f),
                RightFootPosition: new Vector3(0.24f, FootCenterHeight, -0.18f),
                ShotOriginPosition: new Vector3(0.0f, 0.60f, 1.14f));
        }

        private static PoseLayout LerpPose(PoseLayout from, PoseLayout to, float t)
        {
            return new PoseLayout(
                TorsoPosition: from.TorsoPosition.Lerp(to.TorsoPosition, t),
                TorsoRotationDegrees: from.TorsoRotationDegrees.Lerp(to.TorsoRotationDegrees, t),
                TorsoRadius: Mathf.Lerp(from.TorsoRadius, to.TorsoRadius, t),
                TorsoHeight: Mathf.Lerp(from.TorsoHeight, to.TorsoHeight, t),
                TorsoDamageHeight: Mathf.Lerp(from.TorsoDamageHeight, to.TorsoDamageHeight, t),
                HeadPosition: from.HeadPosition.Lerp(to.HeadPosition, t),
                LeftHandPosition: from.LeftHandPosition.Lerp(to.LeftHandPosition, t),
                RightHandPosition: from.RightHandPosition.Lerp(to.RightHandPosition, t),
                LeftFootPosition: from.LeftFootPosition.Lerp(to.LeftFootPosition, t),
                RightFootPosition: from.RightFootPosition.Lerp(to.RightFootPosition, t),
                ShotOriginPosition: from.ShotOriginPosition.Lerp(to.ShotOriginPosition, t));
        }

        private PoseLayout ApplyProceduralAnimation(PoseLayout pose)
        {
            var planarSpeed = new Vector2(Velocity.X, Velocity.Z).Length();
            var movementFactor = Mathf.Clamp(planarSpeed / Mathf.Max(0.001f, _moveSpeed), 0.0f, 1.0f);
            var onFloor = IsOnFloor();
            var animatedPose = pose;

            if (movementFactor > 0.08f && onFloor)
            {
                var phase = _visualAnimationTime * 9.0f;
                var leftStep = Mathf.Sin(phase);
                var rightStep = Mathf.Sin(phase + Mathf.Pi);
                animatedPose = animatedPose with
                {
                    LeftFootPosition = pose.LeftFootPosition + new Vector3(0.0f, Mathf.Max(0.0f, leftStep) * 0.12f * movementFactor, leftStep * 0.08f * movementFactor),
                    RightFootPosition = pose.RightFootPosition + new Vector3(0.0f, Mathf.Max(0.0f, rightStep) * 0.12f * movementFactor, rightStep * 0.08f * movementFactor),
                    LeftHandPosition = pose.LeftHandPosition + new Vector3(0.0f, 0.02f * movementFactor, rightStep * 0.06f * movementFactor),
                    RightHandPosition = pose.RightHandPosition + new Vector3(0.0f, 0.02f * movementFactor, leftStep * 0.06f * movementFactor),
                };
            }

            if (!onFloor)
            {
                animatedPose = animatedPose with
                {
                    LeftHandPosition = animatedPose.LeftHandPosition + new Vector3(-0.02f, 0.08f, -0.10f),
                    RightHandPosition = animatedPose.RightHandPosition + new Vector3(0.02f, 0.08f, -0.10f),
                    LeftFootPosition = animatedPose.LeftFootPosition + new Vector3(0.0f, 0.08f, -0.04f),
                    RightFootPosition = animatedPose.RightFootPosition + new Vector3(0.0f, 0.08f, -0.04f),
                };
            }

            return animatedPose;
        }

        private void AdvanceVisualAnimation(float deltaSeconds)
        {
            var planarSpeed = new Vector2(Velocity.X, Velocity.Z).Length();
            var movementFactor = Mathf.Clamp(planarSpeed / Mathf.Max(0.001f, _moveSpeed), 0.0f, 1.0f);
            _visualAnimationTime += deltaSeconds * Mathf.Lerp(1.5f, 6.0f, movementFactor);
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
            query.Exclude = BuildSelfExcludeList();
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
            ApplyDamageToHitCollider(result["collider"].AsGodotObject(), _equippedWeapon.Definition.Damage);
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
            query.Exclude = BuildSelfExcludeList();
            var results = space.IntersectShape(query, 8);
            foreach (var hit in results)
            {
                ApplyDamageToHitCollider(hit["collider"].AsGodotObject(), _equippedWeapon.Definition.Damage);
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
            query.Exclude = BuildSelfExcludeList();
            var result = GetWorld3D().DirectSpaceState.IntersectRay(query);
            return result.Count == 0 ? rayTarget : (Vector3)result["position"];
        }

        private void ApplyDamageToHitCollider(GodotObject? collider, int baseDamage)
        {
            switch (collider)
            {
                case DamageZone3D damageZone:
                    damageZone.ApplyDamage(baseDamage);
                    break;
                case DummyTarget3D dummyTarget:
                    dummyTarget.ApplyDamage(baseDamage);
                    break;
            }
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
            return ToGlobal(GetShotOriginLocalPosition());
        }

        private Vector3 GetLowestBodyPoint()
        {
            return GlobalPosition + Vector3.Up * GetLowestBodyPointHeight();
        }

        private Vector3 GetShotOriginLocalPosition()
        {
            var pose = ApplyProceduralAnimation(InterpolatePose(_postureState.CurrentValue));
            return pose.ShotOriginPosition;
        }

        private float GetLowestBodyPointHeight()
        {
            return _currentColliderProfile.BottomY;
        }

        private void SyncFirePointToShotOrigin()
        {
            _firePoint.Position = GetShotOriginLocalPosition();
        }

        private float ResolveSafePostureValue(float currentValue, float desiredValue)
        {
            if (Mathf.IsEqualApprox(currentValue, desiredValue))
            {
                return desiredValue;
            }

            if (IsColliderProfileValid(InterpolateColliderProfile(desiredValue)))
            {
                return desiredValue;
            }

            if (!IsColliderProfileValid(InterpolateColliderProfile(currentValue)))
            {
                return desiredValue;
            }

            var valid = currentValue;
            var invalid = desiredValue;
            for (var iteration = 0; iteration < PostureCollisionIterations; iteration++)
            {
                var mid = Mathf.Lerp(valid, invalid, 0.5f);
                if (IsColliderProfileValid(InterpolateColliderProfile(mid)))
                {
                    valid = mid;
                }
                else
                {
                    invalid = mid;
                }
            }

            return valid;
        }

        private bool IsColliderProfileValid(ColliderProfile profile)
        {
            var world3D = GetWorld3D();
            if (world3D == null)
            {
                return true;
            }

            var query = new PhysicsShapeQueryParameters3D
            {
                Shape = CreateShapeForColliderProfile(profile),
                Transform = CreateWorldTransformForColliderProfile(profile),
                CollideWithBodies = true,
                CollideWithAreas = false,
                Margin = 0.02f,
            };
            query.Exclude = BuildSelfExcludeList();
            return world3D.DirectSpaceState.IntersectShape(query, 1).Count == 0;
        }

        private void ApplyColliderProfile(ColliderProfile profile)
        {
            _movementCollider.Position = profile.Center;
            _hurtbox.Position = profile.Center;
            _movementCollider.Shape = CreateShapeForColliderProfile(profile);
            _hurtboxCollision.Shape = CreateShapeForColliderProfile(profile);
        }

        private Transform3D CreateWorldTransformForColliderProfile(ColliderProfile profile)
        {
            var bodyTransform = new Transform3D(
                Basis.FromEuler(new Vector3(0.0f, _currentYawRadians, 0.0f)),
                GlobalPosition + Vector3.Up * CollisionValidationLift);
            return bodyTransform * new Transform3D(Basis.Identity, profile.Center);
        }

        private static Shape3D CreateShapeForColliderProfile(ColliderProfile profile)
        {
            if (profile.UsesBox)
            {
                return new BoxShape3D
                {
                    Size = profile.BoxSize,
                };
            }

            return new CapsuleShape3D
            {
                Radius = profile.Radius,
                Height = profile.Height,
            };
        }

        private static ColliderProfile InterpolateColliderProfile(float postureValue)
        {
            if (postureValue <= PlayerPostureModel3D.CrouchValue)
            {
                var crouchT = postureValue / PlayerPostureModel3D.CrouchValue;
                return LerpCapsuleProfile(StandColliderProfile(), CrouchColliderProfile(), crouchT);
            }

            var proneT = (postureValue - PlayerPostureModel3D.CrouchValue) /
                         (PlayerPostureModel3D.ProneValue - PlayerPostureModel3D.CrouchValue);
            return LerpBoxProfile(CrouchBridgeBoxProfile(), ProneColliderProfile(), proneT);
        }

        private static ColliderProfile StandColliderProfile()
        {
            return new ColliderProfile(
                UsesBox: false,
                Center: new Vector3(0.0f, 0.84f, 0.0f),
                Height: 1.68f,
                Radius: 0.36f,
                BoxSize: Vector3.Zero);
        }

        private static ColliderProfile CrouchColliderProfile()
        {
            return new ColliderProfile(
                UsesBox: false,
                Center: new Vector3(0.0f, 0.60f, 0.0f),
                Height: 1.20f,
                Radius: 0.46f,
                BoxSize: Vector3.Zero);
        }

        private static ColliderProfile CrouchBridgeBoxProfile()
        {
            return new ColliderProfile(
                UsesBox: true,
                Center: new Vector3(0.0f, 0.60f, 0.08f),
                Height: 0.0f,
                Radius: 0.0f,
                BoxSize: new Vector3(0.92f, 1.20f, 0.92f));
        }

        private static ColliderProfile ProneColliderProfile()
        {
            return new ColliderProfile(
                UsesBox: true,
                Center: new Vector3(0.0f, 0.31f, 0.58f),
                Height: 0.0f,
                Radius: 0.0f,
                BoxSize: new Vector3(0.84f, 0.62f, 1.82f));
        }

        private static ColliderProfile LerpCapsuleProfile(ColliderProfile from, ColliderProfile to, float t)
        {
            return new ColliderProfile(
                UsesBox: false,
                Center: from.Center.Lerp(to.Center, t),
                Height: Mathf.Lerp(from.Height, to.Height, t),
                Radius: Mathf.Lerp(from.Radius, to.Radius, t),
                BoxSize: Vector3.Zero);
        }

        private static ColliderProfile LerpBoxProfile(ColliderProfile from, ColliderProfile to, float t)
        {
            return new ColliderProfile(
                UsesBox: true,
                Center: from.Center.Lerp(to.Center, t),
                Height: 0.0f,
                Radius: 0.0f,
                BoxSize: from.BoxSize.Lerp(to.BoxSize, t));
        }

        private Godot.Collections.Array<Rid> BuildSelfExcludeList()
        {
            var exclude = new Godot.Collections.Array<Rid>
            {
                GetRid(),
                HurtboxRid,
            };

            foreach (var zone in _damageZones.Values)
            {
                exclude.Add(zone.GetRid());
            }

            return exclude;
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
            EnsureAction("crouch_posture", Key.Shift);
            EnsureAction("prone_posture", Key.Ctrl);
            EnsureAction("slow_walk", Key.Alt, Key.Meta);
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

        private readonly record struct PoseLayout(
            Vector3 TorsoPosition,
            Vector3 TorsoRotationDegrees,
            float TorsoRadius,
            float TorsoHeight,
            float TorsoDamageHeight,
            Vector3 HeadPosition,
            Vector3 LeftHandPosition,
            Vector3 RightHandPosition,
            Vector3 LeftFootPosition,
            Vector3 RightFootPosition,
            Vector3 ShotOriginPosition);

        private readonly record struct ColliderProfile(
            bool UsesBox,
            Vector3 Center,
            float Height,
            float Radius,
            Vector3 BoxSize)
        {
            public float VerticalSize => UsesBox ? BoxSize.Y : Height;
            public float BottomY => Center.Y - VerticalSize * 0.5f;
            public float TopY => Center.Y + VerticalSize * 0.5f;
            public float FrontZ => Center.Z + (UsesBox ? BoxSize.Z * 0.5f : Radius);
        }
    }
}
