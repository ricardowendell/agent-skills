---
mode: direct
release_tier: B
specs_dir: docs/specs/active
lint: node --check src/app.js
selftest: node --check src/app.js
---

# Pipeline

This fixture has one source file, so it has one gate and declares it twice: as
`lint` and as `selftest`.

## Stages

| Stage | Exit artifact | Gate |
| --- | --- | --- |
| ready | spec in `docs/specs/active/` | human (groom) |
| in_progress | change in the worktree | `lint` |
| merged | change on `main` | `selftest` |

## Gates

- `lint` — `node --check src/app.js`.
- `selftest` — `node --check src/app.js`.
