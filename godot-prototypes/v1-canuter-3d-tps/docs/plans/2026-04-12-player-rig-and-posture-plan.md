# Player Rig And Posture Plan

## Goal

- Replace the current single-capsule player presentation with a simple humanoid procedural rig that supports:
- clearer readable body shape
- body-part-specific hit zones
- future crouch / prone / slow-walk posture changes without entangling visuals and movement physics

## Design Principles

- Keep `movement collider`, `visual rig`, and `damage zones` separate.
- The movement collider exists only for locomotion and collision stability.
- The visual rig exists only for readability and animation.
- Damage zones exist only for hit detection and damage scaling.
- Avoid solving crouch / prone by forcing one shape to do everything.

## Phase 1: Procedural Humanoid Rig

- Replace the single body mesh with:
- `VisualRoot`
- `TorsoMesh`
- `HeadMesh`
- `LeftHandMesh`
- `RightHandMesh`
- `LeftFootMesh`
- `RightFootMesh`
- The torso should become a tall capsule with a more human / Fall-Guys-like proportion.
- The total read should approximate a short stylized person around `1.5m`.
- Head is a sphere.
- Hands are small spheres at the sides.
- Feet are small pegs / simple foot meshes near the base.
- This remains fully procedural and placeholder-friendly.

## Phase 2: Damage Zones

- Add named damage areas:
- head
- torso
- left hand
- right hand
- left foot
- right foot
- Each area gets an independent `Area3D` + `CollisionShape3D`.
- Hitscan and melee should resolve damage against these zones, not against the movement collider.
- Introduce damage multipliers in shared gameplay code.
- Initial expectation:
- head > torso > limbs

## Phase 3: Posture State Model

- Introduce a posture model in shared C#:
- `stand`
- `crouch`
- `prone`
- Use a continuous interpolation variable rather than discrete jumps only.
- The full transition from any state to any other target state should take `0.5 seconds`.
- Priority rules:
- `Ctrl` requests `prone`
- `Shift` requests `crouch`
- otherwise `stand`
- Releasing a lower posture returns to the highest still-requested posture.
- Movement-speed penalties apply immediately even while the visual/collider transition is still in progress.

## Phase 4: Collider Strategy

- Stand / crouch should use a vertical movement capsule with interpolated dimensions.
- Prone should use its own dedicated profile rather than trying to fake it with the same standing capsule.
- Before expanding upward, run a free-space check so the player cannot stand into ceilings.
- If standing is blocked, stay in the lower posture.

## Phase 5: Procedural Animation

- Hands:
- support weapon-hold offsets
- support jump pose offsets
- Feet:
- support walk motion
- support crouch stance
- support prone stance
- Visual motion should be driven from posture state plus movement speed, not hand-authored animation clips yet.

## Recommended Implementation Order

1. Build the procedural humanoid visual rig.
2. Add body-part damage zones and damage multipliers.
3. Add tests for head / torso / limb damage routing.
4. Add the posture state model in shared code.
5. Add crouch movement collider interpolation.
6. Add prone movement collider profile.
7. Add procedural hand / foot motion.

## Risks

- Collider resizing can create tunneling or ceiling-intersection bugs if the space check is not explicit.
- Using the movement collider as the damage collider would block future posture work; keep them separate from the start.
- Prone almost certainly needs a distinct collision profile.

## Initial Slice To Implement Now

- Implemented:
- procedural humanoid player rig
- named damage zones
- damage multipliers wired through hitscan / melee
- continuous stand / crouch / prone posture model
- collider profile switching with free-space validation for blocked stand-up cases
- simple procedural hand/foot motion
- Remaining follow-up:
- refine collider tuning for prone edge cases against forward obstacles
- evolve procedural motion into stronger weapon-hold / locomotion animation if needed
