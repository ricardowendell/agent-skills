---
id: SPEC-0031
title: Re-measure the cells detector v2 invalidates
status: implemented
priority: P1
task: TASK-46
created_at: 2026-11-06
updated_at: 2026-11-08
source_docs:
  - docs/evals/coverage.md
  - docs/evals/write-implementation-prompt-matrix.md
  - docs/evals/pipeline-bookends-matrix.md
related_decisions: []
depends_on:
  - SPEC-0028-detector-host-corpus
  - SPEC-0032-deterministic-publish-checks
blocks:
  - SPEC-0033-discriminating-cases
files:
  - docs/evals/write-implementation-prompt-matrix.md
  - docs/evals/pipeline-bookends-matrix.md
  - docs/evals/coverage.md
  - docs/specs/SPEC-0028-detector-host-corpus.md
  - docs/specs/SPEC-0030-fix-the-near-miss-trigger.md
  - docs/specs/SPEC-0031-remeasure-under-detector-v2.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/SPEC-0031-remeasure-under-detector-v2.md --base main
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

A **first attempt on the default model** ran the same arms at `eb9903e` between
01:46 and 03:08 (`2026-11-07T01-46-26` through `03-08-51`). Those runs are v2,
five draws each, and are the primary evidence where they pair with a skill arm
on the same model. The later attempt at 08:14 hit `GoUsageLimitError` (weekly
limit, HTTP 429; `2026-11-07T08-14-24--capture-idea`, 5 provider go-limit
aborts — the gate missed because the provider aborted before load, not because
routing failed; TASK-54), so the second pass used
`agentworks/deepseek-v4-1-flash` (probe
`08-16-35`, 1/1 clean). The routes disagree on `write` #2 (separator on default,
no clean control on agentworks); they are reported separately, and no rate is
pooled across them.

### The first attempt — default model

Ten runs at `eb9903e`, detector v2 (`71bfb85a91cd68ab`), default
`opencode-go/deepseek-v4.1-flash`, five draws each:

| cell | arm | run directory | clean | passed | checker |
| --- | --- | --- | --- | --- | --- |
| `write-implementation-prompt` #1 | control (a) | `2026-11-07T01-46-26--write-implementation-prompt--without-skill` | 3/5 | 0/3 | `findings=4 isolated=no` |
| `write-implementation-prompt` #2 | control (a) | `2026-11-07T01-57-39--write-implementation-prompt--without-skill` | 3/5 | 0/3 | `findings=2 isolated=no` |
| `write-implementation-prompt` #4 | control | `2026-11-07T02-03-01--write-implementation-prompt--without-skill` | 4/4 valid | **4/4** | `findings=0 isolated=yes`; 1 rep aborted (429) |
| `capture-idea` #1 | skill | `2026-11-07T02-09-26--capture-idea` | 5/5 | 5/5 | `findings=0 isolated=yes` |
| `capture-idea` #1 | control | `2026-11-07T02-39-46--capture-idea--without-skill` | 2/5 | 0/2 | `findings=4 isolated=no` |
| `process-inbox` #1 | skill | `2026-11-07T02-45-54--process-inbox` | 5/5 | 5/5 | `findings=0 isolated=yes` |
| `process-inbox` #1 | control (a) | `2026-11-07T02-51-15--process-inbox--without-skill` | 2/5 valid | 0/2 | `findings=2 isolated=no`; 1 rep aborted (429), 2 contaminated |
| `write-implementation-prompt` #1 | control (b) | `2026-11-07T02-58-14--write-implementation-prompt--without-skill` | 3/5 | 0/3 | `findings=4 isolated=no` |
| `write-implementation-prompt` #2 | control (b) | `2026-11-07T03-01-29--write-implementation-prompt--without-skill` | 5/5 | **0/5** | `findings=0 isolated=yes` |
| `process-inbox` #1 | control (b) | `2026-11-07T03-08-51--process-inbox--without-skill` | 0/5 valid | — | `findings=0 isolated=yes`; **all 5 reps aborted on the provider go-limit (429), not evidence** |

This attempt produced the **primary** evidence for two cells: `write` #2 is a
separator (5/5 vs 0/5) and `write` #4 is a non-discriminator (control 4/4 valid
passed); `process-inbox` #1's `03-08-51` run is not evidence because every rep
aborted before model work. The later agentworks route adds no clean five-draw
control for any of them; it is a fallback, not a tie-breaker.

### F1/F2 — the runs and the checker (agentworks fallback)

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

