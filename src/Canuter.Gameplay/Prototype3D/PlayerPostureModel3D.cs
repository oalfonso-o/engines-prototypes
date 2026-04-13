namespace Canuter
{
    public static class PlayerPostureModel3D
    {
        public const float StandValue = 0.0f;
        public const float CrouchValue = 0.5f;
        public const float ProneValue = 1.0f;

        public static PlayerPostureState3D CreateInitialState()
        {
            return new PlayerPostureState3D(
                CurrentValue: StandValue,
                StartValue: StandValue,
                TargetValue: StandValue,
                ElapsedSeconds: PlayerRuntimeTuning.Prototype3DPostureTransitionSeconds,
                RequestedPosture: PlayerPosture3D.Stand);
        }

        public static PlayerPosture3D ResolveRequestedPosture(bool crouchPressed, bool pronePressed)
        {
            if (pronePressed)
            {
                return PlayerPosture3D.Prone;
            }

            if (crouchPressed)
            {
                return PlayerPosture3D.Crouch;
            }

            return PlayerPosture3D.Stand;
        }

        public static PlayerPostureState3D Retarget(PlayerPostureState3D state, PlayerPosture3D requestedPosture)
        {
            var targetValue = GetValue(requestedPosture);
            if (MathF.Abs(state.TargetValue - targetValue) <= 0.0001f)
            {
                return state with
                {
                    RequestedPosture = requestedPosture,
                };
            }

            return new PlayerPostureState3D(
                CurrentValue: state.CurrentValue,
                StartValue: state.CurrentValue,
                TargetValue: targetValue,
                ElapsedSeconds: 0.0f,
                RequestedPosture: requestedPosture);
        }

        public static PlayerPostureState3D Advance(PlayerPostureState3D state, float deltaSeconds)
        {
            var duration = PlayerRuntimeTuning.Prototype3DPostureTransitionSeconds;
            if (duration <= float.Epsilon)
            {
                return state with
                {
                    CurrentValue = state.TargetValue,
                    ElapsedSeconds = duration,
                };
            }

            var elapsed = float.Clamp(state.ElapsedSeconds + deltaSeconds, 0.0f, duration);
            var t = elapsed / duration;
            return state with
            {
                CurrentValue = Lerp(state.StartValue, state.TargetValue, t),
                ElapsedSeconds = elapsed,
            };
        }

        public static float GetValue(PlayerPosture3D posture)
        {
            return posture switch
            {
                PlayerPosture3D.Stand => StandValue,
                PlayerPosture3D.Crouch => CrouchValue,
                PlayerPosture3D.Prone => ProneValue,
                _ => StandValue,
            };
        }

        public static float GetInstantMoveSpeedMultiplier(PlayerPosture3D requestedPosture, bool slowWalkPressed)
        {
            return requestedPosture switch
            {
                PlayerPosture3D.Prone => PlayerRuntimeTuning.Prototype3DProneMoveSpeedMultiplier,
                PlayerPosture3D.Crouch => PlayerRuntimeTuning.Prototype3DCrouchMoveSpeedMultiplier,
                _ when slowWalkPressed => PlayerRuntimeTuning.Prototype3DCrouchMoveSpeedMultiplier,
                _ => 1.0f,
            };
        }

        private static float Lerp(float a, float b, float t)
        {
            return a + ((b - a) * t);
        }
    }
}
