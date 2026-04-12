namespace Canuter.Gameplay.Tests.Weapons;

public sealed class WeaponCatalogTests
{
    [Fact]
    public void WeaponCatalogMatchesCurrentRuntimeContract()
    {
        Assert.Equal("rifle_01", WeaponCatalog.Rifle01.WeaponId);
        Assert.Equal(WeaponCategory.Rifle, WeaponCatalog.Rifle01.Category);
        Assert.Equal(WeaponFireMode.FullAuto, WeaponCatalog.Rifle01.FireMode);
        Assert.Equal(30, WeaponCatalog.Rifle01.MagazineSize);
        Assert.Equal(4, WeaponCatalog.Rifle01.StartingMagazines);

        Assert.Equal("pistol_01", WeaponCatalog.Pistol01.WeaponId);
        Assert.Equal(WeaponCategory.Pistol, WeaponCatalog.Pistol01.Category);
        Assert.Equal(WeaponFireMode.SemiAuto, WeaponCatalog.Pistol01.FireMode);
        Assert.Equal(12, WeaponCatalog.Pistol01.MagazineSize);
        Assert.Equal(5, WeaponCatalog.Pistol01.StartingMagazines);

        Assert.Equal("knife_01", WeaponCatalog.Knife01.WeaponId);
        Assert.Equal(WeaponCategory.Knife, WeaponCatalog.Knife01.Category);
        Assert.Equal(WeaponFireMode.Melee, WeaponCatalog.Knife01.FireMode);
        Assert.Equal(0, WeaponCatalog.Knife01.MagazineSize);
        Assert.Equal(0, WeaponCatalog.Knife01.StartingMagazines);
    }
}
