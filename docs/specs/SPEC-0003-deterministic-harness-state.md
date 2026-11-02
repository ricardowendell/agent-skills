---
id: SPEC-0003
title: Deterministic harness state for bootstrap-project-harness
status: implemented
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
  dependencies, run with `node`.
- `SKILL.md` runs it before any step and takes its answer as the state; if the
  script cannot run, the table is the declared fallback.
- The Python template gains the `smoke` recipe the definition names; TypeScript
  ships one already.
- Two eval cases: #14 (complete → stop, already exists as `manual`) and #15
  (one file missing → fix only that, never stop).
- Unit tests for the script, a parity test against the templates, and both
  wired into CI and the pre-commit hook.

**Blast radius.** One skill and its eval corpus. The script reads; it never
writes, installs or fixes. No other skill depends on the state table. The eval
runner and the matrix are untouched.

## Non-Goals

- **Shipping the script into the target repo.** It runs from the skill against a
  path. A repo that lacks it must not read as partial, and "additive only"
  forbids writing a file into a repo just to decide what to do with it.
- **Installing the toolchain to decide.** `node_modules`, a lockfile and
  installed hook binaries are install output; a fresh clone never has them.
- **New stacks.** The script understands exactly the two the skill supports.
- **Changing what the harness installs.** The templates stay the source of what
  a complete harness contains.
- **A Python port of the script.** A repo whose machine has no `node` falls back
  to the table; that limit is stated, not solved.
- **A CI job that runs the bootstrap.** Only the unit and parity tests join CI.

## Flow

1. The agent runs `node <skill>/scripts/harness-state.mjs <repo>` (default `.`).
2. The script prints one line per finding and a final state. Exit codes: `0`
   complete, `1` partial, `2` empty, `3` project-no-harness; `4` ambiguous
   stack; `64` unreadable directory.
3. `complete` → the skill reports what it found and stops. No interview, no
   writes, no "verification" pass over the steps.
4. `partial` → the skill fixes only the items listed as missing, then re-runs.
   A `competing: <tool>` line means report and stop instead — never install the
   harness's tool over an existing one.
5. `empty` / project-no-harness → the existing bootstrap flow runs.
6. `ambiguous` → ask which directory, as the stack rules already say.
7. If `node` is unavailable, the skill says so and uses the table.

## Data

No persistence. The script's verdict is the run's output; nothing is written to
the repo and nothing is cached.

## UI Notes

Not applicable.

## Acceptance Criteria

- AC-1 — The script prints exactly one of `empty`, `project-no-harness`,
  `partial`, `complete`, with the flow's exit-code mapping, plus two refusals
  that are not states: `ambiguous` (exit 4, naming the manifests that fired) and
  an unreadable directory (exit 64, naming the path). Tested on four synthetic
  trees, a failing-smoke tree, an ambiguous tree and a missing directory.
- AC-2 — `complete` requires the files the stack's template installs (excluding
  install artefacts) and a smoke that exits 0. The smoke is `just smoke` when
  `just` is on PATH and the recipe exists; otherwise the built-in check parses
  the manifests and syntax-checks the docs sensor. Nothing is installed either
  way, and a repo whose own `just smoke` fails is not complete.
- AC-3 — `SKILL.md` runs the script before step 1, stops on `complete`, treats
  any `competing:` line as report-and-stop, asks on `ambiguous`, and names the
  table as the fallback when the script cannot run. The state table no longer
  describes the state as something read by inspection.
- AC-4 — Case 14 loses `status: manual` after at least 10 of 12 runs stop, and
  its `why:` carries the measured rate. Below 10 of 12 the script still ships,
  the case keeps `manual` with the rate recorded, and this AC is reported as
  failed — the spec stays honest about a mechanism that did not reach the
  behaviour. **Result: 12 of 12 stopped and changed nothing**, up from 5 of 12
  before the script. The first scoring pass read 9/12 because the case's reply
  regex did not accept `state: complete`, the line the script prints; after the
  assertion was widened, the same transcripts re-judge as 12/12.
- AC-5 — The Python template gains a `smoke` recipe that runs without an
  install, matching the TypeScript one.
- AC-6 — `validate-skills`, `run-evals --list --check` and the test suite pass,
  and the new script's tests plus the parity test are added to the CI step and
  to `.githooks/pre-commit` (this repo has no `lefthook.yml` of its own), since
  CI's existing glob only covers `scripts/lib/evals/`.
- AC-7 — Case 15 stages a fixture that is complete except for one required file
  (`lefthook.yml`). The skill creates it and does not declare the repo complete
  on the first pass; asserted by `file lefthook.yml`. It leaves `status: manual`
  only at 3/3. **Result: 3 of 3**, so it is runnable.
- AC-8 — A parity test maps every file under `templates/` to the path it
  installs (`x.template` → `x`, the docs files by name) and enforces three
  things: every required path is installed, every installed path is either
  required or declared optional, and no optional path is stale or also required.
  A new template file therefore fails until it is classified, and the message
  names the list to edit.

## Open Questions

No blocking question. Two decisions are recorded rather than asked:

- The script only inspects the directory it is given. In a monorepo the agent
  passes the package directory, and `ambiguous` covers the case where it cannot
  tell which.
- The `docs/` skeleton is required exactly as the templates install it. A repo
  that keeps its docs elsewhere is `partial` and the skill adds the missing
  directories, which is the same additive behaviour it has today.

## Prompt Notes

- Requirements: one script, one source of truth, two measured cases.
- Entities: state (`empty`, `project-no-harness`, `partial`, `complete`),
  refusal (`ambiguous`, unreadable), stack (`ts`, `python`), missing item,
  competing tool, smoke result.
- Approach: resolve the skill directory from `import.meta.url`; read-only
  checks; no subprocess that installs; `just smoke` only when both `just` and
  the recipe exist.
- Structure: `skills/bootstrap-project-harness/scripts/harness-state.mjs` and
  its two tests, `SKILL.md` step 0 and table, `templates/python/justfile.template`,
  `references/evals.md` cases 14 and 15, `.github/workflows/skills.yml`,
  `.githooks/pre-commit`.
- Operations: script, tests, parity test, skill wiring, python smoke, both
  cases, measurement, statuses.
- Norms: zero new dependencies; Node 20; comments explain why a check exists;
  the skill stays stack-agnostic in prose.
- Safeguards: never write to the target repo; never treat an install artefact
  as a gap; never override a competing tool; fail toward `partial` when a
  required file is unreadable — a wrong `complete` is worse than a wrong
  `partial`.
- Tests: four states, failing smoke, ambiguous, missing directory, template
  parity, plus the two eval cases.

## Notes

This repo has no `docs/product`, `docs/principles` or ADR tree, so the
design-principles and product-scope checks in the grooming workflow had nothing
to read. The gap is recorded rather than filled.
