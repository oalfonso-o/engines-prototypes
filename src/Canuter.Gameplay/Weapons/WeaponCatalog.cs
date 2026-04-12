namespace Canuter
{
    public static class WeaponCatalog
    {
        public static readonly WeaponDefinition Rifle01 = new(
            weaponId: "rifle_01",
            displayName: "Prototype Rifle",
            category: WeaponCategory.Rifle,
            fireMode: WeaponFireMode.FullAuto,
            spriteAssetId: AssetCatalog.WeaponRifleBody01,
            magazineSize: 30,
            startingMagazines: 4,
            damage: 34,
            range: 1200.0f,
            fireIntervalSeconds: 0.14f,
            reloadSeconds: 2.2f
        );

        public static readonly WeaponDefinition Pistol01 = new(
            weaponId: "pistol_01",
            displayName: "Prototype Pistol",
            category: WeaponCategory.Pistol,
            fireMode: WeaponFireMode.SemiAuto,
            spriteAssetId: AssetCatalog.WeaponPistolBody01,
            magazineSize: 12,
            startingMagazines: 5,
            damage: 24,
            range: 1000.0f,
            fireIntervalSeconds: 0.22f,
            reloadSeconds: 1.6f
        );

        public static readonly WeaponDefinition Knife01 = new(
            weaponId: "knife_01",
            displayName: "Prototype Knife",
            category: WeaponCategory.Knife,
            fireMode: WeaponFireMode.Melee,
            spriteAssetId: AssetCatalog.WeaponKnifeBody01,
            magazineSize: 0,
            startingMagazines: 0,
            damage: 65,
            range: 110.0f,
            fireIntervalSeconds: 0.45f,
            reloadSeconds: 0.0f
        );
    }
}
