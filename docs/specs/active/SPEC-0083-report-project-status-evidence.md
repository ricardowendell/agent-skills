---
id: SPEC-0083
title: The status report's claim is measured
status: ready
priority: P1
task: TASK-70
created_at: 2026-11-13
updated_at: 2026-11-13
source_docs:
  - backlog/tasks/task-70 - evals-medir-e-publicar-a-cobertura-da-report-project-status-issue-11.md
  - https://github.com/ricardowendell/agent-skills/issues/11
  - docs/evals/coverage.md
  - skills/report-project-status/SKILL.md
  - evals/report-project-status/cases.md
  - docs/analysis/skills-from-sessions-2026-11-07.md
  - docs/specs/SPEC-0065-recover-the-parked-corpus.md
related_decisions: []
depends_on: []
blocks: []
files:
  - evals/report-project-status/cases.md
  - evals/report-project-status/fixtures/3/git.json
  - evals/report-project-status/fixtures/3/AGENTS.md
  - evals/report-project-status/fixtures/3/CHANGELOG.md
  - evals/report-project-status/fixtures/3/docs/pipeline.md
  - evals/report-project-status/fixtures/3/docs/evals/coverage.md
  - evals/report-project-status/fixtures/3/docs/specs/active/SPEC-0001-widget.md
  - evals/report-project-status/fixtures/3/backlog/tasks/task-1 - widget.md
  - evals/report-project-status/fixtures/3/src/app.js
  - evals/corpus-baseline.json
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0083-report-project-status-evidence.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0083-report-project-status-evidence.md --base main
---

# SPEC-0083: The status report's claim is measured

## Purpose

