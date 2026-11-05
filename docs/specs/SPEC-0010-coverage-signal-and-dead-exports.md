---
id: SPEC-0010
title: Coverage signal and dead exports in the eval harness
status: implemented
priority: P2
created_at: 2026-11-05
updated_at: 2026-11-05
source_docs:
  - backlog/tasks/task-15 - harness-remover-exports-mortos-e-dar-sinal-de-cobertura-no-ci.md
  - scripts/lib/evals/execute.mjs
  - scripts/lib/evals/assertions.mjs
  - scripts/lib/evals/glob.mjs
  - .github/workflows/skills.yml
related_decisions: []
depends_on: []
blocks: []
tests:
  - .github/workflows/skills.yml
---

# SPEC-0010: Coverage signal and dead exports in the eval harness

## Purpose

Two residues appear only when someone looks. `ARMS` is exported from
`execute.mjs` and used nowhere. `gateFor`, `isInside` and `listTree` are exported
but only have internal callers, so the module surface suggests a contract that
nothing depends on.

The CI runs the harness tests and stays green without saying what it did not
touch. `execute.mjs` and `agent.mjs` once went a whole session without a test and
nobody saw it. The fix is a coverage report in the log, not a gate: a numeric
floor needs a baseline number first.

## User Outcome

A contributor reading the CI log sees which harness modules the tests exercised,
and the eval library exports only what is used. Nothing else changes: same
tests, same runner behaviour, same skill corpus.

## Scope

- Remove the unused `ARMS` export.
- Stop exporting `gateFor` (`execute.mjs`), `isInside` (`assertions.mjs`) and
  `listTree` (`glob.mjs`) if their only callers are internal. Keep them as module
  functions.
- Add a coverage report to the CI step that runs
  `node --test scripts/lib/evals/*.test.mjs`, using the Node version the workflow
  already pins.
- Correct any comment in the touched files that states the CI pins Node 20; the
  workflow pins 24.
- Update `README.md` only if it documents an export or command that changes.

**Blast radius.** Three harness modules, one workflow step, possibly one README
table row. No assertion kind, no case format, no runner flag, no skill text, no
numeric threshold.

## Non-Goals

- **A numeric coverage floor.** The report has to exist before a number can be
  chosen. Turning the first number into a ratchet is a separate task, opened
  after the report has run once on `main`.
- **Covering `agent.mjs` or `execute.mjs` with new tests.** The report makes the
  gap visible; closing it is separate work.
- **Changing test behaviour.** No test is deleted, skipped or renamed.
- **Touching the skill corpus or the runner's CLI.**
- **A coverage service or dependency.** The report goes to the job log.

## Flow

1. Confirm each symbol's callers with a repository search before changing its
   export.
2. Remove `ARMS` and remove `export` from the three internal helpers.
3. Run `node --test scripts/lib/evals/*.test.mjs` locally.
4. Add the coverage flag to the existing test step in
   `.github/workflows/skills.yml`. Prefer the flag that prints a text report to
   the log without writing files that the workflow would have to upload.
5. Pin the report to the Node version the workflow uses, and print that version
   in the same step so the log is self-describing.
6. Push a branch and read the CI log: the table covers the harness modules, and
   the Node version line matches the workflow.
7. Re-run the other CI steps to prove nothing else moved.

## Data

No persistence. The only state is the CI log line with the coverage table and
the Node version. If the flag writes a file instead of printing, the workflow
must print it as part of the same step; no artifact upload is added.

## UI Notes

Not applicable.

## Acceptance Criteria

- AC-1 — `ARMS` no longer exists, and `gateFor`, `isInside` and `listTree` are
  not exported. Verified by a repository search and by the absence of the names
  in the module's export surface.
- AC-2 — No import is broken: `node --test scripts/lib/evals/*.test.mjs` passes.
  Verified by the local run and the CI step.
- AC-3 — The CI log for the test step contains a per-file coverage table and the
  Node version used. Verified by reading the job log of the branch run.
- AC-4 — No numeric floor is imposed: the step fails only for the same reasons
  it failed before. Verified by the workflow diff and a green run.
- AC-5 — No comment in the touched files claims the CI pins a Node version other
  than the one in the workflow. Verified by searching the touched files for
  `Node 20` (or the stale version) and comparing with `node-version`.
- AC-6 — README is either unchanged or still accurate about the harness tests
  and their exports. Verified by reading the section that mentions them.

## Result (2026-11-05)

`ARMS` is removed and the three helpers are internal. The CI step runs
`node --version` and `node --test --experimental-test-coverage
scripts/lib/evals/*.test.mjs`; locally it exits 0 and prints a per-file table
(the current run shows 78.64% lines overall, with `agent.mjs` at 36.00% — the
gap the report is meant to expose). The stale `Node 20` comment in `glob.mjs` is
replaced.

AC-1, AC-2, AC-4, AC-5 and AC-6 are met. AC-3 is met locally; the CI job log was
not observed because the branch was not pushed, so that half is reported as not
verified.

## Open Questions

- The task was written when the workflow pinned Node 20, where a threshold was
  not available. The workflow now pins 24. A floor is therefore possible today,
  but choosing it before the first report would be a guess; the spec keeps it
  out and names it as the next task. If the user wants the floor in the same
  slice, the AC set changes: the workflow needs a measured value and a
  documented reason for that value.
- Printing coverage for `scripts/lib/evals/*.test.mjs` reports only the modules
  those tests import. `agent.mjs` appears only if a test imports it; that is the
  gap the report is meant to expose, not a defect of the report.

## Prompt Notes

- Requirements: delete dead surface, keep internal helpers, publish coverage in
  the existing CI test step, correct the stale Node claim.
- Entities: `ARMS`, `gateFor`, `isInside`, `listTree`, the workflow's
  `node-version`, the harness test glob.
- Approach: smallest export change that leaves behaviour identical; report
  before ratchet.
- Structure: `scripts/lib/evals/{execute,assertions,glob}.mjs`,
  `.github/workflows/skills.yml`, README only if needed.
- Operations: search callers, edit exports, run tests, edit workflow, run CI,
  read the log.
- Norms: the repo uses no build step; tests run with `node --test`; CI comments
  explain why a pin exists.
- Safeguards: do not delete a helper that has an internal caller; do not add a
  threshold; do not upload artifacts; do not change test names.
- Tests: the existing harness suite plus one CI-log observation (coverage table
  and Node version) and one state check (no exported names, no stale comment).
