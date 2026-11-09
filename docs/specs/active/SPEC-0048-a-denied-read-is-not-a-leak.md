---
id: SPEC-0048
title: A denied read is not a leak
status: ready
priority: P1
task: TASK-73
created_at: 2026-11-09
updated_at: 2026-11-09
source_docs:
  - backlog/tasks/task-73 - evals-distinguir-leitura-negada-de-leak-no-detector.md
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0046-deny-control-arm-corpus.md
  - docs/specs/active/SPEC-0047-remeasure-under-deny-layer.md
related_decisions: []
depends_on:
  - SPEC-0046-deny-control-arm-corpus
blocks:
  - SPEC-0047-remeasure-under-deny-layer
files:
  - scripts/lib/evals/leak.mjs
  - scripts/lib/evals/leak.test.mjs
  - scripts/lib/evals/result.mjs
  - scripts/lib/evals/result.test.mjs
  - scripts/lib/evals/runcheck.mjs
  - scripts/lib/evals/runcheck.test.mjs
  - scripts/run-evals.mjs
  - scripts/check-eval-run.mjs
  - scripts/replay-evals.mjs
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0048-a-denied-read-is-not-a-leak.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0048-a-denied-read-is-not-a-leak.md --base main
---

# SPEC-0048: A denied read is not a leak

## Purpose

SPEC-0046 gave the control arm an operating-system boundary: a `--no-skill`
draw that reaches for the installed corpus gets `Operation not permitted`. The
boundary works. The accounting does not.

`leak.mjs` classifies a corpus path found in a **tool call's input** as a leak,
regardless of what the call returned. So a control draw that probes
`~/.agents/skills`, is denied, and gets nothing is still published as
`contaminated` and `isolated=no`. A bare agent probes for the skill it does not
have — that is exactly what the control does — so no probing control can ever be
clean, and an enforced host still cannot produce a verdict.

SPEC-0047 measured it: the F0.1 cell ran both arms under an enforced boundary,
the with-skill arm was `5/5 isolated=yes`, and the control's draws `r3`–`r5` were
marked contaminated for reads the transcript shows as denied. The wave stopped
with 40 draws unspent.

The parser already carries what is needed: `toolCalls()` returns `output`,
`exit` and `status` per call (`scripts/lib/evals/events.mjs:60`). The detector
does not have to guess.

## User Outcome

A control draw that tried and was denied is evidence about the skill, not
contamination. The runner reports `denied` separately, so the attempt is visible
and the reader can see the boundary held. `isolated=yes` becomes reachable on an
enforced host, and a wave can finally answer whether a skill separates.

## Scope

- **Per-path denial classification.** A corpus hit whose call shows a permission
  denial **for that path** is recorded as `denied`. A hit whose call succeeded,
  or whose output shows no denial, stays `leak` or `host`.
- **Mixed calls stay conservative.** A shell call that is denied on one path and
  succeeds on another keeps the successful read as a leak.
- **Contamination ignores `denied`.** A draw whose only corpus interactions were
  denied is clean and can be scored.
- **The summary counts `denied`.** `check-eval-run` prints it; it is not a
  finding and does not make `isolated=no`.
- **Detector version bump.** The rules change, so `DETECTOR_VERSION` changes;
  historical rows stay citable because `stale-detector` only guards
  `isolated=yes` claims.
- **Replay proof.** Re-judge the stored SPEC-0047 F0.1 runs with the new
  detector and publish the result: the control's `r3`–`r5` become denied-clean,
  the with-skill run stays `isolated=yes`.
- **Publication.** `docs/evals/coverage.md` replaces "a denied read still
  counts" with the new rule and names this spec; `CHANGELOG` entry.

**Blast radius.** The eval detector and its summary — the layer that decides
what "clean" means for every behavioural measurement. No skill behaviour, no
boundary, no fixture, no case.

## Non-Goals

- No change to the seatbelt boundary or the corpus roots (SPEC-0046).
- No paid draw and no re-run. The proof is a replay of stored transcripts.
- No verdict for any cell. Reclassifying the SPEC-0047 cells is that spec's job,
  after this one lands.
- No change to the five-draw rule, the with-skill artefact, the skill text, the
  templates or Python.
- No new case and no fixture edit.

## Flow

1. **F0 — classify.** Extend the detector so a corpus hit carries
   `kind: "denied"` when its call shows the denial for that path.
2. **F1 — account.** `contaminate` ignores `denied`; the result and the summary
   carry the denied count.
3. **F2 — report.** `check-eval-run` prints the count; the replay path applies
   the same rule.
