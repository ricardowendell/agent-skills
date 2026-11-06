# Changelog

All notable changes to the skills and to the eval harness are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/), and this
project uses [Semantic Versioning](https://semver.org/). The artifact is the set
of skills plus the evidence that backs them, so a version is a claim: which
skills, which cases, and which published measurements.

## [Unreleased]

## [0.4.1] — 2026-11-06

The per-release retro stopped being a promise and got a number.

### Added

- **`harness-health`** — a read-only report over the eval store and
  `.pdlc/runs.json`: draws and outcomes, wall time, tokens, judge disagreements,
  provenance, pdlc retries and red gates. `--json`, `--since`, `--until`; the
  output is deterministic over a bounded snapshot.
- **The 0.4.0 baseline** in `docs/evals/harness-health.md` (173 runs, 844 draws),
  reproducible with `--until 2026-11-06T16:12:50Z`.
- **The loop** in `CONTRIBUTING.md`: per release, before the CHANGELOG, at most
  three findings and one spec.

### Changed

- **"Clean" is split.** `Eligible` means completed runs without contamination or
  infrastructure; `Strict` adds a `checkRun` finding-free draw and full
  provenance. The strict rate is per draw; `coverage.md`'s rule is per run
  directory, so it is the closest comparable trend, not a substitute.
- Usage and judge counts are raw over the whole store; the rates, the dirty
  partitions and wall time exclude unfinished runs.

### Fixed

- The report reuses `runcheck.infrastructureOf`, so eight pre-SPEC-0020 timeouts
  count as infrastructure (9 total), not as eligible failures.
- The baseline is reproducible: the store only grows, and `--until` closes the
  upper end. A record with no parseable start is kept, not dropped.

### Measured

- **173 runs, 844 draws**: eligible 827, denominator 814, **67.2%**; strict 90
  draws, 87 passed / 3 failed, **96.7%**; infrastructure 9; provenance 95
  complete / 745 partial; wall 12h 10m 14s.
- **pdlc**: 10 runs (9 merged, 1 active), 0 retries, 0 red gates, median 43m 11s.
- `pdlc audit` still reports no durable fact after ten runs. The generic signal
  is queued as PDLC-83; the loop reads the record directly and does not wait.

### Known gaps

- The eligible rate mixes partial provenance. Use the strict rate for a clean
  comparison, and name the run directory before calling a delta a regression.
- The report is evidence, not a gate: no number in it fails CI.

## [0.4.0] — 2026-11-06

The evidence got a better instrument and a written disposition; two published
numbers were corrected along the way.

### Added

- **The judge sees the run's tool calls.** A derived ledger (`skill`, `read`
  path, `edit` diff, `write` content, `shell` command/exit/output) is the single
  evidence block, and `verifyEvidence` searches exactly the text the prompt
  shows. The separate command log was removed: it was unmetered, so a judge could
  cite a line that was not in the corpus.
- **`replay-evals --judge`.** Re-judges stored draws without an agent run;
  `--run` selects one directory, and each report carries the stored
  `repoSha`/`skillHash` plus `provenance: complete|partial`.
- **`Dispositions` in `coverage.md`.** Every decided case names the decision, the
  reason, the run directories and the date.

### Changed

- `pdlc_version` floor is `>=1.0.0`; v1.0.0 is published and the run records
  already store it.
- **Case #3 left `manual`.** Its fixture now makes the prompt's literal path fail
  (a generated barrel with a test, plus the convention that text helpers live in
  `src/text.js`), and one sanity draw proved the scope change. It is a regression
  case, not a separator: no control was measured. 76 cases, 74 runnable, 2 manual.

### Fixed

- **The judge's evidence matcher** normalises a leading `$ ` and accepts a short
  literal quote. Re-judging the #7 control moved **1/5 → 5/5**.
- **`--run` is a prefix match**, `--json` requires `--judge`, and a draw that
  failed deterministically is reported as `skipped` rather than `0/0 judged`.
- **Two published numbers corrected by the audit.** `review-code` #3 is **1/10**
  against 10/10, not 0/10 (the pass is a `Hold the merge` stance the guard did not
  name); `audit-code-quality` #4's earlier "passed once / failed once" compared
  two different case versions — the final 8-assertion pair is 1/1 vs 0/1, one
  draw per arm.

### Measured

- **#1 with skill stayed 0/5, for a new reason.** Expectation 1 is `not-met` in
  4/5 (no draw read `AGENTS.md` first; r5 did and was `met`), and expectations 2/4
  are unverifiable by construction. The residual is TASK-40; the instrument was
  not tuned to reach a number.
- The re-judged draws are byte-identical before and after (`result.json` sha256),
  and the ten judge calls spent no agent draw.

### Known gaps

- **#1's with-skill cell predates the SPEC-0016 skill rewrite** (default 12/12 and
  luna 5/5 were measured on the old `SKILL.md`); refreshing that arm needs a
  current-skill re-run.
- **`audit-code-quality` #4 needs n≥5** on the final 8-assertion version before it
  can be called a discriminator.
- **Both re-judged cells are `provenance: partial`** (they predate SPEC-0020), so
  the reuse rule cannot certify them.

## [0.3.0] — 2026-11-06

The runner stopped paying for evidence it does not need, and the load question
was answered: the defect did not reproduce.

### Added

- **Parallel repetitions.** `--concurrency` now limits draws, not cases, so
  `--case 1 --repeat 12` runs four draws at a time. A 12-draw cell went from
  `387 s` of draw time to `176.6 s` of wall time (the same artifact, 12/12).
