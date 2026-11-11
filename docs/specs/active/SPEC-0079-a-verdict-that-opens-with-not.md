---
id: SPEC-0079
title: A verdict that opens with "not" is a rejection
status: implemented
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

The store has **6 negated-opening verdict lines in 6 transcript files across 4
run directories**; 5 of them flip a `verdict` assertion, and the sixth is in a
case that has none:

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

- expected: **6 negated-opening verdict lines in 6 transcript files across 4
  run directories** move from red to green; **5 flip a `verdict` assertion**, and
  the sixth (`audit-docs#3`, `2026-11-02T12-38-42`) is in a case with no
  `verdict` assertion, so it moves in no cell;
- expected class changes: `review-code` #4 control `2/5 → 5/5` (the class stays
  `non-discriminator`; the evidence gets stronger), and whatever the other three
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
4. The replay moves exactly those 6 verdict lines, 5 of which flip a `verdict`
   assertion and one is never judged, and nothing else; the table is published.
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

### F1 — the rule

`stance()` in `scripts/lib/evals/assertions.mjs` now checks the anchored
`NEGATED_STANCES = /^not\s+(?:ready|implemented|done|mergeable|complete|approved|approvable)\b/i`
against the text after the `VERDICT:` label, before the form scan, and returns
`REJECT` on a match. `text` is already the label-sliced, normalised line, so the
rule reads only what the verdict line opens with. `VERDICT_FORMS` and
`VERDICT_BLOCKERS` are unchanged.

| line | reading | why |
| --- | --- | --- |
| `Verdict: not ready to merge` | REJECT | opens in the stance slot |
| `VERDICT: APPROVE — the spec is not ready but ship it` | APPROVE | the negation is a later clause; `^` does not match |
| `Verdict: not applicable` | no stance (`got NOT`) | not in the set |
| `Verdict: no blockers` | no stance | unchanged; `not` is still not a blocker |

### F2 — tests

Three tests through `evaluateAssertions` in
`scripts/lib/evals/assertions.test.mjs`:

- `a verdict line that opens with a negated stance reads REJECT` — all seven set
  members plus the six stored openings (`not done — AC-3 is only half
  implemented`, `not ready to open as-is`, `not implemented.` (the store has it
  twice), `not ready — the spec is not implemented at all`, `not ready to
  merge.`); each also asserts it scores neither APPROVE nor WITHHELD.
- `a negation after the stance slot does not flip the verdict` — the counter-case
  `APPROVE — the spec is not ready but ship it` and `APPROVE — AC-2 is not
  implemented but planned` stay APPROVE.
- `a negated non-stance still names no stance` — `not applicable` and
  `no blockers` score no stance; `not applicable` reports `got NOT`.

### F3 — replay and republish

`node scripts/eval.mjs inspect --replay` over the whole store (2033 of 2079
stored transcripts matched to a current case — 46 have no matching case — across
362 run directories and the flat legacy layout; 353 carry a `verdict`
assertion), before and after the rule. Exactly **6 negated-opening verdict lines
in 6 transcript files across 4 run directories** move red → green; 5 flip a
`verdict` assertion, the sixth is never judged, and no other verdict line
changes:

| transcript | line opens with | verdict assertion | cell |
| --- | --- | --- | --- |
| `2026-11-02T12-38-42--audit-docs` / `audit-docs#3` r2 | `not ready to open as-is.` | not judged — the case has no `verdict` assertion | 3/3 → 3/3 |
| `2026-11-02T20-34-11--matrix--without-skill` / `review-code#4` r5 | `not done — AC-3 is only half implemented` | fail → pass | 0/5 → 0/5 (`reply 36c915b0` still red) |
| `2026-11-07T15-46-26--review-code…--without-skill` / `review-code#2` r2 | `not ready to merge.` | fail → pass | 2/3 → 3/3 |
| `2026-11-11T14-46-54--review-code…--without-skill` / `review-code#4` r3 | `not ready — the spec is not implemented at all` | fail → pass | 2/5 → 5/5 |
| … r4 | `not implemented — the branch contains no code change` | fail → pass | ↑ |
| … r5 | `not implemented.` | fail → pass | ↑ |

The `audit-docs#3` line is a corpus fact the reader never judges: that case's
assertions are `reply`/`noreply`/filesystem, so neither the measurement nor the
replay scores its verdict line. The 2026-11-02 legacy `review-code#4` cell keeps
its red on `reply 36c915b0`, so only the token moves. The 2026-11-07
`review-code#2` cell moves 2/3 → 3/3; it is not a published cell (the published
`#2` cells are the SPEC-0056 wave), so no count is republished for it.

Republished cells (`docs/evals/coverage.md`, `docs/evals/review-code-matrix.md`):

- `review-code` #4 control (`2026-11-11T14-46-54…--without-skill`):
  token **2/5 → 5/5**, cell **2/5 → 5/5**; class **non-discriminator
  unchanged**. The measured column keeps `2/5` as history, marked with the
  replayed value.
- No other published cell moves; their numbers are byte-identical.
- `kinds.mjs`'s contract comment states the stance-slot rule; no
  `VERDICT_FORMS` entry was added.

Zero paid draws: no `run`, no `--resume`, no judge. The replay wrote nothing into
the store.

### Gates

All nine commands from `tests:` exit 0, run in this worktree at the commit:

| command | outcome |
| --- | --- |
| `node scripts/validate-skills.mjs --root skills` | exit 0 — 14 skills, all clear |
| `node scripts/eval.mjs check --root skills` | exit 0 — 101 cases parsed, 98 runnable, 98 fixtures staged, no findings |
| `node --test scripts/lib/evals/*.test.mjs` | exit 0 — 568 tests pass, 0 fail |
| `node --test scripts/lib/*.test.mjs` | exit 0 — 13 tests pass, 0 fail |
| `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` | exit 0 — 42 tests pass, 0 fail |
| `node scripts/check-sensor-parity.mjs` | exit 0 — 2/2 fixtures in parity |
| `node scripts/check-evidence.mjs` | exit 0 — 6 documents, 0 errors, 0 warnings |
| `node scripts/check-staleness.mjs` | exit 0 — 66 cited cells, 51 stale, 3 uncited (report-only) |
| `node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0079-a-verdict-that-opens-with-not.md --base main` | exit 0 — contract holds |

`lint` (`validate-skills`) and `selftest` (`check` + the three test suites +
sensor parity + evidence) are therefore green in the worktree.

