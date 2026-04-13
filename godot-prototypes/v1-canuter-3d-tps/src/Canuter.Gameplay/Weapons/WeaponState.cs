using System;

namespace Canuter
{
    public sealed class WeaponState
    {
        public WeaponDefinition Definition { get; }
        public int AmmoInMagazine { get; private set; }
        public int ReserveAmmo { get; private set; }
        public double CooldownRemaining { get; private set; }
        public double ReloadRemaining { get; private set; }
        public bool IsReloading => ReloadRemaining > 0.0;

        public WeaponState(WeaponDefinition definition)
        {
            Definition = definition;
            AmmoInMagazine = definition.UsesMagazine ? definition.MagazineSize : 0;
            ReserveAmmo = definition.StartingReserveAmmo;
        }

        public void Tick(double delta)
        {
            CooldownRemaining = Math.Max(0.0, CooldownRemaining - delta);

            if (ReloadRemaining <= 0.0)
            {
                return;
            }

            ReloadRemaining = Math.Max(0.0, ReloadRemaining - delta);
            if (ReloadRemaining <= 0.0)
            {
                CompleteReload();
            }
        }

        public bool TryConsumeShot()
        {
            if (CooldownRemaining > 0.0 || IsReloading)
            {
                return false;
            }

            if (Definition.UsesMagazine && AmmoInMagazine <= 0)
            {
                return false;
            }

            if (Definition.UsesMagazine)
            {
                AmmoInMagazine -= 1;
            }

            CooldownRemaining = Definition.FireIntervalSeconds;
            return true;
        }

        public bool CanReload()
        {
            return Definition.UsesMagazine && !IsReloading && AmmoInMagazine < Definition.MagazineSize && ReserveAmmo > 0;
        }

        public bool TryStartReload()
        {
            if (!CanReload())
            {
                return false;
            }

            ReloadRemaining = Definition.ReloadSeconds;
            CooldownRemaining = Math.Max(CooldownRemaining, Definition.ReloadSeconds);
            return true;
        }

        public void SetAmmoForTesting(int ammoInMagazine, int reserveAmmo)
        {
            AmmoInMagazine = ammoInMagazine;
            ReserveAmmo = reserveAmmo;
            CooldownRemaining = 0.0;
            ReloadRemaining = 0.0;
        }

        private void CompleteReload()
        {
            var missingAmmo = Definition.MagazineSize - AmmoInMagazine;
            var transferredAmmo = Math.Min(missingAmmo, ReserveAmmo);
            AmmoInMagazine += transferredAmmo;
            ReserveAmmo -= transferredAmmo;
        }
    }
}
