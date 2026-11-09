---
id: SPEC-0049
title: A corpus hit under enforcement is a denied attempt
status: implemented
priority: P1
task: TASK-74
created_at: 2026-11-09
updated_at: 2026-11-09
source_docs:
  - backlog/tasks/task-74 - evals-sob-enforcement-hit-do-corpus-e-tentativa-negada.md
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0046-deny-control-arm-corpus.md
  - docs/specs/active/SPEC-0048-a-denied-read-is-not-a-leak.md
  - docs/specs/active/SPEC-0047-remeasure-under-deny-layer.md
related_decisions: []
depends_on:
  - SPEC-0046-deny-control-arm-corpus
  - SPEC-0048-a-denied-read-is-not-a-leak
blocks:
  - SPEC-0047-remeasure-under-deny-layer
files:
  - scripts/lib/evals/leak.mjs
  - scripts/lib/evals/leak.test.mjs
  - scripts/lib/evals/runcheck.mjs
  - scripts/lib/evals/runcheck.test.mjs
  - scripts/lib/evals/evidence.mjs
  - scripts/lib/evals/evidence.test.mjs
  - scripts/run-evals.mjs
  - scripts/check-eval-run.mjs
  - scripts/replay-evals.mjs
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0049-a-corpus-hit-under-enforcement-is-a-denied-attempt.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0049-a-corpus-hit-under-enforcement-is-a-denied-attempt.md --base main
---

# SPEC-0049: A corpus hit under enforcement is a denied attempt

## Purpose

SPEC-0048 taught the detector to separate a denied read from a leak, but it
requires a denial line naming the path. A bare agent discards stderr: SPEC-0047's
resumed control ran `ls /Users/wendell/.agents/skills 2>/dev/null`, so nothing in
the transcript names that path with `Operation not permitted` and the detector
published a `leak`. Only the parent `/Users/wendell/.agents/` and
`/Users/wendell/.agents/commands` carry a denial. The cell ended 4/5 clean and
the wave halted again.

The boundary already carries the invariant the detector is trying to prove from
the transcript: **the profile denies every corpus root, and the canary fails if
it does not cover one.** Under `enforced: true` there is no successful corpus
read to detect — only attempts. Asking the transcript to prove each refusal
line by line is redundant and, as measured, unreliable.

A second, unrelated inconsistency surfaced in the same halt: `runcheck.mjs` uses
exact detector-hash equality for `isolated`, while `evidence.mjs` already accepts
a run by capability (`host-reads`). A v2 run that was clean is therefore
`isolated=unknown` to one reader and acceptable to the other, which invalidated
the reused with-skill arm of SPEC-0047 without any new evidence.

## User Outcome

A measurement reader sees one rule: an enforced run that only *tried* to read
the corpus is clean, the attempt is still counted as `denied`, and a pre-v3 run
that already looked for host reads is judged by that capability rather than by
its hash. A wave can produce a verdict on a probing control.

## Scope

- **The enforced flag reaches the detector.** `findLeaks`/`leaksIn` receive the
  run's enforcement state. Under `enforced: true`, a corpus hit is `denied`
  unless the call demonstrably returned that path's content (a non-shell success,
  or an output line naming the path outside a denial).
- **Without enforcement nothing changes.** The v2 rule stands: a corpus path in
  the input is a `leak`/`host`, because the read could have succeeded.
- **`runcheck` adopts the capability rule.** `isolated` requires the detector
  that judged the run to have `host-reads`, not to equal the current digest. A
  v2 clean run reports `isolated=yes`; a v1 run stays `unknown`.
- **One rule, two readers.** `check-evidence` and `check-eval-run` must agree on
  the same run and the same claim.
- **The replay proves both.** The #19 control from the second resume
  (`2026-11-09T10-59-41--…--without-skill`) becomes five clean draws with
  `deniedDraws ≥ 1`, and the v2 with-skill run `07-37-44` reports
  `isolated=yes`.
- **Publication.** `docs/evals/coverage.md` states the enforced rule;
  `CHANGELOG` entry.

**Blast radius.** The detector's classification under enforcement and the
summary's isolation verdict. No boundary, no case, no fixture, no skill.

## Non-Goals

- No change to the seatbelt profile or the corpus roots (SPEC-0046).
- No paid draw and no re-run; the proof is a replay of stored transcripts.
- No verdict for any cell. SPEC-0047 publishes those.
- No change to the five-draw rule, the with-skill artefact, the skill text, the
  templates or Python.
- No new case and no fixture edit.

## Flow

1. **F0 — thread the state.** Pass `enforced` from the run manifest into the
   detector on both the run path and the replay path.
2. **F1 — classify.** Under enforcement, a corpus hit with no demonstrable
   content is `denied`; the content override stays.
3. **F2 — unify the verdict.** `runcheck` uses `hasCapability(version,
   "host-reads")` instead of digest equality.
4. **F3 — prove.** Re-judge the two stored runs and record the before/after.
5. **F4 — publish.** Coverage rule and CHANGELOG.

## Data

- `scripts/lib/evals/leak.mjs` — `findLeaks`, `leaksIn`, `classifies`,
  `DETECTOR_VERSION`, `hasCapability`.
- `scripts/lib/evals/runcheck.mjs` — `checkRun`, the `isolated` derivation at
  `:233` and `:253`.
- `scripts/lib/evals/evidence.mjs` — already capability-based; confirm it agrees.
- `scripts/run-evals.mjs:667` and `scripts/replay-evals.mjs:270` — the two
  callers that must pass the state.
