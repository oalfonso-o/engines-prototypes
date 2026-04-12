# AGENTS

## Project Guidance

- The source of truth for the game we are building is under `docs/`.
- Before making product, gameplay, networking, UI, map, or technical decisions, review the relevant files in `docs/`.
- Start with `docs/README.md` for the document index.
- The Godot project itself lives under `godot/`.
- For gameplay/runtime behavior in the current prototype branch, use `docs/07-mvp-runtime-rules.md` as the implementation contract.

## Working Rule

- If a request conflicts with the documented game specs, update the documentation first or explicitly call out the conflict before implementing changes.
- If runtime gameplay behavior changes in the MVP branch, update `docs/07-mvp-runtime-rules.md` in the same change unless the change is clearly experimental and temporary.

## Development And Testing Rule

- Prefer TDD for gameplay/runtime work whenever the intended behavior can be expressed deterministically.
- Follow a `red -> green -> refactor` loop:
- first add or update a failing automated test that captures the intended behavior
- then implement the smallest change needed to make that test pass
- only refactor after the test is green
- Keep deterministic gameplay logic in shared C# code under `src/Canuter.Gameplay/` whenever practical so it can be covered by fast `dotnet test` unit tests.
- Treat the Godot layer under `godot/` as the engine integration layer that wires scenes, input, rendering, and physics to the shared gameplay logic.
- For Godot-specific behavior that cannot be covered well with pure unit tests, add a small number of targeted headless integration checks instead of broad brittle UI automation.
- Before refactoring an existing gameplay path, add characterization tests that lock the current behavior so regressions are visible immediately.
- When a task changes runtime behavior, run the relevant automated tests before considering the task complete.
- Do not run `dotnet build`, `dotnet test`, and the Godot integration runner in parallel against the same workspace outputs. They can contend on shared `obj/bin` files. Run them in sequence.

## Agent History Rule

- If the user asks to "guardar el historial del agent" in docs, write or update a file under `docs/agents-history/`.
- Use one file per day named with the current local date in ISO format, for example `docs/agents-history/2026-04-12.md`.
- Treat it as an upsert with append:
- create the file if it does not exist
- append a new timestamped entry if it already exists
- Each entry should contain enough information for a later agent to resume work without reconstructing context from scratch.
- Include at least:
- current objective
- relevant decisions taken
- files touched
- important runtime/documentation assumptions
- open issues or next steps
- Keep entries concise but operational.
