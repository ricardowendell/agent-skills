# Agent instructions

- Specs: `docs/specs/`
- Prompts: `docs/prompts/`
- Architecture: `docs/architecture.md`
- Gates: `npm test` — runs `node --test`.

Behavioural guidelines:

- Keep `src/` free of I/O; tests live in `test/` and use `node:test`.
- Do not weaken or delete an existing test to make a change pass.