- **`--stop <passes>/<fails>`.** Defaults to `5/3` when `repeat > 5`; the artifact
  records `stoppedEarly` and the observed `sequence`, and `reps` is what actually
  ran. The stop is evaluated between waves, so a 5-pass target with four lanes
  can finish at eight draws.
- **Provenance for reuse.** Each result records `fixtureHash`, `promptHash` and a
  derived `detectorVersion`; `CONTRIBUTING.md` allows citing an earlier control
  only when all three match.
- **`--stall-seconds`** (default 120). A draw whose event stream goes quiet is
  killed as `stalled`, distinct from `timeout`, instead of waiting the full 600 s.
- **Infrastructure outcomes.** `timeout` and `stalled` become `unscored` with an
  infrastructure reason, at most one retry, and never count as a pass or a
  behavioural failure. `check-eval-run` reports them as findings.

### Changed

- `manifest.json` records `concurrency`, `repeat`, `stop` and `stallMs`.
- A retry re-stages the fixture and the skill into a fresh scratch, so `unchanged`
  assertions cannot be satisfied by the dead attempt.

### Fixed

- `check-eval-run` now sees a legacy `execution.exit: "timeout"`; two 2026-11-05
  directories stopped reading as clean.
- A draw that both stalled and leaked is counted once, as infrastructure.

### Measured

- **The load defect did not reproduce.** At `07f4fe6`, 45 of 46 clean draws
  loaded the skill across `#1`, `#2`, `#5` and `#8` at `n=12`. `#2` is readable
  (11/12 passed) instead of gate 2/5; the description was not changed.
- The Gate A reading is recorded as "did not reproduce", not "fixed": the delta
  includes the SPEC-0016 rule change, so the cause is not isolated.

### Known gaps

- The control arm can still read the installed skill; detection remains the only
  guarantee.
- A direct read of the staged `SKILL.md` is not counted as a load (`TASK-39`).
- `groom-backlog` #2 stays unresolved: its clean control is 0/1.

## [0.2.0] — 2026-11-06

The trust wave: a control run can no longer score a pass by reading the skill it
is supposed to be measured against.

### Added

- **Leak detection** (SPEC-0017). Every repetition records `leak` (the tool calls
  that touched an installed skill or the eval corpus outside the scratch) and
  `contaminated`. A contaminated repetition is not a pass in either arm.
- **`scripts/check-eval-run.mjs`** (SPEC-0018). A model-free checker over a run
  directory: it fails on a leak, on a contaminated repetition, on a lost skill
  gate in the `with-skill` arm, and on an incomplete run (not `completed`, or a
  case directory without `result.json`). `CONTRIBUTING.md` requires it before a
  run directory is cited as a clean measurement.

### Changed

- A contaminated repetition is `unscored`, not `failed`, and leaves the pass-rate
  denominator. `compareRuns` counts any transition out of `passed` as a
  regression, including `passed → unscored`.
- `permission.external_directory: "deny"` ships in the child config as a
  best-effort layer. It does **not** block the read; detection is the guarantee.

### Fixed

- **`implement-from-prompt` #1 on `gpt-6-luna`: the control was 0/5, not 1/5.**
  The single control pass had read the installed `SKILL.md`; re-measured with the
  detector, the separator is 5/5 against 0/5 on both models.
- **`groom-backlog` #2 is unresolved, not a non-discriminator.** Its published
  3/3 tie had 2/3 contaminated control draws; the one clean draw failed. The
  `coverage.md` row now says so.

### Known gaps

- The control arm can still read the installed skill; only detection stands
  between that and a false pass.
- Three pre-detector run directories cannot be re-judged: they have no `leak`
  field and the checker reports `warnings` instead of a clean verdict.

## [0.1.0] — 2026-11-05

First versioned cut. This entry is retroactive: it records what landed before the
repository had a version, so later entries can be read against it.

### Added

- **13 skills** for the product-thinking pipeline: `capture-idea`,
  `process-inbox`, `groom-backlog`, `write-implementation-prompt`,
  `implement-from-prompt`, `review-code`, `audit-docs`, `audit-code-quality`,
  `bootstrap-project-harness`, `tighten-harness`, `find-blind-spots`,
  `record-decision` and `survey-inflight-work`.
- **Eval harness** (`scripts/run-evals.mjs` and `scripts/lib/evals/`) with
  fixtures, assertion kinds, a skill-provenance gate, a control arm and an
  optional judge.
- **Coverage inventory** (`docs/evals/coverage.md`): 76 cases, 26 trigger cases,
  3 manual.
- **Published matrices**: `review-code` and `implement-from-prompt`.
- **pdlc adoption** (`docs/pipeline.md`, `.opencode/agents/`, `runs/`): the
  orchestrated cycle with `lint` and `selftest` as its gates.

### Fixed

- `implement-from-prompt` read a path the prompt names as a place to write as if
  it were an existing module to extend; step 3 now separates a write target from
  a read dependency.
- `groom-backlog` case 2 asserted `nodir docs/specs`, which punished the split
  the skill's own step 6 asks for; the assertion now reads the reply.
- The `pre-commit` hook leaked `GIT_DIR` and `GIT_INDEX_FILE` into the fixture
  tests, which could switch a worktree's branch and set `core.bare` on the main
  repo.

### Changed

- `release_tier` moved from B (dry tag) to A (semver, changelog, tag) so a
  release means something.
- `implement-from-prompt` #4 is now a regression case, not a discriminator: the
  skill passes 5/5, and so does the control at 3/5.
- `groom-backlog` #2 left the matrix: 3/3 in both arms.

### Known gaps

- Four skills have no measurement yet: `capture-idea`, `process-inbox`,
  `record-decision` and `write-implementation-prompt`.
- The control arm can still read an installed skill; `TASK-29` tracks the fix.
