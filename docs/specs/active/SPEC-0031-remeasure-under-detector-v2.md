---
id: SPEC-0031
title: Re-measure the cells detector v2 invalidates
status: ready
priority: P1
task: TASK-46
created_at: 2026-11-06
updated_at: 2026-11-07
source_docs:
  - docs/evals/coverage.md
  - docs/evals/write-implementation-prompt-matrix.md
  - docs/evals/pipeline-bookends-matrix.md
related_decisions: []
depends_on:
  - SPEC-0028-detector-host-corpus
  - SPEC-0032-deterministic-publish-checks
blocks: []
files:
  - docs/evals/write-implementation-prompt-matrix.md
  - docs/evals/pipeline-bookends-matrix.md
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0028-detector-host-corpus.md
  - docs/specs/active/SPEC-0030-fix-the-near-miss-trigger.md
  - docs/specs/active/SPEC-0031-remeasure-under-detector-v2.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0031-remeasure-under-detector-v2.md --base main
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
- **F0 — the list, already derived.** From the 26 invalidated cells, the arms
  still open after SPEC-0030 are exactly seven, five draws each (35 draws):
  - `write-implementation-prompt` #1, control — four v1 attempts, no five-draw
    clean run;
  - `write-implementation-prompt` #2, control — `15-30-39` is 0/4 replay-clean;
  - `write-implementation-prompt` #4, control — `14-37-23` is 4/5 replay-clean;
  - `capture-idea` #1, both arms — control `17-07-09`/`17-23-44`/`17-32-50`
    dirty, skill arm v1 only;
  - `process-inbox` #1, both arms — control `17-08-43`/`17-25-52`/`17-34-41`
    dirty, skill arm v1 only.
  Out of scope because SPEC-0030 already re-measured them at v2: the
  `write-implementation-prompt` with-skill cells #1/#2/#4 and the triggers
  #5/#6. The earlier `#2` control attempts (`14-30-42`, `14-40-36`, `15-25-06`,
  `15-27-30`) are superseded by the new run for the same arm, and
  `capture-idea` #3 at `16-50-30` is superseded by SPEC-0029's staged
  re-measure. #3 is `manual`. Every other invalidated row is either a #5/#6
  trigger run that SPEC-0030 re-ran or one of those attempts; no cell is left
  without a v2 verdict or a history label.
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
  spec's budget; it is never kept as a separator on inertia. The expected cost
  from F0 is **35 draws**; the cap is **80**, leaving room for a retry when a
  run is dirty or a draw stalls. Do not spend the headroom without naming the
  finding that forced it.
- **Annotate, do not rewrite.** Every row in both matrices and in
  `docs/evals/coverage.md` says which detector produced the reading. Old numbers
  stay where they are, marked `v1` history.
- **Stop rule.** If the replay names more cells than the budget covers, stop
  after the three minimum cells, publish the remaining list as a follow-up task,
  and say so in Results. Do not overspend silently.

**Blast radius.** Three evidence documents, the two historical specs whose
forward references the result closes, and the draws. No skill, case, fixture,
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
6. **No drift.** `git diff main...HEAD -- skills/` is empty, every command in
   `tests:` passes, and no run is cited without a `check-eval-run` line.

## Results

### F0 — the list, and the model deviation

