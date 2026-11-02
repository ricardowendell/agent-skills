---
id: SPEC-0001
title: Re-measure the skill matrix after the answer-key fix
status: ready
priority: P0
created_at: 2026-11-01
updated_at: 2026-11-01
source_docs:
  - README.md
  - backlog/tasks/task-4 - eval-re-medir-a-matriz-2x2-depois-do-fix-do-gabarito.md
related_decisions: []
depends_on: []
blocks: []
tests:
  - node scripts/run-evals.mjs --tag matrix --repeat 5 --run
  - node scripts/run-evals.mjs --tag matrix --repeat 5 --no-skill --run
  - node scripts/replay-evals.mjs --quiet
---

# SPEC-0001: Re-measure the skill matrix after the answer-key fix

## Purpose

Every matrix number published so far was produced while the agent under review
could read `references/evals.md` — the case's prompt, expectations and
assertions — inside its own scratch directory. Staging stopped copying that file
in `c876d88`, and the first case re-measured afterwards moved from 3/3 to 0/3.
The published comparison ("the skill changes the outcome") therefore rests on
numbers that include runs which had the answer key.

This spec produces one uncontaminated comparison that someone else can reproduce
with two commands.

## User Outcome

A reader of `docs/evals/review-code-matrix.md` can see, per model and per arm,
how many of the four matrix cases passed across five repetitions, which assertion
failed in each red cell, and can re-run the same measurement with the commands the
document records. The README links to it instead of carrying the numbers.

## Scope

