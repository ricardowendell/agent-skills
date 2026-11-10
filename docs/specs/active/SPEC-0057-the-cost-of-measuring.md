---
id: SPEC-0057
title: The cost of measuring
status: ready
priority: P1
task: TASK-93
created_at: 2026-11-10
updated_at: 2026-11-10
source_docs:
  - backlog/tasks/task-93 - evals-o-custo-da-medicao-—-staging-clock-seam-e-staleness-SPEC-0057.md
  - docs/evals/coverage.md
  - docs/specs/SPEC-0053-a-deterministic-watchdog-test.md
  - docs/specs/SPEC-0055-audit-code-quality-architecture-and-deterministic-checks.md
  - docs/specs/SPEC-0056-review-proportional-to-diff-risk.md
related_decisions: []
depends_on: []
blocks: []
files:
  - scripts/lib/evals/fixture.mjs
  - scripts/lib/evals/fixture.test.mjs
  - scripts/lib/evals/assertions.mjs
  - scripts/lib/evals/assertions.test.mjs
  - scripts/lib/evals/agent.mjs
  - scripts/lib/evals/agent.test.mjs
  - scripts/lib/evals/execute.mjs
  - scripts/lib/evals/runs.mjs
  - scripts/lib/evals/runs.test.mjs
  - scripts/lib/evals/parse.mjs
  - scripts/lib/evals/parse.test.mjs
  - scripts/run-evals.mjs
  - scripts/check-staleness.mjs
  - scripts/check-staleness.test.mjs
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0057-the-cost-of-measuring.md
  - CHANGELOG.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node --test scripts/check-staleness.test.mjs
  - node scripts/check-staleness.mjs --check
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0057-the-cost-of-measuring.md --base main
---

## Purpose

Three harness defects cost money or hide evidence, and none of them needs a model
call to find.

1. **A fixture that resolves to nothing is not an error.** `stageFixture` returns
   an empty scratch when a `git.json` `base` does not resolve
   (`scripts/lib/evals/fixture.mjs:121`), so a case with a broken pointer is
   audited as an empty directory. That is exactly how SPEC-0055's case 9 spent
   five paid draws on a cell that had to be thrown away. A `patch` that fails to
   apply *does* throw; a `base` that fails to resolve does not.
2. **The watchdog test costs 4.5 s of a 4.9 s suite.** `runAgent` reads
   `Date.now()` and real timers directly (`scripts/lib/evals/agent.mjs:66`), so
   the only way to prove the reset without a clock seam is to wait for real
   seconds. SPEC-0053 chose that shape deliberately and said so.
3. **`skillHash` is written and printed, never compared.** `runs.mjs:124`
   records it and `replay-evals.mjs:404` shows twelve characters of it; no script
   reads it to decide whether a published cell still describes the current skill.
   SPEC-0056's AC-6 hole — cases 3–6 measured at an older hash — was found by a
   human reading manifests. `docs/evals/coverage.md` publishes rates that nothing
   checks.

## User Outcome

- A broken fixture fails at authoring or staging time, before a draw is spent.
- The harness suite runs in about a second without losing the watchdog guarantee.
- A stale published cell is reported by a command, not noticed by a reviewer.

## Scope

### F1 — staging failures are loud

- `fixture.mjs` — an unresolvable `base` throws, naming the case, the resolved
  path and the fixture directory. Silent empty scratch is removed.
- `parse.mjs` `validate()` — reports an unresolvable `base` at authoring time, so
  `--list --check` catches it in CI without staging anything.
- `parse.mjs` `validate()` — every regex-bearing assertion (`reply`, `noreply`,
  `filematch`, `ran`, `ranpass`) must compile through `safeRegex`.
- `run-evals.mjs` stage path — every filesystem assertion (`file`, `nofile`,
  `dir`, `nodir`, `filematch`, `unchanged`, `changed`) must have a target the
  base or the patch can actually produce. A `filematch docs/backlog/*` where
  nothing in the fixture creates `docs/backlog/` is an authoring error, not a
  healthy red cell.

### F2 — a clock seam for `runAgent`

- `agent.mjs` — `runAgent` accepts injected `now`, `setTimeout` and
  `clearTimeout`, defaulting to the real ones. The seam is not reachable from the
  CLI and no production call site changes behaviour.
- `agent.test.mjs` — the watchdog tests drive the clock and finish in
  milliseconds. One integration test keeps the real clock with a short window and
  still proves that a stream which emits only at the start dies.

### F3 — staleness is a query, not an anecdote

- **A — per-file hashes.** Each draw records `skillHashes: { rel: hash }` for the
  files that govern it. The existing `skillHash` keeps the tree hash so every
  stored manifest and every published citation stays valid.
- **B — `governs:`.** A case may declare `governs:` with skill-relative paths;
  absent means the whole skill tree (**the conservative default chosen at
  review**). `validate()` rejects a path that does not exist in the skill.
- **C — `scripts/check-staleness.mjs`.** For every cell cited in
  `docs/evals/coverage.md`, compare the governed hashes recorded by the cited run
  with the working tree and list the stale cells. Default is a report, exit 0;
  `--check` exits 1 when any cited cell is stale.

