# AGENTS

## Current Focus

- Work primarily on isolated prototypes under `godot-prototypes/` and `pygame-prototypes/`.
- Prefer changes that keep prototypes independently runnable and easy to test from the command line.

## Godot Prototypes

- These conventions apply to everything under `godot-prototypes/`.
- Fast visual and engine-facing prototyping in Godot can be done in `GDScript`.
- If a prototype later graduates into a more serious game branch, move deterministic and highly testable gameplay logic into `C#`.
- Keep directly engine-coupled logic in `GDScript` when it is mainly scene wiring, camera behavior, HUD, materials, map assembly, input glue, or other Godot-native integration work.
- Prefer a code-first architecture for Godot prototypes unless the user explicitly asks for editor-first scene authoring.

## Godot Bootstrap Style

- Treat `project.godot` as the project entrypoint and `main.tscn` as a minimal bootstrap scene.
- Keep `main.tscn` as small as practical:
  1. one root node
  2. one attached bootstrap script such as `main.gd`
- Do not spread one component's structural definition across both `.tscn` and `.gd` without a clear reason.
- If a component is code-first, its node tree, child creation, and base configuration should live in `.gd` as its single source of truth.
- Prefer `main.gd` as an orchestrator only:
  1. create or initialize top-level components
  2. attach them to the root
  3. avoid embedding subsystem logic there
- Prefer one script per responsibility for top-level bootstrap concerns such as camera, lights, floor, world environment, character root, HUD, or debug controller.
- A component root script should own its whole subtree. For example, a character root script should create its collider, visual rig, skeleton, and other mandatory children itself instead of relying on a companion `.tscn`.
- Avoid predeclaring runtime nodes in `main.tscn` when those same nodes are going to be created and configured in code.
- Prefer readable responsibility-based names without context prefixes such as `sandbox_` or `main_` when the directory already provides the context.

## New Godot Prototype Scaffold

- When creating a new Godot prototype under `godot-prototypes/`, start from the same default scaffold unless the user asks for a different structure.
- Create these top-level files and directories inside the prototype root:
  1. `project.godot`
  2. `main.tscn`
  3. `main.gd`
  4. `runtime/`
  5. `debug/`
  6. `tests/`
  7. `README.md`
- Treat that scaffold as the default contract for a new prototype:
  1. `project.godot` points to `res://main.tscn`
  2. `main.tscn` contains only one root node with `main.gd` attached
  3. `main.gd` bootstraps top-level components and does not own subsystem logic
  4. `runtime/` contains the real prototype components
  5. `debug/` contains optional debug HUD, debug controllers, or manual triggers
  6. `tests/` contains the automated test runner, tests, and fixtures
- Inside `tests/`, create this structure by default:
  1. `tests/runner.gd`
  2. `tests/class/`
  3. `tests/integration/`
  4. `tests/fixtures/`
- Name test files with the prefix `test_`.
- Name fixture files with the prefix `fixtures_`.
- If the prototype is command-line runnable and testable, add matching `make run-...` and `make test-...` targets in the root `Makefile`.
- Add a minimal `README.md` that documents:
  1. what the prototype is
  2. controls if relevant
  3. how to run it
  4. how to run its tests
- Do not invent a different folder layout for each new prototype unless the user explicitly asks for it.

## Godot Directory Split

- Separate Godot prototype code into three domains:
  1. `runtime/`
  2. `debug/`
  3. `tests/`
- `runtime` contains only real game behavior.
- `debug` contains only debug-only tooling, overlays, manual triggers, or inspection helpers.
- `tests` contains only automated validation logic and test-only helpers.
- `runtime` must not depend on `debug` or `tests`.
- `debug` may depend on `runtime`.
- `tests` may depend on `runtime`.
- Do not keep debug-only methods or test-only methods in runtime scripts.
- If a behavior exists only for debug, move it to `debug/`.
- If a behavior exists only for tests, keep it in `tests/`.
- When a runtime component needs companion debug or test logic, mirror it with sibling-named files under `debug/` or `tests/` instead of extending the runtime script API with debug/test-only methods.
- If a runtime script has no debug or test companion, it should exist only under `runtime/`.

## GDScript Rules

- Type everything that can reasonably be typed.
- Prefer explicit types for:
  1. node references
  2. local variables whose inferred type would otherwise become `Variant`
  3. function arguments
  4. function return values
  5. arrays and dictionaries when practical
- Avoid leaving values as implicit `Variant` unless there is a real reason to keep them dynamic.

## GDScript Script Structure

- Structure GDScript files in this order:
  1. `extends`
  2. `class_name`
  3. `const`
  4. `@export`
  5. public vars
  6. private vars
  7. `@onready`
  8. Godot entrypoint callbacks:
     - `_ready`
     - `_process`
     - `_physics_process`
     - `_input`
     - `_unhandled_input`
  9. everything else inside helper classes
- Treat the Godot callbacks as the main entrypoints of the script and keep them near the top so the runtime flow reads from top to bottom.
- Keep callback methods short and make them orchestrate helper calls directly when possible.
- Avoid redundant public passthrough methods that are only called by a single callback and add no external API value.
- Inside a focused component script, helper classes are acceptable for local implementation details.
- Do not force unrelated responsibilities into one file just to satisfy a helper-class pattern. When a responsibility can stand on its own as a component, prefer a separate `.gd` file.
- Values loaded with `preload(...)` for scenes, scripts, or similar runtime assets should be named in `PascalCase`, not `ALL_CAPS`, because they are treated as loaded references rather than fixed compile-time style constants.

