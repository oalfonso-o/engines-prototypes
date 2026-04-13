namespace Canuter
{
    public static class BodyPartDamageModel3D
    {
        public static float GetMultiplier(DamageZoneType3D zoneType)
        {
            return zoneType switch
            {
                DamageZoneType3D.Head => 2.0f,
                DamageZoneType3D.Torso => 1.0f,
                DamageZoneType3D.LeftHand => 0.7f,
                DamageZoneType3D.RightHand => 0.7f,
                DamageZoneType3D.LeftFoot => 0.7f,
                DamageZoneType3D.RightFoot => 0.7f,
                _ => 1.0f,
            };
        }

        public static int ComputeDamage(int baseDamage, DamageZoneType3D zoneType)
        {
            return int.Max(1, (int)MathF.Round(baseDamage * GetMultiplier(zoneType)));
        }
    }
}
