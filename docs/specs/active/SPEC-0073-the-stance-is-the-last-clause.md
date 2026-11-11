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
depends_on: []
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

**F1/F2 — the rule.** `stance()` now walks the line's clauses and takes the
stance from the **last clause that contains at least one unblocked form**; within
that clause the precedence is `REJECT` > `WITHHELD` > `APPROVE`. A clause with no
unblocked form does not erase the one before it, so
`The verdict is APPROVE. Notes: AC-2 is not implemented.` stays **APPROVE**; no
unblocked form anywhere still falls back to the line's first word, so
`unable to approve` names no stance. `","` was added to `CLAUSE_BOUNDARIES`:
a negator cannot reach across a comma, while one inside the stance's own clause
still blocks it. `reject the alternative; approve the change` now reads
**APPROVE**; `AC-2 is not implemented, changes requested` reads **REJECT**;
`AC-2 is not implemented, and not approved` names no stance.

A comma does not reset `if`, `unless` and `whether`. Those introduce a clause
whose consequent follows the comma, so `If the tests were fixed, approve` and
`Unless the export change is removed, approve` stay promises, not stances: they
are read against the wider sentence clause (`CONDITION_BOUNDARIES`), while every
other blocker resets at the comma. No form, blocker or locution was added;
`kinds.mjs` is untouched and `VERDICT_FORMS` / `VERDICT_BLOCKERS` keep their
SPEC-0062 contents. Its comment at `kinds.mjs:99-101` still calls the comma "not"
a clause boundary; that is now true only for the three conditionals, and it is
left for a spec that owns that file.

The four SPEC-0062 shapes are preserved byte for byte:
`Approve the tests; reject the change` → **REJECT**;
`approved, but do not merge` → **REJECT**;
`The verdict is APPROVE. Notes: AC-2 is not implemented.` → **APPROVE**;
`unable to approve` → no stance.

**F3 — tests, through `evaluateAssertions`.** Six new cases in
`scripts/lib/evals/assertions.test.mjs`, each reading the assertion's verdict (not
`stance()` directly):

- "the last clause that names a stance wins, not the first" —
  `reject the alternative; approve the change` → **APPROVE**;
- "`Approve the tests; reject the change` still reads REJECT";
- "`approved, but do not merge` still reads REJECT";
- "`The verdict is APPROVE. Notes: AC-2 is not implemented.` still reads APPROVE";
- "`unable to approve` still names no stance";
- "a negator does not reach across a comma" —
  `AC-2 is not implemented, changes requested` → **REJECT**;
  `AC-2 is not implemented, and not approved` → no stance.