Budget: **86 repetitions scheduled**. **82 produced model work** — 46 in the
default attempt (50 minus 4 no-call reps) and 36 in the agentworks pass (35 arms
plus the probe). The other 4 reps made no model call (`03-08-51` r4/r5 on the
go-limit, `02-51-15` r3 and `02-03-01` r4 on an upstream rate-limit). Three of
the 82 died mid-run on the go-limit (`03-08-51` r1–r3), spent draws without a
verdict. That is **2 over the 80 cap**; the original Results counted only 36
because the first attempt was not cited. AC-5 is not met, and the overrun is
disclosed rather than redefined. The `08-14-24` 429 run spent none. `write` #1
and `capture-idea` #1 were not retried further because their clean control does
not exist on either route.

The two non-evidence runs, with their checker lines:

```sh
node scripts/check-eval-run.mjs ~/.local/share/opencode/evals/runs/2026-11-07T08-14-24--capture-idea
# cases=1 reps=5 findings=5 ... isolated=yes — gate-miss: provider GoUsageLimit 429, no model draw
node scripts/check-eval-run.mjs ~/.local/share/opencode/evals/runs/2026-11-07T08-16-35--capture-idea--agentworks-deepseek-v4-1-flash
# cases=1 reps=1 findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes — one-draw route probe, discarded
```

### F3 — classification

- **`write-implementation-prompt` #1 — unresolved.** Two default attempts
  (`01-46-26`, `02-58-14`) produced 3 clean draws each, 0 passed; the agentworks
  attempt (`08-17-29`) produced 0/2. Every clean draw failed `spec_sha:`. The
  skill arm is the SPEC-0030 5/5 (default), so the direction is a separator, but
  no five-draw clean control exists on either route.
- **`write-implementation-prompt` #2 — separator.** 5/5 with the skill
  (`2026-11-06T19-28-47--write-implementation-prompt`) against **0/5 clean**
  without it (`2026-11-07T03-01-29--write-implementation-prompt--without-skill`),
  both on the default model and detector v2. The agentworks control
  (`08-20-10`) only reached 0/4 clean; that is a route difference, not a reason
  to demote the clean default pair.
- **`write-implementation-prompt` #4 — non-discriminator.** The default control
  (`02-03-01`) is **4/4 valid draws passed** (one rep aborted on the provider);
  the agentworks control is 2/2 passed. The control passes when it runs, so the
  case cannot separate the arms. The 4/4 is not a five-draw rate, but the
  direction is closed.
- **`capture-idea` #1 — unresolved.** Skill 5/5 clean on both routes
  (`02-09-26`, `08-25-21`); the default control (`02-39-46`) is 0/2 clean and the
  agentworks control is 0/0 (5 contaminated). The direction (the clean controls
  would fail `status: unprocessed`) is unchanged, but no clean control exists.
- **`process-inbox` #1 — unresolved.** Skill 5/5 clean (`02-45-54`); the default
  control (`02-51-15`) has **2 valid clean draws, 0/2**, failing `unchanged` and
  `nodir docs/backlog`; `03-08-51` is **not evidence** — all five reps aborted on
  the provider go-limit (429) before acting on the case (`r4`/`r5` before any
  model call, `r1`–`r3` mid-run). The agentworks control
  (`08-31-34`) is 0/2 clean. No valid five-draw clean control exists on either
  route.

### The finding

Contamination is route- and prompt-dependent, not uniform. On the default model
`write` #2 stayed clean for all five draws and `write` #4 for four valid draws;
`process-inbox` #1's `03-08-51` attempt aborted on the provider limit and is not
evidence. On `agentworks` the same cases read the install. `write` #1 and
`capture-idea` #1 read it on both routes. `--no-skill` denies the `skill` tool,
not the file text, and the v2 detector correctly marks those draws contaminated.
The deny-layer half of TASK-43 is still the reason a control can be dirty, but
it no longer blocks `write` #2, which has a clean default-model pair. Do not
lower the five-draw rule to rescue the others.

### Forward references closed

`SPEC-0028` and `SPEC-0030` said the #2/#4 controls were pending SPEC-0031. Both
now carry the v2 outcome — #2 is a separator at 5/5 vs 0/5, #4 a
non-discriminator at 4/4 valid passed — and the numbers those specs published
are unchanged.

### What this means for issue #5

The corrected verdict adds one separator that the first attempt had already
measured: `write-implementation-prompt` #2 (5/5 vs 0/5 on the default model).
With `implement-from-prompt` #1/#8 and `review-code` #7, four cells now separate.
The held-out set published by SPEC-0033 stays the three it measured; `write` #2
is listed beside it in `docs/evals/discriminating-cases.md`. `capture-idea` #1,
`process-inbox` #1 and `write` #1 remain unresolved because their controls never
reached five valid clean draws.

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
