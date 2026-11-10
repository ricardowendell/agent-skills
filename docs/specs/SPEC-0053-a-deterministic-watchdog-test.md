---
id: SPEC-0053
title: A watchdog test that does not race the machine
status: implemented
priority: P1
task: TASK-88
created_at: 2026-11-10
updated_at: 2026-11-10
source_docs:
  - backlog/tasks/task-88 - evals-o-teste-do-watchdog-e-flaky-sob-carga-agent.test.mjs-62.md
  - scripts/lib/evals/agent.test.mjs
  - docs/specs/SPEC-0052-the-eval-store-is-an-answer-key.md
related_decisions: []
depends_on: []
blocks: []
files:
  - scripts/lib/evals/agent.test.mjs
  - docs/specs/SPEC-0053-a-deterministic-watchdog-test.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/SPEC-0053-a-deterministic-watchdog-test.md --base main
---

# SPEC-0053: A watchdog test that does not race the machine

## Purpose

`scripts/lib/evals/agent.test.mjs` has a test that writes five events 30 ms
apart and sets a 300 ms stall window. Under load the scheduler can leave a gap
longer than 300 ms, the watchdog kills a live stream, and the test fails with
"expected a clean exit, got stalled". It failed twice during the SPEC-0052
verification (301 ms each) and passed only on retry.

A gate that flakes is a gate people learn to ignore. This spec fixes the test,
not the watchdog: the production semantics (`stallMs`, the hard timeout, the
`stalled` classification) must not move.

## User Outcome

The eval suite stops flaking on the watchdog test, while a real regression that
kills a live stream still fails. Commits and `pdlc verify` no longer depend on
machine load.

## Scope

- Only `scripts/lib/evals/agent.test.mjs`.
- Remove the wall-clock race. Prefer the smallest change that makes the test
  deterministic:
  - a child paced by a handshake the test controls (for example, it waits for a
    file or a line on stdin before writing the next event), or
  - a clock/timer seam if `runAgent` already exposes one.
- A wider window alone is acceptable only if it is justified by a reproduced
  load and the test still proves the same property; widening until green is not
  a fix.
- Keep the intent: a live stream below the idle window survives; a silent stream
  is still killed. The existing silent-stream test stays.

## Non-Goals

- No change to `scripts/lib/evals/agent.mjs` or its defaults.
- No new dependency, test framework or eval runner.
- No lowering of the gate, no `skip`, no retry inside the test.
- No paid draw.

## Flow

1. **F0 — reproduce.** Run the evals test file with a load that reproduces the
   301 ms gap; record the failing run.
2. **F1 — rewrite.** Replace the timing race with the handshake or the clock
   seam. Keep the assertion that the process exits cleanly.
3. **F2 — prove.** Run the evals suite ten consecutive times and the silent
   stream test once.
4. **F3 — gates.** Run the eight `tests:` commands.

## Data

- `scripts/lib/evals/agent.test.mjs` — the test and any local helper.
- `runAgent`, `isStalled` and the existing stall test.
- The failing evidence from SPEC-0052's verify: 301 ms against a 300 ms window.

## Acceptance Criteria

1. The live-stream test passes 10/10 consecutive runs of
   `node --test scripts/lib/evals/*.test.mjs` on a loaded host.
2. The silent-stream test still fails as `stalled`; the watchdog still kills an
   idle child.
3. `scripts/lib/evals/agent.mjs` is byte-identical (no production change).
4. All eight `tests:` commands pass.
5. No paid draw and no new dependency.

## Results

**F0 — reproduced, source not isolated.** The original failure is the 301 ms gap
against the 300 ms window observed under load during the SPEC-0052 verify
(TASK-88). In the worker reproduction the old shape failed under a 350 ms block
of the parent event loop (`stalled` at 352 ms, no events observed). A separate
reviewer run that blocked the parent for 2000 ms did not reproduce it, so the
exact source of the gap — a slip in the child `setInterval` or parent
scheduling — is not isolated. The rewrite therefore does not depend on a claimed
cause: it keeps a 15x margin between pacing and window and runs for three
windows.

**F1 — rewritten test.** `stallMs = 1500`, child gap 100 ms, 45 ticks,
`timeoutMs = 15000`. It asserts a clean exit, `durationMs > 2 * stallMs`, and at
least `ticks / 2` events observed.

**F2 — proof.**

- 10/10 consecutive `node --test scripts/lib/evals/*.test.mjs` runs under load
  ~43 (24 busy loops) in the worker.
- 15/15 under load ~34 in the independent review.

**Mutation.** Shrinking the window 20x (`stallMs = 75`) makes the unchanged test
fail with `stalled`, so the assertions are not vacuous.

**Gates.** All eight `tests:` commands pass; `pdlc preflight` passes.

## Open Questions

- **Handshake or clock seam?** The handshake is local to the test and proves the
  real child; the clock seam is smaller but changes the module. Choose the
  handshake unless the module already has an injectable clock.
- **How much load?** Reproduce a gap above 300 ms, not a synthetic sleep. The
  point is that the old shape fails under the same conditions the suite meets.

## Prompt Notes

- **Requirements:** make the live-stream test deterministic without changing the
  watchdog; keep the silent-stream test as the negative control.
- **Entities:** `runAgent`, `stallMs`, `timeoutMs`, `isStalled`, the child
  process, the event gap.
- **Approach:** pace the child from the test; compare the last event time with
  the window; assert a clean exit and a duration below the hard timeout.
- **Safeguards:** never mark the test `skip`; never raise `stallMs` in
  `agent.mjs`; no retry inside the test; no paid draw.
- **Tests:** ten consecutive evals-suite runs plus the eight gates.
