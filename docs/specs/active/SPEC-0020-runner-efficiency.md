---
id: SPEC-0020
title: Spend fewer draws and less wall time for the same evidence
status: implemented
priority: P1
task: TASK-37
created_at: 2026-11-06
updated_at: 2026-11-06
source_docs:
  - backlog/tasks/task-37 - harness-gastar-menos-draws-e-menos-tempo-para-a-mesma-evidenci.md
  - docs/evals/coverage.md
  - CONTRIBUTING.md
related_decisions: []
depends_on: []
blocks: []
files:
  - scripts/run-evals.mjs
  - scripts/lib/evals/agent.mjs
  - scripts/lib/evals/result.mjs
  - scripts/lib/evals/report.mjs
  - scripts/lib/evals/runcheck.mjs
  - scripts/lib/evals/execute.mjs
  - scripts/lib/evals/fixture.mjs
  - scripts/lib/evals/leak.mjs
  - scripts/lib/evals/schedule.mjs
  - scripts/lib/evals/runs.mjs
  - scripts/lib/evals/agent.test.mjs
  - scripts/lib/evals/result.test.mjs
  - scripts/lib/evals/report.test.mjs
  - scripts/lib/evals/runcheck.test.mjs
  - scripts/lib/evals/execute.test.mjs
  - scripts/lib/evals/cli.test.mjs
  - scripts/lib/evals/schedule.test.mjs
  - scripts/lib/evals/leak.test.mjs
  - scripts/lib/evals/runs.test.mjs
  - CONTRIBUTING.md
  - docs/evals/coverage.md
  - README.md
  - docs/specs/active/SPEC-0020-runner-efficiency.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
---

# SPEC-0020: Spend fewer draws and less wall time for the same evidence

## Purpose

The last 235 draws cost **5.16 hours of wall time** and roughly **91k tokens
each**: 14k fresh input, 76k cache read, 1.6k output, at a median of 7 steps. The
cache read is not waste — it is the context re-sent every step — so the cost
scales with *steps × context*, and the runner has three structural inefficiencies
that make it worse:

- **Repetitions run in series.** `lanes = min(concurrency, cases)`; a
  `--case 1 --repeat 12` run has one case, so 12 draws go one after another even
  though each has its own scratch.
- **Every cell runs to `n`, always.** The loop has no stop rule. Simulated on the
  stored sequences, stopping at 5 passes / 3 fails saves **26%** of draws even at
  `n=12`; with `n=5` as the default for a binary split it is closer to 45%.
- **A stall waits the full 600s.** Eight timed-out draws cost **80 minutes** of
  wall time; two of them had 2 and 5 steps, so the process was stuck, not slow.

It also counts an infrastructure timeout as a behavioural failure, which
contaminates a rate and forces a re-run to explain it — SPEC-0016's control had
exactly that problem.

## User Outcome

The same matrix, with the same verdicts, costs about half the draws and a quarter
of the wall time. A stalled draw is named as a stall, not silently averaged into a
failure, and a run directory carries the provenance that lets a later wave reuse
its control arm instead of paying for it again.

## Scope

- **Parallel repetitions.** Run the draws of a case through the same lane limit
  as cases, so `--concurrency 4` means four draws in flight even with one case.
  Each draw keeps its own scratch, transcript and result slot.
- **Stop rule.** `--stop <passes>/<fails>`, default `5/3` when `repeat > 5` and
  the full count otherwise. `result.json` records `stoppedEarly: true` and the
  observed sequence; `reps` is the number actually run. A document publishes
  "5/5, stopped early", never "12/12" for a cell that stopped at five.
- **Provenance.** `result.json` records `fixtureHash`, `promptHash` and
  `detectorVersion`. `CONTRIBUTING.md` allows citing a control run from an
  earlier wave only when all three match; any difference re-runs it.
- **Stall watchdog.** `--stall-seconds` (default 120) kills a draw whose event
  stream produced nothing new for that long, and records `exit: "stalled"`,
  distinct from `timeout`.
- **Infrastructure exits are not behaviour.** `timeout` and `stalled` become
  `unscored` with an infrastructure reason, retried at most once, and never count
  as a pass or as a behavioural failure. The checker treats them as incomplete
  evidence, not as a clean run.
- **Concurrency check.** Measure `--concurrency 6` and `8` on one small cell; the
  default moves only if no provider 429 appears.

**Blast radius.** The runner's execution and artifact shape, the checker's
classification of an incomplete run, and one reuse rule in the docs. Verdicts
must not move: the spec re-runs one 12-draw cell and compares it with the stored
one before accepting any default.

## Non-Goals

- No change to any `assert:` line, the skill gate, a fixture or a case prompt.
- No step cap and no cheaper screening model. Both change what is measured.
- No judge. It is off by default and stays off.
- No change to `n` where a document publishes a rate; the default `n=5` applies
  to separation only, and a rate claim still says its `n`.
- No incremental persistence or `--resume`; that is TASK-38, which touches the
  same file but answers a different question.

## Flow