- The four cases tagged `matrix` (`review-code` #1–#4), which are the only ones
  that already have a git fixture and a defined expected verdict.
- Two models: the config default and `opencode-go/gpt-6-luna`.
- Two arms: `with-skill` (default) and `without-skill` (`--no-skill`).
- **Five** repetitions per cell: 4 cases × 2 models × 2 arms × 5 = 80 runs. The
  reading is an aggregate per arm, not a verdict per case — the same arm has
  already produced 2/3 and 3/3 on the same case, so three repetitions cannot
  separate a flake from a difference.
- Each invocation writes its own run directory (`runs/<id>/manifest.json` plus
  `cases/<skill>--<n>/result.json`), so no cell can read an earlier execution's
  green. A failed staging records a failed result instead of leaving the old one.
- Publish the table in `docs/evals/review-code-matrix.md`; the README gains a
  pointer and the command, not the numbers.
- Path parity, not measurement parity: `review-code` #3 in both arms, three
  repetitions each, must classify the same way in Promptfoo and in the runner.
  Comparing twelve cells across two independent batches would test the agent's
  consistency, not the adapter's correctness.

**Blast radius.** One feature area: the eval measurement for `review-code`. It
regresses nothing at runtime, because it changes no skill. What it can invalidate
is the project's own claim that the skill changes the outcome, plus the README
and the eval plan artifact that repeat that claim. No other spec depends on it.

## Non-Goals

- No new assertions, flags or runner features. The runner is frozen for this
  spec: a measurement task that changes the instrument measures nothing.
- No other skills. `review-code` is the only skill with a matrix fixture family;
  widening it to the other ten is a separate decision.
- No judge in the matrix. Semantic grading stays out so that a difference between
  arms is attributable to the skill, not to a rubric — and the default model
  judging itself would make the two arms incomparable.
- No per-case verdict in the document. A cell that reads 4/5 is reported as a
  rate; it is not promoted to "the case passes".
- No table in the README.
- No nightly CI job. The behavioural suite stays opt-in and local.
- No change to how the control arm is described: `--no-skill` measures "not
  auto-loaded", not "text unreachable".

## Flow

1. Confirm both models resolve and record their exact ids before running.
2. Start four separate invocations, one per cell, so each gets its own run
   directory and its manifest says which model and arm it covered.
3. Run the four cells, five repetitions each.
4. Collect the 16 per-case results across the four run directories and check
   `reps: 5` and that `meta.model` matches the run's manifest.
5. Read each red cell's `reason` and attribute it to the assertion that failed.
6. Run the parity smoke: `review-code` #3, two arms, three repetitions, through
   Promptfoo, and compare its classification with the runner's.
7. Search the new transcripts for any read of `references/evals.md`; the count
   must be zero.
8. Write `docs/evals/review-code-matrix.md`, add the pointer to the README, and
   set the spec to `implemented` with `tests:` filled.

## Data

No persistence beyond existing artifacts:

- `~/.local/share/opencode/evals/runs/<id>/manifest.json` — model, arm, level,
  repo sha, the pinned skill hash per case, and the run's counts.
- `…/runs/<id>/cases/<skill>--<n>/result.json` — per-case result with `reps`,
  `passed`, `passRate`, `reason`, `meta.model`.
- `…/runs/<id>/cases/<skill>--<n>/transcript.r<i>.md` — one transcript per
  repetition, carrying the pinned skill hash.
- `docs/evals/review-code-matrix.md` — the published table and its commands.

## UI Notes

Not applicable: this spec has no user-facing surface.

## Acceptance Criteria

- AC-1 — Four run directories exist for this matrix, each with a `manifest.json`
  naming its model and arm, and 16 `result.json` files in total (4 cases × 4
  runs), each with `reps: 5`, `passed`, `passRate` and a `meta.model` that matches
  its manifest. Verified by reading them.
- AC-2 — `docs/evals/review-code-matrix.md` reports, per model, the four cases
  per arm with `passed/5`, plus an aggregate per arm, plus which assertion failed
  in every red cell. Verified by inspection.
- AC-3 — Re-running one cell lands within one repetition of the document's
  count (a `4/5` cell may re-run as `3/5`). Both numbers are written and the
  document states the observed spread; a difference larger than one repetition
  is investigated rather than averaged away. Verified by running it.
- AC-4 — The parity smoke (`review-code` #3, two arms, three repetitions through
  Promptfoo) classifies every run the same way the runner does. A difference is a
  defect in the path, not noise to tolerate. Verified by comparing both outputs.
- AC-5 — Zero transcripts from this run contain a read of `references/evals.md`.
  Verified by searching the four cell directories.
- AC-6 — The document records the measurement date, both model ids, the
  repetition count and the exact commands, and states that figures measured
  before `c876d88` are not comparable because the agent could read the eval
  corpus. The README links to the document. Verified by inspection.

## Open Questions

None blocking. Decisions taken before implementation, on 2026-11-01:

- **Where the table lives** — `docs/evals/review-code-matrix.md`, linked from the
  README. The README had no matrix numbers to replace, and a measurement that
  changes per model does not belong inside usage documentation.
- **What the table claims** — an aggregate per arm over five repetitions, with
  the failure reason recorded per red cell. A per-case verdict would need far
  more repetitions than this repository is willing to pay for.
- **Stale artifacts** — the four cell directories are deleted before each run.
  Fixing the runner to also write the JSON on a staging failure is the better
  long-term answer and is deliberately not part of a measurement task.
- **Parity** — narrowed from twelve cells to one case in both arms, because
  comparing two independent batches across twelve cells measures the agent, not
  the adapter.
- **Comparison model** — `opencode-go/gpt-6-luna`, confirmed available and the
  only model present in the retracted figures, so it stays fixed.
- **Superseded numbers** — the README never carried them; the plan artifact that
  did is outside the repository and out of scope. The new document states the
  date, the models and the repetition count, which is what lets a reader date a
  figure without trusting a file they cannot see.

## Prompt Notes

- Requirements: the measurement must not change the instrument. If a case looks
  wrong mid-run, record it and finish the run; do not fix it inside this task.
- Entities: case (`review-code` #1–#4), arm (`with-skill`, `without-skill`),
  model id, repetition, pass rate, artifact path, transcript path.
- Approach: run the two arms as separate invocations so each artifact is
  attributable, then join the tables by case and arm.
- Structure: `scripts/run-evals.mjs` for the runs, `scripts/emit-promptfoo.mjs`
  plus `scripts/promptfoo/provider.mjs` for the parity smoke,
  `scripts/replay-evals.mjs` to re-check any assertion that moves.
- Operations: clear the cells, run, extract, attribute failures, run the parity
  smoke, check integrity, write the document.
- Norms: English docs; numbers carry the command that produced them; a flake is
  reported as a rate, never rounded to a pass.
- Safeguards: no new dependencies, no CI job, no change to `--no-skill`
  semantics, no assertion changes to make a cell green, no stale artifact
  counted as evidence.
- Tests: AC-1..AC-6 above; AC-3 is the reproduction test, AC-5 the integrity
  test.

## Notes

This repository has no `docs/product`, `docs/principles` or ADR tree, so the
design-principles and voice checks in the grooming workflow have no source to
check against. That gap is recorded here instead of being filled with invented
product direction. If this repo grows a `docs/` skeleton, this note should be
replaced by real checks.
