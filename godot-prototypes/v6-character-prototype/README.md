# canuter-v6-character-prototype

Clean restart of the isolated Godot 4 character sandbox.

The prototype uses a code-first bootstrap:
- `project.godot` starts `main.tscn`
- `main.tscn` only declares the root node and attaches `main.gd`
- `main.gd` builds the sandbox by instantiating the runtime and debug compartments

## Controls

- `WASD`: move
- `Space`: jump
- `G`: trigger a local explosion impulse

## Run

```bash
cd /Users/oalfonso/pipprojects/canuter
make run-v6-character
```

## Test

```bash
cd /Users/oalfonso/pipprojects/canuter
make test-v6-character
```

The test entrypoint is `tests/runner.gd`. It auto-discovers:
- files named `test_*.gd` under `tests/class/` and `tests/integration/`
- methods named `test_*` inside each file

Test layout:
- `tests/class/`: 1:1 tests for non-trivial scripts
- `tests/integration/`: cross-component behavior checks
- `tests/fixtures/`: shared setup helpers with `fixtures_` prefix
