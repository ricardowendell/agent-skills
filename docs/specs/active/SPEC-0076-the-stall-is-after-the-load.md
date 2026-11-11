---
id: SPEC-0076
title: The stall is after the load, and the answer is not a longer wait
status: implemented
priority: P2
task: TASK-50
created_at: 2026-11-11
updated_at: 2026-11-11
source_docs:
  - backlog/tasks/task-50 - evals-o-5-do-the-write-implementation-prompt-stalls-depois-do-load.md
  - docs/specs/SPEC-0030-write-implementation-prompt-regression.md
related_decisions: []
depends_on: []
blocks: []
files:
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0076-the-stall-is-after-the-load.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0076-the-stall-is-after-the-load.md --base main
---

## Purpose

`write-implementation-prompt` #5 has no stall-free cell. In `SPEC-0030`'s two
trigger runs, 4 of 10 draws died on the watchdog **after** the skill loaded: the
`skill` tool call lands between 0.2 s and 2.4 s, then the stream goes silent and
the 120 s watchdog kills the draw. `19-32-45` r1 ran 161.6 s and r4 27.2 s;
`19-53-34` r3 355.0 s and r5 145.0 s. Every one needed a retry, and `19-32-45` r2
stalled on the first attempt and passed on the second.

The load is measured 10/10. What is missing is a stall-free run, and the open
question is where the silence comes from: provider, runner, or prompt.

The task is explicit: do not spend draws without a hypothesis. This spec
diagnoses from the stored manifests and event gaps, commits to one cause, and
says what would falsify it.

## User Outcome

- The stall has a named cause with evidence, or an explicit "cannot separate these
  two", instead of four more draws that produce the same silence.
- The policy stays: `stallMs` 120 s, one `--resume` after a stall, never a longer
  wait to make a cell pass.
- `#5` is published for what it is: a trigger case with a load rate, not a
  behavioural cell.

## Scope

### F1 — read the four stalls

For each stalled draw (`19-32-45` r1/r4, `19-53-34` r3/r5) and the retried one
(`19-32-45` r2), from the stored transcript and `result.json`:

- the timestamp of the last event before the gap, and of the kill;
- the last tool call and whether it was the `skill` load or work after it;
- the draw's token/usage counters if recorded;
- whether the retry of the same case produced a longer or shorter run.

### F2 — separate the three candidates by what the store can show

- **provider** — the stream stops after a request was sent: no further tool call,
  no partial text, and the same model/size produced normal runs elsewhere.
- **runner** — the watchdog fires while the child is still alive and writing; the
  event gap is shorter than the wall clock of a normal draw of the same case.
- **prompt** — the case asks for a long generation (a full prompt file), and every
  stall is on that case only, with the same shape on a second run.

A candidate is adopted only if the store separates it. If two remain, the spec
says so and publishes the pair.

### F3 — publish the decision and the cell's status

- `docs/evals/coverage.md`, the `write-implementation-prompt` row: `#5` stays a
  trigger case with `loaded 5/5` and **no behavioural cell**; the four stalls are
  named with their durations, and the row says which cause the store supports.
- If the cause is the runner's watchdog, the fix is a named follow-up, not a
  longer timeout: the watchdog should distinguish "no bytes from the child" from
  "the child is thinking". If it is the provider, the follow-up is a retry policy,
  already observed. If it is the prompt, the case is refused as unmeasurable at
  n=5 and stays a trigger-only case.

## Non-Goals

- **No paid draw.** The task forbids draws without a hypothesis, and this spec is
  where the hypothesis is chosen.
- **No `stallMs` change.** 120 s is policy (`TASK-50` fixed it).
- **No re-scoring of the stalled draws.** They stay `unscored`.
- **No change to `write-implementation-prompt`.**

## Flow

1. **F1** — the five draws, one table.
2. **F2** — the three candidates, each with the observation that would confirm or
   exclude it.
3. **F3** — the published row and the named follow-up.

## Data

- `~/.local/share/opencode/evals/runs/2026-11-06T19-32-45--write-implementation-prompt`
  and `…19-53-34--write-implementation-prompt` — the two trigger runs.
- `docs/specs/SPEC-0030-…md` — the original measurement.
- `scripts/lib/evals/execute.mjs` — the watchdog and its event-gap accounting.
- `docs/evals/coverage.md` — the `write-implementation-prompt` row.

## Acceptance Criteria

1. The five draws are tabulated with last-event time, kill time, last tool call,
   duration and retry outcome.
2. Each of the three candidates is marked confirmed, excluded, or undecided, with
   the observation that decided it.
