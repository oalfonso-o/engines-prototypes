import * as Phaser from "phaser";
import type { RuntimeTriggerZone } from "../content/runtimeContent";

type TriggerZoneObject = Phaser.GameObjects.Zone & {
  __triggerData?: RuntimeTriggerZone;
};

export class SceneTriggerField {
  private readonly overlapZones: Phaser.Physics.Arcade.StaticGroup;
  private readonly interactZones: TriggerZoneObject[] = [];
  private overlap?: Phaser.Physics.Arcade.Collider;
  private readonly firedZoneIds = new Set<string>();
  private readonly interactKey?: Phaser.Input.Keyboard.Key;
  private playerBody: Phaser.Physics.Arcade.Image | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    triggerZones: RuntimeTriggerZone[],
    private readonly onTriggerAction: (actionId: string) => void,
  ) {
    this.overlapZones = scene.physics.add.staticGroup();
    const keyboard = scene.input.keyboard;
    this.interactKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    triggerZones.forEach((triggerZone) => {
      const zone = createTriggerZone(scene, triggerZone);
      if (triggerZone.triggerMode === "interact") {
        this.interactZones.push(zone);
        return;
      }

      this.overlapZones.add(zone);
    });
  }

  attachPlayer(playerBody: Phaser.Physics.Arcade.Image): void {
    this.playerBody = playerBody;
    this.overlap = this.scene.physics.add.overlap(playerBody, this.overlapZones, (_player, zone) => {
      this.handleZone(zone as TriggerZoneObject);
    });
  }

  update(): void {
    if (!this.playerBody || !this.interactKey || !Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      return;
    }

    for (const zone of this.interactZones) {
      if (this.scene.physics.overlap(this.playerBody, zone)) {
        this.handleZone(zone);
        break;
      }
    }
  }

  destroy(): void {
    this.overlap?.destroy();
    this.overlapZones.clear(true, true);
    this.interactZones.forEach((zone) => zone.destroy());
    this.interactZones.length = 0;
    this.firedZoneIds.clear();
    this.playerBody = null;
  }

  private handleZone(zone: TriggerZoneObject): void {
    const trigger = zone.__triggerData;
    if (!trigger?.actionId || this.firedZoneIds.has(trigger.id)) {
      return;
    }

    this.firedZoneIds.add(trigger.id);
    this.onTriggerAction(trigger.actionId);
  }
}

function createTriggerZone(scene: Phaser.Scene, triggerZone: RuntimeTriggerZone): TriggerZoneObject {
  const zone = scene.add.zone(
    triggerZone.x + (triggerZone.width * 0.5),
    triggerZone.y + (triggerZone.height * 0.5),
    Math.max(triggerZone.width, 1),
    Math.max(triggerZone.height, 1),
  ) as TriggerZoneObject;
  scene.physics.add.existing(zone, true);
  zone.__triggerData = triggerZone;
  return zone;
}
