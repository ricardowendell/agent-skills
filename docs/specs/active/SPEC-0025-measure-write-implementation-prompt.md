---
id: SPEC-0025
title: Measure write-implementation-prompt
status: ready
priority: P1
task: TASK-31
created_at: 2026-11-06
updated_at: 2026-11-06
source_docs:
  - docs/evals/coverage.md
  - docs/evals/implement-from-prompt-matrix.md
  - CONTRIBUTING.md
related_decisions: []
depends_on: []
blocks:
  - SPEC-0026-measure-pipeline-bookends
files:
  - skills/write-implementation-prompt/references/evals.md
  - docs/evals/write-implementation-prompt-matrix.md
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0025-measure-write-implementation-prompt.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
---

# SPEC-0025: Measure `write-implementation-prompt`

## Purpose

The pipeline has four skills whose cases parse but have never been measured:
`capture-idea`, `process-inbox`, `record-decision` and
`write-implementation-prompt`. Three of them are the bookends of
`/capture → /process-inbox → /groom`; this one sits in the middle, immediately
before `implement-from-prompt`, which already has a published matrix.

That order is the problem. `implement-from-prompt` faithfully implements the
prompt it is handed, so a bad prompt is measured as a good implementation. The
one step that decides what the coding agent will be told has no evidence that the
skill changes anything: six cases, one `manual`, and `none` in
`docs/evals/coverage.md`. TASK-31 asks for the measurement.

## User Outcome

Every case of `write-implementation-prompt` either carries a run directory and a
classification — separator, non-discriminator, broken or unresolved — or a
written reason it cannot be run (`manual`). The coverage row cites that
evidence, so a reader can tell what the skill actually buys over not loading it.

## Scope

- **Six cases, measured as they are.** `#1` (5 expectations, 3 asserts, fixture
  1), `#2` (2, 2, fixture 2), `#3` (2, 2, fixture 3), `#4` (2, 2, fixture 4),
  and the two triggers `#5`/`#6` (`gate: off`, `assert: skill|notskill`).
- **Case #3 stops being `manual`.** It has no `prompt:` today, but the fixture
  exists and the contract it tests is explicit: `SKILL.md` step 5 says "Check
  open questions. If any block implementation, stop and list them instead of
  inventing answers", and fixture 3's `SPEC-0009` is `status: ready` with two
  open questions. The case gets `prompt: Create the implementation prompt for
  SPEC-0009.` and keeps its two asserts (`nodir docs/prompts`,
  `unchanged docs/specs/SPEC-0009-audit-log.md`). If five draws cannot produce a
  deterministic verdict, revert the case to `manual` **with a `why:` line** and
  record that in Results. Leaving `manual` without a reason is what this spec is
  closing.
- **A load canary before Gate A**, per `CONTRIBUTING.md`:
  `--case 1 --repeat 12 --run`. 12/12 with the gate held is the precondition; a
  canary miss is a finding about the skill, not a case rate, and stops Gate A.
- **Gate A: five draws per arm, deterministic asserts only, no judge.** Default
  model, default concurrency, `--level behavior`. `--repeat 5` runs all five
  draws (the `--stop 5/3` rule only applies above five).
- **Triggers run in the skill arm only**: `#5` must load the skill, `#6` must
  not, five draws each.
- **Classification per case**, with the rule stated in the matrix:
  - `separator` — with the skill ≥ 4/5 and the control ≤ 1/5;
  - `non-discriminator` — both arms ≥ 4/5, or the gap is smaller than 3/5;
  - `broken` — with the skill ≤ 3/5: the skill fails its own case.
  - `unresolved` — the with-skill cell is at least 4/5 but no run brings the
    control arm to five clean draws, so the case cannot be classed as a
    separator or a non-discriminator on clean evidence; it keeps its raw clean
    counts and says so, the way `groom-backlog` #2 is recorded.
  - A with-skill draw whose `skillGate.ok !== true` is not a pass and not a pass
    rate. More than one miss in five makes the cell unreadable: diagnose and
    re-run before classifying.
- **Publish `docs/evals/write-implementation-prompt-matrix.md`**, in the shape of
  the two existing matrices: what the arms mean, the exact commands, the run
  directories, the table per case (deterministic cell, gate cell, both arms), the
  red cells named by assertion or gate reason, and the classification with its
  evidence. No judge column: this spec runs no judge.
