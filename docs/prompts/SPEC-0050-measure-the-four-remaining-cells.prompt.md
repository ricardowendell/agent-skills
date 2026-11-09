---
spec: SPEC-0050
spec_sha: 2b34ad0b1085d47c4000ed068a66e8a3787958aba45fc0288228fb9de17a03b2
---

# Implementation Prompt: SPEC-0050 Measure the four remaining blocked cells

## Source Spec

- `docs/specs/active/SPEC-0050-measure-the-four-remaining-cells.md` (pin `2b34ad0b…`)
- Prerequisites: SPEC-0046, SPEC-0048, SPEC-0049 (all implemented)
- Predecessor: `docs/specs/active/SPEC-0047-remeasure-under-deny-layer.md` (#19 measured there; paused)

## Requirements

**User outcome.** Four cells that read `unresolved` get a verdict backed by five
clean draws per arm, or stay `unresolved` with the exact reason. A reader can
tell, per skill, whether it separates, does not separate, or cannot be measured.

**The four cells, 40 draws:**

| # | skill | case |
| --- | --- | --- |
| 1 | `capture-idea` | 1 |
| 2 | `process-inbox` | 1 |
| 3 | `groom-backlog` | 2 |
| 4 | `write-implementation-prompt` | 1 |

`bootstrap-project-harness` #19 is **already measured** in SPEC-0047 and is
**not re-run**: with-skill `2026-11-09T07-37-44` is 5/5 passed; the control
`2026-11-09T10-59-41--without-skill` replays under detector v4 to five clean
draws (`deniedDraws=1`), one passed and four red on `file AGENTS.md`,
`file justfile`, `filematch eslint.config.js`, `filematch justfile eslint`. The
cell is a separator on the rule.

**Scope.** Both arms, five draws per cell, model
`agentworks/deepseek-v4-1-flash`, concurrency 4; classify; publish; tell
issue #12 and TASK-70.

**Acceptance criteria** (copied from the spec):

- AC-1 — every cell runs under an enforced control (`params.isolation.enforced:
  true`, `skillLeaks: 0`, `hostReads: 0`, `isolated=yes`), or the spec records
  the failure and stops.
- AC-2 — five clean draws per arm, or `unresolved` with the reason named.
- AC-3 — every verdict cites the run directory and raw counts.
- AC-4 — #19 is cited from SPEC-0047, not re-run, with the caveat that its stored
  artefact still records the older contamination while the replay is the evidence.
- AC-5 — no oracle or fixture edit; every red cell becomes a follow-up task.
- AC-6 — issue #12 and TASK-70 say what the runs show; neither is closed.
- AC-7 — the CHANGELOG states separators, non-separators and unresolved without a
  recomputed rate.
- AC-8 — no harness, skill, template, fixture or Python change; every `tests:`
  command passes.

**Non-goals.** No re-run of #19, no harness change, no new case, no fixture edit,
no oracle edit after the draws, no five-draw change, no second case per skill.

## Entities

| Term | Meaning |
| --- | --- |
| **cell** | one skill + one case, both arms |
| **clean draw** | no `leak`/`host`, no contamination, no infrastructure failure |
| **verdict** | `separator` / `non-discriminator` / `unresolved` |
| **run directory** | `~/.local/share/opencode/evals/runs/<timestamp>--<label>` |

## Approach

Precondition, then the four cells, then publish. Do not spend a draw on #19.
Never promote from fewer than five clean control draws.

## Structure

Only `docs/evals/coverage.md`, `CHANGELOG.md` and this spec change. Run artefacts
stay in the eval store. No source file is touched.

Commands (from the worktree, `node`):

```
node scripts/run-evals.mjs --root skills --skill <id> --case <n> --repeat 5 \
  --model agentworks/deepseek-v4-1-flash --run --concurrency 4
```

and the same with `--no-skill`.

## Operations

1. **F0 — precondition.** `node --test scripts/lib/evals/isolation.test.mjs`;
   confirm `probeIsolation()` reports `enforced: true`, `mechanism: "seatbelt"`.
   Then `node scripts/replay-evals.mjs --leaks` on the two #19 runs and confirm
   the values in Requirements. If either check fails, stop and report.
2. **F1 — run the four cells**, both arms, five draws. Foreground; do not end the
   turn while a run is alive.
3. **F2 — classify.** Five clean draws in both arms for a verdict; otherwise
   `unresolved` with the reason. Name the failing assertion for every red cell.
4. **F3 — publish.** Coverage rows with run dirs and raw counts including
   `deniedDraws`; the #19 row cites SPEC-0047 and states the artefact-vs-replay
   caveat; `CHANGELOG` entry; `## Results` with a per-cell table.
5. **F4 — consumers.** Comment on issue #12 and TASK-70 (Portuguese). Close
   neither; do not check their ACs.
6. **Gates.** Run the eight `tests:` commands.

## Norms

- `node`, not bun. Five draws, never three.
- A dirty draw is not a pass; a control without five clean draws is `unresolved`.
- Commit: `feat(SPEC-0050-measure-the-four-remaining-cells): <summary>`.
- Docs in English; issue comments in Portuguese.

## Safeguards

- Do not re-run `bootstrap-project-harness` #19.
- Do not edit an assertion, fixture, `why:` line or expected output to make a
  cell pass.
- Do not use `--resume` or retry a stalled draw without a human decision. If a
  paid draw stalls post-load: stop the wave, record the event gap and the
  attempt, and report — the coordinator reopens TASK-50.
- Do not touch `scripts/`, `skills/`, templates, Python or fixtures.
- Do not mark issue #12 or TASK-70 done.
- Do not push.

## Verification

| AC | Check |
| --- | --- |
| AC-1 | Each manifest shows `enforced: true`, zero leaks/hosts, `isolated=yes` |
| AC-2 | Per-cell clean counts; every short cell names the reason |
| AC-3 | Each coverage row cites its run directory |
| AC-4 | The #19 row cites `07-37-44` and `10-59-41` from SPEC-0047 with the caveat; no new #19 run exists |
| AC-5 | No assertion/fixture diff; red cells have follow-up ids |
| AC-6 | The two comments exist and neither issue is closed |
| AC-7 | The CHANGELOG entry lists the three verdict classes without a rate |
| AC-8 | The eight gates exit 0; `git diff --name-only` ⊆ `files:` |

Done when all four cells are classified with their run directories, the two
consumers are updated, and the eight gates are green.