The replay left seven arms open after SPEC-0030: the three
`write-implementation-prompt` controls (#1, #2, #4) and both arms of
`capture-idea` #1 and `process-inbox` #1. The with-skill write cells (#1, #2,
#4) and its triggers (#5, #6) were not re-run; they cite SPEC-0030.

The default provider, `opencode-go/deepseek-v4.1-flash`, returned
`GoUsageLimitError` (weekly limit, HTTP 429) on the first attempt
(`2026-11-07T08-14-24--capture-idea`, 5 gate-miss repetitions, no model draw).
The re-measure therefore ran on `agentworks/deepseek-v4-1-flash`, the same model
family through a different route; every row below names that model. A one-draw
probe (`2026-11-07T08-16-35--capture-idea--agentworks-deepseek-v4-1-flash`,
1/1 clean) checked the route before the paid run. The with-skill controls and
the SPEC-0030 skill arms are therefore not a same-model pair; the rows say so and
no paired rate is claimed from them.

### F1/F2 — the runs and the checker

All runs are at `eb9903e`, detector v2 (`71bfb85a91cd68ab`), five draws per arm:

| cell | arm | run directory | clean draws | checker |
| --- | --- | --- | --- | --- |
| `write-implementation-prompt` #1 | control | `2026-11-07T08-17-29--write-implementation-prompt--agentworks-deepseek-v4-1-flash--without-skill` | 0/2 (3 contaminated) | `findings=4 isolated=no` |
| `write-implementation-prompt` #2 | control | `2026-11-07T08-20-10--write-implementation-prompt--agentworks-deepseek-v4-1-flash--without-skill` | 0/4 (1 contaminated) | `findings=1 isolated=no` |
| `write-implementation-prompt` #4 | control | `2026-11-07T08-22-28--write-implementation-prompt--agentworks-deepseek-v4-1-flash--without-skill` | 2/2 (3 contaminated) | `findings=5 isolated=no` |
| `capture-idea` #1 | skill | `2026-11-07T08-25-21--capture-idea--agentworks-deepseek-v4-1-flash` | 5/5 | `findings=0 warnings=0 isolated=yes` |
| `capture-idea` #1 | control | `2026-11-07T08-27-30--capture-idea--agentworks-deepseek-v4-1-flash--without-skill` | 0/0 (5 contaminated) | `findings=5 isolated=no` |
| `process-inbox` #1 | skill | `2026-11-07T08-29-45--process-inbox--agentworks-deepseek-v4-1-flash` | 5/5 | `findings=0 warnings=0 isolated=yes` |
| `process-inbox` #1 | control | `2026-11-07T08-31-34--process-inbox--agentworks-deepseek-v4-1-flash--without-skill` | 0/2 (3 contaminated) | `findings=4 isolated=no` |

Budget: **36 draws** — 35 for the seven arms and 1 for the probe. The 429 run
spent none. The cap is 80; the remaining 44 were not spent because the control
contamination is structural (below), not probabilistic.

The two non-evidence runs, with their checker lines:

```sh
node scripts/check-eval-run.mjs ~/.local/share/opencode/evals/runs/2026-11-07T08-14-24--capture-idea
# cases=1 reps=5 findings=5 ... isolated=yes — gate-miss: provider GoUsageLimit 429, no model draw
node scripts/check-eval-run.mjs ~/.local/share/opencode/evals/runs/2026-11-07T08-16-35--capture-idea--agentworks-deepseek-v4-1-flash
# cases=1 reps=1 findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes — one-draw route probe, discarded
```

### F3 — classification

- **`write-implementation-prompt` #1 — unresolved.** Both clean control draws
  failed `spec_sha:`; 3 draws read the install or the checkout. The skill arm is
  the SPEC-0030 5/5 (default model), so the direction is a separator but the
  five-draw clean control does not exist.
- **`write-implementation-prompt` #2 — unresolved.** All four clean control
  draws failed `nodir docs/prompts`; `r1` read the installed `SKILL.md`. Skill
  arm 5/5 (SPEC-0030). Direction unchanged, no five-draw clean control.
- **`write-implementation-prompt` #4 — non-discriminator.** Both clean control
  draws passed; 3 contaminated. The control passes when clean, so the case
  cannot separate the arms. The 2/2 clean subset is not a five-draw rate, but the
  earlier v1 reading (4/5 clean, 4/4 passed) points the same way.
- **`capture-idea` #1 — unresolved.** Skill 5/5 clean; every control draw read
  the install under `/Users/wendell/.agents/skills` (`r1` the directory, the rest
  the `SKILL.md`), so the clean subset is 0/0. The direction (the clean controls
  would fail `status: unprocessed`) is unchanged, but no clean control exists.
- **`process-inbox` #1 — unresolved.** Skill 5/5 clean; control 0/2 clean (3
  contaminated). Both clean draws failed `unchanged` and `nodir docs/backlog`.

### The finding

The control arm still reads `/Users/wendell/.agents/skills` and the checkout.
`--no-skill` denies the `skill` tool, not the file text, and the v2 detector
correctly marks those draws contaminated. Re-running the control cannot fix it:
the clean counts above are the third wave to show the same mechanism. That is the
deny-layer half of TASK-43, not a case-design defect and not a reason to lower
the five-draw rule.

### Forward references closed

`SPEC-0028` and `SPEC-0030` said the #2/#4 controls were pending SPEC-0031. Both
now carry the v2 outcome — #2 unresolved at 0/4 clean, #4 non-discriminator at
2/2 clean passed — and the numbers those specs published are unchanged.

### What this means for issue #5

The three cells that looked closest to the issue's "three cases" all stay
unresolved: their controls cannot reach five clean draws. The issue's three
separators must come from the arms whose controls are replay-clean under v2 —
`implement-from-prompt` #1 and #8 and `review-code` #7 — re-measured at a v2
detector, or cited as replay-verified v1 history with that limit stated. This
spec does not widen its scope to them; the follow-up belongs to issue #5.

### Gates

`node scripts/validate-skills.mjs --root skills`, `--list --check`, the harness
tests, the bootstrap tests, `check-sensor-parity`, `check-evidence` and
`spec-check --base main`; results are in the report. `git diff main...HEAD --
skills/` is empty. No skill, case, fixture, assertion, runner or detector
changed.


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
