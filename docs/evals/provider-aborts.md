# Provider aborts in the stored runs — TASK-54 audit

Read-only, model-free audit of every stored transcript for a `provider.*` abort,
run on 2026-11-07 with the 0.6.2 detector. The store is
`~/.local/share/opencode/evals/runs`; nothing below rewrites a stored result or a
published number.

```sh
node scripts/audit-provider-aborts.mjs          # one line per abort + summary
node scripts/audit-provider-aborts.mjs --json   # the same as a machine artifact
```

The command detects `provider.go-limit`, `provider.rate-limit`,
`provider.transport` and the other `provider.*` types, then reads the matching
`draws/rN.json` (post-TASK-38) or the aggregate `result.json`
(`repetitions[N-1]`). `recorded` is the `execution.error` TASK-52 writes;
`infrastructure` is the runner's behavioural exclusion; `retried` is
`execution.attempts > 1`.

## Result

**1413 transcripts, 14 aborts, 14 unrecorded, 0 retried.** All 14 predate
TASK-52, so none carries `execution.error`; the result says only
`failed — exit 1` (or a gate miss) and `check-eval-run` has nothing to flag. No
abort was followed by a successful retry.

| run | case | reps | error | result | disposition |
| --- | --- | --- | --- | --- | --- |
| `2026-11-05T07-38-29--review-code` | #4 | r1 | `provider.transport` | failed, exit 1 | cited only in the historical `SPEC-0009` (`2 passed, 1 exit 1`); not touched, recorded here |
| `2026-11-05T09-05-36--review-code` | #7 | r1 | `provider.transport` | failed, exit 1 | marked in `review-code-matrix.md`: the stream continued and produced `VERDICT: REJECT`; the exit 1 is the transport error, not a behavioural difference |
| `2026-11-07T02-03-01--write-implementation-prompt--without-skill` | #4 | r4 | `provider.rate-limit` | failed | already marked "1 rep aborted (429)" in `write-implementation-prompt-matrix.md` and `coverage.md` |
| `2026-11-07T02-51-15--process-inbox--without-skill` | #1 | r3 | `provider.rate-limit` | failed | already marked "1 rep aborted (429), 2 contaminated" in `pipeline-bookends-matrix.md` and `SPEC-0031` |
| `2026-11-07T03-08-51--process-inbox--without-skill` | #1 | r1–r5 | `provider.go-limit` | failed | already marked "all 5 provider aborts, not evidence" in `pipeline-bookends-matrix.md` and `SPEC-0031` |
| `2026-11-07T08-14-24--capture-idea` | #1 | r1–r5 | `provider.go-limit` | failed, gate miss | marked in `SPEC-0031`: 5 provider aborts (HTTP 429); the gate missed because the provider aborted before load, not because the skill failed to route |

## What is not claimed

- No historical number is rewritten. The rows above keep their published tallies;
  the marker names the abort so the tally is read with its denominator.
- `07-38-29` is not edited: it is cited in a durable historical spec, and the
  rule is not to rewrite that record. The audit lists it so a future reader can
  see the abort.
- The `09-05-36` draw is not reclassified: its reply is a valid review, but the
  process exited 1 on `provider.transport`, so it is a failed draw, not a clean
  third pass.
- The audit is not a gate. `check-eval-run` still reports what the result.json
  records; this command is how a reader finds the aborts the old artefacts lost.
