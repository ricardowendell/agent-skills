---
spec: SPEC-0048
spec_sha: 7bb28b503b11043ddf1cf624901489367ca67da0ca7c41a49f841ab78c9b35fc
---

# Implementation Prompt: SPEC-0048 A denied read is not a leak

## Source Spec

- `docs/specs/active/SPEC-0048-a-denied-read-is-not-a-leak.md` (pin `7bb28b50…`)
- Prerequisite: `docs/specs/active/SPEC-0046-deny-control-arm-corpus.md` (implemented)
- Blocked by this: `docs/specs/active/SPEC-0047-remeasure-under-deny-layer.md` (paused)

## Requirements

**User outcome.** A control draw that tried to read the corpus and was denied is
evidence about the skill, not contamination. The runner reports `denied`
separately so the attempt stays visible, and `isolated=yes` becomes reachable on
an enforced host.

**The measured defect.** SPEC-0047's F0.1 control ran under seatbelt and got
`Operation not permitted` on every corpus read, yet `leak.mjs` recorded the path
from the tool **input** and the draws `r3`–`r5` became `contaminated`. The
with-skill arm was `5/5 isolated=yes`; the control was `isolated=no`. The wave
stopped with 40 draws unspent.

**Scope (from the spec):**

- Per-path denial: a corpus hit whose **call** shows a permission denial for that
  path becomes `denied`; a successful read stays `leak`/`host`.
- Mixed calls stay conservative: denied on A, successful on B → `denied` + `leak`.
- `contaminate` ignores `denied`; a denied-only draw is clean and scorable.
- The summary/CLI counts `denied`; it is not a finding and does not force
  `isolated=no`.
- `DETECTOR_VERSION` bumps (the rules change); historical rows stay citable.
- Replay proves it on the two stored SPEC-0047 runs.
- `coverage.md` replaces "a denied read still counts"; `CHANGELOG` entry.

**Acceptance criteria** (copied from the spec):

- AC-1 — a corpus path whose call output shows a denial for that path is
  `denied`, not `leak`/`host`.
- AC-2 — the same path read successfully is still `leak`/`host`; a red fixture
  proves the classifier did not become permissive.
- AC-3 — a call denied on path A and successful on path B yields `denied` for A
  and `leak` for B.
- AC-4 — a denied-only draw is not contaminated and can be scored; a draw with at
  least one successful corpus read is still contaminated.
- AC-5 — the `denied` count is carried in the result and the summary,
  `check-eval-run` prints it, and it is not a finding.
- AC-6 — `DETECTOR_VERSION` changed and `check-evidence` still exits 0.
- AC-7 — replaying the SPEC-0047 control run turns `r3`–`r5` into denied-clean
  (the case then has five clean control draws) and the with-skill run still says
  `isolated=yes`.
- AC-8 — no boundary, case, fixture, skill text, template or Python change; every
  `tests:` command passes.

**Non-goals.** No boundary change, no paid draw, no re-run, no cell verdict, no
five-draw change, no fixture edit.

## Entities

| Term | Meaning |
| --- | --- |
| **corpus hit** | `{ tool, path, kind }` where `kind` is `leak`, `host` or `denied` |
| **denial marker** | `Operation not permitted`, `permission denied`, `EPERM`, `EACCES` in the call's output |
| **denied draw** | a draw whose only corpus interactions were denied |
| **DETECTOR_VERSION** | the digest of `DETECTOR_RULES`; a rule change moves it |

## Approach

`toolCalls()` already returns `output`, `exit` and `status` per call
(`scripts/lib/evals/events.mjs:56-66`) — do not change it. The classifier in
`leak.mjs` scans `input` and does not look at the result; that is the bug.

Classify **per path**, not per call: a shell call can name several paths and the
output can deny one and return another. For each corpus hit, look for a line in
the call's `output` that contains that path (or its directory) and a denial
marker. If found → `denied`. Otherwise the existing `leak`/`host` classification
stands. When the output names no path, fall back to a non-zero `exit` plus a
denial marker **and** an output that carries no file content; be conservative —
a false `denied` hides a real leak.

Then split the accounting in `contaminate`: `denied` entries are recorded but do
not set `contaminated`. Thread the count through the result, `runcheck`'s
per-case counts and the CLI, and apply the same rule in `replay-evals.mjs`.

