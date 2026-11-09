---
id: SPEC-0046
title: Deny the control arm the installed corpus
status: ready
priority: P1
task: TASK-71
created_at: 2026-11-09
updated_at: 2026-11-09
source_docs:
  - backlog/tasks/task-71 - evals-negar-a-skill-instalada-na-arm-de-controle-deny-layer.md
  - docs/evals/coverage.md
  - docs/roadmap.md
  - docs/specs/active/SPEC-0045-stack-review-evals.md
related_decisions: []
depends_on: []
blocks:
  - SPEC-0047-remeasure-under-deny-layer
files:
  - scripts/lib/evals/isolation.mjs
  - scripts/lib/evals/isolation.test.mjs
  - scripts/lib/evals/agent.mjs
  - scripts/lib/evals/agent.test.mjs
  - scripts/lib/evals/execute.mjs
  - scripts/lib/evals/execute.test.mjs
  - scripts/lib/evals/runcheck.mjs
  - scripts/lib/evals/runcheck.test.mjs
  - scripts/lib/evals/evidence.mjs
  - scripts/lib/evals/evidence.test.mjs
  - scripts/run-evals.mjs
  - scripts/replay-evals.mjs
  - scripts/check-eval-run.mjs
  - scripts/check-evidence.mjs
  - docs/evals/coverage.md
  - docs/roadmap.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0046-deny-control-arm-corpus.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0046-deny-control-arm-corpus.md --base main
---

# SPEC-0046: Deny the control arm the installed corpus

## Purpose

The `--no-skill` arm is supposed to measure what an agent does **without** the
skill. It does not. `isolateHome` gives the child a throwaway home and hides
`skills` and `.retired-skills` from `~/.config/opencode`, but it symlinks
`~/.local` wholesale, and `external_directory: deny` is a tool-permission
preference, not an operating-system boundary. The child still runs as this user
and can reach the checkout.

SPEC-0045 measured the consequence: the control arm read the installed corpus in
33 of 35 draws (`skillLeaks=33`, `hostReads=7`, `isolated=no`), so no behavioural
cell reached five clean control draws and every cell was published as
`unresolved`. That is the honest reading, but it means `unresolved` currently
says "the control was not isolated", not "the skill does not separate". The same
block is published for `capture-idea` #1, `groom-backlog` #2 and
`write-implementation-prompt` #1.

The detector already reports the leak (TASK-43). The missing half is denial.

## User Outcome

A maintainer can run a `--no-skill` cell on the measurement host and know that
the child had no path to the installed corpus, because the boundary is enforced
below the tool layer and a canary proves it. On a host where that boundary
cannot be enforced, the run says so — `isolated=unknown` — instead of claiming
`isolated=yes`. A behavioural verdict is then either backed by an enforced
control or explicitly not claimable.

## Scope

- **An enforcement capability, probed at run start.** The runner asks whether the
  host can deny file reads on the corpus; the answer is recorded in the run
  manifest.
- **Enforcement where it exists.** On macOS the child is launched under a
  seatbelt profile that denies reading the skill corpus (installed roots and
  `references/evals.md`). The mechanism is named in the manifest.
- **A canary that is not vacuous.** A deterministic probe reads a known corpus
  path under the same enforcement and must fail; the same probe without the
  enforcement must succeed. No model call.
- **Summary semantics.** `isolated=yes` requires enforcement **and** zero
  `leak`/`host` findings. Unenforced runs report `unknown`; a run with findings
  reports `no`.
- **Publication.** `docs/evals/coverage.md` stops attributing the block to
  TASK-43 (which is `Done` and never had that criterion) and names this spec and
  TASK-71. `docs/roadmap.md` moves the deny layer under 0.7.0 as a declared
  prerequisite of the corpus claim, with the cost of the re-measurement named.

**Blast radius.** The eval runner's isolation and summary semantics — which
every behavioural measurement depends on — plus three documentation surfaces.
No skill behaviour changes; the with-skill arm is untouched; the detector rules
are untouched.

## Non-Goals

- No re-measurement of any skill. The four blocked cells belong to
  SPEC-0047 / TASK-72.
- No container or VM. A real portable boundary is a much larger change and this
  spec does not buy it.
- No enforcement claim on Linux. Where the boundary cannot be applied the run
  reports `unknown`; it must not report `yes`.
- No change to `leak.mjs` detector rules and no change to the five-draw rule.
- No change to the with-skill arm, the skill text, the templates or Python.

## Flow

1. **F0 — capability probe.** A function answers whether this host can deny the
   corpus, and why. It runs once per run and lands in the manifest.
2. **F1 — enforcement.** Where available, launch the child so that reads of the
   corpus fail at the OS boundary. Where not, launch exactly as today.
