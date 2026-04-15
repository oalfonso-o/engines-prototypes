# AGENTS

## Critical Rules

1. Everything is written in `GDScript`.
2. Prefer a code-first architecture by default.
3. Organize `runtime/` by domain first, then by `engine/` versus `logic/`.
4. `logic/` must not depend on `engine/`, scene-tree APIs, or runtime node behavior.
5. `engine/` may depend on `logic/` and adapts logic to the real Godot runtime.
6. Keep root scripts thin. Internal implementation logic belongs in descriptive helper classes.
7. Type everything. Do not rely on implicit `Variant`.
8. Use `@export` only for values genuinely tuned from the inspector.
9. Keep `runtime/`, `debug/`, and `tests/` strictly separated.
10. Automated tests use `GUT` and must follow the project test structure.

## Default Decisions

- Default to `code-first`, not `editor-first`.
- Default to creating nodes and subtrees in code.
- Default to putting internal logic inside helper classes, not root-level private methods.
- Default to placing state in the most local owner possible.
- Default to small, deterministic logic in `logic/`.
- Default to runtime adapters, node wiring, scene work, and Godot-facing code in `engine/`.
- Only use an editor-first approach when the user explicitly asks for it.
- Only use `shared/` when something truly has no clear owner domain.

## Project Structure

- When creating a new Godot prototype, use this default scaffold unless the user explicitly asks for a different structure:
  1. `project.godot`
  2. `main.tscn`
  3. `main.gd`
  4. `runtime/`
  5. `debug/`
  6. `tests/`
  7. `README.md`

- Treat that scaffold as the default contract:
  1. `project.godot` points to `res://main.tscn`
  2. `main.tscn` contains only one root node with `main.gd` attached
  3. `main.gd` bootstraps top-level components and does not own subsystem logic
  4. `runtime/` contains the real game or prototype components
  5. `debug/` contains debug-only tooling
  6. `tests/` contains automated tests and test-only helpers

- Do not invent a different folder layout for each new prototype unless the user explicitly asks for it.

- Add a minimal `README.md` that documents:
  1. what the prototype is
  2. controls if relevant
  3. how to run it
  4. how to run its tests

## Godot Code-First Architecture

- Treat `project.godot` as the project entrypoint.
- Treat `main.tscn` as a minimal bootstrap scene.
- Treat `main.gd` as a thin orchestrator for top-level setup.
- By default, create nodes and subtrees in code instead of preauthoring them in scenes.
- Do not split one component's structural definition across both `.tscn` and `.gd` without a clear reason.
- A component root script should own its whole subtree when the component is code-first.
- If a component is code-first, its node tree, child creation, and base configuration should live in `.gd` as the single source of truth.

## Godot Bootstrap Rules

- Keep `main.tscn` as small as practical:
  1. one root node
  2. one attached bootstrap script such as `main.gd`

- Keep `main.gd` focused on orchestration only:
  1. create or initialize top-level components
  2. attach them to the root
  3. avoid embedding subsystem logic there

- Prefer one top-level script per clear responsibility such as:
  1. camera
  2. lights
  3. floor
  4. world environment
  5. character root
  6. HUD
  7. debug controller

- Avoid predeclaring runtime nodes in `main.tscn` when those same nodes will be created and configured in code.
- Prefer readable responsibility-based names without redundant context prefixes when the directory already provides the context.

## Runtime / Debug / Tests Split

- Separate code into three top-level domains:
  1. `runtime/`
  2. `debug/`
  3. `tests/`

- `runtime/` contains only real game behavior.
- `debug/` contains only debug-only tooling, overlays, manual triggers, or inspection helpers.
- `tests/` contains only automated validation logic and test-only helpers.

- `runtime/` must not depend on `debug/` or `tests/`.
- `debug/` may depend on `runtime/`.
- `tests/` may depend on `runtime/`.

- Do not keep debug-only methods in runtime scripts.
- Do not keep test-only methods in runtime scripts.
- If a behavior exists only for debug, move it to `debug/`.
- If a behavior exists only for tests, keep it in `tests/`.
- When a runtime component needs companion debug or test logic, mirror it with sibling-named files under `debug/` or `tests/` instead of extending the runtime API with debug-only or test-only methods.

## Runtime Domain Architecture

- Organize `runtime/` first by game domain, then by `engine/` versus `logic/`.
- Do not keep global `runtime/engine/` and `runtime/logic/` directories.
- Prefer a structure like:
  1. `runtime/player/`
  2. `runtime/characters/`
  3. `runtime/combat/`
  4. `runtime/world/`
  5. `runtime/ui/`
  6. `runtime/shared/`

- Inside each runtime domain, split files into:
  1. `engine/`
  2. `logic/`

