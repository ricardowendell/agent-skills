---
id: SPEC-0013
title: Context ablation for groom-backlog
status: implemented
priority: P1
created_at: 2026-11-05
updated_at: 2026-11-05
source_docs:
  - backlog/tasks/task-19 - groom-backlog-ablação-de-contexto.md
  - docs/inbox/2026-11-03-guia-pratico-tecnicas-agent-skills.md
  - skills/groom-backlog/SKILL.md
related_decisions: []
depends_on: []
blocks: []
tests:
  - docs/evals/experiments/groom-context/README.md
---

# SPEC-0013: Context ablation for groom-backlog

## Purpose

`groom-backlog` step 2 tells the agent to read all existing specs, the vision,
the release plan and the relevant experience/system/decision docs. The proposal
from the inbox is to start from an index and read only the specs it points to.

The hypothesis is that an index-first pass preserves the result with less
reading. The risk is precise: the relation that matters may not appear in the
index. A corpus that cannot stage such a case would report a saving that is
really a missed conflict.

## User Outcome

A reader sees, on the same four cases and the same model, what each instruction
actually read (from the trace), what it produced, and whether the candidate
skipped a relation the baseline found. The skill text changes only if the
candidate saves work without losing a conflict.

## Scope

- Two skill roots under `docs/evals/experiments/groom-context/`:
  - `baseline/skills/groom-backlog/` — the current `SKILL.md`;
  - `index-first/skills/groom-backlog/` — identical except step 2, which becomes:
    1. read `AGENTS.md` and locate the normative sources;
    2. consult the specs index and search for the feature's terms;
    3. read the related specs, ADRs and journeys;
    4. expand the search on a dependency, overlap or conflict;
    5. keep the spec `draft` when a blocking gap cannot be resolved.
  The candidate text is the inbox proposal, not an approved replacement.
- Four cases, each a fixture with `AGENTS.md`, a docs tree and one backlog item:
  1. a simple item with documentation that already answers it;
  2. a related spec that redefines a term used by the item;
  3. a conflict in a spec whose title does not contain the item's words;
  4. a non-standard layout (`work/specs`, `work/backlog.md`).
- Both roots carry the same cases and fixtures; only `SKILL.md` differs.
- Measure from the transcript's JSONL, not from what was staged: which files the
  agent actually read (`read`/`grep`/`glob` inputs), tool-call count, tokens, and
  whether the produced spec matches the case's answer key.
- One draw per case in both roots. Three draws on the deciding case before any
  promotion.
- Apply the decision rule; edit `skills/groom-backlog/SKILL.md` only on a win.

**Blast radius.** One experiment directory, four fixtures, two frozen skill
roots and, only on a win, one paragraph of `SKILL.md`. No runner change, no new
case format, no product docs, no index created in the real repository.

## Non-Goals

- **Editing `groom-backlog/SKILL.md` before the measurement.** The candidate is a
  frozen copy; the shipped skill stays as is until the decision.
- **Creating a specs index in the corpus or the repository.** If the fixture has
  no index, the candidate uses search and links, which is what the proposal says
  to do before inventing a source of truth.
- **A new runner feature for "files read".** The transcript already stores the
  JSONL; a small analysis script reads it.
- **Measuring all seven existing cases.** Four cases are enough to decide this
  hypothesis, and case 3 is the adversarial one.
- **A percentage threshold.** The comparison is observed reads and actions per
  case, plus the outcome; a rate over one draw would overstate it.

## Flow

1. Copy `skills/groom-backlog` into both roots; apply the candidate only to
   `index-first/skills/groom-backlog/SKILL.md` step 2.
2. Verify the roots: `diff -r` shows only `SKILL.md`; both pass
   `node scripts/run-evals.mjs --root <root> --list --check`.
3. Author the four cases in both roots (same `references/evals.md` case blocks
   and fixtures), each with a `why:` line naming the relation the case is about
   and the assertion that would fail if it is missed.
4. Run all four cases in both roots, `--repeat 1 --timeout 600`.
5. Extract observed reads per run from the transcript JSONL (`tool_use` events
   with `read`, `grep`, `glob`), listing paths relative to the scratch dir.
6. Score the produced spec against the answer key: correct scope, the redefined
   term resolved, the conflict surfaced in case 3, the layout discovered in
   case 4.
7. Compare: reads, tool calls, tokens and outcome per case.
8. Repeat the deciding case three times in both roots.
9. Decide:
   - **promote** — fewer reads or actions in at least two cases, no critical
     regression in any of the four, and the saving does not depend on missing
     case 3's conflict;
   - **reject** — otherwise, including "the candidate read less because it never
     found the relation".
10. On a win, replace step 2 in `skills/groom-backlog/SKILL.md` with the
    candidate. On a loss, leave it untouched and record why.
