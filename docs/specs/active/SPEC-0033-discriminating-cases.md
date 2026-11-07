---
id: SPEC-0033
title: Publish three discriminating cases with a holdout
status: ready
priority: P1
task: TASK-51
created_at: 2026-11-07
updated_at: 2026-11-07
source_docs:
  - docs/evals/coverage.md
  - docs/evals/implement-from-prompt-matrix.md
  - docs/evals/review-code-matrix.md
related_decisions: []
depends_on:
  - SPEC-0031-remeasure-under-detector-v2
blocks: []
files:
  - skills/implement-from-prompt/references/evals.md
  - skills/review-code/references/evals.md
  - docs/evals/discriminating-cases.md
  - docs/evals/coverage.md
  - docs/evals/implement-from-prompt-matrix.md
  - docs/evals/review-code-matrix.md
  - docs/README.md
  - docs/specs/active/SPEC-0033-discriminating-cases.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0033-discriminating-cases.md --base main
---

# SPEC-0033: Publish three discriminating cases with a holdout

## Purpose

Issue #5 asks for three cases where the two arms can differ on a machine-checkable
assertion, measured with repetition, one of them held out. The 0.4.0 eight-case
run found one; the 0.5.0/0.6.0 waves added more, but the first three candidates
SPEC-0031 re-measured (`capture-idea` #1, `process-inbox` #1, `write` #2) stayed
`unresolved` because their controls still read the install.

This spec takes the three arms whose controls are replay-clean and measures them
at one detector: `review-code` #7 (the holdout), `implement-from-prompt` #1 and
`implement-from-prompt` #8. It publishes them as a set a consumer can pin by SHA.

## User Outcome

A consumer can point at three cases, run both arms three times each, and get a
consistent difference on a filesystem or gate assertion, with one case that was
never used to tune the change it measures.

## Scope

- **Freeze the holdout before the first draw.** The holdout is
  `review-code` #7 (red gate). It is named here, at this commit, before any new
  run; its result is read only to publish, never to choose the other two or to
  edit a skill.
- **Measure the three candidates with both arms** at detector v2, five draws
  each, on one model: `review-code` #7, `implement-from-prompt` #1 and
  `implement-from-prompt` #8. The default `opencode-go` route is exhausted, so
  the run names `agentworks/deepseek-v4-1-flash`; the model is recorded per run.
- **Fallback, in order, only if a control cannot reach five clean draws:**
  `record-decision` #2 (4/5 skill, 0/5 control) then `implement-from-prompt` #4
  (non-discriminator, kept as a regression). A candidate that fails is named
  with its clean count; the bar is not lowered.
- **Metadata.** For each selected case, `why:` states what the case measures and
  why the without-arm is expected to fail; `tags:` gains `separator`, and the
  holdout gains `holdout`. No prompt, fixture or assertion changes.
- **Publish** `docs/evals/discriminating-cases.md`: the three rows, both run
  directories, `fixtureHash`/`promptHash`/`skillHash`, detector, model, and the
  holdout. Update `coverage.md` and the two matrices.
- **Land at a commit.** The issue is answered with the merged SHA, not a release.

**Blast radius.** Two case metadata blocks, one new doc, three evidence docs, the
doc map, the spec, and the draws. No skill text, fixture, assertion, runner or
detector change.

## Non-Goals

- No new skill, no new case, no threshold or gate.
- No judge.
- No re-measurement of the SPEC-0031 cells; their result stands.
- No lowering of the five-clean-draw rule to make a candidate fit.

## Flow

1. **F0 — freeze**: record the holdout and the candidate list in this spec.
2. **F1 — measure**: six runs, five draws each, both arms, one model.
3. **F2 — check**: `check-eval-run` on every run; only a clean run supplies a
   verdict.
4. **F3 — select/classify**: separator, non-discriminator, unresolved; fallback
   in the named order.
5. **F4 — annotate/publish**: metadata, the new doc, coverage/matrices, Results.
6. **F5 — answer**: comment on issue #5 with the merged SHA and the three runs.

## Data

- `~/.local/share/opencode/evals/runs/` — the new runs.
- `skills/*/references/evals.md` — the metadata lines.
- `docs/evals/` — the published set and the updated rows.

## Acceptance Criteria

1. **The holdout was frozen before the first draw.** This spec names
   `review-code` #7 in commit `5fe56fc`; no new run predates the freeze.
2. **Three cases separate**, or the shortfall is published: each selected case
   has, in one run per arm, five draws with a consistent outcome, and the arms
   differ on a machine-checkable assertion. A case that cannot reach five clean
   draws is `unresolved` with the raw counts, and the fallback is used or the
   shortfall is stated.
3. **One of the three is the held-out case**, and the doc says which.
4. **The metadata states the measurement**: `why:` says what the case measures
   and why the without-arm fails; `tags:` marks `separator` and `holdout`.
5. **The publication is citable**: `docs/evals/discriminating-cases.md` lists
   both run directories per case, the detector, the model, and the hashes; every
   run has a `check-eval-run` line.
6. **No number is rewritten and no behaviour changes**: v1 rows stay as history;
   `git diff main...HEAD -- skills/` contains only `why:`/`tags:` lines.
7. **No drift.** Every command in `tests:` passes.

## Results

### F0 — the holdout, frozen before the first draw

`review-code` #7 was named the holdout in commit `5fe56fc` (this spec), before
any new run. The other two candidates were `implement-from-prompt` #1 and #8. No
result from #7 was used to choose them or to edit a skill.

### F1/F2 — the six runs

Measured at `a7cb10e`, detector v2 (`71bfb85a91cd68ab`), five draws per arm, on
`agentworks/deepseek-v4-1-flash` (the default `opencode-go` route was over its
weekly limit):

| case | arm | run directory | result | checker |
| --- | --- | --- | --- | --- |
| `implement-from-prompt` #1 | with skill | `2026-11-07T08-57-39--implement-from-prompt--agentworks-deepseek-v4-1-flash` | 5/5 | `findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes` |
| `implement-from-prompt` #1 | control | `2026-11-07T08-59-39--implement-from-prompt--agentworks-deepseek-v4-1-flash--without-skill` | 0/5 | `findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes` |
| `implement-from-prompt` #8 | with skill | `2026-11-07T09-01-25--implement-from-prompt--agentworks-deepseek-v4-1-flash` | 5/5 | `findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes` |
| `implement-from-prompt` #8 | control | `2026-11-07T09-04-41--implement-from-prompt--agentworks-deepseek-v4-1-flash--without-skill` | 0/5 | `findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes` |
| `review-code` #7 (holdout) | with skill | `2026-11-07T09-07-52--review-code--agentworks-deepseek-v4-1-flash` | 5/5 | `findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes` |
| `review-code` #7 (holdout) | control | `2026-11-07T09-11-14--review-code--agentworks-deepseek-v4-1-flash--without-skill` | 0/5 | `findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes` |

Budget: **30 draws**, exactly the six runs; no retry was needed and the cap was
not reached. No run read the install or the checkout.

### F3 — classification

All three are **separators**, on the assertion the control misses:

- `implement-from-prompt` #1: the control never marks
  `docs/specs/SPEC-0007-demo.md` `status: implemented` (0/5).
- `implement-from-prompt` #8: the control invents `src/format.js` (0/5).
- `review-code` #7: the control fails `verdict REJECT` in 0/5 — 3/5 approve
  despite the red gate, 2/5 name the gate but do not emit the token. That is a
  format-and-judgment separation on the assertion the case checks, not a uniform
  judgment difference; the doc says so.

The arms are consistent across their five reps, the difference is on a
filesystem or gate assertion, and one case is held out. That is the issue #5
shape.

### F4 — the publication

- `docs/evals/discriminating-cases.md` lists the three, both run directories, the
  hashes, the detector, the model and the holdout.
- Each case's `why:` now states what it measures and why the without-arm fails;
  `tags:` carries `separator` (and `holdout` on `review-code` #7). No prompt,
  fixture or assertion changed; the `git diff main...HEAD -- skills/` is four
  metadata lines.
- `coverage.md` and both matrices point at the new doc and the six runs.

### Limits

- Five draws show a direction, not a population rate.
- The model route differs from the 0.5.0 matrices; both arms of each case share
  it, so the separation is internal to this set. The earlier v1 rows stay as
  history and are not a delta.
- The case metadata is the only `skills/` change; `skillHash` is unchanged for
  each skill.
- `review-code` #7 is the weakest of the three: its control fails the token 5/5,
  but 2/5 of those failures recognize the red gate and only miss the output
  format. The two `implement-from-prompt` cases fail the same assertion in all
  five controls.
- A run `manifest.json` counts `passed`/`failed` per case; the five-draw
  numerator/denominator is in `cases/*/result.json` (`passed`/`reps`).

### Gates

Every command in `tests:` passes; see the report. `git diff main...HEAD --
skills/` contains only the two `references/evals.md` metadata blocks.


## Open Questions

- **Does the holdout rule survive a failed candidate?** Yes: a failed holdout is
  published as a failure; it is not swapped for another case after the fact.

## Prompt Notes

- **Requirements**: three separators, n≥5, one frozen holdout, metadata, a
  citable doc.
- **Entities**: case, arm, run directory, detector, model, holdout.
- **Approach**: freeze, measure all six runs, then classify; publish once.
- **Structure**: metadata lines and docs; no code.
- **Operations**: `--repeat 5` per arm, `--no-skill` for the control,
  `--root skills`, `--model agentworks/deepseek-v4-1-flash`.
- **Norms**: never pool clean draws across runs; never lower the five-draw rule;
  a dirty control is unresolved, not a separator.
- **Safeguards**: read the holdout's result only after the other two are
  classified; no skill edit in this spec.
- **Tests**: the gates are model-free; the draws are evidence.
