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
  - scripts/lib/evals/evidence.mjs
  - scripts/lib/evals/evidence.test.mjs
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

### Detector capability

`DETECTOR_CAPABILITIES` names what a detector can prove, in order. An
`isolated=yes` citation needs `host-reads`: without it, silence about the host
checkout is not evidence of isolation. The current detector (v3) is
`["host-reads", "denied-split"]`; the legacy map pins v1 (`a31d58f79a6c7038`) to
none and v2 (`71bfb85a91cd68ab`) to `["host-reads"]`. `capabilitiesOf(version)`
returns the current set for `DETECTOR_VERSION`, the mapped set for a known
legacy digest, and `null` for an unknown digest; an unknown digest fails closed.
`denied-split` is recorded but not yet required by any claim: a v2
`isolated=yes` was already true when v3 reclassifies some findings to `denied`,
because the new rule can only move a finding away from `leak`/`host`, never
toward one.

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
6. **The detector version moved and old claims stay honest.** `DETECTOR_VERSION`
   changes with the rules. A citation of `isolated=yes` is accepted when the
   detector that judged the run already had the capability the claim needs
   (`host-reads`); a detector without it stays stale. `check-evidence` exits 0 on
   the current inventory without rewriting a published citation.
7. **The replay proves it end to end.** Re-judging the SPEC-0047 control run
   turns `r3`–`r5` into denied-clean (the case then has five clean control
   draws), and the with-skill run still reports `isolated=yes`. The result is
   published here as evidence, not as a verdict.
8. **Nothing else moves.** No boundary, case, fixture, skill text, template or
   Python change; every `tests:` command passes.

## Results

**Detector v3.** `DETECTOR_RULES` gained `per-path-permission-denial`;
`DETECTOR_VERSION` moved from `71bfb85a91cd68ab` (v2) to `d8478beab04a4e3e`. The
classifier is per path: a hit whose call output names the path (or its directory)
on a line carrying `Operation not permitted`, `permission denied`, `EPERM` or
`EACCES` is `{ kind: "denied" }`. The denial is gathered from the transcript, so
a probe that discarded its own stderr is still classified from the call that
showed the refusal. A mixed call keeps the successful path as a leak; when the
output names no path at all, the fallback also needs a non-zero exit and an
output that carries no content. `contaminate` ignores `denied` and records the
count, `check-eval-run` prints `denied=N`, and `isolated=yes` still requires zero
`leak`/`host`.

**Replay proof (AC-7).** Read-only re-judge of the two stored SPEC-0047 F0.1
runs; no model, no write, no paid draw.

| run | arm | before (v2 `71bfb85a`) | after (v3 `d8478beab0`) |
| --- | --- | --- | --- |
| `2026-11-09T07-37-44--bootstrap-project-harness--agentworks-deepseek-v4-1-flash` | with-skill | `skillLeaks=0 hostReads=0 isolated=yes`, 5/5 passed | `clean [5 draw(s)] isolated=yes`, `denied=0` |
| `2026-11-09T07-52-50--bootstrap-project-harness--agentworks-deepseek-v4-1-flash--without-skill` | control | `skillLeaks=3 hostReads=1 contaminated=3 isolated=no` (r3–r5 contaminated) | `clean [5 draw(s)] isolated=yes`, `denied=3` (r3–r5 denied-clean) |

`node scripts/replay-evals.mjs --leaks <the two dirs>` prints
`Detector d8478beab04a4e3e: 2 cell(s), 0 dirty. No model, no write.` The control's
`r3`–`r5` probes — `/Users/wendell/.agents/skills`,
`/Users/wendell/.config/opencode/skills`, `/Users/wendell/.agents/` and
`/Users/wendell/.agents/commands` — are now three denied draws with no
`leak`/`host`, so the case has five clean control draws and both arms replay
`isolated=yes` against the manifest's enforced seatbelt record. The with-skill
run's stored artefact recorded `isolated=yes` under v2; its transcripts still
carry zero leaks and zero host reads.

The stored `result.json` is not rewritten: the replay is the evidence, and the
old artefact keeps the detector it ran under. `check-eval-run` on that artefact
therefore still echoes `skillLeaks=3 hostReads=1` (v2 record) and reports
`isolated=unknown` for the with-skill run (its recorded detector is not the
current one); the re-judged counts are the replay output above.

**Gate status.** All eight `tests:` commands pass. The v3 digest no longer
invalidates a v2 `isolated=yes` citation by hash equality: `check-evidence`
accepts a claim when the recording detector had `host-reads` (v1 has none, v2 has
it, v3 adds `denied-split`), and an unknown digest fails closed. That is sound
because the v3 rule only reclassifies `leak`/`host` hits to `denied`; it cannot
turn a clean draw dirty. No published citation was rewritten to make the gate
pass.

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
