---
id: SPEC-0050
title: Measure the four remaining blocked cells
status: ready
priority: P1
task: TASK-75
created_at: 2026-11-09
updated_at: 2026-11-09
source_docs:
  - backlog/tasks/task-75 - evals-medir-as-quatro-celulas-restantes-do-corpus-bloqueado.md
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0047-remeasure-under-deny-layer.md
  - docs/specs/active/SPEC-0049-a-corpus-hit-under-enforcement-is-a-denied-attempt.md
related_decisions: []
depends_on:
  - SPEC-0046-deny-control-arm-corpus
  - SPEC-0048-a-denied-read-is-not-a-leak
  - SPEC-0049-a-corpus-hit-under-enforcement-is-a-denied-attempt
blocks: []
files:
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0050-measure-the-four-remaining-cells.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0050-measure-the-four-remaining-cells.md --base main
---

# SPEC-0050: Measure the four remaining blocked cells

## Purpose

SPEC-0047 was the wave that turns the published `unresolved` cells into real
verdicts. It halted three times, each time on a harness defect rather than on the
skill: the detector counted a denied read as a leak (SPEC-0048), and then failed
to recognise a denied attempt whose stderr the agent had discarded, while
`runcheck` and `check-evidence` disagreed about isolation (SPEC-0049). Both are
fixed and merged.

The wave's own retry budget is spent (`2/1`), so this spec carries the remaining
work with a fresh budget instead of overriding the policy. The fifth cell,
`bootstrap-project-harness` #19, is already **measured** and is not re-run:

- with-skill `2026-11-09T07-37-44--…` — 5/5 passed, `isolated=yes`;
- control `2026-11-09T10-59-41--…--without-skill` — re-judged under detector v4,
  five clean draws, `deniedDraws=1`, one passed and four red on `file AGENTS.md`,
  `file justfile`, `filematch eslint.config.js` and `filematch justfile eslint`;
- verdict: **separator** on the rule (5/5 vs 1/5, both arms clean).

That evidence and the citation caveat live in SPEC-0047's Results.

## User Outcome

Four cells that today read `unresolved` get a verdict backed by five clean draws
per arm, or stay `unresolved` with the exact reason. A reader of
`docs/evals/coverage.md` can tell, per skill, whether the skill separates, does
not separate, or cannot be measured, and the run directory behind each answer.

## Scope

- **Four cells**, one per skill, both arms, five draws:
  - `capture-idea` #1
  - `process-inbox` #1
  - `groom-backlog` #2
  - `write-implementation-prompt` #1
- **Classification** as `separator`, `non-discriminator` or `unresolved`,
  naming the failing assertion for every red cell.
- **Publication**: coverage rows with run directories and raw counts, including
  `deniedDraws`; the #19 row cites SPEC-0047 and is not re-run; a `CHANGELOG`
  entry stating what changed and what did not.
- **Consumers**: issue #12 and TASK-70 are told what the runs show.
- **F0 precondition**: the canary passes and the stored #19 evidence still
  replays. If either fails, stop instead of spending draws.

**Blast radius.** The coverage inventory and the release entry. No harness code,
no skill behaviour, no fixtures.

## Non-Goals

- No re-run of `bootstrap-project-harness` #19 (measured in SPEC-0047).
- No harness change. If the detector is still wrong, stop and report; this spec
  does not fix it.
- No new case, no fixture edit, no oracle edit after the draws.
- No change to the five-draw rule or the with-skill artefact.
- No second case per skill.

## Flow

1. **F0 — precondition.** Canary passes; `replay-evals --leaks` reproduces the
   #19 evidence. If not, stop.
2. **F1 — run.** Four cells, both arms, five draws, model
   `agentworks/deepseek-v4-1-flash`, concurrency 4.
3. **F2 — classify.** Five clean draws in both arms required for a verdict;
   anything else is `unresolved` with the reason.
4. **F3 — publish.** Coverage rows, CHANGELOG, `## Results`.
5. **F4 — consumers.** Comment on issue #12 and TASK-70; close neither.

## Data

- Run directories under `~/.local/share/opencode/evals/runs/`.
- `docs/evals/coverage.md` — the inventory and the per-skill rows.
- `CHANGELOG.md` — the release entry.
- SPEC-0047's Results — the #19 cell and its citation caveat.

## Acceptance Criteria

1. **Every cell runs under an enforced control.** Each run shows
   `params.isolation.enforced: true`, `skillLeaks: 0`, `hostReads: 0` and
   `isolated=yes`; otherwise the spec records the failure and stops.
2. **Five clean draws or an unresolved verdict.** Each cell has five clean draws
   per arm, or is published `unresolved` with the exact reason named.
3. **Every verdict cites its evidence.** The coverage row names the run
   directory and the raw counts; a `separator` states both arms, a
   `non-discriminator` states both rates.
4. **#19 is cited, not re-run.** The coverage row points at SPEC-0047's evidence
   and says the control artefact still records the older contamination while the
   replay is the evidence.
5. **No oracle moved.** No assertion, fixture or `why:` line is edited to fit;
   every red cell becomes a follow-up task.
6. **Consumers reflect the evidence.** Issue #12 and TASK-70 say what the runs
   show and neither is closed on fewer than five clean draws in both arms.
7. **The release entry is honest.** `CHANGELOG.md` states which cells separated,
   which did not and which remain unresolved, without recomputing a rate.
8. **Nothing else moves.** No harness, skill, template, fixture or Python
   change; every `tests:` command passes.

## Open Questions

- **What if a cell still cannot reach five clean draws?** It stays `unresolved`
  and the reason is published. That is a legitimate outcome.
- **What if a paid draw stalls post-load?** The TASK-50 protocol applies: stop
  the wave, record the event gap and the attempt, reopen the task — do not retry
  blindly.

## Prompt Notes

- **Requirements:** prove the precondition; spend only the 40 draws; publish
  every verdict with its run directory; cite #19 without re-running it.
- **Entities:** cell, arm, draw, clean/contaminated, verdict, run directory.
- **Approach:** reuse the runner unchanged; both arms at five draws; classify
  with the published rules.
- **Structure:** only `docs/evals/coverage.md`, `CHANGELOG.md` and this spec.
- **Operations:** canary and #19 replay; run the four cells; count; classify;
  publish; comment on #12 and TASK-70; run the eight gates.
- **Norms:** `node`, not bun. Five draws, never three. A red cell is named, not
  argued away.
- **Safeguards:** stop on a stall or a non-enforced control; no `--resume`
  without a human decision; no oracle or fixture edit; no claim from a manual
  case; never close #12 or TASK-70.
- **Tests:** the preconditions hold; the published counts are re-read from the
  stored run dirs; `check-evidence` and `spec-check` run clean.
