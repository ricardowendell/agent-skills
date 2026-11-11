---
id: SPEC-0076
title: The stall is after the load, and the answer is not a longer wait
status: ready
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

_Filled during implementation._