3. The published row states `#5` as a trigger case with no behavioural cell and
   names the supported cause.
4. The named follow-up says what it would change and what it would not (no longer
   timeout to make a cell pass).
5. Zero paid draws; every command in `tests:` exits 0.

## Decisions

- **The store decides, not another draw.** Four stalls are the same event four
  times; a fifth reproduces the silence, not the cause.
- **"Cannot separate" is a valid result.** If the manifests do not distinguish
  provider from runner, the spec publishes both and the follow-up is the
  instrumentation that would separate them — cheaper than a draw.
- **The bar does not move.** No stall-free cell means `#5` stays a trigger case;
  it does not become a behavioural one because its load rate is good.

## Open Questions

None.

## Prompt Notes

- The event gap is in the draw record (`infrastructure: stalled` and the last
  event time); do not recompute it from the markdown if the field exists.
- Compare against a **normal** draw of the same case (the retried one) before
  calling the gap anomalous.

## Results

Zero draws. The five draws below are the two stored `SPEC-0030` trigger runs,
read through `result.json` first and through the transcript only for the last
event and the tool spans. No `--resume`, no judge, no re-score, no `stallMs`
change.

### F1 — the five draws

One correction to the Purpose's numbers: 161.6 s, 27.2 s, 355.0 s and 145.0 s are
the **time to the last event** of the retried attempt, not draw durations.
`execute.mjs:153` keeps only the final attempt ("the final attempt owns the
duration"), so each of those four records the *retry*, which stalled as well; the
first attempt's duration is not in the store. Each killed attempt is therefore
about 120 s longer than the number the Purpose quotes: the work ran to that point
and then stayed silent for the whole watchdog window.

| draw | last event before the gap | kill | gap | last tool call before the silence | duration (`execution.durationMs`) | retry | recorded reason |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `19-32-45` r1 | `step_start` +161.6 s (22:45:30.897Z), 1.1 s after a `step_finish` | +285.3 s (22:47:34.629Z) | 123.7 s | `shell` `pwd; ls -la "$(dirname …)" \| grep eval-writ` at +160.4 s | 285.3 s | 1 retry, also `stalled` | `unscored`, `infrastructure: true`, `stalled` |
| `19-32-45` r2 | `step_finish` (`stop`) +39.7 s (22:43:29.154Z) | none — exit 0 at +43.7 s (22:43:33.166Z) | — | `shell` at +29.8 s, then the reply | 43.7 s | 1 retry, **retry passed** | `passed`, `infrastructure: false`, `null` |
| `19-32-45` r4 | `step_start` +27.2 s (22:38:58.947Z), 1.0 s after a `step_finish` | +150.9 s (22:41:02.583Z) | 123.6 s | `shell` `ls -la /private/var/folders/…/T \| head -50` at +26.2 s | 150.9 s | 1 retry, also `stalled` | `unscored`, `infrastructure: true`, `stalled` |
| `19-53-34` r3 | `step_start` +355.0 s (23:03:36.712Z), 1.2 s after a `step_finish` | +477.7 s (23:05:39.430Z) | 122.7 s | `shell` `for v in 1 2 3 4; do d=$(ls -d /private/…` at +353.8 s | 477.7 s | 1 retry, also `stalled` | `unscored`, `infrastructure: true`, `stalled` |
| `19-53-34` r5 | `step_start` +145.0 s (23:03:26.775Z), 1.3 s after a `step_finish` | +268.4 s (23:05:30.091Z) | 123.3 s | `glob` `**/*` under `/private/var/folders/…/T` at +143.8 s | 268.4 s | 1 retry, also `stalled` | `unscored`, `infrastructure: true`, `stalled` |

The gap is `kill − last event`; the watchdog threshold is 120 s. Do not read
`durationMs − last event` as silence: the passing `19-32-45` r2 shows 4.0 s for
the same subtraction (43.670 vs 39.658) with no stall at all. Usage is the final
attempt's, so it describes the retry: r1 6 steps / 10 calls / 596 output tokens,
r4 4 / 4 / 345, r3 28 / 33 / 3153, r5 8 / 8 / 770; the passing r2 is 6 / 7 /
1001. The four stalls therefore land after 10, 4, 33 and 8 tool calls — four
different points of the draw.

The comparison draw is `19-32-45` r2: same case, same skill hash, same prompt,
same model, and its retry finished in 43.7 s. It passed **without doing the
work** — its closing text is "I stopped before writing anything. The spec isn't
here." The case's only assertion is "loaded the skill", so a draw that gives up
passes and a draw that keeps looking is the one that gets killed.

### F2 — the three candidates

- **prompt — excluded.** The case-5 workload does not line up with the stalls.
  They occur at four different points (27.2 s / 161.6 s / 145.0 s / 355.0 s,
  after 4 / 10 / 8 / 33 tool calls), two of them before the model has read any
  spec, so they are not "the step that generates the prompt file". The one clean
  pass generates nothing at all (above), and the draws that completed the case in
  those runs took 43.7–384.6 s. A long generation is neither necessary (the pass
  generates nothing) nor sufficient: `#6`, the near-miss, has the same profile
  (host-hunt tool runs of 111.5 s and 90.7 s) and passed 5/5 in `19-32-45`. What
  the case *does* contribute, and the store shows it
  plainly: the fixture is empty (`fixtureHash e3b0c442…` is the sha256 of the
  empty file), so the prompt names a `SPEC-0012` that was never staged and the
  draw hunts for it on the host — tool runs of 102.31 s and 17.34 s in r1 and
  108.12 s in r5 (`state.time`). That condition makes the silent windows long;
  it is not the candidate as stated, and changing the case is out of this
  spec's scope.
- **runner — confirmed at the level of the record.** `agent.mjs:138–148` counts
  *bytes* on stdout/stderr, and this stream writes a line only when an event
  completes, so a generation and a running tool both produce no bytes at all.
  The store shows the second directly: in `19-53-34` r3 the model emitted its
  `ls -la …/docs/specs; find … -name 'SPEC-0012*'` call 0.48 s after the
  `step_start` (+193.993 → +194.472 s), the shell then ran **118.51 s** with
  nothing on the stream and `exit 0` (`state.time` +194.472 → +312.980 s), and
  that same attempt was killed at +477.748 s, 122.7 s after its last event.
  Host-hunt runs of 102.31 s and 17.34 s (r1) and 108.12 s (r5) have the same
  shape, and the near-miss `#6` reached 111.5 s (`19-32-45` r5) and 98.5 s
  (`19-53-34` r2). A live child doing
  118.5 s of legitimate work is 1.5 s from the watchdog, and a byte-based
  watchdog cannot tell it from a dead stream at all. What this does not
  establish: what was happening inside the *killed* window — the last event
  before every kill is a `step_start`, no `tool_use` completed after it, so a
  tool run, a generation and a dead stream are indistinguishable there.
- **provider — undecided.** The expected signature is present in all four: the
  last event is the child's own `step_start` (it records a step opening, not that
  a request was sent), then no tool call, no text, and no `provider.*` frame
  anywhere in the stream — the `error` field is absent from every stalled
  `execution` — while normal draws of the same case exist. That is not decisive:
  a 121 s silent generation produces the same zero bytes, the store keeps no
  heartbeat, no token-delta trace and no provider log, and a **third state** is
  just as invisible: a long host-hunt tool (118.51 s observed) emits zero bytes
  with no provider involved at all. The killed window cannot be separated from
  that live-but-quiet tool either — the same condition the empty fixture
  creates.

