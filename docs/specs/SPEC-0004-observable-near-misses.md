---
id: SPEC-0004
title: Observable outcomes for the three trigger near-misses
status: ready
priority: P2
created_at: 2026-11-02
updated_at: 2026-11-02
source_docs:
  - README.md
  - backlog/tasks/task-7 - trigger-dar-sinal-observável-aos-três-near-misses-manuais.md
related_decisions: []
depends_on: []
blocks: []
tests: []
---

# SPEC-0004: Observable outcomes for the trigger near-misses

## Purpose

Three trigger cases assert `notskill`: `find-blind-spots` #4, `tighten-harness`
#5 and `audit-docs` #3. Each measures whether the agent loaded a skill on a
prompt that belongs to a different one.

The measurement says the load is noise. The agent sometimes loads the skill to
check whether it applies, then answers correctly: 2/3 and 1/3 loads on #4, 1/3 on
#5, 1/3 on #3 after its description was narrowed. The reply was right every time,
so the assertion is measuring curiosity, not routing — and a permanent red that
does not correspond to a wrong outcome teaches people to ignore red.

## User Outcome

A reader of the trigger coverage sees, for each near-miss, what the agent must
*not do* — leave the plan alone, leave the lint threshold alone, leave the doc
set alone — instead of which internal skill it happened to open.

## Scope

- Give the three cases a fixture each, so an outcome exists to assert.
- Replace `notskill <id>` with outcome assertions on files.
- Run each case three times and record whether it can leave `status: manual`.

**Blast radius.** Three eval corpora (`find-blind-spots`, `tighten-harness`,
`audit-docs`) and their fixtures. No skill text changes, no description changes,
no change to the runner or to the matrix.

## Non-Goals

- **Re-litigating the descriptions.** `audit-docs` was narrowed and its overfire
  fell from 3/3 to 1/3; that work is done and this spec does not reopen it.
- **Banning the load.** Loading a skill to check whether it applies is not a
  defect, and a case must not fail for it.
- **A judge.** The outcome is a file state; it is deterministic or it is not
  measured.
- **New trigger cases.** The corpus stays at the cases it has.

## Flow

1. Each case stages a fixture that makes its outcome visible:
   - `find-blind-spots` #4: a `plan.md` with a plan to decompose.
   - `tighten-harness` #5: a repo with an oversized `src/huge.js` and the
     lint config that limits it.
   - `audit-docs` #3: a git fixture whose branch changes only
     `docs/architecture.md`.
2. The assertions name what must survive: `plan.md` unchanged and no spec or
   prompt created; `eslint.config.js` and `justfile` unchanged; the other docs
   unchanged and no ADR or spec created.
3. Each case runs three times; the pass rate decides `manual` or runnable.

## Data

No persistence. Fixtures live under `references/evals/<n>/`, as the other cases
do.

## UI Notes

Not applicable.

## Acceptance Criteria

- AC-1 — Each of the three cases has a fixture and at least one assertion on a
  file's state; `notskill` appears in none of them. Verified by reading the three
  case blocks and listing their fixture directories.
- AC-2 — The assertions pass or fail on the outcome alone: a run that loads the
  skill and leaves the files alone passes, and a run that never loads it but
  edits the config fails. Verified by the three-repetition runs and by reading
  the assertions.
- AC-3 — Each case is run three times. A case at 3/3 loses `status: manual`; a
  case below 3/3 keeps it, and its `why:` carries the measured rate and the
  assertion that failed. No case is left red for a load.
- AC-4 — `node scripts/run-evals.mjs --root skills --list --check` passes, and
  each of the three cases' `status:` reflects its measured rate, so the
  runnable/manual totals the command prints match the case files.

## Open Questions

**Blocking — none.** One judgement is recorded rather than asked: for
`tighten-harness` #5, splitting `src/huge.js` is allowed. The user asked for
source work; the case only forbids turning it into a threshold change, so the
assertions are `unchanged` on the config and the task runner, not on the source.

## Prompt Notes

- Requirements: three fixtures, outcome assertions, no `notskill` in these
  cases, measured status.
- Entities: near-miss case, fixture, outcome assertion (`unchanged`, `nofile`,
  `file`), load (recorded, not asserted).
- Approach: start from what the case's `expect:` already says and translate it
  into file state; if an expectation cannot be expressed as file state, it stays
  in `expect:` and is not asserted.
- Structure: `skills/<id>/references/evals.md` (case blocks) and
  `skills/<id>/references/evals/<n>/` (fixtures, with `git.json` where a diff is
  the object under review).
- Operations: build the three fixtures, rewrite the assertions, run each case
  three times, update `status:` and `why:` from the measurement, update the
  trigger counts.
- Norms: fixtures stay small and self-contained; a case states what it checks;
  `gate: off` stays, because these measure routing-adjacent behaviour, not the
  skill's own contract.
- Safeguards: do not assert "no skill loaded" as a proxy for correctness; do not
  weaken an existing case to make it pass; if an outcome assertion is unstable,
  keep the case `manual` and say why.
- Tests: the three cases at `--repeat 3`, plus the runner's unit suite.

## Notes

This repo has no `docs/product`, `docs/principles` or ADR tree, so the
design-principles and product-scope checks in the grooming workflow had nothing
to read. The gap is recorded rather than filled.
