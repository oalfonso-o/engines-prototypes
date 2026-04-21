# AGENTS

## Fast Mode Default

- Superpowers are disabled for this repo in practice: do not reach for skills, TDD rituals, elaborate debugging playbooks, or process-heavy loops unless the user explicitly asks for them.
- Default mode is `modo rapido`: make the smallest change that can move the prototype forward, run it, render it, inspect it, correct it.
- Prefer real game results over abstract confidence. If the problem is visible in the running prototype, validate it there.
- Ask only when the spec is still behaviorally ambiguous. If the intent is clear enough to build, build.
- If one direction fails twice or starts collecting hacks, offsets, physics patches, or workaround layers, stop and reset to a cleaner source or baseline.

## Global Working Style

- This root `AGENTS.md` is global only. Do not put engine-specific rules here.
- Engine-specific rules belong in each engine root:
  1. `godot-prototypes/AGENTS.md`
  2. `sokol-prototypes/AGENTS.md`
  3. `pygame-prototypes/AGENTS.md`
  4. `unity-prototypes/AGENTS.md`
  5. `phaser-prototypes/AGENTS.md`
- Keep the root `Makefile` thin and use it as an entrypoint that forwards into engine-specific `Makefile`s.
- Prefer stable project contracts in root-level config files such as `settings.yaml` when a prototype needs explicit runtime or data rules.
- Heavy preprocessing belongs offline in scripts or tools, not inside the hot runtime path.
- Before implementing a feature, first check that the spec is fully deterministic and boolean-clear, with nothing left open to interpretation.

## Validation Of Work

- Default minimum validation is: the relevant prototype starts without crashing.
- When a bug is visible in the running prototype, validate the fix in the running prototype.
- Do not claim a visually sensitive task is correct unless the validation artifact actually shows the claim clearly enough to judge.

## Directory Intent

- `godot-prototypes/`, `sokol-prototypes/`, `pygame-prototypes/`, `unity-prototypes/`, and `phaser-prototypes/` each own their engine-specific conventions.
- Project-specific rules may live deeper than the engine root when a single prototype needs extra constraints, but they must not replace the engine-root `AGENTS.md`.
