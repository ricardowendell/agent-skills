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
  - docs/evals/coverage.md
  - docs/evals/harness-health.md
  - .githooks/pre-commit
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

1. **`spec-check` refuses the contract breaks that can break a build**: a
   touched file missing from `files:`, a dangling `task:`, a dangling
   `depends_on`/`blocks`, and a placeholder left in an `implemented` spec exit 1,
   one line per finding, `--json` matching. A declared file the diff did not
   touch and an asymmetric `depends_on`/`blocks` print warnings instead, so an
   innocent edit of an old spec does not fail on debt it inherited.
2. **`check-evidence` refuses a missing run directory**, a completed run with no
   `cases/`, an unfinished run cited as complete, and a v1 run claimed
   `isolated=yes`; it warns when a rejected run is cited as clean without a
   marker, and `--strict` makes that fatal.
3. **Both are model-free** and finish in seconds over the whole repo.
4. **Wiring works**: `check-evidence` is in the `selftest` line and passes; CI
   runs `spec-check` on the changed specs; `CONTRIBUTING.md` documents both with
   the exact command.
5. **The corpus passes** after the citations this spec has to fix; the repair
   list and what changed are in Results, and no published number moved.
6. **No drift**: `git diff main...HEAD -- skills/` is empty, the five gates pass,
   and the spec spends no draw.

## Results

### F0 — the inventory

Both checks were run over the current corpus in report mode before any code was
changed:

```text
node scripts/spec-check.mjs --spec docs/specs/active/<each>.md
node scripts/check-evidence.mjs
```

After the full-name rule below, `check-evidence` found 4 errors and 97 warnings.
The errors were the four `missing result.json` bullets under **Unreadable eval
artefacts** in `docs/evals/harness-health.md`, where the run is `running` but the
line did not carry a completion marker. The warnings are runs with findings
cited as history without one of the dirty markers; they stay warnings, not
errors.

The first pass with exact-directory resolution produced 116 "missing" errors.
Most were shorthands the corpus already uses (`2026-11-06T17-25-52--process-inbox`
for the `...--without-skill` directory). That was a false positive, so the check
resolves an exact directory first; only a two-segment token (timestamp + skill)
may stand for a unique `${token}--*` directory, and an ambiguous one is an error
that names the candidates. A token with an arm (three or more segments) never
falls back to a prefix: `...--demo--nonexistent-arm` must not resolve to
`...--demo`. Two genuinely wrong citations were corrected:
`2026-11-04T21-59-17--without-skill` (missing the `--audit-code-quality` label)
and `2026-11-05T13-22-08--implement-from-prompt--opencode-go-gpt-6-luna` (the
with-skill directory does not exist; the cited artefact is the control). Neither
change moves a number.

`spec-check` over the active corpus found two historical specs with
`status: implemented` and no Results section (`SPEC-0015`, `SPEC-0016`) and four
one-way links: `SPEC-0019` → `SPEC-0020`, `SPEC-0023` → `SPEC-0021`,
`SPEC-0023` → `SPEC-0022`, and `SPEC-0030` → `SPEC-0029`. They predate the rule
or live in specs outside this spec's files; they are not changed. Both classes
are warnings now, so touching one of those specs prints the debt without failing
CI.

### F1/F2 — `speccheck` and `spec-check`

`scripts/lib/evals/speccheck.mjs` parses the frontmatter subset the specs use
(scalars, `[]`, inline and block lists) and applies the contract rules. The CLI
is `--spec <path> --base <ref> [--json]`; without `--base` it runs the
contract-only rules. Errors exit 1, warnings print and exit 0, one line per
finding, no stack trace.

The diff rule reports both directions. A declared file the diff did not touch is
a warning: a plan may name a file the implementation did not need. A touched
file the spec did not declare is always an error. Results prose is not used to
suppress either direction. Symmetry is literal (`A blocks B` ⇔ `B depends_on A`),
but an asymmetric link is a warning, not an error: the corpus has four
pre-existing one-way links, and an innocent edit of one of those specs must not
fail the build. A dangling slug remains an error. The diff is read with
`git diff --name-only -z` so a non-ASCII path is compared raw, not C-quoted.

