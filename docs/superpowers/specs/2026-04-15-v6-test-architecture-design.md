# V6 Test Architecture Design

**Date:** 2026-04-15

## Goal

Restructure `godot-prototypes/v6-character-prototype/tests/` so the suite is easier to read and maintain for a code-first workflow:

- one automatic test entrypoint
- one test file per non-trivial class for class-scoped checks
- separate integration tests for multi-class behavior
- shared fixtures in dedicated helper files

## Why Change

The current single-file integration runner mixes three different concerns:

1. architecture and bootstrap checks
2. class-level behavioral checks
3. multi-component runtime integration checks

That makes it harder to answer simple questions such as:

- what does this specific script guarantee?
- which tests cover visual layout versus movement versus architecture?
- where should a new test live?

## Target Structure

```text
godot-prototypes/v6-character-prototype/tests/
  runner.gd
  class/
    test_character_root.gd
    test_char_visual.gd
    test_debug_controller.gd
  integration/
    test_bootstrap.gd
    test_movement.gd
    test_explosion.gd
    test_visual_layout.gd
  fixtures/
    fixtures_sandbox.gd
    fixtures_character.gd
```

## Naming Rules

### Test Files

- Discoverable test files must start with `test_`.
- Class-scoped tests must be 1:1 with the non-trivial `.gd` they validate.
- Example: `runtime/character_root.gd` -> `tests/class/test_character_root.gd`

### Fixture Files

- Shared helpers must start with `fixtures_`.
- Fixture files are not discoverable tests.

### Test Methods

- Discoverable test methods must start with `test_`.
- A single file may contain multiple `test_*` methods.

## Discovery Model

`tests/runner.gd` is the only entrypoint used by `make test-v6-character`.

It must:

1. discover `test_*.gd` files under `tests/class/` and `tests/integration/`
2. ignore `tests/fixtures/`
3. load each test script
4. discover `test_*` methods inside each loaded script
5. execute them in deterministic alphabetical order
6. report failures with `file::method` context
7. exit non-zero when any assertion fails

No manual registration list should be required when adding a new test file or a new `test_*` method.

## Test API

Every discoverable test method receives:

```gdscript
func test_something(assertions, context) -> void:
```

or async:

```gdscript
func test_something(assertions, context) -> void:
    await ...
```

### `assertions`

`assertions` is responsible for collecting failures instead of stopping at the first one. It should expose a small API such as:

- `check(condition: bool, message: String) -> void`
- optional helpers like `check_equal(...)` only if they clearly improve readability

### `context`

`context` provides shared runtime utilities needed by many tests, for example:

- instantiate `main.tscn`
- add the instantiated scene to the tree
- wait for `process_frame` or `physics_frame`
- settle frames
- queue cleanup and free nodes safely
- access common fixtures

The key rule is that each test method creates and tears down its own scene context. Tests must not rely on state from previous tests.

## Fixture Responsibilities

Fixtures exist only to reduce setup duplication. They must not hide the actual assertions being made.

### `fixtures_sandbox.gd`

Owns helpers for:

- instantiating `main.tscn`
- waiting a configurable number of frames
- returning useful top-level nodes such as:
  - sandbox root
  - `CharacterPrototype`
  - `VisualRig`
  - debug HUD nodes

### `fixtures_character.gd`

Owns helpers for:

- creating or extracting a character-only context
- returning `CollisionShape3D`, `Skeleton3D`, torso/hand/foot attachments, and similar character-specific handles

## Coverage Layout

### Class Tests

Class tests answer: "what contract does this one script own?"

Initial split:

- `test_character_root.gd`
  - gameplay body setup
  - move intent and jump intent contracts
  - explosion impulse contract
- `test_char_visual.gd`
  - skeleton and attachment creation
  - idle bob / visual pose contracts
  - helper access pattern guardrails if those remain important
- `test_debug_controller.gd`
  - explosion origin calculation
  - debug label update behavior

Not every trivial file needs a class test. Files like simple camera or floor setup scripts should only get their own class test if they accumulate meaningful logic.

### Integration Tests

Integration tests answer: "do these parts work correctly together?"

Initial split:

- `test_bootstrap.gd`
  - code-first bootstrap shape
  - runtime-created top-level tree
- `test_movement.gd`
  - jump
  - settle back to floor
- `test_explosion.gd`
  - physical push
  - visual reaction
  - recovery
- `test_visual_layout.gd`
  - collider/visual separation
  - floor clearance
  - required bones
  - relative hand/foot layout

## Reporting

Runner output should make failures readable without opening the runner code first.

Preferred format:

```text
tests/class/test_char_visual.gd::test_required_bones_present -> missing expected bone: head
tests/integration/test_explosion.gd::test_explosion_pushes_away_from_origin -> explosion should push the character away from the origin
```

## Migration Plan

1. Keep current behavioral coverage while introducing `tests/runner.gd`.
2. Move reusable setup logic into fixtures first.
3. Split the current large integration runner into class and integration files.
4. Update `Makefile` so `make test-v6-character` points to `tests/runner.gd`.
5. Remove the old monolithic runner only after the new suite covers the same behavior.

## Non-Goals

- introducing a full external test framework
- adding manual registration for files or methods
- sharing one live scene instance across multiple tests by default

## Decision Summary

- Use one automatic entrypoint: `tests/runner.gd`
- Discover both test files and `test_*` methods automatically
- Use `test_` as the prefix for test files and test methods
- Use `fixtures_` as the prefix for fixture helpers
- Create a fresh scene/context per test method
- Keep class tests 1:1 with non-trivial runtime/debug scripts
- Keep integration tests behavior-focused
