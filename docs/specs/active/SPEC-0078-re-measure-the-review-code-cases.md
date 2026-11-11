---
id: SPEC-0078
title: Re-measure the review-code cases the hash moved under
status: ready
priority: P1
task: TASK-92
created_at: 2026-11-11
updated_at: 2026-11-11
source_docs:
  - backlog/tasks/task-92 - evals-re-medir-os-casos-3-6-do-review-code-no-skillHash-atual.md
  - docs/specs/SPEC-0056-review-code-cases.md
  - docs/evals/review-code-matrix.md
related_decisions: []
depends_on: []
blocks: []
files:
  - docs/evals/coverage.md
  - docs/evals/review-code-matrix.md
  - docs/specs/active/SPEC-0078-re-measure-the-review-code-cases.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0078-re-measure-the-review-code-cases.md --base main
---

## Purpose

`SPEC-0056` changed `review-code`'s `SKILL.md` and re-measured cases 8–10 and the
regressions 1, 2 and 7. Cases **3, 4, 5 and 6** were left at their historical
evidence: they were never drawn at the current tree hash (`9a28572…`), and the
published cells predate the skill edit.

Everything measured since then used an instrument that has changed four times
(`ranpass` by effect, isolation per draw, deterministic tree hash, stance by last
clause). This is the first re-measurement that runs on an oracle worth trusting,
and it is the last big spend on the board.

## User Outcome

- Cases 3–6 have cells measured at the current `skillHash`, with both arms where
  the arm means something.
- The published `review-code` row says which cells are measured and at which
  hash, instead of citing history as if it were current.
- The spend is declared, counted draw by draw, and stops at a stated ceiling.

## Scope

### F1 — what is drawn, and why the trigger controls are not

**Behavioural cases 3 and 4**, both arms, five draws each — **20 draws**:

```
node scripts/eval.mjs run review-code 3 --arm with    --repeat 5 --model agentworks/deepseek-v4-1-flash
node scripts/eval.mjs run review-code 3 --arm without --repeat 5 --model agentworks/deepseek-v4-1-flash
node scripts/eval.mjs run review-code 4 --arm with    --repeat 5 --model agentworks/deepseek-v4-1-flash
node scripts/eval.mjs run review-code 4 --arm without --repeat 5 --model agentworks/deepseek-v4-1-flash
```

**Trigger cases 5 and 6**, `--arm with` only, five draws each — **10 draws**:

```
node scripts/eval.mjs run review-code 5 --arm with --repeat 5 --model agentworks/deepseek-v4-1-flash
node scripts/eval.mjs run review-code 6 --arm with --repeat 5 --model agentworks/deepseek-v4-1-flash
```

Case 5 asserts `skill review-code`; case 6 asserts `notskill review-code`. A
control run stages no skill at all, so case 5's control fails by construction and
case 6's passes by construction: the ten draws would buy no information. This is
the one place the task's 4 × 2 × 5 arithmetic is reduced, and it is recorded.

**Target: 30 draws. Ceiling: 40.** The remaining 10 are reserved for re-running
draws the harness discarded (stalls, provider aborts) — never for redrawing a cell
to get a greener number.

### F2 — classify

- **separator** — the arms differ on the judgement.
- **non-discriminator** — they agree, including both pass.
- **unresolved** — a cell cannot reach five clean draws, or the arm never
  exercised the thing under test.

Case 3 is the hard one: its control has historically reached 2/3, 4/10 and then
0/3 across three generations of the guard, so a 5/5 vs 4/5 result is not a
separator and must not be published as one.

### F3 — publish before/after

- `docs/evals/coverage.md`, the `review-code` row: for each of 3–6, the run dir,
  clean draws, passed, class, `skillHash`, model, and `isolated=`.
- `docs/evals/review-code-matrix.md`: the four cases' rows updated to the new
  cells, with the historical rows kept as history (marked), not deleted.
- The spec's `## Results`: the before/after table, the class per case, the red
  assertion per red cell, the spend per draw, and the list of cells that remain
  historical.

## Non-Goals

- **No `#1`, `#2`, `#7`–`#10`.** They were re-measured under `SPEC-0056` and are
  not in this budget.
- **No case, prompt, fixture, assertion or gate change.** If a case cannot
  discriminate, that is a finding about the case, published as such.
- **No `stallMs` change.** A stall is resumed once; the re-run counts against the
  ceiling.
- **No claim of a separator where the arms agree.**
- **No draw outside the 30 measured cells.**

## Flow

1. **F1** — the six runs, in the order above; record each run dir as it prints.
2. **F2** — classify from the stored `result.json` files.
3. **F3** — publish; every cited run passes `check-eval-run`.

## Data

- `evals/review-code/cases.md` — cases 3–6, with their `why:` and assertions.
- `docs/evals/review-code-matrix.md` — the current rows to update.
- `docs/evals/coverage.md:19` — the `review-code` row.
- Historical runs cited there: `2026-11-01T22-02-37`, `2026-11-02T20-34-11`,
  `2026-11-07T15-46-26`, `2026-11-10T15-*` (the `SPEC-0056` wave).

## Acceptance Criteria

1. Exactly six runs: 3 and 4 both arms, 5 and 6 with-skill, five draws each.
2. Total paid draws ≤ 40; the target is 30 and any excess is a discarded-draw
   re-run, named with its reason.
3. Every cited run has a run dir, `skillHash`, model and `isolated=` published,
   and passes `check-eval-run`.
4. Each of the four cases has a class from F2, with the red assertion named per
   red cell.
5. A case whose arms agree is published as a non-discriminator even if the skill
   arm looks better; a 5/5 vs 4/5 is not called a separator.
6. The historical rows in the matrix survive as history, marked.
7. No case, prompt, fixture, assertion or gate changed; `stallMs` unchanged.
8. Every command in `tests:` exits 0.

## Decisions

- **Skip the trigger controls.** A control stages no skill, so `skill review-code`
  fails and `notskill review-code` passes by construction. Ten draws for a
  tautology is not a measurement.
- **The ceiling is for discarded draws, not for better numbers.** A stall is
  infrastructure: it is re-run once, and if the ceiling is reached the cell
  publishes at its clean count with the missing draw named.
- **Re-measure now, because the oracle changed.** Publishing new numbers under an
  instrument that scored the string would have been worse than the history it
  replaces.

## Open Questions

None.

## Prompt Notes

- `--model agentworks/deepseek-v4-1-flash` on every run; the config default is
  another provider and a cell must not mix them.
- Record the run dir the CLI prints, verbatim, and `check-eval-run` it before
  citing.
- Do not read the transcripts to tune anything. Read them to publish the routing
  and red assertions, and stop there.
- If a draw stalls post-load, `--resume` once; that re-runs only the discarded
  slot and counts as a draw.

## Results

_Filled during implementation._