4. **F3 — prove.** Re-judge the two stored SPEC-0047 runs and record the before
   and after counts.
5. **F4 — publish.** Coverage rule and CHANGELOG.

## Data

- `scripts/lib/evals/leak.mjs` — `findLeaks`, `classifies`, `DETECTOR_RULES`,
  `DETECTOR_VERSION`.
- `scripts/lib/evals/events.mjs` — already returns `output`/`exit`/`status` per
  call; no change expected.
- `scripts/lib/evals/result.mjs` — `contaminate`.
- `scripts/lib/evals/runcheck.mjs` — the per-case counts and the `isolated`
  derivation.
- `scripts/run-evals.mjs` — `leaksIn` → `contaminate`.
- `scripts/check-eval-run.mjs`, `scripts/replay-evals.mjs` — the two readers.
- Stored runs: `2026-11-09T07-37-44--bootstrap-project-harness--agentworks-deepseek-v4-1-flash`
  and `2026-11-09T07-52-50--bootstrap-project-harness--agentworks-deepseek-v4-1-flash--without-skill`.
- `docs/evals/coverage.md`, `CHANGELOG.md`.

## Acceptance Criteria

1. **Denied is its own kind.** A corpus path whose call output shows a
   permission denial for that path is recorded as `denied`, not `leak`/`host`.
2. **A successful read is still a leak.** The same path, read successfully, is
   still `leak`/`host`; a red fixture proves the classifier did not become
   permissive.
3. **Mixed calls stay conservative.** A call denied on path A and successful on
   path B yields `denied` for A and `leak` for B.
4. **A denied-only draw is clean.** `contaminate` does not mark it and it can be
   scored; a draw with at least one successful corpus read is still contaminated.
5. **The attempt stays visible.** The result and the summary carry a `denied`
   count; `check-eval-run` prints it; it is not a finding and does not force
   `isolated=no`.
6. **The detector version moved.** `DETECTOR_VERSION` changes with the rules,
   and `check-evidence` still exits 0 on the current inventory.
7. **The replay proves it end to end.** Re-judging the SPEC-0047 control run
   turns `r3`–`r5` into denied-clean (the case then has five clean control
   draws), and the with-skill run still reports `isolated=yes`. The result is
   published here as evidence, not as a verdict.
8. **Nothing else moves.** No boundary, case, fixture, skill text, template or
   Python change; every `tests:` command passes.

## Open Questions

- **How precise must the path match be?** The denial line usually names the exact
  path (`ls: /…/skills: Operation not permitted`), but a `read` tool may name
  only the file. Prefer a line that contains the path or its directory; when the
  output names neither, fall back to a non-zero exit plus a denial marker, and
  record it as `denied` only if no content could have been returned.
- **What if a call is denied and the same path is later read successfully?** The
  successful read is a leak. The classifier is per call, not per draw.
- **Does the version bump invalidate published rows?** No: they cite the detector
  they ran under, and `stale-detector` only rejects an `isolated=yes` claim made
  with a detector other than the current one. New runs cite the new version.

## Prompt Notes

- **Requirements:** classify a denied corpus hit as `denied`; keep successful
  reads as leaks; ignore `denied` for contamination; count it; bump the version;
  prove it by replay.
- **Entities:** corpus hit (`tool`, `path`, `kind`), denial marker, denied count,
  contaminated draw.
- **Approach:** extend `findLeaks`, which already receives the calls including
  `output`/`exit`; keep the classifier conservative and per path; split `denied`
  from the rest in `contaminate`; thread the count into the result, the summary
  and the two readers.
- **Structure:** the detector stays in `leak.mjs`; the accounting in
  `result.mjs`/`runcheck.mjs`; the readers unchanged in shape, one field richer.
- **Operations:** add the denial test to the classifier; split in `contaminate`;
  count in `runcheck`; print in `check-eval-run`; apply in `replay-evals`;
  re-judge the two runs; update coverage and CHANGELOG; run the eight gates.
- **Norms:** `node`, not bun. Tests next to the module. A rule change bumps
  `DETECTOR_VERSION` and `leak.test.mjs`'s golden digest is updated
  consciously. Comments explain why, with the F0.1 measurement.
- **Safeguards:** never widen the classifier to call a successful read denied;
  never infer denial from the path alone (the disk is the arbiter, and the
  evidence is the output); do not touch the boundary; no paid draw; do not
  publish a cell verdict here.
- **Tests:** denied vs allowed on the same path; mixed call; denied-only draw is
  clean; successful read still contaminated; summary count; replay re-judges the
  stored control.