- Use `shared/` sparingly.
- If something has a clear owner domain, keep it in that domain instead of placing it in `shared/`.

## File Placement Decision Order

- Before creating or moving a runtime file, decide in this order:
  1. which domain owns it
  2. whether it belongs in `logic/` or `engine/`
  3. what test coverage it needs

- Use this mental rule:
  1. if it decides rules, computes state, parses data, or derives values, it likely belongs in `logic/`
  2. if it applies those decisions to the Godot runtime, it likely belongs in `engine/`

- Use this second rule when in doubt:
  1. if it could run in a test without a real scene or node tree, prefer `logic/`
  2. if it requires a real runtime node or scene context, prefer `engine/`

## Engine Versus Logic Rules

- Put a file in `logic/` when it mostly follows these rules:
  1. it does not inherit from `Node`, `Node3D`, `CharacterBody3D`, `Control`, or other runtime node classes
  2. it does not depend on the scene tree
  3. it does not use `get_node`, `add_child`, `queue_free`, `instantiate`, or similar scene operations
  4. it does not read real input
  5. it does not manipulate cameras, lights, HUD nodes, world environment nodes, scene timers, or node signals
  6. it can receive simple inputs and return simple outputs
  7. it should be testable without a real scene or runtime tree

- Put a file in `engine/` when it mostly follows these rules:
  1. it inherits from Godot runtime node classes
  2. it manipulates nodes or scenes
  3. it connects or reacts to node signals
  4. it reads real input
  5. it spawns scenes, projectiles, or runtime nodes
  6. it moves bodies in the world
  7. it applies logic to cameras, HUD, lights, environment, resources, or packed scenes

- Using Godot value types such as `Vector2`, `Vector3`, `Transform3D`, `Basis`, `Color`, arrays, or dictionaries does not automatically make a file `engine/`.

## Dependency Direction Rules

- `engine/` may depend on `logic/`.
- `logic/` must not depend on `engine/`.
- `logic/` must not instantiate runtime nodes.
- `logic/` must not traverse the scene tree.
- `logic/` must not call scene-management APIs.
- Treat `logic/` as pure gameplay logic, state, parsing, rules, and calculation code.
- Treat `engine/` as the adapter layer that connects `logic/` to the real Godot runtime.
- Folder structure alone is not enough. Preserve this dependency direction in the actual code.

## Placement Examples

- parse map text into a layout model -> `runtime/world/logic/`
- instantiate runtime nodes from a layout model -> `runtime/world/engine/`
- decide weapon spread values -> `runtime/combat/logic/`
- spawn and move a projectile node -> `runtime/combat/engine/`
- compute a health state transition -> `runtime/characters/logic/`
- apply that health state to a HUD or scene node -> `runtime/ui/engine/` or another relevant `engine/` layer
- decide a visual pose target -> `runtime/characters/logic/`
- apply that pose target to nodes, rigs, or transforms -> `runtime/characters/engine/`

## GDScript Typing Rules

- Type everything.
- Do not leave values as implicit `Variant`.
- Use explicit types for:
  1. node references
  2. local variables
  3. function arguments
  4. function return values
  5. arrays
  6. dictionaries
  7. constants when practical
  8. helper class fields

- If something can reasonably be typed, type it.
- Dynamic typing should be treated as an exception, not as the default.

## GDScript Script Structure

- Structure every GDScript file in this order:
  1. `extends`
  2. `class_name`
  3. `const`
  4. `@export`
  5. public vars
  6. private vars
  7. `@onready`
  8. Godot callbacks:
     - `_ready`
     - `_process`
     - `_physics_process`
     - `_input`
     - `_unhandled_input`
  9. public methods used from outside the file
  10. helper classes

- Treat Godot callbacks as the main entrypoints of the script and keep them near the top so the runtime flow reads from top to bottom.
- Keep the root of the script readable and predictable.
- Values loaded with `preload(...)` for scenes, scripts, or runtime assets should be named in `PascalCase`, not `ALL_CAPS`.

## Root And Helper Class Discipline

- Inside a script, keep almost all internal logic inside descriptive helper classes.
- Treat the root level of the script as a thin orchestration layer, not as the place where internal implementation logic lives.

- At the root level, allow only:
  1. Godot lifecycle callbacks such as `_ready`, `_process`, `_physics_process`, `_input`, or `_unhandled_input`
  2. public methods that are actually called from outside the file
  3. root variables only when they are part of the public runtime API or are genuinely shared across multiple helper classes

- Do not leave private internal methods hanging around at the root level.
- Do not spread implementation logic across multiple root-level helper methods.
- If logic is internal to the file, place it inside a helper class with a descriptive responsibility-based name.

## Callback And Public Method Size Rule

