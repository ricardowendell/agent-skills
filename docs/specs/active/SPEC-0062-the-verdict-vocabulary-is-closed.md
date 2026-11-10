---
id: SPEC-0062
title: The verdict vocabulary is closed to valid forms
status: ready
priority: P1
task: TASK-91
created_at: 2026-11-10
updated_at: 2026-11-10
source_docs:
  - backlog/tasks/task-91 - evals-o-vocabulario-de-veredito-nao-reconhece-formas-valida.md
  - docs/evals/coverage.md
  - docs/specs/SPEC-0056-review-proportional-to-diff-risk.md
related_decisions: []
depends_on: []
blocks: []
files:
  - scripts/lib/evals/assertions.mjs
  - scripts/lib/evals/assertions.test.mjs
  - scripts/lib/evals/kinds.mjs
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0062-the-verdict-vocabulary-is-closed.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0062-the-verdict-vocabulary-is-closed.md --base main
---

## Purpose

The `verdict` assertion recognises a fixed list of stances. When the model writes
a valid stance in a form the list does not carry, the cell reads as a failure that
did not happen.

The SPEC-0056 wave published three of them:

| Case | Control arm, in prose | Scored |
| --- | --- | --- |
| #1 | approves 5/5 ("compliant — approve", "Passes SPEC-0007") | 0/5 |
| #8 | rejects 5/5 ("changes requested", "needs changes") | 0/5 |
| #9 | rejects 5/5 ("one blocking defect") | 3/5 |

In each case the classification was corrected in prose during review. The scores
were not: they still say the control missed a judgement it made. A reader who
looks at the table sees a separator on engineering judgement when the difference
is only the token.

## User Outcome

- A control that says "changes requested" scores as a rejection.
- The published rates describe judgement, not vocabulary.
- Re-judging is free: the stored transcripts are replayed, no draw is spent.

## Scope

### F1 — close the vocabulary

`assertions.mjs` maps a stance to a set of accepted forms instead of one literal.
At minimum: `approve`, `approve with nits`, `approve with should-fix`,
`reject`, `request changes`, `changes requested`, `needs changes`,
`blocking`, `do not merge`, and the Portuguese equivalents a reviewer may emit.

The mapping is a closed list, published in `kinds.mjs` next to the other
assertion vocabulary. A form that is not on the list stays a miss — the fix widens
the list, it does not accept anything that looks vaguely negative.

### F2 — re-judge, do not re-measure

Replay the stored runs for `review-code` #1, #8, #9, #10 with
`scripts/replay-evals.mjs` and publish before/after per cell. The historical rates
stay visible: the table gains a **replayed** column, and the original measured
column is not rewritten.

### F3 — say what the assertion measures

`docs/evals/coverage.md` gains one paragraph: the `verdict` assertion scores the
stance line, not the engineering judgement; a token/contract separator is not a
capability separator; the replay column is the judgement-corrected rate.

## Non-Goals

- **No new draw.** Every number here comes from replaying stored transcripts.
- No change to any skill text, case prompt or fixture.
- No change to `speccheck` or the spec contract.
- No rewriting of the SPEC-0056 Results; it records what was measured then.
- No `CHANGELOG.md` edit here: the entry lands in the wave's publication commit so
  this spec can run in parallel with SPEC-0059.

## Flow

1. **F1 — vocabulary.** Rewrite the stance matcher as an explicit form table with
   a test per form, including the near-misses that must stay misses.
2. **F2 — replay.** Re-judge the four cells; record the run directories and the
   before/after counts.
3. **F3 — publish.** The new column, the paragraph, and a Results section.

## Data

- `scripts/lib/evals/assertions.mjs` (the matcher) and `kinds.mjs` (the registry).
- The stored runs cited by `docs/evals/coverage.md`.
- `docs/evals/coverage.md` for the replayed column.

## Acceptance Criteria

1. The stance mapping is an explicit table in `kinds.mjs`; every accepted form has
   a test, in both languages.
2. A near-miss is still a miss: "not approved", "cannot approve", "no changes
   needed" and a sentence that merely contains "approve" must not score as their
   surface reading. Prove each with a test.
3. `reply`/`noreply` behaviour is unchanged; only `verdict` is affected.
4. Replaying `review-code` #1, #8, #9 and #10 reproduces the transcripts cited in
   `coverage.md` and yields the before/after counts published in Results.
5. The historical column is untouched: the published measured rates do not move.
6. The new paragraph states plainly that the assertion scores the stance line, not
   the judgement, and that the replayed column is the judgement-corrected rate.
7. `--list --check` still parses 97 cases; `check-evidence` and `check-staleness`
   exit 0 with their current counts.
8. Zero paid draws.
9. `CHANGELOG.md` is not in this spec's diff.

## Decisions

- **Widen the list, not the matcher.** A fuzzy "mentions approve/reject" rule would
  score "I cannot approve in good conscience" as an approval. The fix is a closed,
  tested table.
- **Replay, never re-measure.** The transcripts already contain the judgement; the
  only thing that was wrong is how it was read. A new draw would buy noise.
- **Do not rewrite SPEC-0056.** Its numbers were correct under the old vocabulary;
  the replayed column is the corrected reading of the same evidence.

## Open Questions

None.

## Prompt Notes

- Start from the four transcripts the review cited, not from the assertion code.
  The forms that matter are the ones the controls actually emitted.
- Keep the matcher pure and table-driven; the test file should read as the table.
- The Portuguese forms are not decoration: a reviewer writing in Portuguese is a
  real case in this repo's own history.

_Filled during implementation._
