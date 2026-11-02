---
id: SPEC-0003
title: Deterministic harness state for bootstrap-project-harness
status: ready
priority: P1
created_at: 2026-11-02
updated_at: 2026-11-02
source_docs:
  - README.md
  - backlog/tasks/task-6 - bootstrap-project-harness-medir-o-caminho-harness-completo-parar.md
related_decisions: []
depends_on: []
blocks: []
tests: []
---

# SPEC-0003: Deterministic harness state

## Purpose

`bootstrap-project-harness` asks the agent to decide which of four states a repo
is in — empty, project without harness, partial harness, complete harness — and
then act on that decision. Two measurement rounds show the decision is where it
breaks: given a repo whose files are all present and whose `just check` and
`just smoke` are green with zero dependencies, the agent called it partial in 7
of 12 runs and rebuilt files that already existed.

The reason it gave was consistent: it audited against the canonical templates,
found the repo's files trimmed or its toolchain uninstalled, and treated the
difference as a gap. The skill's own definition — files present plus a smoke
gate — was in the text, and the text did not win.

## User Outcome

An agent asked to bootstrap a repo that already has a complete harness says so
and stops, and the reason it stopped is a command's output rather than a
judgement about whether trimmed files count as present.

## Scope

- A new `skills/bootstrap-project-harness/scripts/harness-state.mjs`, zero
  dependencies, run with the repo's own `node`.
- `SKILL.md` runs it before any step and treats its answer as the state, instead
  of re-deriving the state by inspection.
- The Python template gains the `smoke` recipe the definition already names; the
  TypeScript template ships one already.
- `references/evals.md` case 14 (`bootstrap-project-harness`) stops being
  `manual` if it reaches the stop path in at least 10 of 12 runs.
- Unit tests for the script, in CI.

**Blast radius.** One skill and its eval corpus. The script reads; it never
writes, installs or fixes. No other skill depends on the state table. The eval
runner and the matrix are untouched.

## Non-Goals

- **Shipping the script into the target repo.** It runs from the skill against a
  path. A repo that lacks it must not read as partial, and the skill's
  "additive only" rule forbids writing a file into a repo just to decide what to
  do with it.
- **Installing the toolchain to decide.** `node_modules`, a lockfile and
  installed hook binaries are install output; a fresh clone never has them.
- **New stacks.** The script understands exactly the two the skill supports.
- **Changing what the harness installs.** The templates stay the source of what
  a complete harness contains.
- **A CI job that runs the bootstrap.** Only the script's unit tests join CI.

## Flow

1. The agent runs `node <skill>/scripts/harness-state.mjs <repo>` (default `.`).
2. The script prints one line per finding and a final state, and exits `0` for
   complete, `1` for partial, `2` for empty, `3` for project-without-harness.
3. `complete` → the skill reports what it found and stops. No interview, no
   writes, no "verification" pass over the steps.
4. `partial` → the skill fixes only the items the script listed as missing, then
   re-runs it.
5. `empty` / project-without-harness → the existing bootstrap flow runs.

## Data

No persistence. The script's verdict is the run's output; nothing is written to
the repo and nothing is cached.

## UI Notes

Not applicable.

## Acceptance Criteria

- AC-1 — The script prints exactly one of `empty`, `project-no-harness`,
  `partial`, `complete`, with the same exit-code mapping as the flow, and is
  tested on four synthetic trees — one per state — plus a repo where the smoke
  check fails. It exits non-zero and names the failing file when it cannot read
  the directory.
- AC-2 — `complete` requires the files the stack's template installs (excluding
  install artefacts) and a built-in check that parses the manifests and the docs
  sensor without installing anything. No `just`, `npm` or `uv` is required for
  the verdict.
- AC-3 — `SKILL.md` runs the script before step 1 and stops on `complete`, and
  the state table no longer describes the state as something read by inspection.
  A reader of the table and the script's output can see they are the same four
  states.
- AC-4 — Case 14 loses `status: manual` after at least 10 of 12 runs stop, and
  its `why:` carries the measured rate. If it stays below 10, it keeps `manual`
  with the rate recorded; the spec then says the mechanism did not reach the
  behaviour and the case is the evidence.
- AC-5 — The Python template gains a `smoke` recipe that runs without an
  install, matching the TypeScript one, so both stacks can satisfy AC-2.
- AC-6 — `validate-skills`, `run-evals --list --check` and the test suite pass,
  and the new script's tests are added to the CI step and to the pre-commit
  command, since CI's existing glob only covers `scripts/lib/evals/`.

## Open Questions

**Blocking — none.** The design is decided; the only unknown is behavioural and
AC-4 measures it. One point worth recording rather than deciding now: if the
agent still ignores the script, the next lever is not wording but making the
first step impossible to skip (for example, the skill's opening lines *are* the
command and its output shape). That is a follow-up, not part of this slice.

## Prompt Notes

- Requirements: one script, one source of truth, one measured case.
- Entities: state (`empty`, `project-no-harness`, `partial`, `complete`), stack
  (`ts`, `python`), missing item, smoke result.
- Approach: resolve the skill directory from the script's own location
  (`import.meta.url`), so the agent needs no path arithmetic; read-only checks
  only; no subprocess that installs.
- Structure: `skills/bootstrap-project-harness/scripts/harness-state.mjs`, its
  test beside it, `SKILL.md` step 0, `templates/python/justfile.template`,
  `skills/bootstrap-project-harness/references/evals.md` case 14, and the CI and
  pre-commit commands that run the unit tests.
- Operations: write the script and tests; wire it into the skill; add the Python
  smoke; run case 14 three times, then nine more if the first three stop; update
  the case's status and `why:` with the measured rate.
- Norms: zero new dependencies; Node 20; the skill stays stack-agnostic in prose
  and stack-specific only in the template lists; comments explain why a check
  exists, not what the line does.
- Safeguards: never write to the target repo; never treat a missing install
  artefact as a gap; do not weaken the existing "additive only" and "report
  competing toolchains" rules; a wrong `complete` is worse than a wrong
  `partial` — when a required file is unreadable, fail toward partial.
- Tests: four state fixtures, a failing smoke, a missing directory, and the
  existing eval suite.

## Notes

This repo has no `docs/product`, `docs/principles` or ADR tree, so the
design-principles and product-scope checks in the grooming workflow had nothing
to read. The gap is recorded rather than filled.
