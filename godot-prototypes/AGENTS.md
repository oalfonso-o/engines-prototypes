# AGENTS

## Scope

- This file applies to everything under `godot-prototypes/`.

## Language Split

- Fast visual and engine-facing prototyping in Godot can be done in `GDScript`.
- If a prototype later graduates into a more serious game branch, move deterministic and highly testable gameplay logic into `C#`.
- Keep directly engine-coupled logic in `GDScript` when it is mainly scene wiring, camera behavior, HUD, materials, map assembly, or other Godot-native integration work.

## GDScript Typing Rule

- When using `GDScript`, type everything that can reasonably be typed.
- Prefer explicit types for:
- node references
- local variables whose inferred type would otherwise become `Variant`
- function arguments
- function return values
- arrays and dictionaries when practical
- Avoid leaving values as implicit `Variant` unless there is a real reason to keep them dynamic.

## Testing Rule

- Prefer TDD whenever the intended behavior can be expressed deterministically.
- For `GDScript` prototypes, favor small headless integration checks over brittle UI automation.
- For logic that is a strong fit for unit testing, prefer pushing it toward `C#` as the prototype matures.