11. Write the README with roots, hashes, commands, per-case reads/tokens/outcome,
    decision and cost.

## Data

The experiment directory holds the two roots, the fixtures, the analysis script
and the run outputs. No product docs are created or changed. The answer keys are
fixture data and stay outside the staged tree.

## UI Notes

Not applicable.

## Acceptance Criteria

- AC-1 — The two roots are byte-identical except `SKILL.md`, and both pass
  `--list --check`. Verified by `diff -r` and the command's exit status.
- AC-2 — Four cases exist and run in both roots: simple item, redefined term,
  conflict under an unrelated title, non-standard layout. Verified by the case
  list and the staged fixtures.
- AC-3 — Observed reads come from the transcript JSONL, not from the staged
  files; the evidence table names the files read per run. Verified by
  re-extracting one run from its transcript.
- AC-4 — No critical regression in the four cases: the produced spec does not
  invent scope, does not miss case 3's conflict, and does not mark `ready` with
  an unresolved blocking gap. Verified by the answer keys.
- AC-5 — The candidate shows fewer observed reads or tool calls in at least two
  of four cases. Verified by the per-case table.
- AC-6 — The deciding case is run three times in both roots before any
  promotion. Verified by the run directories.
- AC-7 — If the saving depends on missing case 3's conflict, the candidate is
  rejected, `skills/groom-backlog/SKILL.md` is unchanged, and the result is
  recorded. Verified by the diff and the README.
- AC-8 — On a win, step 2 of the shipped skill carries the candidate text and
  the rest of the workflow is unchanged. Verified by the diff.
- AC-9 — The README records root hashes, the model, exact commands, per-case
  reads, tokens, outcome and decision. Verified by reading it.

## Result (2026-11-05)

The two roots differ only in `SKILL.md`; both passed `--list --check`. Four
cases ran in both roots, and case 3 was repeated three times per root.

| case | baseline reads/calls/tokens | index-first reads/calls/tokens | outcome |
| --- | --- | --- | --- |
| 1 simple | 8 / 14 / 15.2k | 7 / 13 / 14.0k | both pass |
| 2 redefined term | 5 / 12 / 16.4k | 6 / 11 / 14.1k | both pass |
| 3 hidden conflict (means of 3) | 6.0 / 13.0 / 15.4k | 4.7 / 10.7 / 25.4k | both 3/3 |
| 4 non-standard layout | 3 / 8 / 13.6k | 4 / 8 / 18.0k | both pass |

The candidate made fewer tool calls in three cases and did not miss case 3's
conflict: the index-first runs read `SPEC-0003-digest.md` and surfaced the
no-webhook constraint in all three draws. There was no critical regression.

The cost direction decides against promotion: on case 3 the candidate used 65%
more input tokens (25.4k vs 15.4k) and on case 4 32% more, while cases 1 and 2
were cheaper. The consistent saving is file and call count, not total cost, and
the spec's open question requires both directions. The shipped
`skills/groom-backlog/SKILL.md` is unchanged (`git diff --quiet` succeeds).

AC-1–AC-6 and AC-9 are met. AC-7's condition (a saving that depends on a missed
conflict) did not occur, but the candidate was not promoted for the cost reason
above. AC-8 was not triggered.

## Open Questions

- "Fewer reads" can mean fewer files or fewer bytes; a single long spec read in
  full may cost more than several small files. The README should report both
  read calls and tokens, and the decision should use both directions rather than
  one.
- The corpus needs a specs index for the candidate to consult. Where it does not
  exist (case 4), the candidate searches; that is intentional, but it makes the
  two cases measure different strategies. The comparison stays per case, not
  aggregated into a single rate.
- If the baseline already reads selectively in practice, the candidate has no
  headroom and the hypothesis is refuted by observation. That outcome is a
  valid result and leaves the skill unchanged.

## Prompt Notes

- Requirements: two roots, four cases, trace-level reads, outcome scoring, a
  decision rule, conditional edit of one step.
- Entities: `skills/groom-backlog/SKILL.md`, the two frozen roots, the four
  fixtures, the JSONL transcripts, the answer keys.
- Approach: freeze both arms, run the same corpus, read the trace rather than
  the staging.
- Structure: `docs/evals/experiments/groom-context/{baseline,index-first,fixtures,README.md}`.
- Operations: copy roots, author cases, run both, extract reads, score, repeat,
  decide, edit or record.
- Norms: case format and assertion vocabulary follow the runner; `--root` is the
  established way to test a frozen skill copy.
- Safeguards: never count a file available in the fixture as read; never promote
  on a saving that comes from a missed conflict; never edit the live skill
  before the decision; keep the candidate text quoted in the README.
- Tests: a state check (roots differ only in `SKILL.md`), a trace check (reads
  per run), and an outcome check (the four answer keys).