### F3 — `evidence` and `check-evidence`

`scripts/lib/evals/evidence.mjs` scans `docs/evals/*.md` for run-directory
tokens and applies `checkCitation` to the record the CLI reads. The CLI reads
`manifest.json` and `cases/*/result.json`, reuses `checkRun`, and never calls a
model. Errors: missing directory, a completed run with no `cases/` or no case
results, non-`completed` run without a marker on the line, and `isolated=yes` for
a run whose recorded detector differs from `DETECTOR_VERSION`. Warning: a
completed run with findings cited without a
`dirty|leak|host|stall|contaminated|discard|history|failure` marker; `--strict`
makes it fatal. The warning is advisory in `selftest` so the 97 historical
citations do not turn the gate red.

The token cases that used to slip:
- `...--demo--nonexistent-arm` → `missing-run` (the arm is never dropped);
- `...--demo--with-skill` (exact directory) → clean;
- `...--demo` with two `...--demo--*` candidates → `missing-run` naming both;
- a `completed` manifest with no `cases/` → `empty-run`.

### F4 — wiring

- `docs/pipeline.md`: `node scripts/check-evidence.mjs` joins the `selftest`
  line; the gate description says CI runs the rest plus `spec-check` because it
  has no local store.
- `.github/workflows/skills.yml`: checkout is `fetch-depth: 0`, and a
  `Spec contract for changed specs` step runs `spec-check` for every spec the
  push/PR diff touches, using the PR base sha or `event.before`.
- `CONTRIBUTING.md`: new **Checking a publication** section with both exact
  commands, the local-`main` base rule, and the `--strict` rule; the CI list and
  the pre-PR checklist now name them.
- `.githooks/pre-commit`: runs `check-evidence.mjs` after sensor parity, so the
  hook and the `selftest` line cannot drift.

### F5 — the repair list

- `docs/evals/harness-health.md`: the four `missing result.json` bullets gained
  `(unreadable)`. They are the four errors the check reported.
- `docs/evals/coverage.md`: `2026-11-04T21-59-17--without-skill` →
  `2026-11-04T21-59-17--audit-code-quality--without-skill`, and
  `2026-11-05T13-22-08--implement-from-prompt--opencode-go-gpt-6-luna` →
  the `--without-skill` directory. No published number moved.

These two documents were added to this spec's `files:` line: they are the corpus
repair the Scope asks for, and declaring them keeps the diff honest.

```text
node scripts/check-evidence.mjs
6 documents, 0 errors, 97 warnings; current detector 71bfb85a91cd68ab
```

### Tests and gates

`scripts/lib/evals/speccheck.test.mjs` has one fixture per rule plus the clean
case, a git-backed CLI test for errors and `--json`, a non-ASCII path test for
`-z`, and a usage-error test. `evidence.test.mjs` has the pure rule cases plus a
synthetic store (existing/clean, running, v1 with `isolated=yes`, dirty,
completed-without-cases), a two-segment shorthand/ambiguity test, and the
with-arm cases (exact exists, missing arm, empty run).

```text
node scripts/validate-skills.mjs --root skills                      All clear
node scripts/run-evals.mjs --root skills --list --check             exit 0
node --test scripts/lib/evals/*.test.mjs                            333 pass
node --test skills/bootstrap-project-harness/scripts/*.test.mjs     pass
node scripts/check-sensor-parity.mjs                                2/2 fixtures
node scripts/check-evidence.mjs                                     0 errors
node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0032-...md --base main
```

`git diff main...HEAD -- skills/` is empty. Zero model draws.


## Open Questions

- **How strict is "equals the diff"?** Resolved: a declared file the diff did
  not touch is a warning, never suppressed by prose; a touched file the spec did
  not declare is an error. The check reports both directions.
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
