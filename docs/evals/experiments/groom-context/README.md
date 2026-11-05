# Experiment: context ablation in `groom-backlog`

Status: open. The candidate is the inbox proposal in TASK-19, frozen as a copy of
the skill; the shipped `skills/groom-backlog/SKILL.md` is not edited until the
measurement says so.

## Hypothesis

Reading an index and the specs it points to preserves the result of
`groom-backlog` with less reading than step 2's instruction to read all specs,
the product vision and scope, the release plan and the relevant docs.

The risk is the reason this experiment exists: the relation that matters may not
appear in the index. A saving that comes from not finding a conflict is a
regression, not an improvement.

## Roots

| arm | path | what changes |
| --- | --- | --- |
| baseline | `baseline/skills/groom-backlog/` | the current `SKILL.md` |
| index-first | `index-first/skills/groom-backlog/` | only step 2 |

Both roots carry the same `references/evals.md` and the four fixtures. Only
`SKILL.md` differs; `diff -r` is the check.

## Cases

1. **Simple item.** The backlog asks for a CSV export; the product scope already
   answers it. No conflict.
2. **Redefined term.** The item says "priority"; SPEC-0002 defines priority as
   the plan tier, not urgency.
3. **Hidden conflict.** The item asks for a shipping webhook; SPEC-0003 (titled
   "Weekly digest") forbids webhooks and limits outbound notifications. The index
   summary does not contain the item's words, so only reading the spec finds it.
4. **Non-standard layout.** Specs live in `work/specs`; there is no index.

## Commands

```sh
node scripts/run-evals.mjs --root docs/evals/experiments/groom-context/baseline \
  --skill groom-backlog --case 1 --repeat 1 --timeout 600 --run
node scripts/run-evals.mjs --root docs/evals/experiments/groom-context/index-first \
  --skill groom-backlog --case 1 --repeat 1 --timeout 600 --run
```

Repeat for cases 2–4. For the deciding case, use `--repeat 3` in both roots.

Read the trace, not the fixture:

```sh
node docs/evals/experiments/groom-context/read-trace.mjs \
  <run>/cases/groom-backlog--01/transcript.md
```

## Measurement

| measure | how |
| --- | --- |
| files read | `read`/`grep`/`glob` calls in the transcript JSONL |
| actions | tool calls in the same trace |
| cost | tokens from the run artifact |
| outcome | the case assertions plus its answer key |

An assertion that passes only because the spec exists is not outcome evidence:
the produced spec must contain the required relation.

## Decision rule

Promote only if the candidate shows fewer reads or tool calls in at least two of
the four cases, has no critical regression (invented scope, missed conflict,
`ready` with an unresolved blocking gap) in any case, and the saving does not
depend on missing case 3's conflict. Otherwise record the result and leave the
shipped skill unchanged.

## Result, 2026-11-05

One draw per case, then three draws on case 3 (the adversarial one) in both
roots. `reads` and `calls` come from the transcript JSONL; `tokens` are input
tokens summed over the run.

| case | baseline (reads/calls/tokens) | index-first (reads/calls/tokens) | outcome |
| --- | --- | --- | --- |
| 1 simple | 8 / 14 / 15.2k | 7 / 13 / 14.0k | both pass |
| 2 redefined term | 5 / 12 / 16.4k | 6 / 11 / 14.1k | both pass |
| 3 hidden conflict (3 draws, means) | 6.0 / 13.0 / 15.4k | 4.7 / 10.7 / **25.4k** | both 3/3 |
| 4 non-standard layout | 3 / 8 / 13.6k | 4 / 8 / 18.0k | both pass |

The candidate reads fewer files and makes fewer tool calls in three of four
cases, and it found case 3's conflict in all three repeated draws — the saving
did not come from missing the relation (it read `SPEC-0003-digest.md`).

But the hypothesis was about cost, and the token direction is not a saving: on
case 3 the candidate costs **65% more input tokens** (25.4k vs 15.4k) and on
case 4, 32% more, while cases 1 and 2 are cheaper. The only consistent
reduction is file/call count, which is not what the run pays for.

## Decision

**Not promoted.** The shipped `skills/groom-backlog/SKILL.md` is unchanged. The
decision rule required fewer reads or actions in two cases (met) *and* that the
saving not depend on a missed conflict (met), but the spec's open question about
using both directions decides it: reads fell while tokens rose on the cases that
matter, so there is no measured cost reduction to ship. The candidate text stays
in `index-first/` as the record.

Check: `git diff --quiet skills/groom-backlog/SKILL.md`.

## Cost

16 runs total (8 single draws + 6 repeats on case 3, plus the two case-4 reruns
after the assertion fix), about 40 minutes of agent time. A full re-run is the
two root commands above with `--repeat 1`, then `--case 3 --repeat 3`.
