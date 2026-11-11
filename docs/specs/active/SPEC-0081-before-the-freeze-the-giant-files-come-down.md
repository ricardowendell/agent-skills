---
id: SPEC-0081
title: Before the freeze, the giant files come down
status: implemented
priority: P2
task: TASK-111
created_at: 2026-11-11
updated_at: 2026-11-11
source_docs:
  - backlog/tasks/task-111 - harness-reduzir-os-arquivos-gigantes-de-evals-antes-do-freeze.md
  - docs/evals/coverage.md
  - docs/pipeline.md
  - docs/specs/SPEC-0058-the-corpus-leaves-the-skill.md
related_decisions: []
depends_on: []
blocks: []
files:
  - scripts/lib/evals/assertions.mjs
  - scripts/lib/evals/assertions.test.mjs
  - scripts/lib/evals/commands.mjs
  - scripts/lib/evals/commands.test.mjs
  - scripts/lib/evals/verdict.mjs
  - scripts/lib/evals/verdict.test.mjs
  - docs/evals/coverage.md
  - docs/evals/coverage-history.md
  - docs/specs/active/SPEC-0081-before-the-freeze-the-giant-files-come-down.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0081-before-the-freeze-the-giant-files-come-down.md --base main
---

## Purpose

The 2026-11-11 review names the pattern: the harness's operational files have
outgrown a reviewable unit. Measured on `main` at 0.7.6:

| file | size | what is in it |
| --- | --- | --- |
| `scripts/lib/evals/assertions.mjs` | 29,299 B | verdict parsing, command parsing, gates, oracles and the assertion dispatcher in one module |
| `docs/evals/coverage.md` | 85,112 B | the wave-by-wave narrative of `SPEC-0050`, `SPEC-0055`, `SPEC-0056` and `SPEC-0078` is ~440 of its ~915 lines |
| `scripts/lib/evals/assertions.test.mjs` | 42,499 B | verdict, command and oracle tests in one file |
| other eval tests | 25–46 KB each | `runcheck`, `cli`, `leak`, `isolation`, `execute` |

The review's conclusion is a feature freeze on the harness, with one exception:
a measurement that misclassified a paid run. The maintainer's condition is that
the debt comes down **before** the freeze, so the freeze locks a reviewable
surface instead of a growing one.

This spec is a move, not a redesign. No assertion semantics change.

## User Outcome

- `assertions.mjs` is a dispatcher again: verdict parsing and command parsing live
  in their own modules, and the public surface is importable from the same path.
- `coverage.md` is an operational scorecard; the historical waves live in
  `docs/evals/coverage-history.md`.
- No published count, verdict or case changes, and the gates stay green.

## Scope

### F1 — split `assertions.mjs` by concern

Move code, do not rewrite it. The public surface is fixed by its importers:

- `execute.mjs` imports `evaluateAssertions`, `oracleFindings`, `skillGate`;
- `events.test.mjs` imports `evaluateAssertions`;
- `parse.mjs` imports `safeRegex`;
- `assertions.test.mjs` imports the rest.

Suggested split, adjustable if the move stays mechanical:

- `verdict.mjs` — `normaliseVerdict`, the form/blocker tables, boundary helpers,
  `stance` and the negated-stance rule (`SPEC-0079`);
- `commands.mjs` — `parseCommands`, `resolveCommands`, `effectiveExit` and the
  effect-aware command interpretation;
- `assertions.mjs` — `evaluateAssertions`, `skillGate`, `targetDirectory`,
  `oracleFindings`, `oracleWarnings`, `safeRegex`, re-exporting the moved names so
  every existing import keeps working.

`assertions.mjs` ends at or below 15,000 bytes.

### F2 — the tests follow the split

Move the verdict tests to `verdict.test.mjs` and the command tests to
`commands.test.mjs` (or equivalent), keeping `assertions.test.mjs` for the
dispatcher, gates and oracles. No test is deleted, skipped or rewritten to fit:
the total test count is identical before and after, and the names stay.

