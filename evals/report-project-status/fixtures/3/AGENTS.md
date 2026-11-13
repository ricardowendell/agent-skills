# Widget

A small fixture repository. A status report is read-only here: it reports the
state and never edits it.

## Layout

- Backlog index: `backlog/tasks/` — one file per task, `task-<n> - <slug>.md`.
- Specs directory: `docs/specs/active/` — a spec is in the queue only when it is
  `status: ready` with `task:` and `files:`.
- Policy and gates: `docs/pipeline.md`.

## Rules

- `src/app.js` is the sentinel; the report must leave it byte-identical.
- Release notes live in `CHANGELOG.md`; the top entry is the current release.

## Commands

- Lint: `node --check src/app.js`
- Test: none configured
- Gates: lint and selftest are both `node --check src/app.js`, declared in
  `docs/pipeline.md`.

## Git

- Base branch: `main`. There is no remote, so issues and CI are unknown.
