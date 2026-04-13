namespace Canuter.Gameplay.Tests.Weapons;

public sealed class WeaponStateTests
{
    [Fact]
    public void RifleStartsWithFullMagazineAndDerivedReserveAmmo()
    {
        var state = new WeaponState(WeaponCatalog.Rifle01);

        Assert.Equal(30, state.AmmoInMagazine);
        Assert.Equal(90, state.ReserveAmmo);
        Assert.False(state.IsReloading);
    }

    [Fact]
    public void PistolStartsWithFullMagazineAndDerivedReserveAmmo()
    {
        var state = new WeaponState(WeaponCatalog.Pistol01);

        Assert.Equal(12, state.AmmoInMagazine);
        Assert.Equal(48, state.ReserveAmmo);
        Assert.False(state.IsReloading);
    }

    [Fact]
    public void KnifeStartsWithoutMagazineOrReserveAmmo()
    {
        var state = new WeaponState(WeaponCatalog.Knife01);

        Assert.Equal(0, state.AmmoInMagazine);
        Assert.Equal(0, state.ReserveAmmo);
        Assert.False(state.CanReload());
    }

    [Fact]
    public void ShotConsumptionUsesMagazineAndAppliesCooldown()
    {
        var state = new WeaponState(WeaponCatalog.Rifle01);

        var firstShot = state.TryConsumeShot();
        var secondShot = state.TryConsumeShot();

        Assert.True(firstShot);
        Assert.False(secondShot);
        Assert.Equal(29, state.AmmoInMagazine);
        Assert.Equal(90, state.ReserveAmmo);
        Assert.Equal(WeaponCatalog.Rifle01.FireIntervalSeconds, state.CooldownRemaining, 3);
    }

    [Fact]
    public void TickClearsCooldownAndAllowsNextShot()
    {
        var state = new WeaponState(WeaponCatalog.Pistol01);
        Assert.True(state.TryConsumeShot());

        state.Tick(WeaponCatalog.Pistol01.FireIntervalSeconds);

        Assert.Equal(0.0, state.CooldownRemaining, 6);
        Assert.True(state.TryConsumeShot());
        Assert.Equal(10, state.AmmoInMagazine);
    }

    [Fact]
    public void CannotFireMagazineWeaponWhenEmpty()
    {
        var definition = new WeaponDefinition(
            weaponId: "test_empty",
            displayName: "Test Empty",
            category: WeaponCategory.Pistol,
            fireMode: WeaponFireMode.SemiAuto,
            spriteAssetId: "test_sprite",
            magazineSize: 1,
            startingMagazines: 1,
            damage: 1,
            range: 1.0f,
            fireIntervalSeconds: 0.1f,
            reloadSeconds: 0.5f
        );
        var state = new WeaponState(definition);

        Assert.True(state.TryConsumeShot());
        state.Tick(definition.FireIntervalSeconds);

        Assert.False(state.TryConsumeShot());
        Assert.Equal(0, state.AmmoInMagazine);
    }

    [Fact]
    public void ReloadStartsOnlyWhenMagazineIsMissingAmmoAndReserveExists()
    {
        var state = new WeaponState(WeaponCatalog.Rifle01);

        Assert.False(state.TryStartReload());
        Assert.True(state.TryConsumeShot());
        Assert.True(state.TryStartReload());
        Assert.True(state.IsReloading);
        Assert.Equal(WeaponCatalog.Rifle01.ReloadSeconds, state.ReloadRemaining, 3);
        Assert.Equal(WeaponCatalog.Rifle01.ReloadSeconds, state.CooldownRemaining, 3);
    }

    [Fact]
    public void EmptyMagazineCanStillStartReloadWhenReserveExists()
    {
        var state = new WeaponState(WeaponCatalog.Rifle01);

        for (var i = 0; i < WeaponCatalog.Rifle01.MagazineSize; i++)
        {
            Assert.True(state.TryConsumeShot());
            state.Tick(WeaponCatalog.Rifle01.FireIntervalSeconds);
        }

        Assert.Equal(0, state.AmmoInMagazine);
        Assert.True(state.CanReload());
        Assert.True(state.TryStartReload());
        Assert.True(state.IsReloading);
    }

    [Fact]
    public void CannotFireWhileReloading()
    {
        var state = new WeaponState(WeaponCatalog.Rifle01);
        Assert.True(state.TryConsumeShot());
        Assert.True(state.TryStartReload());

        Assert.False(state.TryConsumeShot());
        Assert.Equal(29, state.AmmoInMagazine);
    }

    [Fact]
    public void ReloadTransfersOnlyMissingAmmoUpToAvailableReserve()
    {
        var definition = new WeaponDefinition(
            weaponId: "test_partial_reload",
            displayName: "Test Partial Reload",
            category: WeaponCategory.Rifle,
            fireMode: WeaponFireMode.FullAuto,
            spriteAssetId: "test_sprite",
            magazineSize: 10,
            startingMagazines: 2,
            damage: 1,
            range: 1.0f,
            fireIntervalSeconds: 0.1f,
            reloadSeconds: 1.0f
        );
        var state = new WeaponState(definition);

        for (var i = 0; i < 8; i++)
        {
            Assert.True(state.TryConsumeShot());
            state.Tick(definition.FireIntervalSeconds);
        }

        Assert.Equal(2, state.AmmoInMagazine);
        Assert.Equal(10, state.ReserveAmmo);
        Assert.True(state.TryStartReload());

        state.Tick(definition.ReloadSeconds);

        Assert.Equal(10, state.AmmoInMagazine);
        Assert.Equal(2, state.ReserveAmmo);
        Assert.False(state.IsReloading);
    }

    [Fact]
    public void MeleeWeaponCanAttackWithoutMagazine()
    {
        var state = new WeaponState(WeaponCatalog.Knife01);

        Assert.True(state.TryConsumeShot());
        Assert.Equal(0, state.AmmoInMagazine);
        Assert.Equal(WeaponCatalog.Knife01.FireIntervalSeconds, state.CooldownRemaining, 3);
    }
}