- **Update only this skill's row in `docs/evals/coverage.md`**, plus the
  `Manual` count in the total row if #3 became runnable. The Known-holes sweep
  and the `docs/README.md` map belong to SPEC-0026, which lands after this one.

**Blast radius.** One case line in `skills/write-implementation-prompt/references/evals.md`,
one new evidence doc, one table row in `docs/evals/coverage.md`. No skill prose,
no assertion of an existing case, no fixture, no runner, no gate changes.

**Budget.** About 62 draws: 12 canary, 40 for four behavioural cases across two
arms, 10 triggers. At the 0.4.0 baseline's ~51 s per draw and concurrency 4 that
is roughly 15–25 minutes of wall time. No judge.

## Non-Goals

- No fix to the skill in this spec. If a case comes back `broken`, the spec
  records it and stops; the fix is a new spec with its own before/after draw.
- No redesign of a case that fails to separate. A control that passes because
  the assertions cannot see the difference is recorded as
  `non-discriminator`, with the reason. Adding reply assertions is a different
  spec.
- No second model. The matrix names the default model; a cross-model claim needs
  its own draws.
- No Known-holes bullet rewrite and no `docs/README.md` edit: SPEC-0026 owns the
  fan-in and depends on this spec.
- No judge, no fixture change, no new case.

## Flow

1. **F0 — repro** (`--list --check`): six cases, five runnable, one `manual`.
2. **F1 — case #3**: add the prompt, confirm it still parses and stages.
3. **F2 — canary**: `--case 1 --repeat 12 --run`; 12/12 with the gate held.
4. **F3 — Gate A, with the skill**: five draws for `#1`–`#4`; five for the
   trigger tag.
5. **F4 — Gate A, control**: the same four cases with `--no-skill`.
6. **F5 — check every run** with `scripts/check-eval-run.mjs`; a cell enters the
   table only with `findings=0 warnings=0`, otherwise it is cited as the record
   of the failure with the finding named.
7. **F6 — publish**: the matrix, the coverage row, the total's `Manual` count.

## Data

- `~/.local/share/opencode/evals/runs/<timestamp>--write-implementation-prompt*/`
  — `manifest.json` (model, arm, params, status) and `cases/<n>/result.json`
  (`repetitions[]`, `skillGate`, `leak`, provenance hashes).
- `docs/evals/write-implementation-prompt-matrix.md` — the published table.
- `docs/evals/coverage.md` — this skill's row and the total.

## Acceptance Criteria

1. **All six cases are accounted for.** Five are runnable and #3 is either
   runnable with a deterministic verdict or `manual` with a written `why:`;
   `--list --check` exits 0 and reports the counts the spec records.
2. **Five draws per arm on every behavioural case**, on one measurement surface
   (the same `fixtureHash`, `promptHash`, `skillHash` and `detectorVersion`),
   each run directory cited; every cited run passes `check-eval-run` with
   `findings=0 warnings=0`, or is cited as the failure record with the finding
   named and no rate taken from it.
3. **Every case has a classification** (`separator`, `non-discriminator`,
   `broken` or `unresolved`) or is `manual` with a written reason, and every red
   cell names the assertion or gate reason that failed. No repetition is rounded
   into a rate; `reps` and `passed` are the numbers.
4. **`docs/evals/write-implementation-prompt-matrix.md` is published** with the
   commands, the run directories, the table and the red cells, and the coverage
   row for this skill cites it.
5. **The skill stays required in its own arm.** `#5` loads
   `write-implementation-prompt` and `#6` does not, five draws each; no existing
   assertion is weakened and no case gains a pass without the skill.
6. **No behavior change.** `git diff main...HEAD -- skills/` contains only
   `skills/write-implementation-prompt/references/evals.md` (the case #3 prompt,
   or its `why:`), and the five policy gates pass.

## Results

Measured on `opencode-go/deepseek-v4.1-flash` (config default), no judge. The
with-skill cells are at `8e26cf6`; the control and trigger re-runs are at
`fff5b96`, which changed only this spec document. `fixtureHash`, `promptHash`,
`skillHash` and `detectorVersion` are identical across the two commits, so the
surface is the same; the matrix carries the hash table. All run directories live
under `~/.local/share/opencode/evals/runs/`. The published reading is
[`docs/evals/write-implementation-prompt-matrix.md`](../../evals/write-implementation-prompt-matrix.md).

