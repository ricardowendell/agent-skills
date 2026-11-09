---
spec: SPEC-0047
spec_sha: 62354bf96f33b213b168d8f06d1288c738ceef30e0b36cddbc191fbebb7c947f
---

# Implementation Prompt: SPEC-0047 Re-measure the blocked cells under the deny layer

## Source Spec

- `docs/specs/active/SPEC-0047-remeasure-under-deny-layer.md` (pin `62354bf9…`)
- Prerequisite: `docs/specs/active/SPEC-0046-deny-control-arm-corpus.md` (implemented)
- Inventory: `docs/evals/coverage.md`

## Requirements

**User outcome.** For each of the five blocked cells, a reader can tell whether
the skill separates from the control, does not separate, or still cannot be
measured — with the run directory behind each verdict. Issue #12's behavioural
criterion and TASK-70's measured-run criterion get an answer instead of
"blocked on the deny layer".

**The five cells** (one per skill):

| # | skill | case | the published block |
| --- | --- | --- | --- |
| 1 | `capture-idea` | 1 | `2026-11-07T08-27-30--capture-idea--agentworks-deepseek-v4-1-flash--without-skill` |
| 2 | `process-inbox` | 1 | `2026-11-06T17-25-52--process-inbox--without-skill` (dirty: leak + host) |
| 3 | `groom-backlog` | 2 | `2026-11-06T07-47-34--groom-backlog--without-skill` |
| 4 | `write-implementation-prompt` | 1 | `2026-11-07T08-17-29--write-implementation-prompt--agentworks-deepseek-v4-1-flash--without-skill` |
| 5 | `bootstrap-project-harness` | 19 | the stack control `2026-11-08T22-51-39--bootstrap-project-harness--agentworks-deepseek-v4-1-flash` |

**Scope.** Both arms, five draws per arm, the documented model; reclassify each
cell; publish in `docs/evals/coverage.md` with the run directory and raw counts;
a `CHANGELOG` entry; tell issue #12 and TASK-70 what the runs show.

**Acceptance criteria** (copied from the spec):

- AC-1 — every cell runs under an enforced control, or the spec records the
  enforcement failure and stops instead of publishing a verdict.
- AC-2 — each cell has five clean draws per arm or is published `unresolved`
  with the exact reason named.
- AC-3 — every verdict is published with its evidence: a `separator` states both
  arms, a `non-discriminator` states both rates, an `unresolved` names the
  blocker.
- AC-4 — no oracle moved after the draws; a red cell becomes a follow-up task.
- AC-5 — issue #12's behavioural criterion and TASK-70 reflect the evidence;
  neither is marked done on fewer than five clean draws in both arms.
- AC-6 — the `CHANGELOG` entry states which cells separated, which did not, and
  which remain unresolved, without recomputing a published number.
- AC-7 — no harness code, skill text, template, fixture or detector change; every
  `tests:` command passes.

**Non-goals.** No harness change (that was SPEC-0046). No new cases. No fixture
edit. No oracle edit after the draws. No lowering of the five-draw rule. No
promotion of a partially clean cell. No second stack cell.

## Entities

| Term | Meaning |
| --- | --- |
| **cell** | one skill + one case number, run in both arms |
| **arm** | `with-skill` (default) or `--no-skill` (control) |
| **clean draw** | a draw with no `leak`/`host` finding, no contamination, no infrastructure failure |
| **verdict** | `separator` (five clean in both arms and a different outcome), `non-discriminator` (five clean both arms, same outcome), `unresolved` (fewer than five clean in the control or a stall) |
| **run directory** | `~/.local/share/opencode/evals/runs/<timestamp>--<label>` |

## Approach

Enforcement first, then one cell, then the rest. SPEC-0046's boundary also hides
config entries that symlink into this checkout (`commands`, `AGENTS.md`), so a
sandboxed child that cannot start would burn the whole wave. Run one cell, read
its two manifests, then commit the remaining draws.

Never promote from fewer than five clean control draws. The published rules in
`docs/evals/coverage.md` are the contract; the wave produces numbers, it does not
change the rules.

## Structure

Only three files change: `docs/evals/coverage.md`, `CHANGELOG.md` and this spec.
The run artefacts stay in the eval store. No source file is touched.

Commands (run from the worktree, `node`, not bun):

