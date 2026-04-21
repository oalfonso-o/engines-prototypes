# AGENTS

## Pygame Prototypes

- Runtime is Python with `pygame`.
- Prefer small, code-first prototypes with minimal asset overhead.
- Keep each prototype self-contained and easy to run from its own folder.
- Prefer straightforward module boundaries over framework-style abstraction.
- For quick experiments, a single `main.py` is acceptable; split files only when the prototype starts to carry multiple clear responsibilities.
- Prefer deterministic update loops and explicit constants for speeds, sizes, and timings.
- If preprocessing or content generation is needed, keep it in scripts or tools outside the frame loop.

## Validation

- Minimum validation is that the prototype starts without crashing.
- If a bug is visible in the running window, validate the fix in the running window.
