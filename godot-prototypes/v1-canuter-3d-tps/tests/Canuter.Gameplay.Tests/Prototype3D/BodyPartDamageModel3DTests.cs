namespace Canuter.Gameplay.Tests.Prototype3D;

public sealed class BodyPartDamageModel3DTests
{
    [Theory]
    [InlineData(DamageZoneType3D.Head, 60)]
    [InlineData(DamageZoneType3D.Torso, 30)]
    [InlineData(DamageZoneType3D.LeftHand, 21)]
    [InlineData(DamageZoneType3D.RightHand, 21)]
    [InlineData(DamageZoneType3D.LeftFoot, 21)]
    [InlineData(DamageZoneType3D.RightFoot, 21)]
    public void ComputesDamageByZoneMultiplier(DamageZoneType3D zoneType, int expectedDamage)
    {
        var damage = BodyPartDamageModel3D.ComputeDamage(30, zoneType);

        Assert.Equal(expectedDamage, damage);
    }
}