3. **F2 — canary.** A deterministic probe proves the boundary is real and that
   the canary is not passing for the wrong reason.
4. **F3 — summary.** Derive `isolated` from enforcement plus findings.
5. **F4 — publication.** Coverage attribution, roadmap placement, CHANGELOG.

## Data

- `scripts/lib/evals/isolation.mjs` — the throwaway home and today's deny
  preference.
- `scripts/lib/evals/agent.mjs` — process launch, env scrubbing, watchdog.
- `scripts/lib/evals/execute.mjs` — per-repetition execution and the arm switch.
- `scripts/lib/evals/runcheck.mjs`, `evidence.mjs` — the recorded summary and
  the guard that rejects a claim the manifest does not support.
- `scripts/run-evals.mjs`, `scripts/replay-evals.mjs` — manifest fields and the
  replay path that must agree with the runner.
- Run manifests under `~/.local/share/opencode/evals/runs/`.
- `docs/evals/coverage.md`, `docs/roadmap.md`, `CHANGELOG.md`.

## Acceptance Criteria

1. **The capability is recorded.** A run on a host without enforcement writes an
   explicit unenforced marker in its manifest; the summary never prints
   `isolated=yes` for it.
2. **Enforcement is applied where available.** On macOS the manifest names the
   mechanism and the run reports the boundary as enforced.
3. **The canary is not vacuous.** A deterministic probe that reads a known
   corpus path under the enforcement fails, and the same probe without the
   enforcement succeeds. Both outcomes are asserted in the test suite.
4. **Detection still works.** A draw that reaches the corpus despite the
   enforcement still produces a named `leak` or `host` finding and is reported
   `isolated=no`, never `yes`.
5. **`isolated=yes` cannot be overclaimed.** The evidence guard rejects
   `isolated=yes` when the manifest says the run was unenforced, and a test
   pins that rejection.
6. **The attribution is corrected.** `docs/evals/coverage.md` no longer calls
   this "the deny-layer half of TASK-43"; it names SPEC-0046 and TASK-71 and
   states which skills stay `unresolved` until SPEC-0047 runs.
7. **The roadmap says where it lands.** The deny layer appears under 0.7.0 as a
   prerequisite of the corpus claim, with the cost of the wave named.
8. **Nothing else moves.** The detector rules, the skill text, the templates,
   Python and the with-skill arm are unchanged, and every `tests:` command
   passes.

## Open Questions

- **How far does the boundary need to reach?** The seatbelt profile sits below
  the tool layer, so `read`, `glob`, `grep` and `bash` are covered by one rule.
  If a legitimate read of the fixture or the auth state is denied, the profile
  is too broad and the canary must catch it.
- **What does a Linux maintainer get?** A run that reports `unknown`. That is
  honest but it means a separation claim can only be produced on macOS. Is that
  acceptable, or does 0.7.0 need a portable boundary as a follow-up?
- **Does auth still work?** The isolated home symlinks `.local` for provider
  credentials. The denial must be scoped to the corpus, not to `.local`, or the
  child loses auth and every run aborts.
- **Paid canary or deterministic canary?** This spec requires the deterministic
  probe only. A paid canary would prove the same thing at model cost and is not
  planned.

## Prompt Notes

- **Requirements:** enforce at the OS boundary where available; record the
  capability; make `isolated` a derived claim; prove the boundary with a
  non-vacuous canary; correct the published attribution.
- **Entities:** enforcement capability (`enforced` / `unenforced`), mechanism
  name, corpus roots, manifest field, `isolated` (`yes` / `no` / `unknown`),
  canary probe.
- **Approach:** probe once per run; wrap the child launch, not the tool layer;
  keep the existing env scrubbing and watchdog; derive the summary from
  enforcement plus findings; keep the replay path reading the same manifest
  field.
- **Structure:** the probe and the launcher live with `isolation.mjs` and
  `agent.mjs`; the summary derivation stays in `runcheck.mjs`/`evidence.mjs`;
  the manifest field is written by `run-evals.mjs` and read by
  `replay-evals.mjs`.
- **Operations:** add the probe and its unit test; add the launcher wrapper;
  add the canary test pair; extend the summary; update the manifest; correct the
  three documents; run the eight gates.
- **Norms:** `node`, not bun. Tests next to the module. No new dependency if
  a platform binary will do. Prose in the docs stays in English; comments
  explain *why*, with the measurement that justified the change.
- **Safeguards:** never report `yes` from absence of findings alone; never
  silently fall back to unenforced and still claim isolation; do not widen the
  deny to `.local`; no re-measurement, no paid draws; no container.
- **Tests:** the capability probe; the canary pair (denied vs allowed); the
  summary derivation for enforced-clean, enforced-leaky and unenforced; the
  evidence guard rejecting `isolated=yes` on an unenforced manifest.