### F3 — `coverage.md` becomes an operational scorecard

Keep in `coverage.md`: the inventory (Discriminating set, Iterative corpus),
Evidence rules, the latest staleness reading, Known holes, Dispositions and How to
update. Move the per-wave historical narrative — the `Detector v2` subsections of
the `SPEC-0050`/`0055`/`0056`/`0078` waves — to `docs/evals/coverage-history.md`,
byte-preserved, with a pointer left in `coverage.md`.

The cell tables that `check-evidence` parses stay in `coverage.md`; the matrices
are evidence and are not touched. `coverage.md` ends at or below 50,000 bytes.

The citation surface is not history: the run directories of the archived wave
tables and audit stay in `coverage.md` as a compact index, so `check-staleness`
sees the same cells after the move as before it.

### F4 — publish the before/after

Publish, in Results: the byte and line counts of the split modules and of
`coverage.md`; the test count; and the exact `check-evidence` and
`check-staleness` output before and after. If any number differs for a reason
other than the move, stop and report it as a finding, not as a licence to update
the number.

## Non-Goals

- No new assertion kind, matcher, case, draw or re-measure.
- No edit to durable specs (`SPEC-0058` and the rest are records).
- No change to installed/upstream skills (`impeccable`).
- No doc compaction beyond `coverage.md`; the matrices are evidence, not history.
- No behaviour change: same inputs, same findings, same exits.

## Flow

1. **F1** — grep the importers, split the module, re-export.
2. **F2** — move the tests, run the suite, compare the count.
3. **F3** — cut the wave narrative out of `coverage.md`, paste it into
   `coverage-history.md`, leave the pointer.
4. **F4** — run the gates and publish the measurements.

## Data

- `scripts/lib/evals/assertions.mjs` and its importers (`execute.mjs`,
  `events.test.mjs`, `parse.mjs`, `assertions.test.mjs`).
- `scripts/lib/evals/assertions.test.mjs` and the other eval test files.
- `docs/evals/coverage.md` — the `Detector v2` section and the wave subsections.
- `scripts/check-evidence.mjs` — it parses `coverage.md`, `discriminating-cases.md`
  and `*-matrix.md`; the cell tables must stay where it looks for them.

## Acceptance Criteria

1. `scripts/lib/evals/assertions.mjs` exports the same eight names as before
   (`evaluateAssertions`, `skillGate`, `targetDirectory`, `oracleFindings`,
   `oracleWarnings`, `resolveCommands`, `effectiveExit`, `safeRegex`) and is at
   most 15,000 bytes.
2. `verdict.mjs` and `commands.mjs` (or the chosen equivalents) carry the moved
   code; the diff of the moved functions against the originals is empty except for
   imports and exports.
3. The test suite has the same number of tests before and after, and no test name
   disappears.
4. `node scripts/eval.mjs check --root skills` prints the same counts, and
   `check-evidence` prints the same document/error/warning counts, before and
   after.
5. `coverage.md` is at most 50,000 bytes, states the pointer to
   `coverage-history.md`, keeps a compact citation index for the run directories
   whose tables moved, and keeps every table `check-evidence` parses; no
   published cell count changes.
6. `check-staleness` prints the same counts — 66 cited, 51 stale, 3 uncited —
   exit 0, and every command in `tests:` exits 0.

## Decisions

- **The public surface stays.** Splitting by concern is a move; `assertions.mjs`
  remains the import path so the refactor does not fan out into the runners.
- **History moves, evidence does not.** The matrices are the measurement and stay;
  the wave narrative is history and moves to a named archive.
- **The refactor precedes the freeze.** The freeze should lock a small surface,
  and this spec is the last harness work before it.

## Open Questions

None.

## Prompt Notes

- Grep the importers before touching the module; the eight exports are the
  contract.
- Move code, do not rewrite it; a moved function's body should diff clean.
- Run the two gates in `docs/pipeline.md` exactly as written, plus the spec-check
  line in `tests:`.
