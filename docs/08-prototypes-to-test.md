# Prototypes To Test

This document tracks small gameplay or presentation prototypes that are worth testing in the runtime before they are promoted to a stable rule.

## Pending

- `snap rotation`
  - Test a heading-locked turning mode where the facing direction rotates in discrete angle steps instead of continuous mouse-driven rotation.
  - Evaluate whether it improves readability, control feel, or pseudo-3D presentation.
  - Notes for the stronger version that should not break aim:
  - `dead zone + hysteresis`
  - While the mouse remains inside a sector tolerance such as `+/-10` degrees, do not rotate.
  - Only switch sector once the pointer exits that tolerance band.
  - This should reduce constant micro-switching.
  - `snap visual != snap logical`
  - The logical angle change can be instant.
  - The visual transition should still interpolate briefly over roughly `100-150ms`.
  - The goal is for the change to read as deliberate rather than as an abrupt pop.
  - `aim decoupled`
  - Shot direction should continue to use the real mouse direction.
  - The world rotation angle should not become the source of truth for aim.
  - The player should still be able to aim correctly at an enemy even if the world is snapping between sectors.

- `continuous slow rotation`
  - Test a heading-locked turning mode with no snap rotation.
  - Rotation should remain continuous but:
  - very slow
  - with inertia
  - with a capped maximum turn speed
  - Evaluate whether this preserves readability while avoiding the discontinuity risk of snap sectors.