## Helper Class Rules

- Use helper classes inside the same file to group closely related responsibilities and make navigation predictable.
- Prefer helper instances over `static` helpers when the helper owns configuration, runtime state, cached references, or any other variables that are only used by that helper.
- Use `static` helpers only when the helper is truly stateless.
- Prefer to keep variables inside the helper that actually uses them instead of leaving large bags of state on the root node.
- Only lift a variable to the root script when it is genuinely shared by multiple helpers or is part of the node's public runtime API.
- Prefer a separate top-level script over an in-file helper when that logic represents a whole component with its own subtree or bootstrap responsibility.
- Prefer clear helper names such as:
  1. `Builder`
  2. `Solver`
  3. `Factory`
  4. `Geometry`
  5. `Debug`
  6. `TestSupport`
- Inside a helper class:
  1. methods without `_` are treated as the helper's public API
  2. methods with `_` are treated as internal helper implementation details
- When introducing a new piece of logic, prefer creating a small helper that owns its own variables and exposes a narrow public method instead of extending the root script with more direct state.
- If logic exists only for debug behavior, keep it inside a `Debug...` helper class.
- If logic exists only to support tests, keep it inside a `TestSupport...` helper class or in the test file itself.

## Exported Configuration

- Use `@export` for values that are meant to be tuned from the Godot inspector.
- If a value is not actually being tuned from the inspector or configured externally, do not keep it as `@export`; make it a normal variable instead.
- Keep `@export` values on the component root script, not inside helper classes.
- Pass exported configuration into helper classes as arguments instead of making helper classes own inspector-tunable state.
- Use `const` for fixed implementation details and formulas that are not intended to be tuned from the editor.

## Variable Visibility

- Treat variables as either public or private.
- If a variable is used from Godot wiring, from another script, from another helper, or from tests through the runtime API, make it public.
- If a variable is only used internally inside the same helper, make it private with an underscore prefix.
- Do not create getter methods for plain variables.
- Do not create setter methods for plain variables either.
- If external code needs a plain value, expose the variable itself as public and access it directly.
- If external code needs to mutate a plain value, assign the public variable directly instead of wrapping the assignment in a trivial method.
- Methods are acceptable for runtime commands, computed values, assembled state, or other behavior that is not a simple variable passthrough.
- Example of what not to do: private helper state like `_torso_radius` plus `func torso_radius() -> float: return _torso_radius`.
- Example of what to do instead: public helper state like `var torso_radius: float = 0.28` accessed as `_config.torso_radius`.
- Computed helpers such as `compute_idle_bob(...)`, `hand_offset(...)`, or `head_offset()` should stay as methods because they assemble or derive a value instead of exposing stored state.

## Development And Testing

- Prefer TDD whenever the intended behavior can be expressed deterministically.
- Follow `red -> green -> refactor`:
  1. add or update a failing automated test that captures the intended behavior
  2. implement the smallest change needed to make that test pass
  3. refactor only after the test is green
- Before refactoring an existing behavior, add characterization tests so regressions are visible immediately.
- Run the relevant automated tests before considering the task complete.
- Do not run `dotnet build`, `dotnet test`, and the Godot integration runner in parallel against the same workspace outputs. They can contend on shared `obj/bin` files. Run them in sequence.

## Godot Testing

- For `GDScript` prototypes, favor small headless integration checks over brittle UI automation.
- For logic that is a strong fit for unit testing, prefer pushing it toward `C#` as the prototype matures.
- Prefer one test entrypoint such as `tests/runner.gd` per prototype and wire command-line test targets to that runner.
- Favor automatic discovery over manual registration:
  1. test files should use the prefix `test_`
  2. test methods should use the prefix `test_`
  3. fixture helpers should use the prefix `fixtures_`
- Split tests by scope:
  1. `tests/class/` for 1:1 tests of non-trivial scripts
  2. `tests/integration/` for cross-component behavior checks
  3. `tests/fixtures/` for shared setup helpers only
- Each discovered test case should create its own scene or fixture context unless there is a measured performance reason to share one.
- Treat the test runner as infrastructure only:
  1. discover files and methods
  2. provide shared assertions and context helpers
  3. execute tests and decide the exit code
- Keep product assertions in the test files themselves, not inside the runner or fixtures.

## Agent History

- If the user asks to "guardar el historial del agent" in docs, write or update a file under `docs/agents-history/`.
- Use one file per day named with the current local date in ISO format, for example `docs/agents-history/2026-04-12.md`.
- When writing the timestamp header for an entry, get the time from the user's machine by running `date`. Do not trust the model's internal time.
- Use the `date` result as the source of truth for the entry time, and format the header with the label `Europe/Barcelona`.
- Treat it as append/upsert:
  1. create the file if it does not exist
  2. append a new timestamped entry if it already exists
- Each entry should contain enough information for a later agent to resume work without reconstructing context from scratch.
- Include at least:
  1. current objective
  2. relevant decisions taken
  3. files touched
  4. important runtime assumptions
  5. open issues or next steps
- Keep entries concise but operational.
