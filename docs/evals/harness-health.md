# Harness health

Read-only report over stored eval artefacts and pdlc run records. It spends
no model and writes nothing.

## Evals

| Metric | Value |
| --- | --- |
| Runs | 173 |
| Unfinished runs | 6 |
| Cases | 245 |
| Shapes | 108 single, 137 repeated |
| Draws | 844 |
| Unfinished draws | 4 |
| Passed (eligible) | 547 |
| Failed (eligible) | 267 |
| Unscored (eligible) | 0 |
| Staged (eligible) | 13 |
| Contaminated | 4 |
| Infrastructure | 9 |
| Eligible draws (not contaminated, not infrastructure) | 827 |
| Rate denominator (eligible, non-staged) | 814 |
| Pass rate (eligible, non-staged) | 67.2% |
| Gate misses (eligible) | 21 |
| Strict clean draws | 90 |
| Strict passed / failed | 87 / 3 |
| Strict pass rate | 96.7% |
| Wall time | 12h 10m 14s |
| Sum of draw durations | 16h 14m 43s |
| Tokens (in / out / reasoning) | 13,996,752 / 1,486,071 / 1,549,673 |
| Cache (read / write) | 85,654,482 / 1,574,993 |
| Steps | 6,475 |
| Tool calls | 10,766 |
| Judge runs | 26 |
| Judge failures | 12 |
| Deterministic pass, judge fail | 12 |
| Provenance (completed draws) | 95 complete, 745 partial |

### Unreadable eval artefacts

- `2026-11-03T09-52-59--review-code--without-skill/review-code--03`: missing result.json
- `2026-11-05T07-55-46--review-code/review-code--07`: missing result.json
- `2026-11-06T07-09-52--implement-from-prompt--without-skill/implement-from-prompt--02`: missing result.json
- `2026-11-06T13-11-35--review-code--agentworks-gpt-oss-120b--without-skill/review-code--01`: missing result.json

## pdlc

| Metric | Value |
| --- | --- |
| Runs | 10 |
| active | 1 |
| merged | 9 |
| Retries (attempts > 1) | 0 |
| Runs with a red gate | 0 |
| Median duration | 43m 11s |

---

Published baseline for release **0.4.0** on **2026-11-06**. Snapshot:
`2026-11-06T16:12:50Z` UTC over the local store. Regenerate from the main
checkout with:

```sh
node scripts/harness-health.mjs --until 2026-11-06T16:12:50Z
```

The store only grows, so the `--until` bound is what reconstructs this snapshot;
without it the report counts runs that started later. A dispatched worktree has
no `.pdlc/`, so this baseline was produced there with `--until
2026-11-06T16:12:50Z --pdlc /Users/wendell/.agents/.pdlc/runs.json`; the numbers
are the same when the simple command runs from the main checkout.

## 0.5.0 delta — 2026-11-06T20:52:31Z

```sh
node scripts/harness-health.mjs --until 2026-11-06T20:52:31Z
```

| Metric | 0.4.0 (16:12:50Z) | 0.5.0 (20:52:31Z) |
| --- | --- | --- |
| Runs | 173 | 234 |
| Unfinished runs | 6 | 7 |
| Cases | 245 | 313 |
| Draws | 844 | 1,147 |
| Eligible draws | 827 | 1,079 |
| Rate denominator | 814 | 1,066 |
| Pass rate (eligible, non-staged) | 67.2% | 67.2% |
| Gate misses (eligible) | 21 | 25 |
| Strict clean draws | 90 | 338 |
| Strict passed / failed | 87 / 3 | 256 / 82 |
| Strict pass rate | 96.7% | 75.7% |
| Contaminated | 4 | 47 |
| Infrastructure | 9 | 17 |
| Provenance (completed draws) | 95 complete, 745 partial | 398 complete, 745 partial |
| Wall time | 12h 10m 14s | 15h 55m 56s |
| Sum of draw durations | 16h 14m 43s | 24h 31m 15s |
| pdlc runs | 10 | 13 |
| pdlc retries / red gates | 0 / 0 | 0 / 0 |
| pdlc median | 43m 11s | 47m 55s |