- Stored runs: `2026-11-09T10-59-41--bootstrap-project-harness--agentworks-deepseek-v4-1-flash--without-skill`
  and `2026-11-09T07-37-44--bootstrap-project-harness--agentworks-deepseek-v4-1-flash`.
- `docs/evals/coverage.md`, `CHANGELOG.md`.

## Acceptance Criteria

1. **A suppressed probe is denied.** Under `enforced: true`, a corpus path named
   in a call that returned no content for it — including `… 2>/dev/null` — is
   recorded `denied`, not `leak`/`host`.
2. **No enforcement, no change.** The same transcript judged with
   `enforced: false` still produces a `leak`/`host` for that path.
3. **A real read still loses.** A call that demonstrably returned the path's
   content (a non-shell success, or an output line naming the path outside a
   denial) still produces a `leak`, even under enforcement.
4. **One verdict for isolation.** `runcheck` decides `isolated` by the
   `host-reads` capability: a v2 clean run is `yes`, a v1 run is `unknown`, and
   the answer matches `check-evidence` for the same run.
5. **The replay proves it.** The #19 control `10-59-41` replays to five clean
   draws with `deniedDraws ≥ 1` and `isolated=yes`; the v2 with-skill run
   `07-37-44` reports `isolated=yes`. Recorded in `## Results`.
6. **The detector version moved** if a rule or the classification changed, and
   `check-evidence` still exits 0 without rewriting a published citation.
7. **Nothing else moves.** No boundary, case, fixture, skill text, template or
   Python change; every `tests:` command passes.

## Results

Replay-only: no draw was run and no run directory was written. Detector v4 is
`d3e95ef948f983b7` (v3 was `d8478beab04a4e3e`).

**Before (v3).**

```
# control 10-59-41 — replay --leaks
bootstrap-project-harness#19 → dirty(leak)  [5 draw(s)]  isolated=no  deniedDraws=1
# control 10-59-41 — check-eval-run (stored artefact)
findings=1 skillLeaks=1 hostReads=0 isolated=no deniedDraws=1
# with-skill 07-37-44 — check-eval-run (stored artefact)
findings=0 skillLeaks=0 hostReads=0 isolated=unknown deniedDraws=0
```

**After (v4).**

```
# control 10-59-41 — replay --leaks
bootstrap-project-harness#19 → clean  [5 draw(s)]  isolated=yes  deniedDraws=1
# control 10-59-41 — check-eval-run (stored artefact, read-only)
findings=1 skillLeaks=1 hostReads=0 isolated=no deniedDraws=1
# with-skill 07-37-44 — check-eval-run (stored artefact)
findings=0 skillLeaks=0 hostReads=0 isolated=yes deniedDraws=0
# with-skill 07-37-44 — check-evidence, citing it with isolated=yes
0 errors, 0 warnings
```

The control's re-judged leak count is zero (five clean draws, one denied draw);
its stored v3 `result.json` still records the leak v3 published, because the
replay is read-only — that artefact is cited through the replay, not through
`check-eval-run`. The two readers agree on the with-skill run: `isolated=yes`
from `check-eval-run` and zero `stale-detector` findings from `check-evidence`.

Run directories (read-only):

- `~/.local/share/opencode/evals/runs/2026-11-09T10-59-41--bootstrap-project-harness--agentworks-deepseek-v4-1-flash--without-skill`
- `~/.local/share/opencode/evals/runs/2026-11-09T07-37-44--bootstrap-project-harness--agentworks-deepseek-v4-1-flash`

No cell verdict is published here; SPEC-0047 owns the remeasurement.

## Open Questions

- **What counts as "demonstrably returned the content"?** A `read` tool with a
  non-empty result, or a shell output line naming the path without a denial
  marker. When the output names no path and the tool is a shell, treat it as an
  attempt: under enforcement nothing could have come back.
- **Does the enforced rule hide a broken profile?** No: the canary is the guard.
  If a root is not denied, the canary fails before any draw is spent. The
  detector classifies attempts; the canary proves the boundary.
- **Does the capability rule widen any claim?** It accepts a run that already
  looked for host reads; it does not accept a v1 run and does not accept an
  unknown digest.

## Prompt Notes

- **Requirements:** thread the enforcement state into the detector; classify a
  content-less corpus hit as `denied` under enforcement; keep the non-enforced
  and content-override paths; unify `runcheck` on capability; prove by replay.
- **Entities:** enforcement state (`enforced`), corpus hit (`tool`, `path`,
  `kind`), demonstrable content, capability (`host-reads`).
- **Approach:** add an options object to `findLeaks`/`leaksIn` so the two
  callers pass the manifest's state; keep the classifier conservative; make
  `runcheck` import `hasCapability` rather than compare digests.
- **Structure:** the detector stays in `leak.mjs`; the verdict in
  `runcheck.mjs`; the readers unchanged in shape.
- **Operations:** thread the flag; add the enforced branch; add the capability
  check; add tests for both states and the content override; re-judge the two
  runs; update coverage and CHANGELOG; run the eight gates.
- **Norms:** `node`, not bun. Tests next to the module. A rule change bumps
  `DETECTOR_VERSION` and the golden digest is updated consciously.
- **Safeguards:** never mark a demonstrable content read `denied`; never apply
  the enforced rule when the manifest does not say `enforced: true`; do not touch
  the boundary; no paid draw; no cell verdict.
- **Tests:** suppressed probe under enforcement → denied; same under no
  enforcement → leak; content under enforcement → leak; v2 run → `isolated=yes`;
  v1 run → `unknown`; replay of both stored runs.
