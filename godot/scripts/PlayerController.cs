using NumericVector2 = System.Numerics.Vector2;
using System.Collections.Generic;
using Godot;

namespace Canuter
{
    public partial class PlayerController : CharacterBody2D
    {
        [Signal]
        public delegate void AnimationChangedEventHandler(string animationName);

        private Area2D _hurtbox = null!;
        private Node2D _visualRoot = null!;
        private AnimatedSprite2D _bodySprite = null!;
        private Sprite2D _weaponSprite = null!;
        private Marker2D _firePoint = null!;
        private Camera2D _camera = null!;
        private readonly Dictionary<string, WeaponState> _weaponStates = new();
        private WeaponState _equippedWeapon = null!;
        private IPlayerViewModeController _viewModeController = new TopDownFixedViewModeController();
        private string _currentAnimation = string.Empty;
        private double _tracerRemaining;
        private Vector2 _tracerStart;
        private Vector2 _tracerEnd;
        private Vector2 _currentAimDirection = Vector2.Down;
        private Vector2 _currentFireDirection = Vector2.Down;
        private float _currentAimRotation;
        private Vector2 _pendingMouseDelta;
        private bool _gameplayInputEnabled = true;

        public WeaponDefinition EquippedWeaponDefinition => _equippedWeapon.Definition;
        public int EquippedAmmoInMagazine => _equippedWeapon.AmmoInMagazine;
        public int EquippedReserveAmmo => _equippedWeapon.ReserveAmmo;
        public bool IsReloading => _equippedWeapon.IsReloading;
        public int MaxHealth => 100;
        public int CurrentHealth => 100;
        public Camera2D GameplayCamera => _camera;
        public Vector2 CurrentAimDirection => _currentAimDirection;
        public Vector2 CurrentFireDirection => _currentFireDirection;
        public float CurrentAimRotation => _currentAimRotation;
        public PlayerViewMode CurrentViewMode => _viewModeController.Mode;
        public Rid HurtboxRid => _hurtbox.GetRid();

        public override void _Ready()
        {
            SetProcessInput(true);
            SetProcessUnhandledInput(true);

            _hurtbox = GetNode<Area2D>("Hurtbox");
            _visualRoot = GetNode<Node2D>("VisualRoot");
            _bodySprite = GetNode<AnimatedSprite2D>("VisualRoot/BodySprite");
            _weaponSprite = GetNode<Sprite2D>("VisualRoot/WeaponSprite");
            _firePoint = GetNode<Marker2D>("VisualRoot/FirePoint");
            _camera = GetNode<Camera2D>("Camera2D");
            _camera.IgnoreRotation = false;
            EnsureInputMap();
            _bodySprite.SpriteFrames = AssetRepository.LoadCharacterSpriteFrames(AssetCatalog.CharacterBodyBase01);
            EquipWeapon(WeaponCatalog.Rifle01);
            SetZoom(PlayerRuntimeTuning.DefaultZoom);
            _bodySprite.Play("idle");
            EmitSignal(SignalName.AnimationChanged, "idle");
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
                QueueRedraw();
            }
        }