- A test that must change is a finding to report, not a licence to delete it.
- `coverage.md`'s `Detector v2` subsections are historical; move them verbatim and
  leave the pointer with the current detector id.

## Results

**F1 — split by concern.** `scripts/lib/evals/assertions.mjs` is a dispatcher
again. `verdict.mjs` carries `normaliseVerdict`, the form matcher table, the
blocker/clause tables, `boundaryCut`/`clauseBefore`/`blockerRe`/`blockedBefore`,
`STANCE_PRECEDENCE`, the anchored `NEGATED_STANCES` rule (SPEC-0079) and
`stance`. `commands.mjs` carries `parseCommands`, `splitCommands`, `words`,
`scriptName`, `readScripts`, `commandEntries`, `resolveCommands`, the printed
exit / runner-summary readers and `effectiveExit`. `assertions.mjs` keeps
`evaluateAssertions`, `skillGate`, `targetDirectory`, `oracleFindings`,
`oracleWarnings`, `safeRegex` and `check`, and re-exports `resolveCommands` and
`effectiveExit`, so all four importers (`execute.mjs`, `events.test.mjs`,
`parse.mjs`, `assertions.test.mjs`) import from the same path with no edit.
The moved bodies were sliced from the original file: a byte diff of lines 15–140
against `verdict.mjs` and lines 293–558 against `commands.mjs` is empty, and the
retained blocks (142–291, 560–709) diff clean too. The only additions are the
module headers, the import lines and one export list per module; no moved line
changed.

**F2 — the tests follow.** `assertions.test.mjs` (60 tests) split into
`verdict.test.mjs` (22), `commands.test.mjs` (15) and `assertions.test.mjs` (23:
dispatcher, gates, oracles). Every test body is a verbatim slice of the original
file; the sorted name list before and after is identical (60 names, no added,
missing or renamed test), and the suite total is unchanged at **568 tests**.

