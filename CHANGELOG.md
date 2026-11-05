# Changelog

All notable changes to the skills and to the eval harness are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/), and this
project uses [Semantic Versioning](https://semver.org/). The artifact is the set
of skills plus the evidence that backs them, so a version is a claim: which
skills, which cases, and which published measurements.

## [Unreleased]

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
