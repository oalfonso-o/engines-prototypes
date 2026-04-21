# AGENTS

## Phaser Prototypes

- Runtime is JavaScript in the browser using Phaser.
- Prefer simple static-web setups first. Do not introduce Node tooling unless the task actually needs bundling, packages, or build steps.
- Prefer self-contained prototypes that can run from a local static server.
- Keep the entrypoint small: `index.html` plus a minimal `src/` tree.
- Prefer code-first scene construction for early prototypes.
- Vendor the framework locally when that removes unnecessary setup friction.
- Keep assets light; generated shapes and code-driven visuals are preferred for first iterations.

## Validation

- Minimum validation is that the local static server starts and the prototype page loads successfully.
- If gameplay behavior is visible in the browser, validate it in the browser rather than only by reading code.