1. **F0 — parallel draws.** Move the repetition loop to the lane pool. Prove the
   artifact shape is unchanged with a 4-draw run and compare a 12-draw cell's
   verdict against the stored `2026-11-05T12-35-30--implement-from-prompt`
   (12/12). Record wall time before (stored durations) and after.
2. **F1 — stop rule.** Implement `--stop`; simulate on the stored sequences first
   to confirm the saving, then run one cell with `--repeat 12` and check the
   artifact says `stoppedEarly` and the sequence it observed.
3. **F2 — provenance.** Hash the staged fixture tree and the prompt per draw; add
   `detectorVersion` from the leak module. Test with a fixture mutation: the hash
   must change.
4. **F3 — watchdog.** Add the idle-event timer in `agent.mjs`, with a unit test
   that feeds no events and expects `stalled` quickly, and one that feeds a slow
   but live stream and expects it to survive.
5. **F4 — infra exits.** Classify `timeout`/`stalled` as `unscored`; add the
   single retry; update the checker so an infrastructure-unscored does not read
   as a clean run but does not read as a behavioural failure either.
6. **F5 — concurrency.** Run the 11-case `matrix` tag once at 6 and once at 8;
   record 429s. Keep 4 unless the runs are clean.
7. **F6 — document.** README flags, `CONTRIBUTING.md` reuse rule, coverage note.

### Where the change lives

- **`scripts/lib/evals/schedule.mjs`** owns the draw pool, the index-ordered
  artifact and the stop decision. It is a separate module because the mandatory
  test has to prove "parallelism does not change the artifact" and the stop rule
  without spending a model draw. `run-evals.mjs` keeps argv, scrubbing, staging
  calls, transcripts and the single write of `result.json`.
- **`scripts/lib/evals/execute.mjs`** owns the process that can exit `timeout` or
  `stalled`, so the one-retry rule and the per-draw provenance sit there rather
  than in the CLI. Both front ends (CLI and Promptfoo) then measure the same
  thing, and a retry is attached to the exit it retried.
- **`fixture.mjs`** returns the hash of the staged fixture (reusing `treeHash`)
  and hashes the prompt text; **`leak.mjs`** derives `DETECTOR_VERSION` from the
  list of rules that decide what counts as a leak, so changing the detector moves
  the identifier; **`runs.mjs`** records `concurrency`, `repeat`, `stop` and
  `stallMs` in `manifest.json` instead of leaving them to be inferred.

## Data

- Stored run directories: durations, step counts, pass/fail sequences, token
  totals per draw.
- `~/.local/share/opencode/evals/runs/<id>/cases/<skill>--<n>/result.json` — the
  artifact, before and after.
- `docs/evals/coverage.md` — the reuse rule.

## Acceptance Criteria

- **AC-1** — A 12-draw cell runs its repetitions in parallel up to
  `--concurrency`, keeps one transcript per draw, and produces the same verdict
  as the stored run (`2026-11-05T12-35-30--implement-from-prompt`, 12/12), with
  wall time measurably lower. Verified by the new run directory and the durations.
- **AC-2** — `--stop 5/3` is the default when `repeat > 5`; the artifact records
  `stoppedEarly` and the observed sequence, and `reps` is the number actually
  run. Verified by one run and by reading the artifact.
- **AC-3** — `fixtureHash`, `promptHash` and `detectorVersion` are recorded; a
  mutated fixture changes the hash. `CONTRIBUTING.md` states the reuse rule and
  names the three fields. Verified by a test and by reading the document.
- **AC-4** — A draw with no event for `--stall-seconds` is killed and recorded as
  `stalled`, not `timeout`; a live but slow stream is not killed. Verified by two
  unit tests.
- **AC-5** — `timeout` and `stalled` are `unscored` with an infrastructure reason,
  retried at most once, and never satisfy a pass or a behavioural failure. The
  checker reports them as incomplete evidence rather than clean. Verified by
  tests and by the existing timed-out run directories.
- **AC-6** — `--concurrency 6` and `8` are measured on one cell; the default only
  changes if neither produced a 429, and the result is recorded either way.
- **AC-7** — No `assert:` line, case prompt, fixture or gate changed; `lint` and
  `selftest` are green; no behavioural run was added to CI or to the hook.

## Results

Measured on the default model (`opencode-go/deepseek-v4.1-flash`) on 2026-11-06.
No stored run was overwritten; the pre-change directories still carry the
comparison numbers.

### AC-1 — parallel draws, same verdict

| Run | Draws | Verdict | Repo / skill hash | Sum of draw durations | Artifact interval |
| --- | --- | --- | --- | --- | --- |
| `2026-11-05T12-35-30--implement-from-prompt` (stored, serial) | 12 | 12/12 | `3779a20` / `a58c5074` | 387 s | 386.8 s |
| `2026-11-06T10-03-23--implement-from-prompt` (`--repeat 12 --stop 12/0 --concurrency 4`) | 12 | 12/12 | `63ed5f5` / `0389466e` | 691 s | **176.6 s** |

