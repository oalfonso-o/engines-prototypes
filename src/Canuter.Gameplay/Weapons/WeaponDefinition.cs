using System;

namespace Canuter
{
    public enum WeaponCategory
    {
        Rifle,
        Pistol,
        Knife,
    }

    public enum WeaponFireMode
    {
        SemiAuto,
        FullAuto,
        Melee,
    }

    public sealed class WeaponDefinition
    {
        public string WeaponId { get; }
        public string DisplayName { get; }
        public WeaponCategory Category { get; }
        public WeaponFireMode FireMode { get; }
        public string SpriteAssetId { get; }
        public int MagazineSize { get; }
        public int StartingMagazines { get; }
        public int Damage { get; }
        public float Range { get; }
        public float FireIntervalSeconds { get; }
        public float ReloadSeconds { get; }

        public bool UsesMagazine => MagazineSize > 0;
        public int StartingReserveAmmo => UsesMagazine ? MagazineSize * Math.Max(StartingMagazines - 1, 0) : 0;

        public WeaponDefinition(
            string weaponId,
            string displayName,
            WeaponCategory category,
            WeaponFireMode fireMode,
            string spriteAssetId,
            int magazineSize,
            int startingMagazines,
            int damage,
            float range,
            float fireIntervalSeconds,
            float reloadSeconds
        )
        {
            WeaponId = weaponId;
            DisplayName = displayName;
            Category = category;
            FireMode = fireMode;
            SpriteAssetId = spriteAssetId;
            MagazineSize = magazineSize;
            StartingMagazines = startingMagazines;
            Damage = damage;
            Range = range;
            FireIntervalSeconds = fireIntervalSeconds;
            ReloadSeconds = reloadSeconds;
        }
    }
}