**F0 — repro.** `node scripts/run-evals.mjs --root skills --list --check`
exits 0: 76 cases, 74 runnable, 2 manual. This skill is six cases, five
runnable, one manual — the same counts before and after the work, because #3
went back to `manual` (below).

**F1/F2 — case #3.** The case was given
`prompt: Create the implementation prompt for SPEC-0009.` and ran five draws:
`2026-11-06T14-01-54--write-implementation-prompt` **4/5**, gate 5/5,
`findings=0 warnings=0`. Four draws stopped and listed the open questions;
`r3` treated both as non-blocking, turned them into non-goals, and wrote
`docs/prompts/SPEC-0009-audit-log.prompt.md`, failing `nodir docs/prompts`.
Five draws did not produce a deterministic verdict, so the case is back to
`status: manual` with a `why:` naming that run and assertion. The fixture is
confirmed runnable and stages cleanly.

**Canary.** `2026-11-06T13-51-35--write-implementation-prompt`: **12/12**
passed, **12/12** skill-gate holds, `findings=0 warnings=0`. The eight-draw
`2026-11-06T13-46-05--write-implementation-prompt` is **discarded, not clean**:
`r8` read this spec's worktree under `.lane/trees/SPEC-0025-.../docs/`, which the
detector does not cover, so its `findings=0` says nothing. It is not a 12-draw
canary and is not used.

**Gate A — with skill (five draws each, no judge).**

| case | run directory | passed | gate |
| --- | --- | --- | --- |
| #1 | `2026-11-06T13-56-14--write-implementation-prompt` | 5/5 | 5/5 |
| #2 | `2026-11-06T13-59-48--write-implementation-prompt` | 5/5 | 5/5 |
| #3 | `2026-11-06T14-01-54--write-implementation-prompt` | 4/5 | 5/5 |
| #4 | `2026-11-06T14-04-25--write-implementation-prompt` | 5/5 | 5/5 |

All four pass `check-eval-run` with `findings=0 warnings=0`.

**Gate A — control (five draws each, no judge, no triggers).** Only #2 and #4
reach a clean five-draw run; #1 did not in three attempts.

| case | run directory | clean draws | passed clean | checker |
| --- | --- | --- | --- | --- |
| #1 | `2026-11-06T15-15-52--write-implementation-prompt--without-skill` | 3/5 | 0/3 | `findings=2` (leaks `r1`,`r3`) |
| #1 | `2026-11-06T15-18-26--write-implementation-prompt--without-skill` | 4/5 | 0/4 | `findings=1` (leak `r3`) |
| #1 | `2026-11-06T15-20-43--write-implementation-prompt--without-skill` | 3/5 | 0/3 | `findings=2` (leaks `r2`,`r5`) |
| #2 | `2026-11-06T15-25-06--write-implementation-prompt--without-skill` | 3/5 | 0/3 | `findings=2` (leaks `r3`,`r4`) |
| #2 | `2026-11-06T15-27-30--write-implementation-prompt--without-skill` | 3/5 | 0/3 | `findings=2` (leaks `r3`,`r4`) |
| #2 | `2026-11-06T15-30-39--write-implementation-prompt--without-skill` | **5/5** | **0/5** | `findings=0 warnings=0` |
| #3 | `2026-11-06T14-32-58--write-implementation-prompt--without-skill` | 4/5 | 0/4 | `findings=1` (leak `r3`) |
| #4 | `2026-11-06T14-37-23--write-implementation-prompt--without-skill` | **5/5** | **5/5** | `findings=0 warnings=0` |

No #1 attempt has five clean draws, so #1 is **unresolved**, not a separator.
Every clean #1 draw failed `filematch ... spec_sha:`. The #2 clean cell is
`15-30-39` (0/5, `nodir docs/prompts`).

**Triggers — skill arm only.** Three fresh attempts, no clean five-draw run for
#5; the numbers are per run, not stacked.

| run directory | #5 | #6 | checker |
| --- | --- | --- | --- |
| `2026-11-06T14-07-04--write-implementation-prompt` | 4/5, `r5` stalled | 3/5; `r1`,`r2` loaded | `findings=1` |
| `2026-11-06T14-43-01--write-implementation-prompt` | 2/5; `r1`,`r4` stalled, `r3` contaminated | 5/5 | `findings=3` |
| `2026-11-06T15-33-16--write-implementation-prompt` | 3/3 clean scored loaded; `r1` contaminated+stalled, `r4` contaminated | 5/5 | `findings=2` |
| `2026-11-06T15-49-43--write-implementation-prompt` | 3/3 clean scored loaded; `r1` stalled, `r3` contaminated | 3/5; `r1`,`r2` loaded | `findings=2` |
| `2026-11-06T16-02-56--write-implementation-prompt` | **3/3 clean scored loaded**; `r1`,`r2` contaminated | 4/5; `r2` loaded | `findings=2` |

