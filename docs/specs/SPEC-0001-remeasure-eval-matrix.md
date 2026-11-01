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
  - node scripts/run-evals.mjs --tag matrix --repeat 3 --run
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

A reader of the README can see, per case and per model, how many repetitions
passed with the skill pinned and how many passed without it — and can re-run the
same measurement to get the same counts.

## Scope

- The four cases tagged `matrix` (`review-code` #1–#4), which are the only ones
  that already have a git fixture and a defined expected verdict.
- Two models: the config default and one comparison model.
- Two arms: `with-skill` (default) and `without-skill` (`--no-skill`).
- Three repetitions per cell, so a flake shows up as a pass rate instead of one
  draw: 4 cases × 2 models × 2 arms × 3 repetitions = 48 runs.
- Re-check that the Promptfoo path reports the same per-case counts, now that
  both front ends share `executeCase` (`b9c7534`).
- Replace the stale numbers in the README and in the eval plan artifact, and
  mark the old ones as pre-fix rather than deleting them silently.

**Blast radius.** One feature area: the eval measurement for `review-code`. It
regresses nothing at runtime, because it changes no skill. What it can invalidate
is the project's own claim that the skill changes the outcome, and the two
readers that trust it (README, plan artifact). No other spec depends on it.

## Non-Goals

- No new assertions, flags or runner features. The runner is frozen for this
  spec: a measurement task that changes the instrument measures nothing.
- No other skills. `review-code` is the only skill with a matrix fixture family;
  widening it to the other ten is a separate decision.
- No judge comparison. Semantic grading stays out of the matrix so that a
  difference between arms is attributable to the skill, not to a rubric. The
  self-judging caveat (judge model == model under test) is why.
- No nightly CI job. The behavioural suite stays opt-in and local.
- No change to how the control arm is described: `--no-skill` measures "not
  auto-loaded", not "text unreachable".

## Flow

1. Confirm both models are available and record their ids as resolved by the
   runner (`<id> (config default)` in the artifact).
2. Run the matrix with the skill, then the same matrix without it, three
   repetitions each, writing one artifact per run.
3. Extract a per-case table: case, model, arm, passed/total, and the assertion
   that failed when the cell is red.
4. Generate and run the Promptfoo config for the same four cases and arms, and
   compare per-case counts with the runner's artifact.
5. Update the README section that quotes the numbers, and the plan artifact,
   keeping the superseded figures visible with a "pre-fix" marker.
6. Sanity-check the transcripts from this run for any read of
   `references/evals.md`; the count must be zero.

## Data

No persistence beyond the existing artifacts:

- `~/.local/share/opencode/evals/last-run.json` — one summary per run.
- `~/.local/share/opencode/evals/<skill>/<n>.json` — per-case result, including
  `passRate`, `passed`, `reps` and the semantic verdict when a judge ran.
- `~/.local/share/opencode/evals/<skill>/<n>.r<i>.md` — one transcript per
  repetition, with the pinned skill hash.

## UI Notes

Not applicable: this spec has no user-facing surface.

## Acceptance Criteria

- AC-1 — The per-case results for all four cells exist under
  `~/.local/share/opencode/evals/<skill>[--<model>][--without-skill]/<n>.json`
  — 16 files — each with `reps: 3`, `passed`, `passRate` and the resolved model
  id. Verified by reading them.
- AC-2 — A table in the README reports, per case and model, the with-skill and
  without-skill pass counts, and the aggregate for each arm. Verified by
  inspection.
- AC-3 — A fresh run of the documented command produces the same pass count in
  every cell. If a cell moves, the new count is reported rather than explained
  away. Verified by running it.
- AC-4 — The Promptfoo run over the same four cases and two arms reports the
  same per-case pass counts as the runner artifact. Verified by comparing the
  two artifacts.
- AC-5 — Zero transcripts from this run contain a read of `references/evals.md`.
  Verified by searching the transcripts directory.
- AC-6 — The README keeps the superseded table, with the "measured before
  `c876d88`; the agent could read the eval corpus; do not cite" marker in the
  table's caption so it travels with a copy. Verified by inspection.

**Security.** No user data, no persistence, no rendering of generated content.
The transcripts contain agent output written to a local directory that already
holds every earlier run.

## Open Questions

None blocking. Three questions were open at grooming and were answered on
2026-11-01:

- **Comparison model** — `opencode-go/gpt-6-luna`, confirmed available. It is
  the only model that appears in the retracted numbers, so holding it fixed
  isolates the answer-key fix as the variable under test.
- **AC-6 scope** — README only. The plan artifacts under `~/.opencode/plan/` sit
  outside the repository and are not versioned; a criterion about them could not
  be verified by anyone reading the repo.
- **Superseded table** — kept verbatim with the marker in the caption. The delta
  against the new table is the evidence that the leak distorted the measurement,
  and a caption travels with a copied table.

## Prompt Notes

- Requirements: the measurement must not change the instrument. If a case looks
  wrong mid-run, record it and finish the run; do not fix it inside this task.
- Entities: case (`review-code` #1–#4), arm (`with-skill`, `without-skill`),
  model id, repetition, pass rate, artifact path, transcript path.
- Approach: run the two arms as separate invocations so each artifact is
  attributable, then join the tables by case and arm.
- Structure: `scripts/run-evals.mjs` for the runs, `scripts/emit-promptfoo.mjs`
  plus `scripts/promptfoo/provider.mjs` for parity, `scripts/replay-evals.mjs`
  to re-check any assertion that moves.
- Operations: run, extract, compare, write the table, mark the old numbers.
- Norms: English docs; numbers carry the command that produced them; a flake is
  reported as a rate, never rounded to a pass.
- Safeguards: no new dependencies, no CI job, no change to `--no-skill`
  semantics, no assertion changes to make a cell green.
- Tests: AC-1..AC-6 above; AC-3 is the reproduction test, AC-5 the integrity
  test.

## Notes

This repository has no `docs/product`, `docs/principles` or ADR tree, so the
design-principles and voice checks in the grooming workflow have no source to
check against. That gap is recorded here instead of being filled with invented
product direction. If this repo grows a `docs/` skeleton, this note should be
replaced by real checks.
