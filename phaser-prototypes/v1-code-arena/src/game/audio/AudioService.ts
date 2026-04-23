import type Phaser from "phaser";
import type { AudioSettings } from "../../settings/prototypeSettings";

export type MusicTrackId = "music.intro" | "music.menu" | "music.campaign";

export class AudioService {
  private readonly loadedTracks = new Map<MusicTrackId, string>();
  private currentTrackId: MusicTrackId | null = null;
  private currentSound: Phaser.Sound.BaseSound | null = null;
  private ducked = false;
  private settings: AudioSettings;

  constructor(
    private readonly game: Phaser.Game,
    settings: AudioSettings,
  ) {
    this.settings = settings;
  }

  registerTrack(trackId: MusicTrackId, assetKey: string): void {
    this.loadedTracks.set(trackId, assetKey);
  }

  playMusic(trackId: MusicTrackId): void {
    if (this.currentTrackId === trackId) {
      return;
    }

    this.stopMusic();
    this.currentTrackId = trackId;
    const assetKey = this.loadedTracks.get(trackId);
    if (!assetKey || !this.game.sound || !this.game.cache.audio.exists(assetKey)) {
      return;
    }

    this.currentSound = this.game.sound.add(assetKey, {
      loop: true,
      volume: this.ducked ? this.settings.music.ducked_volume : this.settings.music.default_volume,
    });
    this.currentSound.play();
  }

  stopMusic(): void {
    this.currentSound?.stop();
    this.currentSound?.destroy();
    this.currentSound = null;
    this.currentTrackId = null;
  }

  duckMusic(): void {
    this.ducked = true;
    this.applyVolume(this.settings.music.ducked_volume);
  }

  restoreMusic(): void {
    this.ducked = false;
    this.applyVolume(this.settings.music.default_volume);
  }

  applySettings(settings: AudioSettings): void {
    this.settings = settings;
    this.applyVolume(this.ducked ? settings.music.ducked_volume : settings.music.default_volume);
  }

  private applyVolume(volume: number): void {
    if (!this.currentSound) {
      return;
    }

    const sound = this.currentSound as Phaser.Sound.BaseSound & {
      setVolume?: (nextVolume: number) => unknown;
      volume?: number;
    };
    if (typeof sound.setVolume === "function") {
      sound.setVolume(volume);
      return;
    }

    if (typeof sound.volume === "number") {
      sound.volume = volume;
    }
  }
}