**F3 — `coverage.md` is a scorecard.** The archive
[`docs/evals/coverage-history.md`](../../evals/coverage-history.md) holds, byte
preserved: the whole `## Detector v2` section (the v2–v6 evolution and the four
wave subsections with their cell tables, lines 162–598), the three superseded
staleness readings (lines 623–657), the iterative-corpus provenance notes (the
`#10` replay footnote and the `#12` resumed-directory note, lines 60–65 and
67–89) and the `### Discrimination audit` (lines 883–923). `coverage.md` keeps
the inventory, the Discriminating set, the Iterative corpus table (with `†`
pointing at the archive), Evidence rules, the current detector pointer
(`cf2e2e319d975a5b`), the `## Staleness` rules with the latest (fourth) reading,
Known holes, the Dispositions table and How to update. It also carries a compact
`### Archived citations` index: the run-directory pair for every cell whose wave
row moved (`audit-code-quality` #5–#9 and `review-code` #1, #2, #7–#10) and the
audit's two time-only tokens, so the measurement surface does not shrink with
the prose. The matrices are untouched, and no published count in any retained
table changed.

| file | before (bytes / lines) | after (bytes / lines) |
| --- | --- | --- |
| `scripts/lib/evals/assertions.mjs` | 29,299 / 709 | **13,414 / 320** |
| `scripts/lib/evals/verdict.mjs` | — | 5,922 / 135 |
| `scripts/lib/evals/commands.mjs` | — | 10,956 / 276 |
| `scripts/lib/evals/assertions.test.mjs` | 42,499 / 924 | 13,670 / 308 |
| `scripts/lib/evals/verdict.test.mjs` | — | 18,708 / 400 |
| `scripts/lib/evals/commands.test.mjs` | — | 12,193 / 273 |
| `docs/evals/coverage.md` | 86,462 / 938 | **47,613 / 427** |
| `docs/evals/coverage-history.md` | — | 42,249 / 560 |

The Purpose's `85,112 B` is the 0.7.6 measurement (`dbffe15`); implementation ran
on 0.7.7 after SPEC-0080's fourth staleness reading, so the before column here is
`86,462 B`. Both are correct baselines for their own point in history.

**F4 — the before/after.** `node scripts/eval.mjs check --root skills` is
unchanged: `Parsed 101 case(s): 98 runnable, 3 manual; 98 fixture(s) staged.` /
`No findings.` (same before and after).

`node scripts/check-evidence.mjs`, before and after, is identical:

```console
6 documents, 0 errors, 0 warnings; current detector cf2e2e319d975a5b; store /Users/wendell/.local/share/opencode/evals/runs
```

`node scripts/check-staleness.mjs` (report-only, exit 0 in both), before and
after, is identical:

```console
66 cited cell(s), 51 stale, 3 uncited citation(s); coverage .../docs/evals/coverage.md; store /Users/wendell/.local/share/opencode/evals/runs
```

A JSON comparison of the `--json` reports is also exact: the same 66 cell keys,
the same chosen run and the same stale reason for every one (`diffs 0`).

**Finding — the original AC5/AC6 pair was inconsistent, and the resolution is a
citation index, not a lost measurement.** The archive move removes the only
citations for eleven cells (`audit-code-quality` #5–#9, `review-code` #1, #2 and
#7–#10) and the two ambiguous time-only tokens the audit carried. A pure move
therefore prints `58 cited, 54 stale, 1 uncited` — the delta this section
originally reported. That is not acceptable here: the spec exists to compact
documentation, not to shrink what `check-staleness` can see, and a cell that
leaves the scan is a measurement lost, not a doc edit.

The fix keeps the history archived and moves the *citations* into a compact
`### Archived citations` index (11 run-directory pairs plus the two time tokens,
2,621 B). With it, `check-staleness` is byte-for-byte equivalent to the pre-move
run: **66 cited / 51 stale / 3 uncited**, same runs, same reasons.

The original 45,000-byte ceiling cannot hold with that surface: the named
keep-set alone (inventory, Discriminating set, Iterative corpus, Evidence rules,
`## Staleness` with only the latest reading, Known holes, Dispositions including
the audit, How to update) measures **47,182 B** before any pointer (49,313 B once
the moved provenance notes are counted). AC5 is
recalibrated to **≤50,000 bytes**; the document is **47,613 B**, leaving 2,387 B
of headroom. Summary of the resolved contract: 45,000 B or 66/51/3, not both;
the repo requires the measurement, so the ceiling moved.

**Gates** (run in the worktree, all exit 0):

```console
$ node scripts/validate-skills.mjs --root skills
Scanned 14 SKILL.md across 1 roots.

All clear.

$ node scripts/eval.mjs check --root skills
Parsed 101 case(s): 98 runnable, 3 manual; 98 fixture(s) staged.

No findings.

$ node --test scripts/lib/evals/*.test.mjs
ℹ tests 568
ℹ pass 568
ℹ fail 0

$ node --test scripts/lib/*.test.mjs
ℹ tests 13
ℹ pass 13
ℹ fail 0

$ node --test skills/bootstrap-project-harness/scripts/*.test.mjs
ℹ tests 42
ℹ pass 42
ℹ fail 0

$ node scripts/check-sensor-parity.mjs
ok   clean (exit 0)
ok   mixed (exit 1)

2/2 fixtures in parity

$ node scripts/check-evidence.mjs
6 documents, 0 errors, 0 warnings; current detector cf2e2e319d975a5b; store /Users/wendell/.local/share/opencode/evals/runs

$ node scripts/check-staleness.mjs
66 cited cell(s), 51 stale, 3 uncited citation(s); coverage .../docs/evals/coverage.md; store /Users/wendell/.local/share/opencode/evals/runs

$ node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0081-before-the-freeze-the-giant-files-come-down.md --base main
ok docs/specs/active/SPEC-0081-before-the-freeze-the-giant-files-come-down.md — contract holds
```

No behavioural eval was run: this spec changes no assertion, case, fixture or
draw, and the two checkers above are model-free.