`report-project-status` shipped on 2026-11-08 (`fca9c78`) and serves the largest
measured cluster in the session analysis: 15 sessions across 5 projects, 635
user turns. Its claim, though, rests on a **declared human review**: three
trigger/near-miss cases and one behavioural case (#3) that is `status: manual`.
`docs/evals/coverage.md` says "declared, not measured — no fixture, no run dir,
and no harness separated them". Issue #11 keeps three ACs open for exactly that:
the behavioural case, the measured run, and the one-week pilot.

This spec closes them without changing the skill: a fixture makes case 3
runnable, a two-arm run classifies the cell, and the pilot is instrumented at
the cut. A red cell becomes a follow-up, not an argument.

## User Outcome

A reader of `docs/evals/coverage.md` sees the `report-project-status` row with a
fixture, no manual case, and a measured cell citing both run dirs and the raw
counts — or an honest `unresolved` with the reason. The one-week pilot is
started with its metric and baseline recorded; its result lands after the week.

## Scope

- **F0 — the fixture.** One plain tree, no GitHub remote
  (`evals/report-project-status/fixtures/3/`, `git.json` `{ "base": "." }`):
  - `AGENTS.md` names the backlog index, the specs directory and the gate
    commands (the skill resolves all three from it);
  - `CHANGELOG.md` with two dated entries, one of them the current release;
  - `docs/pipeline.md` with the gates named;
  - `docs/evals/coverage.md` with one coverage row;
  - one `ready` spec in `docs/specs/active/` and one backlog task;
  - `src/app.js` as the sentinel the case asserts is untouched.
- **F1 — case 3 runs.** Remove `status: manual`. Add machine assertions for the
  surface the skill promises: it loads, prints `STATUS:`, reports
  `ISSUES … unknown` and `CI … unknown` (there is no `gh` remote), prints a
  `NEXT STEPS` block, names no invented issue number (`noreply #<digits>`), and
  leaves `src/app.js` byte-identical (`unchanged`). The "at most three next
  steps, each with evidence" stays a human `expect:` — no assertion kind counts
  lines, so the coverage row says the count is human-checked, not machine-checked.
- **F1.1 — the baseline digest moves once.** Adding assertions changes the case's
  parsed fields, and `evals/corpus-baseline.json` guards them (SPEC-0065). Update
  **only** `report-project-status` case 3's `fieldsSha256`; the old value
  `b6b89b3baa7aa4ae337938bf750056ec6c7efef6b1abaf471362329c15da17a6` stays here as
  history, and every other baseline case and fixture is untouched. This supersedes
  SPEC-0065's "the baseline is not edited" for this one entry, recorded rather than
  silent: the move proof holds for every other case and for every fixture.
- **F2 — the measured run.** Both arms, five draws each
  (`node scripts/eval.mjs compare report-project-status --case 3 --repeat 5`,
  model recorded), under the current detector. Classify the cell as `separator`,
  `non-discriminator` or `unresolved`; cite both run dirs and the raw counts.
  A control with fewer than five clean draws is `unresolved` with the exact
  reason, and a pass whose draw read the answer key is not a pass. No oracle
  edit after the first draw: a red cell is named and becomes a follow-up task.
- **F3 — the pilot, instrumented.** Start the passive one-week pilot at the cut:
  metric = user turns from session start to the first action in status sessions,
  baseline = the 15 sessions / 635 turns in
  `docs/analysis/skills-from-sessions-2026-11-07.md`, start date recorded in
  `docs/evals/coverage.md`. The result is appended after the week (a follow-up,
  not a gate); if the week cannot be observed, the reason is recorded — the AC
  accepts either.
- **F4 — publish.** The coverage row (manual 1 → 0, fixture `none` → tree 3,
  the measured note with the run dirs) and the total row (`manual` 3 → 2), plus
  the `CHANGELOG.md` entry under the next release.

**Blast radius.** One corpus case set and its fixture; the coverage inventory and
the release entry. The skill, the runner, the detector and every other corpus
are untouched.

## Non-Goals

- No change to `skills/report-project-status/SKILL.md` or its command stubs. If
  the measured run exposes a defect, record it as a follow-up with the failing
  assertion; do not fix it here.
- No edit to any baseline entry other than case 3 of `report-project-status`;
  the rest of the move proof stays exactly as recorded.
- No new assertion kind or runner flag — the freeze covers those; the case uses
  `skill`, `reply`, `noreply` and `unchanged` only.
- No issue actions, no `gh` call in the fixture, no benchmark of the 50-issue
  cap.
- No second skill and no recap mode (`SPEC-0040` owns that, and it stays paused).
- No recomputation of a published number; a red cell is stated as it is.

## Flow

1. **F0 — tree.** Write the plain fixture and its manifest; `eval.mjs check`
   stages it without a model.
2. **F1 — case.** Remove the manual marker, add the assertions, and confirm the
   case is in the runnable set with the same prompt and `why:`.
3. **F2 — run.** Both arms, five draws, model recorded; read the counts and the
   detector verdict; classify.
4. **F3 — pilot.** Record the metric, the baseline and the start date in the
   coverage note; the result is a follow-up.
5. **F4 — publish.** Coverage row and total, CHANGELOG, `files:` complete.

## Data

- `evals/report-project-status/fixtures/3/` — the plain tree.
- `docs/evals/coverage.md` — the row, the measured note and the total.
- `CHANGELOG.md` — the release entry.
- Run directories under `~/.local/share/opencode/evals/runs/`.

## Acceptance Criteria

1. **Case 3 is runnable**: the corpus reports 4 cases, 3 trigger, **0 manual**,
   and the fixture stages 4/4 with `node scripts/eval.mjs check --root skills`.
2. **The fixture is a real scratch repo**: no GitHub remote, `ISSUES: unknown`
   and `CI: unknown` are the honest degradation, and the fixture carries the
   backlog, spec and gate surfaces the skill reads.
3. **The case asserts the surface**: the skill loads, `STATUS:` is printed,
   both `unknown` lines appear, a `NEXT STEPS` block appears, no issue number is
   invented, and the sentinel file is unchanged.
4. **The run follows the five-draw rule**: five draws per arm, model recorded,
   and the classification is `separator`, `non-discriminator` or `unresolved`
   with both run dirs and raw counts.
5. **A red cell is honest**: the failing assertion is named, no oracle is edited
   after the first draw, and the follow-up is recorded.
6. **The pilot is instrumented**: metric, baseline and start date are in the
   coverage note, with the result due after a week or the reason it cannot be
   observed.
7. **Publication is complete**: the coverage row and the total row are updated,
   and the CHANGELOG entry states what changed and what did not.
8. **Nothing else moves**: no skill, runner, detector or other corpus change;
   every `tests:` command passes.
9. **The baseline moves once and says so**: case 3's digest is updated, the old
   value is quoted in this spec, and every other baseline entry still matches.

## Open Questions

- **Is the three-step cap machine-checkable?** No assertion kind counts lines, so
  it stays a human `expect:` and the coverage note says so. Adding a counting
  kind is frozen; if the measured run shows the cap is where the arms differ, the
  right move is a follow-up spec, not a runner change.
- **Does the fixture need `.pdlc/runs.json`?** The default operator report reads
  the backlog and specs, not the pdlc store; omit it unless the run shows the
  skill asks for it.
- **When does the pilot window close?** One week after the 0.8.1 cut. If the
  week is not observable (no status sessions), the reason is recorded and the
  AC is still met.

## Prompt Notes

- **Requirements**: one fixture, one de-manualized case, one two-arm five-draw
  run, one instrumented pilot, one honest publication; no skill change.
- **Entities**: fixture tree, scratch repo, unknown degradation, sentinel file,
  with-skill arm, control arm, clean draw, separator, next-step cap.
- **Approach**: copy the plain-tree shape of `audit-code-quality` fixture 7
  (`base: "."`), point `AGENTS.md` at the fixture's own backlog/specs/gates, and
  assert the reply surface the skill documents.
- **Structure**: `evals/report-project-status/fixtures/3/` beside the corpus;
  the case stays number 3.
- **Operations**: `node scripts/eval.mjs check --root skills` first; then
  `compare report-project-status --case 3 --repeat 5`; record both run dirs and
  the model.
- **Norms**: no paid draw before the fixture stages clean; five draws, never
  three; a contaminated control is `unresolved`; a red cell is named, not
  softened; the count of next steps is human-checked.
- **Safeguards**: no `gh` remote, no credential, no issue action; the fixture is
  a scratch repo and the skill stays read-only.
- **Tests**: the gates above; `check-evidence` validates the run-dir citation,
  and `spec-check` keeps `files:` honest.

## Results

Delivered 2026-11-13 in the spec's worktree at `repoSha 7573ede`.

**F0/F1 — the fixture and the case.** `evals/report-project-status/fixtures/3/`
is a plain tree (`git.json` `{ "base": "." }`, no `remote`): `AGENTS.md` names
the backlog index (`backlog/tasks/`), the specs directory
(`docs/specs/active/`) and the gates (`node --check src/app.js`, declared in
`docs/pipeline.md`); `CHANGELOG.md` has entries for 0.2.0 and 0.1.0;
`docs/evals/coverage.md` carries one row; `docs/specs/active/SPEC-0001-widget.md`
is `status: ready` with `task: TASK-1`; `backlog/tasks/task-1 - widget.md` is the
task; `src/app.js` is the sentinel. `status: manual` is gone and the case asserts
`skill report-project-status`, `reply STATUS:`,
`reply ISSUES[\s\S]{0,120}?unknown`, `reply CI[\s\S]{0,120}?unknown`,
`reply NEXT STEPS`, `noreply #[0-9]+` and `unchanged src/app.js`; the prompt and
`why:` are unchanged, and the next-step cap stays a human `expect:`.

```text
$ node scripts/eval.mjs check report-project-status --root skills
Parsed 4 case(s): 4 runnable, 0 manual; 4 fixture(s) staged.
No findings.
$ node scripts/eval.mjs list report-project-status --root skills --tag trigger
Parsed 3 case(s) tagged trigger: 3 runnable, 0 manual
```

**F1.1 — the baseline digest.** `evals/corpus-baseline.json` changed in exactly
one value: case 3's `fieldsSha256`
`b6b89b3baa7aa4ae337938bf750056ec6c7efef6b1abaf471362329c15da17a6` →
`49ea7d9d2ced46bea430efbe7c861c29b4f8fe43dd92ea585a61d7f852384212` (the digest
`corpus.test.mjs` computes over `{n, title, prompt, why, assert}`). Every other
case and every fixture still matches, and `node --test
scripts/lib/evals/corpus.test.mjs` is green (11/11).

**F2 — the measured run.** `node scripts/eval.mjs compare report-project-status 3
--repeat 5 --root skills` (the positional case; the CLI rejects the bare
`--case 3` form). Model `opencode-go/deepseek-v4.1-flash` (config default),
detector `cf2e2e319d975a5b`, level `behavior`, concurrency 4, ten scored draws.
Both runs record `params.isolation.enforced: true` (seatbelt) and check clean:
`findings=0 warnings=0 skillLeaks=0 hostReads=0 isolated=yes deniedDraws=0`.

| arm | run directory | clean | passed |
| --- | --- | --- | --- |
| with skill | `2026-11-13T09-53-13--report-project-status` | 5/5 | 4/5 |
| without skill | `2026-11-13T09-49-36--report-project-status--without-skill` | 5/5 | 0/5 |

**Class: `separator`** — 5/5 clean both arms, 4/5 passed with the skill against
0/5 without it. The red draw is r1 of the with-skill arm: both `unknown` reply
assertions failed because the reply localised the degradation token
(`- open: **desconhecido**`, `**CI** … **desconhecido**`) instead of printing the
literal `unknown` the skill's "Degradation and refusal" section requires. The
other four draws print the literal token inside a Portuguese report (r2:
`- abertas: **unknown** — gh issue list falhou`), so the assertion is reachable,
not language-hostile. The oracle was not edited after the first draw; the two
honest fixes (read the degradation in the reply's language, or require the
literal token in the skill) are a follow-up, and `docs/evals/coverage.md` records
the red draw together with one latent gap: `noreply #[0-9]+` also matches "AC #1"
numbering, which is what three of the control's reds are.

**F3 — the pilot.** Started 2026-11-13, closing 2026-11-20. Metric: user turns
from session start to the first action in status sessions. Baseline: 15 sessions
/ 635 turns (`docs/analysis/skills-from-sessions-2026-11-07.md`). The result is
appended to the coverage note after the week as a follow-up, not a gate.

**F4 — publication.** `docs/evals/coverage.md` row: `manual` 1 → 0, fixture
`none` → tree 3, the measured note with both run dirs and the raw counts; the
total's `manual` column 3 → 2. `CHANGELOG.md` carries the 0.8.1 entry. The skill,
the runner, the detector and every other corpus are untouched.