Bump `DETECTOR_VERSION` because `DETECTOR_RULES` gains a rule; update the golden
digest in `leak.test.mjs` consciously.

## Structure

- `scripts/lib/evals/leak.mjs` — `classifies`, `findLeaks`, `DETECTOR_RULES`.
- `scripts/lib/evals/result.mjs` — `contaminate`.
- `scripts/lib/evals/runcheck.mjs` — per-case counts and the `isolated`
  derivation (`:224-243`).
- `scripts/run-evals.mjs:667-668` — `leaksIn` → `contaminate`.
- `scripts/check-eval-run.mjs` — prints the summary.
- `scripts/replay-evals.mjs:260-280` — the re-judge path.
- `docs/evals/coverage.md` (the "a denied read still counts" rule), `CHANGELOG.md`.

## Operations

1. **Classifier.** Add the per-path denial test to `leak.mjs`. A hit becomes
   `{ tool, path, kind: "denied" }`. Keep `classifies()` returning `leak`/`host`
   for everything else. Unit tests: denied vs allowed on the same path; mixed
   call; a denial marker for a *different* path does not deny this one.
2. **Accounting.** In `result.mjs`'s `contaminate`, split `denied` from the rest:
   `contaminated` only when a `leak`/`host` remains; record `denied` on the
   result (a count or the list) so it survives into the JSON.
3. **Summary.** In `runcheck.mjs`, count `denied` per case and expose it; keep it
   out of `findings`. Confirm `isolated=yes` still requires zero `leak`/`host`.
4. **Readers.** `check-eval-run.mjs` prints the denied count next to the leaks;
   `replay-evals.mjs` applies the same split so a re-judged run matches a fresh
   one.
5. **Version.** Bump the rules (and therefore `DETECTOR_VERSION`) and update the
   golden digest with a comment saying why.
6. **Replay proof.** Re-judge both stored runs from SPEC-0047:
   `2026-11-09T07-37-44--bootstrap-project-harness--agentworks-deepseek-v4-1-flash`
   and `2026-11-09T07-52-50--bootstrap-project-harness--agentworks-deepseek-v4-1-flash--without-skill`.
   Record the before/after counts. The control must go from
   `skillLeaks=3, hostReads=1, contaminated=3` to zero leaks/hosts with three
   denied draws and five clean control draws; the with-skill run must stay
   `isolated=yes`. Do not publish a cell verdict — that is SPEC-0047's job.
7. **Publication.** Replace the "a denied read still counts" statement in
   `docs/evals/coverage.md` with the new rule and name SPEC-0048. Add the
   `CHANGELOG` entry.
8. **Gates.** Run the eight `tests:` commands with `node`.

## Norms

- `node`, not bun. Tests next to the module.
- A rule change bumps the detector version; never edit the golden digest without
  changing the rule that produced it.
- Comments explain *why*, citing the F0.1 measurement.
- Commit: `feat(SPEC-0048-a-denied-read-is-not-a-leak): <summary>`.

## Safeguards

- Do not call a successful read `denied`. The disk is the arbiter and the
  evidence is the call output; a path alone is not a denial.
- Do not infer denial from the path being unreadable now — the transcript is the
  record.
- Do not touch the seatbelt boundary, the corpus roots, any case, fixture, skill
  text, template or Python.
- Do not run a paid draw. The replay reads stored transcripts only.
- Do not publish a verdict for any cell and do not change the five-draw rule.
- Do not mark issue #12 or TASK-70.

## Verification

| AC | Check |
| --- | --- |
| AC-1 | Unit: a corpus hit with a denial marker for that path yields `kind: "denied"` |
| AC-2 | Unit: the same path read successfully still yields `leak`/`host` |
| AC-3 | Unit: one call, path A denied, path B returned → `denied` + `leak` |
| AC-4 | Unit: `contaminate` on a denied-only list is clean; on a list with one leak it is contaminated |
| AC-5 | `check-eval-run` on the re-judged control prints the denied count and no leaks/hosts; `runcheck` counts it |
| AC-6 | `DETECTOR_VERSION` differs from the previous digest; `check-evidence` exits 0 |
| AC-7 | The replay output recorded in the spec: control five clean draws, with-skill `isolated=yes` |
| AC-8 | The eight `tests:` commands exit 0; `git diff --name-only` ⊆ `files:` |

Done when the replay proves the split, the two stored runs are re-judged, and the
eight gates are green.