The quoted #5 reading is `16-02-56`: 3/3 clean scored draws loaded, two
contaminated, no stall. The two earlier re-runs each lost one draw to a stall;
no #5 run reached five scored draws (#6 reached 5/5 in two runs). #6 is not
deterministic: 5/5, 3/5 and
4/5 in the three re-runs. In every failing #6 draw the **first action is the
`skill` call** — `14-07-04 r1` says "I'll load the skill first, then find the
spec"; `r2` says "this looks like a spec-related request"; `15-49-43 r2` says
"I'll load the skill that handles spec-to-prompt work, then find the spec." The
near-miss prompt itself routes to the skill; the earlier "filesystem search"
cause was wrong. The empty trigger scratch (`fixtureHash e3b0c442…`) has no
`SPEC-0012`, which is part of the case-construction defect.

**Classification.** #1 **unresolved** (four control attempts, no five clean
draws; clean subsets 0/3, 0/4, 0/3 and the older 0/4), #2 **separator** (5/5 vs
0/5 clean), #4 **non-discriminator** (5/5 vs 5/5), #3 **manual** (reverted with
a `why:` after the 4/5 split). Triggers are routing evidence, not rates.

**Budget.** 145 draws against the ~62 estimated, because cells were re-run: 20
canary (8 under the default stop rule, then 12 with `--stop 12/0`), 20 with-skill
Gate A, 50 triggers (five runs), and 55 control (four #1 attempts, five #2
attempts, one #3 and one #4, 11 runs × 5 draws). No single command exceeded its
planned repeat count; the overrun is re-runs, not longer cells.

**Gates.** All five pass: `validate-skills` (13 SKILL.md, all clear),
`--list --check` (exit 0, 76/74/2), `scripts/lib/evals/*.test.mjs` (252/252),
`skills/bootstrap-project-harness/scripts/*.test.mjs` (17/17), and
`check-sensor-parity` (2/2 fixtures). `git diff` under `skills/` touches only
`skills/write-implementation-prompt/references/evals.md` (the #3 `prompt:` and
`why:` lines).

## Open Questions

- **Does #3 belong in the matrix at all?** The fixture and the contract both
  support it; the risk is a sixth case that never separates because both arms
  stop. That is still a measurement, and `non-discriminator` is the honest
  label. Reverting to `manual` with a reason is the fallback, not the default.
- **What does a five-draw cell prove?** A direction, not a rate — the same
  reading `coverage.md` uses. The spec does not promote a case beyond
  `separator` on five draws; it does not claim stability across models.

## Prompt Notes

- **Requirements**: evidence for all six cases, five draws per arm, clean runs
  only, a published matrix and one coverage row.
- **Entities**: case number, arm (`with-skill`/`without-skill`), run directory,
  draw, assertion, gate reason, classification.
- **Approach**: canary → Gate A with the skill → Gate A control → checker → doc.
  Run the two arms on one measurement surface: `fixtureHash`, `promptHash`,
  `skillHash` and `detectorVersion` equal, with the assertion set unchanged; a
  `repoSha` that moved no measured case (docs and the manual #3 line are fine)
  is citable with that evidence.
- **Structure**: one new doc under `docs/evals/`; the case line in the skill's
  `references/evals.md`; one row in the inventory. Nothing under `scripts/`.
- **Operations**: the exact command per step is in `CONTRIBUTING.md > Measuring`;
  use `--root skills` so a third-party install never leaks warnings.
- **Norms**: internal prose in English, one sentence per cell, run directories in
  backticks, no spreadsheet numbers. The matrix says what the arms mean before
  it says what they scored.
- **Safeguards**: never edit an assertion to make a control pass; never cite a
  run the checker rejects as clean; never report a rate from fewer than five
  draws; stop and report before touching the skill's prose.
- **Tests**: the five gates are model-free. The measurement is evidence, not a
  gate: no number in the matrix fails CI, and the spec says so.