- Godot callbacks and public root methods may contain direct logic only when that logic stays very small.
- If a callback or public method is around 3 to 4 lines, it may keep that logic inline.
- If a callback or public method grows to 5 lines or more, move that logic into a helper class method instead.
- Treat this as a readability threshold, not as a loophole to keep dense logic at the root.
- The goal is that root methods read as short orchestration entrypoints that delegate real work to clearly named classes.

## Helper Class Responsibility Rules

- Each helper class should group logic by one clear responsibility.
- Prefer descriptive names that explain what the class owns, for example:
  1. `Builder`
  2. `Solver`
  3. `Factory`
  4. `Geometry`
  5. `InputHandler`
  6. `HealthModel`
  7. `CameraController`
  8. `DebugOverlay`
  9. `TestSupport`

- When a new internal behavior appears, prefer creating or extending a clearly named helper class instead of adding more root-level methods.
- The helper class should be the obvious single place where that logic lives and grows.
- Use helper instances over `static` helpers when the helper owns configuration, runtime state, cached references, or other variables used only by that helper.
- Use `static` helpers only when the helper is truly stateless.
- Prefer a separate top-level script over an in-file helper when that logic represents a whole component with its own subtree or bootstrap responsibility.

## Exported Configuration Rules

- Use `@export` only for values that are genuinely meant to be tuned from the Godot inspector.
- If a value is not actually being tuned from the inspector or configured externally, do not keep it as `@export`. Make it a normal variable instead.
- Keep `@export` values on the root script, not inside helper classes.
- Pass exported configuration into helper classes as arguments instead of making helper classes own inspector-tunable state.
- Use `const` for fixed implementation details and formulas that are not meant to be tuned from the editor.

## Variable Visibility And Placement Rules

- Treat variables as either public or private.
- If a variable is used from Godot wiring, from another script, from another helper, or from tests through the runtime API, make it public.
- If a variable is only used internally inside the same helper, make it private with an underscore prefix.
- Do not create getter methods for plain variables.
- Do not create setter methods for plain variables either.
- If external code needs a plain value, expose the variable itself as public and access it directly.
- If external code needs to mutate a plain value, assign the public variable directly instead of wrapping the assignment in a trivial method.
- Methods are acceptable for runtime commands, computed values, assembled state, or behavior that is not a simple variable passthrough.

- Keep variables in the most local place that actually owns them.
- If a variable is only used by one helper class, keep it inside that helper class.
- If a variable is used by multiple helper classes, it may live at the root level.
- If a variable is accessed from outside the file as part of the runtime API, expose it at the appropriate public level.
- Do not keep state at the root level just for convenience when that state really belongs to one helper class.

## Root Readability Goal

- A reader should be able to open a script and quickly understand:
  1. the Godot entrypoints
  2. the public API exposed to other files
  3. which helper classes own the real internal logic

- Root-level code should feel like a clean table of contents for the component.
- Internal logic should already be living in the place where it would naturally continue to grow.

## Testing With GUT

- Automated tests use `GUT`.
- Keep the test structure under `tests/` as:
  1. `tests/classes/`
  2. `tests/helpers/`
  3. `tests/integration/`

- `tests/classes/` contains focused tests for individual non-trivial scripts or classes.
- `tests/integration/` contains cross-component behavior checks.
- `tests/helpers/` contains shared test helpers and test-only support code.

- Name test files with the prefix `test_`.
- Keep helpers and support utilities under `tests/helpers/`.
- Tests should be runnable in isolation.
- Do not contaminate `runtime/` with test-only logic, helpers, or hooks.
- Keep product assertions in the test files themselves.
- Keep test helpers in `tests/helpers/` focused on setup, shared utilities, or reusable support behavior.

## Testing Strategy By Layer

- Prefer focused deterministic tests for `logic/` code.
- Prefer integration-style tests for `engine/` code.
- `logic/` code should be written so it is easy to exercise with small deterministic tests.
- `engine/` code may require scene setup, runtime wiring, or broader integration coverage.

- Before creating a new file, decide:
  1. its domain
  2. whether it belongs in `logic/` or `engine/`
  3. what test coverage it needs

- Before considering a change complete, make sure the relevant tests exist or are updated in the correct place.

## Review Checklist

Before finalizing a change, verify all of these:

1. The file is in the correct domain.
2. The file is in `logic/` or `engine/` for a concrete reason.
3. `logic/` does not depend on scene-tree APIs or runtime node behavior.
4. The script is fully typed.
5. The script order matches the project structure rules.
6. Root code is thin and internal logic lives in helper classes.
7. `@export` is used only for real inspector-tunable values.
8. Variables live in the most local owner possible.
9. No debug-only or test-only behavior leaked into `runtime/`.
10. Tests use `GUT` and live in the correct test area.
