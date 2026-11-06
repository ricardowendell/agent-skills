# Harness health

Read-only report over stored eval artefacts and pdlc run records. It spends
no model and writes nothing.

## Evals

| Metric | Value |
| --- | --- |
| Runs | 170 |
| Cases | 243 |
| Shapes | 106 single, 137 repeated |
| Draws | 842 |
| Passed (clean) | 550 |
| Failed (clean) | 274 |
| Unscored (clean) | 0 |
| Staged (clean) | 13 |
| Contaminated | 4 |
| Infrastructure | 1 |
| Clean draws | 837 |
| Scored clean draws | 824 |
| Pass rate (clean, scored) | 66.7% |
| Wall time | 12h 5m 19s |
| Sum of draw durations | 16h 11m 49s |
| Tokens (in / out / reasoning) | 13,958,800 / 1,485,390 / 1,548,139 |
| Cache (read / write) | 85,452,962 / 1,574,993 |
| Steps | 6,455 |
| Tool calls | 10,748 |
| Judge runs | 26 |
| Judge failures | 12 |
| Deterministic pass, judge fail | 12 |
| Provenance | 93 complete, 749 partial |

### Unreadable eval artefacts

- `2026-11-03T09-52-59--review-code--without-skill/review-code--03`: missing result.json
- `2026-11-05T07-55-46--review-code/review-code--07`: missing result.json
- `2026-11-06T07-09-52--implement-from-prompt--without-skill/implement-from-prompt--02`: missing result.json

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

Published baseline for release **0.4.0** on **2026-11-06**. Regenerate with:

```sh
node scripts/harness-health.mjs --pdlc /Users/wendell/.agents/.pdlc/runs.json
```

## How to read it

- **The store is the history.** A release appends runs; compare the same section
  with the previous release's table. The report is deterministic over a fixed
  store, so a diff is a change in artefacts, not in the reader.
- **A regression is a move against a comparable number.** Same case shape, same
  `fixtureHash`/`promptHash`/`detectorVersion`, same arm and model. A new matrix,
  a smoke run, a control arm, or a partial-provenance draw changes the mix:
  that is variance, not a regression. Name the run directory before calling a
  delta either one.
- **The rate is per clean draw.** `Pass rate (clean, scored)` is `passed /
  (passed + failed + unscored)`; contaminated and infrastructure draws are
  excluded from both numerator and denominator, and staged smoke draws are never
  scored. A case that stops early contributes the draws it actually ran.
- **Wall time is work, not elapsed time.** It sums each run's
  `startedAt`→`finishedAt`; overlapping runs add up. `Sum of draw durations` is
  the agent time inside those runs.
- **Judge failures are advisory evidence.** A judge can only fail a draw that
  passed every deterministic assertion. `Deterministic pass, judge fail` is that
  subset; it is the list to read when the number moves.
- **Provenance says what is comparable.** Complete means all three of
  `fixtureHash`, `promptHash` and `detectorVersion` are on the draw. A partial
  draw is history, not a clean measurement.
- **Unreadable artefacts are named.** A run without `manifest.json` or a case
  without a readable `result.json` is listed under `Unreadable`, never skipped.
  They are excluded from the counts; check them before trusting a delta.
- **pdlc retries are `attempts > 1`.** A red gate is any `gates[].ok === false`.
  The median duration falls back to `started_at`→`finished_at` when the record
  has no `duration`.
- **Evidence, not a gate.** No number in this table fails CI. The release loop
  reads it before the CHANGELOG entry and opens at most three findings and one
  spec.
