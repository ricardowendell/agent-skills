---
id: SPEC-0032
title: Check publication mechanically instead of by review
status: ready
priority: P1
task: TASK-49
created_at: 2026-11-06
updated_at: 2026-11-06
source_docs:
  - docs/evals/coverage.md
  - docs/pipeline.md
  - CONTRIBUTING.md
related_decisions: []
depends_on: []
blocks:
  - SPEC-0031-remeasure-under-detector-v2
files:
  - scripts/lib/evals/speccheck.mjs
  - scripts/lib/evals/speccheck.test.mjs
  - scripts/spec-check.mjs
  - scripts/lib/evals/evidence.mjs
  - scripts/lib/evals/evidence.test.mjs
  - scripts/check-evidence.mjs
  - docs/pipeline.md
  - .github/workflows/skills.yml
  - CONTRIBUTING.md
  - docs/specs/active/SPEC-0032-deterministic-publish-checks.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
---

# SPEC-0032: Check publication mechanically instead of by review

## Purpose

Three of the four review rounds on SPEC-0028 were not judgment. They were:

- `files:` did not equal the diff;
- another document still quoted the old number;
- a new rule was applied to one table and not to the rows that summarise it.

The same class cost SPEC-0029 a round and SPEC-0030 three. Every one of those is
machine-checkable. A model should be reading for doctrine and design, not
grepping for a stale `0/5`.

Two checks close it: one for the spec contract, one for the evidence it cites.
Both are code, both run in seconds, neither spends a model turn.

## User Outcome

A spec whose `files:` does not match its diff, whose `task:` does not exist, or
whose `depends_on` is dangling fails before a reviewer sees it. A document that
cites a run directory which does not exist, is unfinished, or is claimed clean
while the checker rejects it fails before it lands.

## Scope

- **`scripts/spec-check.mjs`** — `--spec <path> --base <ref>`; exit 1 per
  finding, `--json` for an artifact. Rules:
  - `files:` is non-empty and equals `git diff --name-only <base>...HEAD` (the
    spec may declare a file it did not touch only when it says so in Results;
    the check reports both directions).
  - `task:` resolves to a `backlog/tasks/` file with that id.
  - every `depends_on`/`blocks` entry resolves to a spec slug, and the two keys
    are symmetric (`A blocks B` ⇔ `B depends_on A`).
  - `status: implemented` leaves no `_Filled during implementation._` and a
    non-empty Results.
  - `status: ready` requires `task:`, `files:` and at least one AC.
- **`scripts/check-evidence.mjs`** — scans `docs/evals/*.md` for run-directory
  tokens and checks them against the store (`--store`, default the local one):
  - the directory exists;
  - its manifest is `completed`, unless the citing line marks it
    `unfinished|running|discard|history|unreadable`;
  - a line claiming `isolated=yes` cites a run whose recorded detector version
    is the current one;
  - warning: a line cites a run the checker rejects (findings > 0) without a
    marker (`dirty|leak|host|stall|contaminated|discard|history|failure`).
  `--strict` promotes the warning to an error.
- **Wiring.** `check-evidence` joins the `selftest` line in `docs/pipeline.md`
  (policy change approved at the human gate); `spec-check` runs in CI for the
  specs a pull request changes. `CONTRIBUTING.md` says when to run each.
- **The corpus passes.** Any citation the new check flags is corrected in this
  spec — a missing directory, an unfinished run cited as complete, a v1 run
  claimed `isolated=yes`. The numbers are not rewritten; the marker is.

**Blast radius.** Two new CLIs, their pure modules and tests, one policy line,
one CI step, one manual section. No skill, case, fixture, assertion or runner
change. **Zero model draws.**

## Non-Goals

- **No prose judging.** The checks verify structure: does the directory exist, is
  the count from the run, is the version the one claimed. They do not decide
  whether a sentence interprets its evidence correctly.
- No replacement for the reviewer: doctrine, design and the "does this follow
  from the measurement" calls stay human/model work.
- No new dependency and no build system; plain Node like the rest of `scripts/`.
- No retroactive rewrite of published numbers.

## Flow

1. **F0 — inventory.** Run both checks over the current corpus in report mode
   and list every hit; those hits are this spec's repair list.
2. **F1 — `speccheck`** pure module: contract rules over texts + a diff list.
3. **F2 — CLI**: `--spec`, `--base`, `--json`.
4. **F3 — `evidence`** pure module + CLI over the store.
5. **F4 — wiring**: selftest, CI, CONTRIBUTING.
6. **F5 — repair** the corpus citations, then prove both green.

## Data

- `docs/specs/active/SPEC-*.md` — frontmatter and body.
- `backlog/tasks/task-<n> - *.md` — the task binding.
- `~/.local/share/opencode/evals/runs/` — manifests and results.
- `docs/evals/*.md` — the claims.

## Acceptance Criteria

1. **`spec-check` refuses the four contract breaks**: `files:` ≠ diff, a dangling
   `task:`, an asymmetric or dangling `depends_on`, and a placeholder left in an
   `implemented` spec. Exit 1, one line per finding, `--json` matches.
2. **`check-evidence` refuses a missing run directory**, an unfinished run cited
   as complete, and a v1 run claimed `isolated=yes`; it warns when a rejected run
   is cited as clean without a marker, and `--strict` makes that fatal.
3. **Both are model-free** and finish in seconds over the whole repo.
4. **Wiring works**: `check-evidence` is in the `selftest` line and passes; CI
   runs `spec-check` on the changed specs; `CONTRIBUTING.md` documents both with
   the exact command.
5. **The corpus passes** after the citations this spec has to fix; the repair
   list and what changed are in Results, and no published number moved.
6. **No drift**: `git diff main...HEAD -- skills/` is empty, the five gates pass,
   and the spec spends no draw.

## Results

_Filled during implementation._

## Open Questions

- **How strict is "equals the diff"?** A worker often declares a file and does
  not touch it (the SPEC-0030 case was the reverse). The rule should report both
  directions and let the spec explain one in Results rather than silently pass.
- **Does `check-evidence` need a base?** Checking the whole corpus on every
  commit is cheap here (the store is local, the docs are small). If it becomes
  slow, `--changed` is the escape, not a default.

## Prompt Notes

- **Requirements**: two deterministic CLIs, wired, with the corpus green.
- **Entities**: spec contract, run directory, detector version, marker.
- **Approach**: pure rule modules first (testable without git), thin CLIs after.
- **Structure**: `scripts/lib/evals/speccheck.mjs` and `evidence.mjs`; the CLIs
  only read the repo and print.
- **Operations**: `git diff --name-only` for the file list; `checkRun` from
  `runcheck.mjs` for the dirty verdict; no shell injection.
- **Norms**: one line per finding, exit 1, `--json` for artifacts, no colour.
- **Safeguards**: never rewrite a number; a check that cannot decide prints a
  warning, not a pass; do not add a rule the corpus cannot satisfy without a
  repair list in the spec.
- **Tests**: one fixture per rule plus a clean case, in the existing
  `scripts/lib/evals/*.test.mjs` glob.
