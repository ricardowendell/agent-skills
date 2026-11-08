---
id: SPEC-0018
title: Make the leak and load invariants fail loudly
status: implemented
priority: P1
task: TASK-33
created_at: 2026-11-05
updated_at: 2026-11-06
source_docs:
  - backlog/tasks/task-33 - harness-transformar-carga-e-isolamento-em-invariantes-testadas.md
  - docs/evals/coverage.md
  - CONTRIBUTING.md
related_decisions: []
depends_on:
  - docs/specs/SPEC-0017-eval-leak.md
blocks: []
files:
  - scripts/check-eval-run.mjs
  - scripts/lib/evals/runcheck.mjs
  - scripts/lib/evals/runcheck.test.mjs
  - CONTRIBUTING.md
  - docs/evals/coverage.md
  - docs/specs/SPEC-0018-eval-invariants.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
---

# SPEC-0018: Make the leak and load invariants fail loudly

## Purpose

TASK-10 (load) and TASK-11 (isolation) are both Done, and both defects came back
as TASK-30 and TASK-29. The ACs measured a mechanism — an aggregate load rate, a
`scrubEnv` — and never turned the property into something that fails. A property
that only lives in prose gets refiled as a task.

The two properties are:

1. **No run reads an installed skill or the eval corpus from outside its scratch.**
   SPEC-0017 makes that a fact on every repetition; this spec makes a dirty run
   fail a command instead of waiting for a human to grep.
2. **A cell that claims separation loaded the skill it claims to measure.**
   A gate miss inside a "12/12" is the same class of silent corruption.

## User Outcome

Before publishing a matrix, the author runs one command per cited run directory
and gets a verdict: clean, a named finding, or a pre-detector warning. A leak or
a gate miss is a red build, not a paragraph in a review. The next person who
refactors the runner cannot reintroduce either defect without seeing it.

## Scope

