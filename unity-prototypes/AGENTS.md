# AGENTS

## Unity Prototypes

- Runtime is Unity, primarily C#.
- Prefer `Assets/`, `Packages/`, `ProjectSettings/`, `tools/`, and `docs/` as the source structure.
- Treat Unity generated folders as non-source: `Library/`, `Logs/`, `Temp/`, `Obj/`, `UserSettings/`, `MemoryCaptures/`.
- Prefer code-driven setup for early prototypes unless the user explicitly asks for editor-authored scene work.
- Keep editor automation in `Assets/Editor/` or `tools/` and keep runtime code in regular `Assets/` scripts.
- Keep scene/bootstrap files thin and move real behavior into descriptive components.
- Prefer repeatable command-line or Makefile entrypoints for bootstrapping, opening, and building projects.

## Validation

- Minimum validation is that the Unity project opens or builds without crashing, depending on the task.
- When behavior is visible in play mode or in a player build, validate it there rather than only by file inspection.