No existing test was edited. The two conditional shapes above remain in the
SPEC-0062 lists ("a negated form is not its surface reading" and "every published
blocker fires in a grammatical sentence"), and they still pass.

**F4 — replay, no draw.** Two comparisons over every stored transcript that
carries a `verdict` assertion, using the case definitions in `evals/`:

| reader | verdict-bearing transcripts | `verdict` passing |
| --- | --- | --- |
| pre-SPEC-0062 (`827b843`, the commit before the vocabulary landed) | 316 | 229 |
| `HEAD` (this branch before the change) | 316 | 246 |
| this branch | 316 | 246 |

Pre-SPEC-0062 → this branch moves **17 draws, all `false → true`**, the same 17
SPEC-0062 published; `HEAD` → this branch moves **0**. So the corpus did not
move: neither shape has a store instance, and no stored draw is re-scored. The
store now yields 316 verdict-bearing transcripts; SPEC-0062 measured 315 at its
writing. The pass counts (229 and 246) and the moved set reproduce exactly.

| cell | run directory | draw | verdict | before | after | moved? |
| --- | --- | --- | --- | --- | --- | --- |
| `review-code`#4 | `2026-11-01T22-02-37--matrix--without-skill` | r3 | REJECT | fail | pass | yes |
| `review-code`#4 | `2026-11-02T20-34-11--matrix--without-skill` | r2 | REJECT | fail | pass | yes |
| `review-code`#1 | `2026-11-07T15-42-21--review-code--agentworks-deepseek-v4-1-flash--without-skill` | r1 | APPROVE | fail | pass | yes |
| `review-code`#1 | `2026-11-07T15-42-21--review-code--agentworks-deepseek-v4-1-flash--without-skill` | r2 | APPROVE | fail | pass | yes |
| `review-code`#2 | `2026-11-07T15-46-26--review-code--agentworks-deepseek-v4-1-flash--without-skill` | r3 | REJECT | fail | pass | yes |
| `review-code`#8 | `2026-11-10T15-05-54--review-code--agentworks-deepseek-v4-1-flash--without-skill` | r1 | REJECT | fail | pass | yes |
| `review-code`#8 | `2026-11-10T15-05-54--review-code--agentworks-deepseek-v4-1-flash--without-skill` | r2 | REJECT | fail | pass | yes |
| `review-code`#8 | `2026-11-10T15-05-54--review-code--agentworks-deepseek-v4-1-flash--without-skill` | r3 | REJECT | fail | pass | yes |
| `review-code`#8 | `2026-11-10T15-05-54--review-code--agentworks-deepseek-v4-1-flash--without-skill` | r4 | REJECT | fail | pass | yes |
| `review-code`#8 | `2026-11-10T15-05-54--review-code--agentworks-deepseek-v4-1-flash--without-skill` | r5 | REJECT | fail | pass | yes |
| `review-code`#9 | `2026-11-10T15-12-14--review-code--agentworks-deepseek-v4-1-flash--without-skill` | r4 | REJECT | fail | pass | yes |
| `review-code`#1 | `2026-11-10T15-23-10--review-code--agentworks-deepseek-v4-1-flash--without-skill` | r1 | APPROVE | fail | pass | yes |
| `review-code`#1 | `2026-11-10T15-23-10--review-code--agentworks-deepseek-v4-1-flash--without-skill` | r4 | APPROVE | fail | pass | yes |
| `review-code`#2 | `2026-11-10T15-28-46--review-code--agentworks-deepseek-v4-1-flash--without-skill` | r5 | REJECT | fail | pass | yes |
| `review-code`#10 | `2026-11-10T15-54-47--review-code--agentworks-deepseek-v4-1-flash--without-skill` | r2 | APPROVE | fail | pass | yes |
| `review-code`#10 | `2026-11-10T15-54-47--review-code--agentworks-deepseek-v4-1-flash--without-skill` | r3 | APPROVE | fail | pass | yes |
| `review-code`#10 | `2026-11-10T15-54-47--review-code--agentworks-deepseek-v4-1-flash--without-skill` | r5 | APPROVE | fail | pass | yes |

The nine run directories cited in the table also replay through the CLI:
`node scripts/eval.mjs inspect <the nine dirs> --replay` → **66 transcripts,
13 differing statuses: 11 `failed -> passed`, 2 `passed -> failed`**. The eleven
are the five #8 control draws, #9 control r4, and five #2 draws — three in
`2026-11-01T22-02-37` (r1/r3/r5, not among the 17 verdict moves) plus
`2026-11-07T15-46-26` r3 and `2026-11-10T15-28-46` r5. The two `passed -> failed`
rows are `review-code`#3 r1 in `2026-11-01T22-02-37` and `2026-11-02T20-34-11`,
failing the same `reply`/`noreply` assertions. Replaying the same nine
directories with `main`'s `scripts/` prints a byte-identical output (diff empty),
so all thirteen are pre-existing recorded-status drift this branch inherits, not
a change it makes; the branch-vs-`HEAD` verdict comparison above is 0. Scoping
the command to `2026-11-10T15-05-54` and `2026-11-10T15-12-14` replays 10
transcripts and prints exactly those six `failed -> passed` moves (the five #8
draws and #9 r4).

Of the 17 moved verdict draws, eight now replay the whole case as `passed`: the
five #8 draws, #9 r4, `#2` in `2026-11-07T15-46-26` r3 and `#2` in
`2026-11-10T15-28-46` r5. The other nine were recorded red and still replay red:
the four `#1` draws and the three `#10` draws on `reply Not verified`, and the two
legacy `#4` draws, which do not cite the branch spec hash (`reply 36c915b0`).

**Coverage line.** `docs/evals/coverage.md`, in the Known hole for the verdict
vocabulary: "Two latent residues in the reader are closed by SPEC-0073 — the
stance is the last clause that names one … and a comma ends a clause … — and both
shapes are covered by test; neither has a store instance, so no stored draw
moves."

**Gates.** All exit 0:

- `validate-skills --root skills` — 14 SKILL.md, all clear;
- `eval.mjs check --root skills` — 101 cases (98 runnable, 3 manual), 98 fixtures
  staged, no findings;
- `node --test scripts/lib/evals/*.test.mjs` — 565 pass, 0 fail;
- `node --test scripts/lib/*.test.mjs` — 13 pass, 0 fail;
- `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` — 42 pass,
  0 fail;
- `check-sensor-parity` — 2/2 fixtures in parity;
- `check-evidence` — 6 documents, 0 errors, 0 warnings;
- `check-staleness` — 66 cited cells, 55 stale, 3 uncited, same as `main`;
- `spec-check --spec docs/specs/active/SPEC-0073-the-stance-is-the-last-clause.md
  --base main` — no errors.

**Cost.** Zero paid draws, no resume, no judge: every number above comes from
stored transcripts. Nothing was written into the store, and no skill, case prompt
or fixture was edited.