        public override void _PhysicsProcess(double delta)
        {
            if (!_gameplayInputEnabled)
            {
                Velocity = Vector2.Zero;
                MoveAndSlide();
                _pendingMouseDelta = Vector2.Zero;
                return;
            }

            var input = Input.GetVector("move_left", "move_right", "move_up", "move_down");
            var frameResult = _viewModeController.Update(new PlayerViewFrameInput(
                ActorPosition: ToNumeric(GlobalPosition),
                CurrentVelocity: ToNumeric(Velocity),
                MovementInput: ToNumeric(input),
                MouseWorldPosition: ToNumeric(GetGlobalMousePosition()),
                CurrentAimDirection: ToNumeric(_currentAimDirection),
                CurrentAimRotation: _currentAimRotation,
                DeltaSeconds: delta,
                MouseDelta: ToNumeric(_pendingMouseDelta)));

            Velocity = ToGodot(frameResult.Velocity);
            MoveAndSlide();
            ApplyViewFrame(frameResult);
            _pendingMouseDelta = Vector2.Zero;

            if (_equippedWeapon.Definition.FireMode == WeaponFireMode.FullAuto && Input.IsMouseButtonPressed(MouseButton.Left))
            {
                TryUseEquippedWeapon();
            }

            if (Velocity.LengthSquared() > PlayerRuntimeTuning.MovingAnimationThresholdSquared)
            {
                PlayAnimation("move");
            }
            else
            {
                PlayAnimation("idle");
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

            if (@event is not InputEventMouseButton mouseButton || !mouseButton.Pressed)
            {
                return;
            }

            if (!_gameplayInputEnabled)
            {
                return;
            }

            switch (mouseButton.ButtonIndex)
            {
                case MouseButton.Left:
                    TryUseEquippedWeapon();
                    break;
                case MouseButton.WheelUp:
                    SetZoom(CameraZoomModel.ZoomIn(_camera.Zoom.X));
                    break;
                case MouseButton.WheelDown:
                    SetZoom(CameraZoomModel.ZoomOut(_camera.Zoom.X));
                    break;
            }
        }

        public override void _Draw()
        {
            if (_tracerRemaining <= 0.0)
            {
                return;
            }

            DrawLine(ToLocal(_tracerStart), ToLocal(_tracerEnd), new Color(0.98f, 0.83f, 0.25f, 1.0f), 3.0f);
        }

        private void PlayAnimation(string animationName)
        {
            if (_currentAnimation == animationName)
            {
                return;
            }

            _currentAnimation = animationName;
            _bodySprite.Play(animationName);
            EmitSignal(SignalName.AnimationChanged, animationName);
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

        public void SetViewModeController(IPlayerViewModeController controller)
        {
            _viewModeController = controller;
            _camera.PositionSmoothingEnabled = controller.Mode != PlayerViewMode.HeadingLocked;
            _pendingMouseDelta = Vector2.Zero;
        }

        public void SetGameplayInputEnabled(bool enabled)
        {
            _gameplayInputEnabled = enabled;
            if (!enabled)
            {
                Velocity = Vector2.Zero;
            }
        }

        public void AddMouseDeltaForTesting(Vector2 delta)
        {
            _pendingMouseDelta += delta;
        }

        private void ApplyViewFrame(PlayerViewFrameResult frameResult)
        {
            _currentAimDirection = ToGodot(frameResult.AimDirection);
            _currentFireDirection = ToGodot(frameResult.FireDirection);
            _currentAimRotation = frameResult.AimRotation;
            _visualRoot.Rotation = frameResult.VisualRotation;
            _hurtbox.Rotation = frameResult.HurtboxRotation;
            _camera.Rotation = frameResult.CameraRotation;
            _camera.Position = ToGodot(frameResult.CameraFollowOffset);
        }

        private static NumericVector2 ToNumeric(Vector2 value)
        {
            return new NumericVector2(value.X, value.Y);
        }

        private static Vector2 ToGodot(NumericVector2 value)
        {
            return new Vector2(value.X, value.Y);
        }

        private void EquipWeapon(WeaponDefinition definition)
        {
            if (!_weaponStates.TryGetValue(definition.WeaponId, out var state))
            {
                state = new WeaponState(definition);
                _weaponStates[definition.WeaponId] = state;
            }

            _equippedWeapon = state;
            _weaponSprite.Texture = AssetRepository.LoadWeaponTexture(definition.SpriteAssetId);
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
            var direction = _currentFireDirection;
            if (direction.LengthSquared() <= 0.0001f)
            {
                direction = Vector2.Down;
            }

            var targetPoint = origin + direction * _equippedWeapon.Definition.Range;
            var query = PhysicsRayQueryParameters2D.Create(origin, targetPoint);
            query.CollideWithBodies = true;
            query.CollideWithAreas = true;
            query.Exclude = new Godot.Collections.Array<Rid> { GetRid(), _hurtbox.GetRid() };

            var result = GetWorld2D().DirectSpaceState.IntersectRay(query);
            Vector2 hitPoint = targetPoint;

            if (result.Count > 0)
            {
                hitPoint = (Vector2)result["position"];
                if (result["collider"].AsGodotObject() is DummyTarget dummyTarget)
                {
                    dummyTarget.ApplyDamage(_equippedWeapon.Definition.Damage);
                }
            }

            _tracerStart = origin;
            _tracerEnd = hitPoint;
            _tracerRemaining = 0.06f;
            QueueRedraw();
        }

        private void TryUseMeleeWeapon()
        {
            if (!_equippedWeapon.TryConsumeShot())
            {
                return;
            }

            var origin = _firePoint.GlobalPosition;
            var direction = _currentFireDirection;
            if (direction.LengthSquared() <= 0.0001f)
            {
                direction = Vector2.Down;
            }

            var shape = new CircleShape2D { Radius = 24.0f };
            var query = new PhysicsShapeQueryParameters2D
            {
                Shape = shape,
                Transform = new Transform2D(0.0f, origin + direction * (_equippedWeapon.Definition.Range * 0.6f)),
                CollideWithBodies = false,
                CollideWithAreas = true,
            };
            query.Exclude = new Godot.Collections.Array<Rid> { GetRid(), _hurtbox.GetRid() };

            var results = GetWorld2D().DirectSpaceState.IntersectShape(query, 8);
            var hitPoint = origin + direction * _equippedWeapon.Definition.Range;

            foreach (var result in results)
            {
                if (result["collider"].AsGodotObject() is DummyTarget dummyTarget)
                {
                    dummyTarget.ApplyDamage(_equippedWeapon.Definition.Damage);
                    hitPoint = dummyTarget.GlobalPosition;
                    break;
                }
            }

            _tracerStart = origin;
            _tracerEnd = hitPoint;
            _tracerRemaining = 0.04f;
            QueueRedraw();
        }

        private void SetZoom(float zoom)
        {
            _camera.Zoom = Vector2.One * zoom;
        }

    }
}
