---
id: SPEC-0079
title: A verdict that opens with "not" is a rejection
status: ready
priority: P2
task: TASK-109
created_at: 2026-11-11
updated_at: 2026-11-11
source_docs:
  - backlog/tasks/task-109 - evals-o-vocabulario-do-verdict-nao-le-not-ready-nem-not-implemented.md
  - docs/specs/SPEC-0062-the-verdict-vocabulary-is-closed.md
  - docs/specs/SPEC-0078-re-measure-the-review-code-cases.md
related_decisions: []
depends_on: []
blocks: []
files:
  - scripts/lib/evals/assertions.mjs
  - scripts/lib/evals/assertions.test.mjs
  - scripts/lib/evals/kinds.mjs
  - docs/evals/coverage.md
  - docs/evals/review-code-matrix.md
  - docs/specs/active/SPEC-0079-a-verdict-that-opens-with-not.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0079-a-verdict-that-opens-with-not.md --base main
---

## Purpose

The closed stance vocabulary has no entry for a verdict that opens with a
negation: `Verdict: not ready`, `Verdict: not implemented`, `Verdict: not done`.
`SPEC-0078` published `review-code` #4 as a non-discriminator whose control
"never approved" but scored **2/5**, because three of its five draws wrote exactly
those forms and the guard read `got NOT`.

The judgement was right and the token was missing — the same class as `ranpass`
scoring the command string (`TASK-102`) and the `#10` false red. It is the last
known place where the oracle can turn "refused correctly" into "said nothing".

The store has **6 verdict lines in 5 transcripts** that open with `not`:

| line opens with | transcript |
| --- | --- |
| `not done — AC-3 is only half implemented` | `2026-11-02T20-34-11--matrix--without-skill` |
| `not ready to open as-is` | `2026-11-02T12-38-42--audit-docs` |
| `not implemented.` (×2), `not ready —` | `2026-11-11T14-46-54--review-code…--without-skill` (`#4`, three draws) |
| `not ready to merge.` | `2026-11-07T15-46-26--review-code…--without-skill` |

Adding the rule is cheap; the risk is a false rejection. `Verdict: APPROVE — AC-2
is not implemented but planned` must stay **APPROVE**, so the rule cannot be a
keyword search.

## User Outcome

- A verdict line that **opens** with a negation of a stance is a rejection, and
  the corpus reads it as one.
- A later clause that mentions something unimplemented never flips an approval.
- Every stored cell the rule moves is re-judged and republished, with the delta
  named.

## Scope

### F1 — the rule is about the stance slot, not the line

In `stance(line)` (`scripts/lib/evals/assertions.mjs`), before the form scan:

```js
const NEGATED_STANCES = /^not\s+(?:ready|implemented|done|mergeable|complete|approved|approvable)\b/i
```

If `text` matches it, the stance is **REJECT** and the scan is skipped. `text` is
already the content after the `VERDICT:` label (the caller slices it), so the rule
applies only to what the verdict line *opens* with.

Consequences to state in the comment:

- `Verdict: not ready to merge` → REJECT;
- `Verdict: APPROVE — AC-2 is not implemented but planned` → APPROVE (the
  negation is in a later clause, so the regex does not match `^`);
- `Verdict: not applicable` → no stance (not in the set);
- `Verdict: no blockers` → unchanged.

### F2 — tests, through `evaluateAssertions`

One test per shape above, plus the six stored shapes' verdicts, plus a
counter-case that the rule does not fire mid-line:
`VERDICT: APPROVE — the spec is not ready but ship it` → APPROVE.

### F3 — replay and republish

Replay every stored transcript carrying a `verdict` assertion (the `SPEC-0073`
harness: `inspect --replay` over the run dirs) and publish the delta:

- expected: **6 verdict lines in 5 transcripts** move from red to green;
- expected class changes: `review-code` #4 control `2/5 → 5/5` (the class stays
  `non-discriminator`; the evidence gets stronger), and whatever the other four
  cells do;
- any cell whose class changes is republished; any cell that does not is left
  byte-identical except for a date if it carries one.

`docs/evals/coverage.md` and `docs/evals/review-code-matrix.md` are updated for
the cells that move. If a published count changes, the historical count is kept
and marked, as the matrix already does.

### F4 — the vocabulary contract

`kinds.mjs`'s comment states the negated-opening rule next to the form list, so a
reader knows a stance can be named without being in `VERDICT_FORMS`.

## Non-Goals

- **No new `VERDICT_FORMS` entry.** The rule is a stance slot, not a phrase; adding
  `not implemented` as a form would let it fire mid-line.
- **No change to the blocker list.** `not` is deliberately not a blocker; the
  stance-slot rule is the narrow fix.
- **No paid draw.** The replay is `inspect --replay` over stored runs.
- **No case, prompt or fixture change.**
- **No re-scoring by hand.** If a cell moves, it moves because the reader moved.

## Flow

1. **F1** — the rule and the comment.
2. **F2** — the tests.
3. **F3** — the replay, then republish the cells that moved.
4. **F4** — the contract comment.

## Data

- `scripts/lib/evals/assertions.mjs` — `stance()`, `normaliseVerdict`, and the
  `verdict` branch that slices after the label.
- `scripts/lib/evals/kinds.mjs` — `VERDICT_FORMS`, `VERDICT_BLOCKERS`, and the
  contract comment.
- The five transcripts in the Purpose.
- `docs/evals/review-code-matrix.md` — the `#4` rows and the vocabulary-gap note.

## Acceptance Criteria

1. A verdict line opening with `not ready` / `not implemented` / `not done` (and
   the other set members) reads REJECT.
2. A line that mentions a negation after the first clause is unaffected:
   `VERDICT: APPROVE — the spec is not ready but ship it` → APPROVE.
3. A negated non-stance (`not applicable`) still names no stance.
4. The replay moves exactly the 6 verdict lines in the 5 transcripts and nothing
   else; the table is published.
5. `review-code` #4's control is republished at 5/5 with the class unchanged, and
   any other moved cell is republished with its before/after.
6. `kinds.mjs` states the rule; no `VERDICT_FORMS` entry is added.
7. Zero paid draws; every command in `tests:` exits 0.

## Decisions

- **The stance slot, not the vocabulary.** The phrase `not implemented` is
  ambiguous mid-line and unambiguous as the first thing after `VERDICT:`. Put the
  rule where the ambiguity is absent.
- **A small closed set.** `ready`, `implemented`, `done`, `mergeable`, `complete`,
  `approved`, `approvable` — the words a reviewer actually negates in a verdict
  line. `not applicable` must not be caught, and is not.
- **Re-judge, then publish.** The corpus's rule: a reader change that moves a
  stored verdict is a corpus event, republished with its delta.

## Open Questions

None.

## Prompt Notes

- `stance()` receives the line already sliced after the label; do not re-slice and
  do not strip markdown beyond what `normaliseVerdict` already does.
- The regex must be anchored (`^`); a `\b` search anywhere is the bug this spec
  exists to avoid.
- Replay with `node scripts/eval.mjs inspect <run-dir> --replay`; do not run,
  resume or judge.

## Results

_Filled during implementation._
