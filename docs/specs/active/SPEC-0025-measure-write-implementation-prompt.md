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
classification — separator, non-discriminator or broken — or a written reason it
cannot be run. The coverage row cites that evidence, so a reader can tell what
the skill actually buys over not loading it.

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
2. **Five draws per arm on every behavioural case**, at one commit, each run
   directory cited; every cited run passes `check-eval-run` with
   `findings=0 warnings=0`, or is cited as the failure record with the finding
   named and no rate taken from it.
3. **Every case has a classification** (`separator`, `non-discriminator`,
   `broken`) and every red cell names the assertion or gate reason that failed.
   No repetition is rounded into a rate; `reps` and `passed` are the numbers.
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

_Filled during implementation._

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
  Run the two arms at the same commit; a control from an earlier commit is not
  citable.
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