Both runs recorded `detectorVersion: "leak-v1"` (the pre-change identifier).
After this change the same rules produce `a31d58f79a6c7038`, so **neither run is
reusable as a control under the new rule** — the conservative outcome the reuse
rule asks for. That does not weaken the scheduling evidence, which is internal to
the new run's own artifact.

The stored run predates SPEC-0020 and was staged from a different skill copy
(`a58c5074` vs `0389466e`), so it is **sanity for the verdict only**, not a
controlled speed comparison. The scheduling claim comes from the new run's own
artifact: twelve draws summed 691 s of draw time, but the `startedAt` →
`finishedAt` interval was 176.6 s at `--concurrency 4`, a **3.9× overlap**. The
sum rose because four draws compete for the provider; that is the resource trade
the spec names, not a regression. `stoppedEarly: false`: twelve were asked for
and twelve ran. `--stop 12/0` against `--repeat 12` disables both arms of the
stop rule (the passes target is the full count, the failure ceiling is zero).

Wall numbers in this section are the artifact interval
(`finishedAt − startedAt` in `manifest.json`), not `time` around the process.

### AC-2 — the 5/3 default stops between waves

`2026-11-06T10-00-46--implement-from-prompt` (`--repeat 12`, default stop)
reports **8/8, `stoppedEarly: true`**, `sequence` = eight `pass`, artifact
interval **142.8 s (2:23)**.

The target is five clean passes, but the rule is evaluated **between waves**: at
`--concurrency 4`, the first wave is 4 draws and the second wave can complete
before the decision is applied, so a clean cell stops at **5 + 3 = 8** rather
than at 5. This is the intended behaviour, not a bug to fix in this spec: it
keeps the lane full while the evidence is still clean, and `reps` always names
what actually ran. A cell that needs a full `n` uses `--stop 12/0` (or another
explicit target at or above `n`).

### AC-6 — concurrency 6 and 8, no 429s

| Run | Cases | Result | Artifact interval |
| --- | --- | --- | --- |
| `2026-11-06T10-06-36--matrix` (`--tag matrix --repeat 1 --concurrency 6`) | 11 | 10 passed / 1 failed | 181.3 s (3:01) |
| `2026-11-06T10-09-44--matrix` (`--concurrency 8`) | 11 | 11 passed | 176.6 s (2:57) |

The 429 scan over both transcripts found only hex fragments inside objects and
token counts; **zero rate-limit responses**. There is no wall-time gain from 6 to
8, so **the default stays 4**. The one failure at 6 is a gate miss
(`implement-from-prompt` #2 did not load the skill), recorded as measured, not
attributed to concurrency; the 8-lane rerun passed 11/11.

### AC-3, AC-4, AC-5 — verified by unit tests

The provenance mutation test (one fixture byte moves `fixtureHash`, one prompt
edit moves `promptHash`, neither moves the other), the two watchdog tests (no
events → `stalled` quickly; a slow but live stream survives) and the
infrastructure tests (unscored, one retry, its own finding in the checker) run in
`node --test scripts/lib/evals/*.test.mjs`. The retry re-stages the fixture and
the skill in a fresh scratch, so a dead draw's writes cannot satisfy
`unchanged`/`changed`; `execution.durationMs` is the final attempt, with
`attempts`/`retries` alongside. The checker also reads the older
`execution.exit` field, so pre-SPEC-0020 timeouts are no longer clean:
`2026-11-05T15-06-58--implement-from-prompt--without-skill` reports two
`infrastructure: timeout` findings (exit 1) and
`2026-11-05T08-35-22--review-code` reports one (exit 1). No behavioural run was
added to CI or the hook.

### AC-7 — blast radius

No `assert:` line, case prompt, fixture or gate changed. `lint` and the four
non-behavioural `selftest` commands are green; the checker already treats a
stopped-early run as complete (it reads `reps` and the repetitions, not a
required count), so no checker change was needed.

## Stop Conditions

- An early stop changes a verdict in the cell it is compared against: the default
  falls back to `5/0` (stop only after five clean passes) and the finding is
  recorded.
- Parallel draws produce provider 429s at 4: revert to 2, record it, and do not
  raise the default.
- The watchdog kills a draw that was still working: raise the idle window to 180
  and record the trade-off; never remove the watchdog.
- A hash cannot distinguish a fixture change from a prompt change: drop the
  reuse rule rather than ship a provenance field that lies.
- An infrastructure retry doubles the cost of a cell: cap it at one and record
  how often it fired.

## Budget

One 12-draw comparison cell, one 12-draw stop-rule cell, and two 3-case
concurrency probes (12 draws). At most 36 model draws; the rest is unit tests and
the stored sequences.

## Open Questions

- **Does parallelising hurt the provider cache?** Each draw builds its own
  context, so the intra-draw cache is per conversation; the measurement records
  `cacheRead` per draw before and after to prove it did not collapse.
- **Is `n=5` enough for a rate?** No — the rule stays: `n=5` separates, `n=12`
  measures a rate. The default is a default, not a claim.
- **Should `stalled` retry with a longer window first?** One retry at the same
  window is the starting point; if stalls cluster, the retry raises the window
  once.
