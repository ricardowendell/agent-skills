---
id: SPEC-0024
title: Give every release a harness-health baseline
status: ready
priority: P2
task: TASK-41
created_at: 2026-11-06
updated_at: 2026-11-06
source_docs:
  - docs/evals/coverage.md
  - docs/evals/harness-health.md
  - CONTRIBUTING.md
related_decisions: []
depends_on: []
blocks: []
files:
  - scripts/harness-health.mjs
  - scripts/lib/evals/health.mjs
  - scripts/lib/evals/health.test.mjs
  - docs/evals/harness-health.md
  - CONTRIBUTING.md
  - docs/specs/active/SPEC-0024-harness-health.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
---

# SPEC-0024: Give every release a harness-health baseline

## Purpose

The per-release retro exists as a decision (2026-11-06): close every release with
a short health pass, at most three tasks and one spec. The first pass found the
gap immediately. `pdlc audit` ran nine times across the 0.4.0 wave and printed
"nenhum fato durável" every time, because its only learn rule is a `verify`
escalation and no run escalated. The repo has the raw material — 170 run
directories, `.pdlc/runs.json`, the published matrices — but no single, repeatable
number that answers "is the harness getting slower, dirtier or more expensive
than the last release?".

Without that number the retro is a matter of memory, and a release cannot be
compared with its predecessor. The loop needs a baseline before it can have a
trend.

## User Outcome

At the close of a release, one command prints the same table for the new release
and the previous one: draws, outcomes, wall time, tokens, judge disagreements,
provenance completeness and the pdlc retry/gate picture. The first baseline is
published for 0.4.0; the next release is read against it instead of in the
abstract.

## Scope

- **A read-only report, `scripts/harness-health.mjs`.**
  - Sources: `~/.local/share/opencode/evals/runs/` (each run's `manifest.json`
    and each case's `result.json`) and `.pdlc/runs.json`. Both are read, never
    written.
  - Filters: `--runs <dir>` (default the local eval store), `--pdlc <file>`
    (default `.pdlc/runs.json`), `--since <YYYY-MM-DD>` on the run's
    `startedAt`. Output: markdown by default, `--json` for an artifact.
  - Deterministic: runs sorted by id, durations rounded to seconds, no clock
    inside the report. Two invocations over the same store print identical text.
  - Metrics, per section:
    - **Evals** — runs, cases, draws; passed / failed / unscored; contaminated
      and infrastructure separately; clean draws and the rate over them; wall
      time from `manifest.startedAt`→`finishedAt`; the sum of per-draw
      `durationMs`; tokens and steps; judge runs, judge failures and the
      deterministic-pass/judge-fail count; provenance complete vs partial
      (`fixtureHash` + `promptHash` + `detectorVersion` all present).
    - **pdlc** — runs by status, retries (`attempts > 1`), gate failures
      (`gates[].ok === false`), and the median `duration`.
  - Single-draw cases (no `repetitions`) and repeated cases are both handled;
    the report says which shape it saw.
- **The first baseline**, `docs/evals/harness-health.md`: the 0.4.0 table, the
  exact command, the date, and how to read a delta (what is a regression, what is
  variance, why a rate is per clean draw). The numbers come from running the
  script, not from a spreadsheet.
- **The release loop in `CONTRIBUTING.md`**: before the CHANGELOG entry, run the
  report, note the delta against the previous release, and file at most three
  findings. The report is evidence; it is not a CI gate and it spends no model.
- **A task for the loop** (`TASK-41`) so the first run is traceable.

**Blast radius.** One new script and its pure aggregator, one new doc, one
paragraph in `CONTRIBUTING.md`. No skill, assertion, fixture, gate or eval
behavior changes.

## Non-Goals

- No fix to `pdlc audit` here; that is the sibling spec in the pdlc repo
  (PDLC-72). This spec only produces the input it will read.
- No dashboard, no database, no history file: the store is the history, and the
  report is deterministic over it.
- No hook/PATH change. The pyenv `python3` failure is a host issue; it gets its
  own task instead of being smuggled into the report.
- No new draw and no judge. The report reads artifacts.

## Flow

1. **F0 — aggregator.** `scripts/lib/evals/health.mjs` with pure functions over
   already-read objects: `evalHealth({ runs })`, `pdlcHealth({ runs })`,
   `renderMarkdown(report)`. No I/O in the pure layer, so the tests do not need a
   fake home.
2. **F1 — CLI.** `scripts/harness-health.mjs`: discovery, filters, JSON/markdown.
   Refuses an unknown flag and a malformed `--since` (same contract as
   `replay-evals`).
3. **F2 — tests.** A temp store with: a repeated case (12 draws, one
   infrastructure, one contaminated), a single-draw case, one judge failure, one
   complete and one partial provenance, and a `.pdlc/runs.json` with a retry and a
   red gate. Assert each count and that two runs over the same fixture are
   byte-identical.
4. **F3 — baseline.** Run it over the real store at 0.4.0, write
   `docs/evals/harness-health.md` with the output pasted, and cite the command and
   the date.
5. **F4 — loop.** One paragraph in `CONTRIBUTING.md`: when to run it, how to read
   the delta, the three-finding cap.

## Data

- `~/.local/share/opencode/evals/runs/<run>/manifest.json` — counts, model, arm,
  params, `startedAt`/`finishedAt`.
- `…/cases/<case>/result.json` — `repetitions[]` (or a single draw), `execution`,
  `semantic`, `fixtureHash`/`promptHash`/`detectorVersion`.
- `.pdlc/runs.json` — per-run `status`, `attempts`, `gates`, `duration`.
- `docs/evals/harness-health.md` — the published baseline.

## Acceptance Criteria

1. **The report runs and is read-only.** `node scripts/harness-health.mjs` prints
   the markdown table over the local store; `--json` emits the same numbers; the
   eval store and `.pdlc/runs.json` are unchanged (hash before/after).
2. **Deterministic.** Two invocations over the same store produce identical
   output; the test asserts it on a fixture store.
3. **Every metric is covered by a unit test** on a fixture store: single and
   repeated cases, pass/fail/unscored, contamination, infrastructure, judge
   failure, provenance complete/partial, pdlc retry and gate failure. `--since`
   and an unknown flag are tested.
4. **The 0.4.0 baseline is published** in `docs/evals/harness-health.md` with the
   command, the date and the real numbers; a reader can regenerate it and get the
   same text.
5. **The loop is written down** in `CONTRIBUTING.md`: per release, before the
   CHANGELOG, at most three findings, one spec.
6. **No draws, no model, no behavior change.** `git diff -- skills/` empty; the
   five policy gates pass.

## Stop Conditions

- If a stored artifact cannot be parsed, the report counts it as `unreadable` and
  names the directory; it does not skip silently and does not fail the whole run.
- If the store has two shapes of `result.json` that cannot be reconciled (a
  missing `manifest.json`, a case with neither repetitions nor execution), stop
  and report the directory before inventing a shape.
- If the baseline makes the report look like a gate, cut it back: it is evidence,
  not a threshold.

## Budget

Zero draws, zero judge calls. The report is local file I/O over ~170 directories.

## Open Questions

- Should the baseline include the number of cases with a recorded disposition
  (`Dispositions` in coverage)? Nice to have, but parsing prose is fragile;
  leave it out of v1 and add a machine-readable count only when coverage grows
  its own structure.
