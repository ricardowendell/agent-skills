---
id: SPEC-0073
title: The stance is the last clause, and a comma is a clause
status: ready
priority: P3
task: TASK-97
created_at: 2026-11-11
updated_at: 2026-11-11
source_docs:
  - backlog/tasks/task-97 - evals-fixar-o-trade-do-reject-vins-e-a-fronteira-de-virgula-no-verdict-SPEC-0062.md
  - docs/specs/SPEC-0062-the-verdict-vocabulary-is-closed.md
related_decisions: []
depends_on:
  - SPEC-0072-say-what-the-evidence-says
blocks: []
files:
  - scripts/lib/evals/assertions.mjs
  - scripts/lib/evals/assertions.test.mjs
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0073-the-stance-is-the-last-clause.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0073-the-stance-is-the-last-clause.md --base main
---

## Purpose

Two latent residues in the verdict matcher, found by the `SPEC-0062` review, both
under-scoring and neither observed in the store (0 of 315 draws move):

1. **REJECT beats APPROVE across clauses.** `stance()`
   (`scripts/lib/evals/assertions.mjs:74-90`) collects every form in the line and
   returns `REJECT` before `APPROVE`, whatever the order. So
   `reject the alternative; approve the change` reads **REJECT** — the line
   approves the change and rejects something else.
2. **A comma is not a clause.** `CLAUSE_BOUNDARIES` is `[".", ";", ":", "—", "–"]`
   (`:53`), so a negator from one comma-separated clause blocks a stance in the
   next: `AC-2 is not implemented, changes requested` scores **nothing**, and the
   line is reported by its first word.

The store has no instance of either shape, so this is a correctness fix with a
regression test each, and a replay to prove nothing else moved.

## User Outcome

- A verdict line's stance is the stance its **final clause** states; within one
  clause a rejection still wins.
- A comma ends a clause, so a negator cannot reach across it.
- The 17 draws re-judged under `SPEC-0062` keep their verdicts.

## Scope

### F1 — the last clause that names a stance wins

Replace the whole-line precedence with: walk the line's clauses in order; the
stance is taken from the **last** clause that contains at least one unblocked
form; within that clause the existing order holds (`REJECT` > `WITHHELD` >
`APPROVE`). No unblocked form anywhere keeps today's behaviour (first word, upper
case).

This must preserve, byte for byte, the shapes `SPEC-0062` fixed:

- `Approve the tests; reject the change` → **REJECT** (last clause);
- `approved, but do not merge` → **REJECT** (`do not merge` is a form; with the
  comma now a boundary it sits in the final clause);
- `The verdict is APPROVE. Notes: AC-2 is not implemented.` → **APPROVE**
  (the last clause has no unblocked form, so the last stance-bearing clause is
  the first);
- `unable to approve` → no stance (blocked, single clause).

### F2 — a comma ends a clause

Add `","` to `CLAUSE_BOUNDARIES`. Consequence to state in the comment: a negator
before a comma no longer reaches the next clause, which is the point; a negator
after it still applies to its own clause.

### F3 — tests

In `assertions.test.mjs`, one test per shape:

- `reject the alternative; approve the change` → **APPROVE**;
- `Approve the tests; reject the change` → **REJECT** (kept);
- `approved, but do not merge` → **REJECT** (kept);
- `AC-2 is not implemented, changes requested` → **REJECT**;
- `AC-2 is not implemented, and not approved` → no stance (blocked in its own
  clause);
- the four `SPEC-0062` shapes above, unchanged.

A `verdict` assertion, not a `stance()` call: the case measures the assertion's
verdict, so test through `evaluateAssertions`.

### F4 — replay proves the corpus did not move

Re-run the `SPEC-0062` replay over the same stored runs it lists (the 17 draws
that moved then) and confirm the same 17 move, with the same verdicts. If any
other draw changes, stop: a matcher change that moves a stored verdict is a
corpus event, not a fix, and the spec must be re-scoped before it lands.

Publish the replay table in `## Results` and one line in `docs/evals/coverage.md`
next to the verdict vocabulary note: the two shapes are covered by test and have
no store instance.

## Non-Goals

- **No new form, blocker or locution.** `VERDICT_FORMS` and `VERDICT_BLOCKERS` are
  `SPEC-0062` ground.
- **No change to `skillGate`, `reply` or `filematch`.**
- **No re-scoring.** If a stored draw moves, that is a finding, not a fix.
- **No paid draw.** The replay is `inspect --replay` over stored runs.

## Flow

1. **F1/F2** — the two edits, with the doc comment updated to the new rule.
2. **F3** — the tests, through `evaluateAssertions`.
3. **F4** — the replay and the published line.

## Data

- `scripts/lib/evals/assertions.mjs:53` (`CLAUSE_BOUNDARIES`), `:69-90`
  (`blockedBefore`, `stance`).
- `scripts/lib/evals/assertions.test.mjs` — the verdict tests from `SPEC-0062`.
- `docs/specs/SPEC-0062-the-verdict-vocabulary-is-closed.md` — the 17 draws and
  the runs they came from.

## Acceptance Criteria

1. `reject the alternative; approve the change` reads APPROVE;
   `Approve the tests; reject the change` still reads REJECT.
2. `approved, but do not merge` still reads REJECT.
3. `AC-2 is not implemented, changes requested` reads REJECT; a negator in its
   own clause still blocks (`AC-2 is not implemented, and not approved` → no
   stance).
4. Every `SPEC-0062` test passes unchanged; the four shapes in F1 are pinned by
   their own tests.
5. The replay moves exactly the 17 draws `SPEC-0062` moved, with the same
   verdicts; the table is published.
6. No stored draw is re-scored and no class changes.
7. Zero paid draws; every command in `tests:` exits 0.

## Decisions

- **Last clause wins, not first form.** A verdict line ends with its conclusion;
  reading the first form lets a rejected alternative masquerade as the verdict.
  The `SPEC-0062` shapes survive because in each of them the decisive form is in
  the final clause.
- **Within a clause, rejection keeps its precedence.** `approved, but do not
  merge` is one or two clauses depending on the punctuation; either way the
  rejection is the later, decisive half.
- **The two shapes have no store instance, and that is stated.** A matcher change
  with a replay behind it is still a change; the corpus says which evidence it
  has.

## Open Questions

None.

## Prompt Notes

- Keep `stance()` a pure function of the line; do not reach into the reply.
- Clauses are cut at `. ; : , — –`; do not add newlines as boundaries unless the
  line already contained one (the caller passes a single line).
- The replay is `node scripts/eval.mjs inspect <run-dir> --replay`; delete nothing
  in the store.

## Results

_Filled during implementation._