**Published pair: runner confirmed, provider undecided; prompt excluded.** The
store separates the case from the silence and the threshold from the child's
state. It cannot separate "the stream died" from "the child is working quietly" —
a generation and a host-hunt tool both emit zero bytes — and that is cheaper to
instrument than to draw again.

**Falsifier for the runner verdict:** a stall that opens with a `provider.*`
frame, or a kill that lands well before 120 s of silence (bytes still arriving).

### F3 — published row and follow-up

`docs/evals/coverage.md`, the `write-implementation-prompt` row: `#5` stays a
**trigger case** with `loaded 5/5` in both runs and **no behavioural cell**; the
four stalls are named with their durations (285.3 s, 150.9 s, 477.7 s, 268.4 s,
each killed at the 120 s watchdog, 122.7–123.7 s after its last event, retried
once, retry stalled too); the row
states the supported cause — the runner's byte-based watchdog, with the provider
undecided and prompt excluded — and does not promote the case.

**Named follow-up (one, not a timeout change):** give the child a **heartbeat** —
a liveness line from the child process itself, independent of its event output,
so a live-but-quiet child (a 118.5 s tool run, a long generation) is
distinguishable from a dead stream. That is the signal that would have fired on
these four kills, and the same trace would decide the provider. It would not
raise `stallMs`, would not make `#5` a behavioural cell, and would not re-score
these four draws.

### Gates

Every command in `tests:` exits 0; see the commit for the recorded output.