- **`scripts/check-eval-run.mjs <run-dir>…`** — a model-free checker over
  `result.json`:
  - fails on any repetition with `leak` non-empty or `contaminated: true`
    (SPEC-0017's field);
  - fails on any `with-skill` repetition whose `skillGate.ok` is not true, and
    on any control repetition whose `skillGate.loaded` is non-empty;
  - fails closed on an unfinished run: `manifest.status` other than `completed`,
    a case directory without `result.json`, or no case results at all is an
    `incomplete` finding;
  - prints the case, the repetition, the path or the gate reason, and exits
    non-zero; a clean run prints the counts and `findings=0 warnings=0`.
  - The rule lives in `scripts/lib/evals/runcheck.mjs` as a pure function over
    the parsed result, so it has unit tests.
- **`CONTRIBUTING.md`** — the publishing checklist gains the command, and states
  that a run directory cited as a clean measurement must pass it with
  `findings=0 warnings=0`; a failing directory is cited only as the record of
  the failure itself. The load canary (`--case 1 --repeat 12 --run`) stays a
  **manual** pre-matrix step, written in the same place: behavioural runs cost
  money and the policy keeps them out of CI.
- **`docs/evals/coverage.md`** — the evidence rules say a clean measurement is
  cited only after the checker passes it with `findings=0 warnings=0`; a failure
  is cited with its finding named.

**Blast radius.** One new script, one pure module with tests, and two documents.
Nothing in the runner changes; the checker reads what the runner already writes.
The three contaminated draws SPEC-0017 names predate the `leak` field, so the
checker cannot re-judge them: it reports them as `not checkable` warnings, not
as invalid. The red cases are the post-detector runs it can actually read.

## Non-Goals

- **No behavioural run in CI.** The policy (`docs/pipeline.md`) says evals are
  local evidence. A canary in the workflow would spend provider money on every
  push and make CI depend on a model.
- No change to the pre-commit hook. It stays model-free and fast.
- No new status vocabulary. The checker reads `leak`/`contaminated` and
  `skillGate`; `incomplete` is a finding kind, not a new run status, and it does
  not invent a `quarantine` state.
- No enforcement of a minimum pass rate. The checker gates provenance, not
  quality; a case at 1/5 is still a publishable fact.

## Flow

1. **F0 — the pure rule.** `runcheck.mjs` taking `{ arm, cases }` → findings.
   Unit tests: a clean with-skill run, a control run with a leak, a separator
   with a gate miss, a control run at 0/5 (clean, must pass the checker), and a
   run with no `leak` field at all (pre-SPEC-0017 artefact: warn, do not crash).
2. **F1 — the CLI.** `scripts/check-eval-run.mjs` over one or more directories;
   exit 1 on findings, listing them.
3. **F2 — prove it against reality.** It must fail
   `2026-11-06T07-47-34--groom-backlog--without-skill` (two contaminated draws)
   and `2026-11-06T07-31-00--implement-from-prompt--without-skill` (one
   contaminated draw), and exit 0 on the clean control
   `2026-11-06T07-05-38--implement-from-prompt--opencode-go-gpt-6-luna--without-skill`
   (0/5) and on `2026-11-05T12-35-30--implement-from-prompt`. The last one is the
   clean 12/12, but it predates the detector, so it warns with
   `findings=0 warnings=12`: that is not a clean verdict. All four invocations
   go in the spec's report. Pre-detector artefacts have no `leak` field and are
   not checkable; they emit warnings, not a verdict.
4. **F3 — document.** CONTRIBUTING checklist + coverage evidence rule.
5. **F4 — gates.** `lint` and `selftest`; the new tests run inside the harness
   suite, so no new gate command.

## Data

- `result.json` per case, as written by the runner.
- The run directories used as red/green proof and the pre-detector warning case.
- `docs/evals/coverage.md` — the evidence rule that now names the checker.

## Acceptance Criteria

- **AC-1** — `node scripts/check-eval-run.mjs <dir>` exits non-zero when a
  repetition has a leak or contamination, or when a cited separator lost the
  skill gate, and names the case, the repetition and the cause. Verified by unit
  tests and by the two real directories.
- **AC-2** — A clean control run at 0/5 and a clean with-skill run at 5/5 exit 0;
  the checker does not confuse "the control failed" with "the run is dirty".
  Verified by tests.
- **AC-3** — A result file without the `leak` field is handled explicitly: the
  checker warns that provenance is unknown and does not treat it as clean.
  Verified by a test.
- **AC-4** — `CONTRIBUTING.md` requires the command before a run directory is
  cited, and records the load canary as a manual pre-matrix step with the reason.
- **AC-5** — `lint` and `selftest` are green; no behavioural run was added to CI
  or to the hook.
- **AC-6** — An unfinished run (`manifest.status` not `completed`), a case
  directory without `result.json`, or a run with no case results exits non-zero
  as `incomplete`; a pre-detector run exits 0 with `warnings>0`, never
  `warnings=0`. Verified by CLI tests.

## Results

Model-free checker run against the existing directories (no behavioural run was
started):

| Verdict | Run directory | Output |
| --- | --- | --- |
| **fail** (exit 1) | `2026-11-06T07-47-34--groom-backlog--without-skill` | 2 leaks: `groom-backlog#2` r1 and r2 read the installed `SKILL.md`/`evals.md`; `findings=2 warnings=0` |
| **fail** (exit 1) | `2026-11-06T07-31-00--implement-from-prompt--without-skill` | 1 leak: `implement-from-prompt#2` r3 read the installed corpus; `findings=1 warnings=0` |
| **warn** (exit 0) | `2026-11-05T12-35-30--implement-from-prompt` | 12/12 clean; pre-SPEC-0017 artifact, so 12 `warn leak-missing` lines; `findings=0 warnings=12` — not a clean verdict |
| **pass** (exit 0) | `2026-11-06T07-05-38--implement-from-prompt--opencode-go-gpt-6-luna--without-skill` | 0/5 control clean; `findings=0 warnings=0` |

The clean 12/12 predates the leak detector: its `result.json` has no `leak`
field at all. The checker warns per draw and keeps the historical run citable;
it never treats those draws as clean. A repetition without `leak` in a run that
carries the field anywhere is a `leak-missing` finding. The checker also fails
an unfinished run (`manifest.status` not `completed`), a case directory without
`result.json`, or a run with no case results as `incomplete`: for example,
`2026-11-06T07-09-52--implement-from-prompt--without-skill` exits 1 with
`status running` and no result for its case.

## Stop Conditions

- The checker flags a published, genuinely clean run: the rule is wrong; fix the
  rule with the run as a regression test before touching the document.
- Distinguishing "separator cited" needs a list the document cannot supply
  machine-readably: drop that half, keep the leak half, and record the decision.
  The leak invariant is the one that already produced false passes.
- The pre-commit hook starts needing a model: stop; that is out of scope by
  policy.

## Budget

No model runs for the checker itself. The two proof directories already exist;
the only cost is the engineering.

## Open Questions

- **How the checker learns which cases are separators.** Options: a `separators`
  list in the matrix frontmatter, or a `docs/evals/published.json` manifest. The
  first keeps the fact next to the table; the second is machine-readable but adds
  a file. The spec prefers the manifest only if the matrix cannot carry it.
- **Gate misses in the control arm.** A control run that loads a skill is already
  impossible by construction (`--no-skill` denies the tool), so the checker
  treats a control gate miss as a runner bug, not a case finding.