```
node scripts/run-evals.mjs --root skills --skill <id> --case <n> --repeat 5 \
  --model agentworks/deepseek-v4-1-flash --run --concurrency 4
```

and the same with `--no-skill`. The run is labelled `without-skill` already; do
not add a tag that collides with another case.

## Operations

1. **F0 — enforcement.** Run the canary from SPEC-0046 (`node --test
   scripts/lib/evals/isolation.test.mjs`) and confirm `probeIsolation()` reports
   `enforced: true` with `mechanism: "seatbelt"`. If it does not, stop and
   report: the wave has nothing to measure.
2. **F0.1 — confirm #19 from the stored evidence, do not re-run it.** #19 is
   fully measured: the with-skill run
   `2026-11-09T07-37-44--bootstrap-project-harness--agentworks-deepseek-v4-1-flash`
   is 5/5 passed, and the control
   `2026-11-09T10-59-41--bootstrap-project-harness--agentworks-deepseek-v4-1-flash--without-skill`
   replays under v4 to five clean draws (`deniedDraws=1`), with one pass and four
   red on `file AGENTS.md`, `file justfile`, `filematch eslint.config.js` and
   `filematch justfile eslint`. Reproduce both with `replay-evals --leaks` and
   stop if they no longer hold. **Spend zero draws on #19.** Note in the coverage
   row that the control's stored `result.json` still records the v3
   contamination; the replay is the evidence.
3. **F1 — the remaining four cells.** `capture-idea` #1, `process-inbox` #1,
   `groom-backlog` #2, `write-implementation-prompt` #1, each in both arms, five
   draws. Record every run directory.
4. **F2 — classify.** For each cell, count clean draws per arm and compare the
   outcome. `separator` requires five clean in both arms; `non-discriminator`
   requires five clean in both arms with the same outcome; anything else is
   `unresolved`, and the reason is named (contamination, stall, missing draw,
   enforcement failure). Name the failing assertion for every red cell.
5. **F3 — publish.** Update the skill's row in `docs/evals/coverage.md` with the
   run directory, the raw counts and the verdict. Add the `CHANGELOG` entry.
   Write `## Results` in the spec with a per-cell table.
6. **F4 — consumers.** Comment on issue #12 and TASK-70 with what the runs show.
   Do not close either: #12 needs a five-clean separation in both arms before its
   behavioural criterion can be called met, and TASK-70 keeps its pilot AC.
7. **Gates.** Run the eight `tests:` commands from the worktree.

## Norms

- `node`, not bun. Five draws, never three.
- A dirty draw is not a pass; a control without five clean draws is `unresolved`,
  never a separator.
- The model is `agentworks/deepseek-v4-1-flash`; record it.
- Commit: `feat(SPEC-0047-remeasure-under-deny-layer): <summary>`.
- Prose in the docs stays in English; the issue comments are in Portuguese.

## Safeguards

- Do not edit an assertion, a fixture, a `why:` line or the expected output to
  make a cell pass. A red cell is published and becomes a follow-up task.
- Do not use `--resume` or retry a stalled draw without a human decision. If a
  paid draw stalls post-load: stop the wave, record the event gap and the
  attempt, and report — the coordinator reopens TASK-50.
- Do not run the full stack matrix: only #19. A second stack cell is a separate
  decision.
- Do not touch `scripts/`, `skills/`, templates, Python or fixtures.
- Do not mark issue #12 or TASK-70 done.
- Do not push.

## Verification

| AC | Check |
| --- | --- |
| AC-1 | The new #19 control manifest shows `params.isolation.enforced: true`, `skillLeaks: 0`, `hostReads: 0`, and reports `isolated=yes`; the reused with-skill run `07-37-44` still reports `isolated=yes` |
| AC-2 | Per-cell clean-draw counts in the Results; every cell with fewer than five in the control names the reason |
| AC-3 | Coverage row per skill cites the run directory; the verdict matches the rule |
| AC-4 | `git diff --name-only` touches no assertion, fixture or `why:` line; every red cell has a follow-up task id |
| AC-5 | The #12 and TASK-70 comments exist and neither is closed |
| AC-6 | The CHANGELOG entry lists separators, non-separators and unresolved without a recomputed rate |
| AC-7 | The eight `tests:` commands exit 0; `git diff --name-only` ⊆ `files:` |

Done when every cell is classified with its run directory, the two consumers are
updated, and the eight gates are green.
