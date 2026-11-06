---
id: SPEC-0031
title: Re-measure the cells detector v2 invalidates
status: ready
priority: P1
task: TASK-46
created_at: 2026-11-06
updated_at: 2026-11-06
source_docs:
  - docs/evals/coverage.md
  - docs/evals/write-implementation-prompt-matrix.md
  - docs/evals/pipeline-bookends-matrix.md
related_decisions: []
depends_on:
  - SPEC-0028-detector-host-corpus
blocks: []
files:
  - docs/evals/write-implementation-prompt-matrix.md
  - docs/evals/pipeline-bookends-matrix.md
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0031-remeasure-under-detector-v2.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
---

# SPEC-0031: Re-measure the cells detector v2 invalidates

## Purpose

The 0.5.0 matrices were judged by a detector that could not see the host corpus
(SPEC-0028). Three cells were published as `unresolved` because their controls
were dirty; the other cells were called clean by a detector that would not have
noticed a control reading `docs/specs/` or `AGENTS.md`.

The replay in SPEC-0028 produces the list of cells whose clean claim does not
survive. This spec turns that list into evidence: the same arms, at one detector
version, five clean draws each.

The list is not invented here. It is whatever the replay names, plus the three
cells 0.5.0 already knew were unresolved.
- `write-implementation-prompt` #1
- `capture-idea` #1
- `process-inbox` #1

## User Outcome

Every published cell either carries a verdict under the current detector or says
plainly that it is history judged by an older one. No separator survives because
nobody re-checked it.

## Scope

- **Read the replay output first.** The cell list and its size come from
  SPEC-0028's invalidation table; the spec does not guess it.
- **Do not re-run what SPEC-0030 already measured.** The four
  `write-implementation-prompt` with-skill cells and its two triggers are
  re-measured there, at the same detector; cite those runs. A control that
  SPEC-0030 did not re-run and the replay invalidates is in scope here.
- **Measure each named cell with both arms** at the same `DETECTOR_VERSION`:
  five draws with the skill, five without, one clean run per arm where possible.
  A cell whose arm cannot reach five clean draws is `unresolved` with the raw
  clean counts — the rule the 0.5.0 spec already uses.
- **Downgrade is free, re-measurement is paid.** A separator the replay
  invalidates is downgraded to `unresolved` immediately if it falls outside this
  spec's budget; it is never kept as a separator on inertia. The budget is
  **at most 80 draws**: the three minimum cells (30) plus up to five more
  (50).
- **Annotate, do not rewrite.** Every row in both matrices and in
  `docs/evals/coverage.md` says which detector produced the reading. Old numbers
  stay where they are, marked `v1` history.
- **Stop rule.** If the replay names more cells than the budget covers, stop
  after the three minimum cells, publish the remaining list as a follow-up task,
  and say so in Results. Do not overspend silently.

**Blast radius.** Three documents and the draws. No skill, case, fixture,
assertion, runner or detector change.

## Non-Goals

- No new case, no skill edit, no detector change (SPEC-0028 owns it).
- No re-measurement of cells the replay leaves clean.
- No judge.
- No threshold or gate: this is evidence.

## Flow

1. **F0 — list**: take SPEC-0028's invalidation table; merge the three known
   cells; sort by cost.
2. **F1 — measure**: per cell, skill arm five draws, control arm five draws.
3. **F2 — check**: `check-eval-run` on every run; only a clean run supplies a
   rate.
4. **F3 — classify**: separator, non-discriminator, broken, unresolved.
5. **F4 — publish**: matrices, inventory, Results, and any follow-up task for
   the cells the budget left out.

## Data

- `~/.local/share/opencode/evals/runs/` — the new runs.
- `docs/evals/coverage.md` — the invalidation table from SPEC-0028 and the
  updated rows.
- Both matrices — the annotated cells.

## Acceptance Criteria

1. **Every cell named by the replay has a v2 verdict**, or is explicitly marked
   as v1 history with the reason it was not re-measured.
2. **The three known cells are measured** with both arms under one detector,
   five clean draws per arm in a single run, or stay `unresolved` with the new
   clean counts and the named finding.
3. **No separator is kept on inertia.** Any invalidated separator is either
   re-measured or downgraded, and the downgrade is visible in the row.
4. **No number is rewritten.** Each reading carries its detector version; the
   old value stays as history.
5. **The budget is respected or the stop rule is followed**: at most 80 draws,
   and any remaining cell is listed as a follow-up.
6. **No drift.** `git diff main...HEAD -- skills/` is empty, the five gates pass,
   and no run is cited without a `check-eval-run` line.

## Results

_Filled during implementation._

## Open Questions

- **What if the replay invalidates most cells?** Then the honest outcome is that
  0.5.0 measured with a detector that could not prove isolation, and the wave
  produces a smaller set of clean cells. That is a finding for the CHANGELOG, not
  a reason to widen the budget.
- **Does a v1 control stay citable after a detector change?** No: the pairing
  rule requires matching `detectorVersion`. That is why both arms are re-run.

## Prompt Notes

- **Requirements**: the replay's list, both arms at one detector, clean runs
  only, annotated numbers.
- **Entities**: cell, arm, run directory, detector version, clean count.
- **Approach**: list first, then measure in one batch, then classify, then
  annotate.
- **Structure**: documents only; the runner is untouched.
- **Operations**: `--repeat 5` per arm per case, `--no-skill` for the control,
  `--root skills`.
- **Norms**: the matrix states what changed and why; no rate from a rejected
  run.
- **Safeguards**: never pool clean draws across runs; never promote a separator
  from a dirty control; never quietly drop a cell.
- **Tests**: the five gates are model-free; the draws are evidence.
