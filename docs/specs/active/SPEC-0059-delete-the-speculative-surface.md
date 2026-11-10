---
id: SPEC-0059
title: Delete the speculative surface
status: ready
priority: P2
task: TASK-96
created_at: 2026-11-10
updated_at: 2026-11-10
source_docs:
  - docs/README.md
  - CONTRIBUTING.md
  - docs/specs/SPEC-0057-the-cost-of-measuring.md
  - CHANGELOG.md
related_decisions: []
depends_on: []
blocks: []
files:
  - scripts/audit-provider-aborts.mjs
  - scripts/harness-health.mjs
  - scripts/lib/evals/provider-audit.mjs
  - scripts/lib/evals/provider-audit.test.mjs
  - scripts/lib/evals/health.mjs
  - scripts/lib/evals/health.test.mjs
  - docs/evals/harness-health.md
  - scripts/check-evidence.mjs
  - scripts/lib/evals/evidence.mjs
  - scripts/lib/evals/evidence.test.mjs
  - README.md
  - CONTRIBUTING.md
  - docs/README.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0059-delete-the-speculative-surface.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0059-delete-the-speculative-surface.md --base main
---

## Purpose

Three subsystems exist to serve questions nobody is asking, and one of them
checks the wrong thing.

| Subsystem | Size | Consumer |
| --- | --- | --- |
| `provider-audit` + `audit-provider-aborts.mjs` | 124 lines + 100 test lines | a one-off 0.6.2 scan of stored transcripts |
| `health` + `harness-health.mjs` + `harness-health.md` | 471 lines + test doc | a per-release health baseline nobody reads |
| `check-evidence` + `evidence.mjs` | 178 lines + test | the only thing tying a published rate to a run directory |

The first two go. The third stays but narrows: today it sweeps every markdown
citation in the repository, which is why it carries 100 warnings nobody acts on.
The invariant worth keeping is one line — **a cited run directory must exist** —
and that is cheap to enforce.

## User Outcome

- 700+ lines of code and tests deleted, with no behaviour lost that anyone uses.
- `check-evidence` exits 0 with no warning noise, so a real finding is visible.
- `docs/pipeline.md` is untouched: the policy keeps `check-evidence` in `selftest`
  and the command still does its job.

## Scope

### F1 — delete the provider audit

`scripts/audit-provider-aborts.mjs`, `scripts/lib/evals/provider-audit.mjs` and
its test. Provider aborts are classified per draw at run time and recorded in
`execution.error`; the stored-transcript sweep answered a question that the runner
now answers directly. Nothing imports it.

### F2 — delete the health baseline

`scripts/harness-health.mjs`, `scripts/lib/evals/health.mjs`, its test, and
`docs/evals/harness-health.md`. It aggregated whole-store trends for a release
report that no longer exists; `docs/evals/coverage.md` carries the current state.

### F3 — narrow `check-evidence`

Keep: every cited run directory in `docs/evals/coverage.md` and the matrix files
resolves, and a cell with no run directory is a finding.

Drop: the repository-wide markdown sweep that produced the 100 pre-existing
warnings, and the citation forms it guessed at.

The command keeps its name and its exit contract, so `docs/pipeline.md`'s
`selftest` line does not change. Any citation the narrower check cannot resolve is
reported once, not guessed.

### F4 — clean the references

`README.md`, `CONTRIBUTING.md` and `docs/README.md` lose the mentions of the
deleted commands. No new document replaces them.

## Non-Goals

- **No policy change.** `docs/pipeline.md` is not edited; the `selftest` line keeps
  `check-evidence`, `run-evals --list --check`, the test globs, sensor parity and
  the bootstrap tests. No human gate this spec cannot clear on its own.
- **No archive of `docs/evals/experiments/`.** Those 294 files are cited history;
  removing them needs its own spec and an explicit enumeration, and this one is
  about code, not prose.
- No change to `speccheck`, the spec contract, or any skill.
- No paid draw.

## Flow

1. **F1** — delete the provider audit and its test; grep for callers first.
2. **F2** — delete the health baseline, its test and its document.
3. **F3** — rewrite `check-evidence` to the cited-run invariant; keep the CLI and
   the exit code; prove the count of warnings drops to zero on a clean tree and
   that a missing run directory still fails.
4. **F4** — remove the dead mentions from the three documents.
5. **F5** — publish: `CHANGELOG.md` and a Results section with the net line count.

## Data

- The seven files named in `files:`.
- `docs/evals/coverage.md` as the citation source `check-evidence` reads
  (read-only here; SPEC-0062 owns it in this wave).

## Acceptance Criteria

1. `scripts/audit-provider-aborts.mjs`, `scripts/lib/evals/provider-audit.mjs` and
   its test are gone, and no file references them.
2. `scripts/harness-health.mjs`, `scripts/lib/evals/health.mjs`, its test and
   `docs/evals/harness-health.md` are gone, and no file references them.
3. `check-evidence` keeps its path, its name and its exit contract; it no longer
   walks arbitrary markdown.
4. On a clean tree `node scripts/check-evidence.mjs` exits 0 with **zero**
   warnings (today: 100).
5. A cited run directory that does not exist is still a finding with a non-zero
   exit; the test proves it.
6. `docs/pipeline.md` is not in the diff and `npm run selftest` still passes
   unchanged.
7. The net line delta is negative and published in Results, with the count per
   deleted module and its test.
8. No file under `docs/specs/**` or `backlog/**` is modified except this spec and
   the task.
9. Zero paid draws; every gate in `tests:` passes.

## Decisions

- **`check-evidence` narrows rather than disappears.** Its invariant — a
  published rate points at a run that exists — is the repository's product claim.
  What was wrong was the mechanism: a whole-repository sweep that treats every
  prose mention as a citation and reports 100 warnings, which trains the reader to
  ignore it.
- **The archive of `experiments/` waits.** Deleting 294 files is a different
  change with a different risk, and doing it here would swell `files:` to a size
  nobody reviews.

## Open Questions

None.

## Prompt Notes

- Grep for every deleted symbol before deleting: `provider-audit`,
  `harness-health`, `health.mjs`. The 0.6.2 CHANGELOG entry names
  `audit-provider-aborts` as history and must stay as prose.
- `check-evidence` may share helpers with `check-staleness`; if it does, keep the
  shared helper and delete only the sweep. Do not duplicate a parser.
- The zero-warning claim is the point of F3. If the narrower check still warns on
  a real citation gap, publish that number honestly instead of forcing zero.

_Filled during implementation._