## Non-Goals

- **No concurrency change.** `concurrency 4` stays. The 4-vs-8 experiment was
  considered and rejected; a wave's cost is dominated by draw count and setup
  waste, not by harness overhead.
- **No gate.** `check-staleness` is report-only in this spec. It enters
  `docs/pipeline.md` and CI only after a clean first pass, as its own change.
- **No skill, fixture or oracle edit.** No `SKILL.md`, no case, no assertion
  changes. The 97 parsed cases and every published rate stay identical.
- **No paid draw.** Every acceptance criterion below is provable with local
  commands.
- **No new dependency.** `check-staleness` uses `node:fs` and the existing hash
  helper.

## Flow

1. **F1 — loud staging.** Add the throw, the authoring check and the oracle
   reachability check. Prove both regressions with a broken `base` and a dead
   `filematch`.
2. **F2 — clock seam.** Inject the clock, convert the watchdog tests, keep one
   real-clock integration test, and measure the suite before and after.
3. **F3-A/B — record and declare.** Per-file hashes in the draw and `governs:` in
   the parser and validator.
4. **F3-C — report.** Write `check-staleness.mjs`, run it against the current
   `coverage.md`, and publish the initial stale list.
5. **F4 — publish.** `coverage.md` notes how staleness is reported, `CHANGELOG.md`
   gets the entry, and the spec gets a `## Results` with the measured timings.

## Data

- `scripts/lib/evals/{fixture,parse,assertions,agent,execute,runs}.mjs` and their
  tests.
- `scripts/run-evals.mjs` for the stage-time oracle check.
- New `scripts/check-staleness.mjs` and its test.
- `docs/evals/coverage.md` for the cited cells and the reporting note.
- Existing run store under `~/.local/share/opencode/evals/runs/` (read-only).

## Acceptance Criteria

1. A `git.json` whose `base` does not resolve fails staging with an error naming
   the case, the resolved path and the fixture directory; no draw starts.
2. `--list --check` reports that same broken `base` without staging anything, so
   CI catches it.
3. `validate()` rejects a regex assertion that does not compile through
   `safeRegex`.
4. At stage time, a filesystem assertion whose target neither the base nor the
   patch can produce is an error naming the case and the path.
5. `runAgent` accepts `now`, `setTimeout` and `clearTimeout`, defaults to the real
   ones, and no CLI flag reaches them. Every existing call site keeps its
   behaviour.
6. The watchdog tests are deterministic and finish in under 500 ms; one
   integration test keeps the real clock with a short window and still shows a
   start-only stream dying as `stalled`.
7. `node --test scripts/lib/evals/*.test.mjs` drops from 4.9 s to under 2 s on
   this machine, measured before and after and published in Results.
8. Each draw records `skillHashes: { rel: hash }` for the files that govern it,
   and `skillHash` still carries the tree hash.
9. A case may declare `governs:`; absent means the whole skill tree; `validate()`
   rejects a path that is not in the skill; the resolved list is recorded in the
   draw.
10. `scripts/check-staleness.mjs` lists every stale cited cell in
    `docs/evals/coverage.md`, exits 0 by default and 1 under `--check`.
11. `check-staleness` is report-only: it is not added to CI, not added to
    `docs/pipeline.md`, and the spec records that promoting it to a gate is a
    follow-up after the first clean pass.
12. The clock-seam reversal of SPEC-0053 is recorded in a `## Decisions` section
    citing that spec's "no clock seam" note; SPEC-0053 itself is not edited.
13. No skill text, fixture or oracle changes; `--list --check` still parses 97
    cases (94 runnable, 3 manual); zero paid draws.

## Decisions

- **The clock seam supersedes SPEC-0053's "no clock seam" note.** SPEC-0053 chose
  a real-clock test with a wide margin because `runAgent` exposed no injectable
  time. That decision is superseded here: the seam is a testability change, not a
  measurement change, and it makes the watchdog test both faster and
  deterministic. SPEC-0053 stays as the historical record and is not edited. No
  ADR directory exists in this repo, so the decision lives here, next to the
  change it governs.
- **`governs:` defaults to the whole skill tree.** A narrower declaration is
  opt-in. Nothing becomes more permissive without an explicit line, so no case
  can quietly claim freshness it does not have.
- **`check-staleness` reports before it gates.** On its first run it will name
  cells that are already known to be stale (review-code cases 3–6 among them).
  Publishing that list is the point; turning it into a gate on a repository that
  is already red would make the gate meaningless.

## Open Questions

None. The three policy choices above were settled at review on 2026-11-10.

## Prompt Notes

- Read `fixture.mjs:115–123` first: the bug is one `return`, and the contrast with
  `applyPatch` (which throws) is the whole argument.
- Keep the seam out of the CLI surface. If a flag can set the clock, a paid run
  can lie about its own duration.
- `check-staleness` must read the stored manifests, never the live store's
  `baseline.json`/`last-run.json`: those are not evidence.
- Do not touch `skills/`. If a test needs a skill fixture, build a temporary one.

_Filled during implementation._
