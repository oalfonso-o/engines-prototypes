# Phaser V1 Code Arena

Standard workflow:

```bash
npm install
npm run dev
```

Controls:

- `A/D` or left/right: move
- `W`, `Up`, or `Space`: jump
- `R`: reset scene

Goal: clear the first swamp platformer layout by collecting all coins.

Movement tuning lives in `settings.yaml` at the root of this prototype.
Adjust `max_run_speed`, acceleration/deceleration, jump velocity, gravity, fall speed, and body values there.

This prototype now uses Phaser from `npm`, bundled by Vite, with all game code in `TypeScript`.

The playable character uses the local `Shinobi` spritesheets copied from `~/2dassets/craftpix-net-453698-free-shinobi-sprites-pixel-art/Shinobi/`.

The level art uses the local swamp pack copied from `~/2dassets/craftpix-net-672461-free-swamp-game-tileset-pixel-art/`.
