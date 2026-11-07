# Roadmap

The plan behind the releases. It is a working document, not a policy: the
pipeline (`docs/pipeline.md`) governs how work runs; this page says what the work
is and in which order. A change of direction is a human decision, and the
releases themselves are the record of what shipped.

Status: **0.6.2 released** on 2026-11-07. The next release is 0.7.0.

## Where the bottleneck is

Coverage is no longer the constraint. The repo has 76 cases, four clean
separators and a held-out set for issue #5. The constraint is **trust in a single
run**:

- a provider abort (`go-limit`, `rate-limit`, `overloaded`) can leave a run with
  trivially green assertions and `isolated=yes` (`TASK-52`);
- a run that dies before writing its result loses already-paid draws (`TASK-38`);
- a direct read of the staged `SKILL.md` is not counted as a load (`TASK-39`);
- the first SPEC-0031 attempt sat in the store uncited for a day and had to be
  reconciled after the release (`0.6.1`).

A new capability measured on top of those defects would inherit them. The
reliability patch comes first.

## Releases

| release | claim | work | cost |
| --- | --- | --- | --- |
| **0.6.2** (patch) | an aborted run is never clean | `TASK-52`, `TASK-38`, `TASK-39`, `TASK-40`, `TASK-54`; `TASK-36` documented, `TASK-35` deferred | **0 draws** |
| **0.7.0** | the first diagnosis skill | vendor Matt Pocock's `diagnosing-bugs`, pinned by commit, never global; five fixtures × five draws × two arms; one fixture held out | **~50 draws** (~0.6 M tokens at the 0.5.0 median) |
| **0.8.0** | the kit checks its own wiring | `agent-skills doctor`: duplicate ids, broken references, overrides, evaluator compatibility | **0 draws** |

The 0.7.0 holdout is frozen before the first draw, the way `review-code` #7 was
frozen for issue #5.

## 0.6.2 — the order

1. **`TASK-52` — a provider abort is not a draw.** Classify `go-limit`,
   `rate-limit` and `overloaded` as infrastructure or as a finding; a run where
   every rep aborted must not print `isolated=yes`. This is the blocker for every
   future measurement.
2. **`TASK-38` — do not lose paid draws.** Write the result incrementally and
   resume an interrupted run; add an auth probe before a batch. 0.7.0 will spend
   ~50 draws.
3. **`TASK-39` — a direct `SKILL.md` read is a load** in the with-skill arm.
4. **`TASK-40` — reconcile the #1 expectation with the judge** (zero draws; use
   the stored transcripts).
5. **`TASK-54` — audit the store for the aborts the old results lost.** The
   read-only scan is the release gate: a run cited as clean with a
   `provider.*` abort gets a marker, never a rewritten number.
6. **`TASK-36` and `TASK-35` — process hygiene.** TASK-36 is documented: pdlc
   1.2.0 resolves the task by slug, and the workaround is in `AGENTS.md`; its
   test cycle is blocked on the upstream checkout. TASK-35 (archive the Done
   tasks) is deferred: the tasks are reconciled (TASK-53) but not moved.
7. **`TASK-50` — the post-load stall** is not in the default path. Revisit only
   if a paid measurement hits it; no draws without a hypothesis.

## Out of scope until a consumer asks

- **A deny layer for the control arm.** `TASK-29` chose detection over denial;
  the consequence is that `capture-idea` #1, `process-inbox` #1 and
  `write-implementation-prompt` #1 stay `unresolved`. That is honest. If a
  consumer needs one of those cells, the deny layer is its own task, not a
  re-measure.
- **More cases of the same shape, a bigger corpus, an expanded judge.**
- **A token-budget mechanism** on top of the health delta.
- **pdlc phase markers (`PDLC-83`).** Another repo; it does not block this one.

## Rules that do not change

- A holder-out is frozen before the first draw.
- F0 starts with an **inventory of the store**, not only the replay table.
- A control supplies a rate only with five valid draws; an abort is not a draw.
- A release is a claim. 0.6.2 is not "almost there" if the store re-scan is red.
- Never rewrite a published number; name the correction and keep the old value as
  history.

## How this page is maintained

Update it when a release is cut or when the order changes. The evidence stays in
[`evals/coverage.md`](evals/coverage.md) and the release entries in
[`../CHANGELOG.md`](../CHANGELOG.md); this page does not duplicate their numbers.