The eligible rate did not move. The strict rate fell because its base more than
tripled: the 0.5.0 measurement wave is the first with full provenance, and its
control arms fail by design. That is the mix change the rule below already
describes, not a regression — the 82 strict failures are control draws.

### Findings (three)

1. **Control contamination.** Contaminated draws went from 4 to 47. The controls
   read the host install, and at least one read the host `docs/` corpus, which
   `leak.mjs` does not classify. Three cells could not be classified and are
   published as `unresolved`. TASK-43.
2. **Cross-skill routing cannot be measured.** `capture-idea #3` and
   `process-inbox #3` assert that the sibling skill loads, but staging copies
   only the skill under review; both are 0/N by construction. TASK-44.
3. **`write-implementation-prompt` #6 leaks.** The "summarise this spec" prompt
   loads the skill in 2–4 of 5 draws, and #5 stalled in three of five trigger
   runs. TASK-45.

No fix shipped for any of them; this release publishes the evidence.

## How to read it

- **Two rates, two questions.** `Pass rate (eligible, non-staged)` is the broad
  trend: draws in completed runs that are not contaminated and not
  infrastructure, with staged smoke draws out of the denominator. It includes
  partial provenance and gate misses, so it answers whether the whole store is
  moving. `Strict pass rate` is a per-draw strict rate: completed run, full
  provenance (`fixtureHash` + `promptHash` + `detectorVersion`), and no
  `checkRun` finding for that draw. `coverage.md`'s rule is per run directory,
  so strict is the closest comparable trend, not a substitute.
- **Unfinished runs are not evidence for the rates.** Runs with
  `manifest.status` other than `completed` are counted under `Unfinished runs`;
  their draws are counted under `Unfinished draws` and kept out of both rates.
  Their `finishedAt` is null, so their wall time is not summed. Contaminated and
  infrastructure are counted over completed draws; an unfinished draw never
  enters the `passed`/`failed`/`unscored`/`staged` partitions or either rate.
- **Usage is raw over the whole store.** Tokens, steps, tool calls, the sum of
  draw durations and judge counts include unfinished runs: the spend happened.
  Only the rates, the dirty-draw counts and wall time exclude unfinished runs.
- **The store is the history.** A release appends runs; compare the same section
  with the previous release's table. Use that release's `--until` bound to
  reconstruct its snapshot; the report is deterministic over that window. The
  bound applies to the eval run's `startedAt` and the pdlc record's
  `started_at`; a record with no parseable start is kept, not dropped.
- **A regression is a move against a comparable number.** Same case shape, same
  arm and model. A new matrix, a control arm, or a draw with partial provenance
  changes the mix: that is variance, not a regression. Name the run directory
  before calling a delta either one.
- **The rate denominator.** `Rate denominator (eligible, non-staged)` is
  `passed + failed + unscored` over eligible draws; unscored is not a pass and
  stays in the denominator, while staged smoke draws do not. `Eligible draws`
  includes staged, so it is larger than the denominator.
- **Gate misses are eligible but not strict.** `Gate misses (eligible)` counts
  `with-skill` draws whose `skillGate.ok` is not true. They have no leak and no
  infrastructure, so the broad rate includes them; `checkRun` keeps them out of
  the strict rate.
- **Provenance is counted over completed draws.** Complete means all three of
  `fixtureHash`, `promptHash` and `detectorVersion` are present. A partial draw
  is history, not strict evidence, and never enters the strict rate.
- **Wall time is work, not elapsed time.** It sums each completed run's
  `startedAt`→`finishedAt`; overlapping runs add up. `Sum of draw durations` is
  the agent time inside every draw, including unfinished ones.
- **Judge failures are advisory evidence.** A judge can only fail a draw that
  passed every deterministic assertion. `Deterministic pass, judge fail` is that
  subset; it is the list to read when the number moves.
- **pdlc retries are `attempts > 1`.** A red gate is any `gates[].ok === false`.
  The median duration falls back to `started_at`→`finished_at` when the record
  has no `duration`.
- **Evidence, not a gate.** No number in this table fails CI. The release loop
  reads it before the CHANGELOG entry and opens at most three findings and one
  spec.
