---
id: SPEC-0060
title: One command, one decision
status: ready
priority: P1
task: TASK-99
created_at: 2026-11-10
updated_at: 2026-11-10
source_docs:
  - docs/specs/SPEC-0057-the-cost-of-measuring.md
  - docs/specs/SPEC-0059-delete-the-speculative-surface.md
  - docs/specs/SPEC-0062-the-verdict-vocabulary-is-closed.md
  - CONTRIBUTING.md
  - README.md
related_decisions: []
depends_on: []
blocks: []
files:
  - scripts/eval.mjs
  - scripts/run-evals.mjs
  - scripts/replay-evals.mjs
  - scripts/lib/evals/cli.test.mjs
  - scripts/lib/evals/schedule.mjs
  - scripts/lib/evals/schedule.test.mjs
  - scripts/lib/evals/execute.mjs
  - scripts/lib/evals/execute.test.mjs
  - scripts/lib/evals/report.mjs
  - scripts/lib/evals/report.test.mjs
  - scripts/lib/evals/cache.mjs
  - scripts/lib/evals/cache.test.mjs
  - scripts/lib/evals/fixture.test.mjs
  - scripts/lib/evals/runcheck.test.mjs
  - evals/implement-from-prompt/cases.md
  - evals/write-implementation-prompt/cases.md
  - evals/corpus-baseline.json
  - docs/evals/implement-from-prompt-matrix.md
  - docs/evals/pipeline-bookends-matrix.md
  - docs/evals/write-implementation-prompt-matrix.md
  - docs/evals/review-code-matrix.md
  - docs/evals/discriminating-cases.md
  - package.json
  - .github/workflows/skills.yml
  - .githooks/pre-commit
  - docs/pipeline.md
  - CONTRIBUTING.md
  - docs/README.md
  - README.md
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0060-one-command-one-decision.md
  - CHANGELOG.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0060-one-command-one-decision.md --base main
---

## Purpose

Two CLIs, 1 402 lines, five obvious operations and no defaults that reflect how a
skill author actually works. `run-evals.mjs` (921 lines) does parse, validate,
stage, run, judge and report; `replay-evals.mjs` (481) re-judges and inspects. A
contributor reads `README.md` for thirty lines of flags before running anything,
and the first paid run they type is a five-draw matrix rather than one draw that
answers whether the harness works.

The fix is not a new framework. The library already holds the hard parts
(`execute`, `assertions`, `fixture`, `schedule`, `result`, `report`). What is
missing is one entry point, defaults that make the cheap experiment the easy one,
and a scorecard that prints one screen.

## User Outcome

- `node scripts/eval.mjs check` — no model, tells you the corpus is sound.
- `node scripts/eval.mjs run review-code 7` — one draw, one answer.
- `node scripts/eval.mjs compare review-code 7 --against main` — three arms, with
  the reuse rules stated.
- `node scripts/eval.mjs inspect <run-dir>` — status, failures and a replay of
  the stored transcripts, offline.

## Scope

### F1 — one entry point, five operations

`scripts/eval.mjs` becomes the only eval CLI:

| Command | What it does | Model |
| --- | --- | --- |
| `list` | print cases for a skill or tag | no |
| `check` | parse, validate, resolve every fixture, dry-stage | no |
| `run <skill> <n>` | one arm, one skill; `--arm with\|without`, `--repeat` (default **1**) | yes |
| `compare <skill> <n>` | none / baseline / candidate arms; `--against <ref>` | yes |
| `inspect <run-dir>` | stored status, failing assertions, `--replay` | no |

`--root`, `--model`, `--case`, `--tag`, `--level`, `--timeout`, `--stall-seconds`,
`--judge`, `--json`, `--resume` keep their current meaning. A flag that no longer
has a meaning is removed rather than accepted and ignored.

`scripts/run-evals.mjs` and `scripts/replay-evals.mjs` are deleted. This is a
move, not a wrapper: the goal is fewer lines and one control flow, and a shim
that delegates to an unchanged runner would satisfy the letter and none of the
reason.

`check-eval-run.mjs`, `check-evidence.mjs`, `check-staleness.mjs`,
`validate-skills.mjs`, `spec-check.mjs` and `check-sensor-parity.mjs` stay as they
are. They answer different questions and each is a trust check in its own right.

### F2 — the draw ladder is the default, and it is labelled

`run` starts at **one** draw. `compare` starts at **three** per arm. Five or more
is an explicit promotion (`--repeat 5`), and only then may a result call itself
evidence.

The scorecard prints the numerator and the denominator and labels the strength:

- 1–3 draws: **screening** — direction, not a claim.
- 5+ draws: **evidence** — may be published in `docs/evals/`.

No command silently spends more than its `--repeat`. Early stop stays available
(`--stop p/f`), and a stopped case reports the repetitions that actually ran, not
the ceiling.

### F3 — `compare` states what it reuses

An arm is reused only when **all** of these are identical: model and provider,
prompt hash, fixture hash, assertion/grading hash, the arm's skill hash, and the
isolation contract recorded in the manifest. Otherwise the arm reruns. `--refresh`
forces a rerun; `--against <ref>` pins the baseline by commit rather than by
directory.

`compare` prints the reuse decision per arm (`reused <dir>` or `ran <dir>`) so a
reader never has to infer whether a number is fresh.

### F4 — one screen

The scorecard fits a terminal screen by default:

```text
review-code #7   agentworks/deepseek-v4-1-flash   evidence (5/arm)
arm        valid  passed  tokens   median   result
none        5/5    0/5    61.2k    112s     reject
candidate   5/5    5/5    58.9k    104s     approve      -> improves
```

`--json` emits the whole record. `--verbose` expands failures. A default output
that needs a second command to be useful is not a scorecard.

### F5 — every live reference moves

`package.json`, `.github/workflows/skills.yml`, `.githooks/pre-commit`,
`docs/pipeline.md`, `CONTRIBUTING.md`, `README.md`, `docs/README.md` and
`docs/evals/coverage.md` name the new command. `docs/specs/**`, `backlog/**`,
`docs/prompts/**`, `docs/inbox/**` and `CHANGELOG.md` keep the old command as
history, the same way SPEC-0058 left the old corpus paths.

`docs/pipeline.md` is policy: the `selftest:` line changes in this spec and the
**merge needs the human gate**.

## Non-Goals

- No new framework, plugin registry, adapter or dashboard.
- No change to staging, isolation, assertions, the verdict table or the corpus.
- No change to `check-eval-run`, `check-evidence`, `check-staleness`,
  `validate-skills`, `spec-check` or sensor parity.
- No migration layer for the old flags beyond one documented mapping in
  `CONTRIBUTING.md`.
- No paid draw in this spec. The command is proven by `check`, by the no-model
  tests, and by `--level smoke`.

## Flow

1. **F0 — the mapping.** Write the flag mapping (old → new) in `CONTRIBUTING.md`
   first; it is the spec's executable checklist.
2. **F1 — the entry.** Build `scripts/eval.mjs` over the existing library, one
   subcommand at a time, moving behaviour rather than reimplementing it.
3. **F2 — the ladder.** `--repeat` defaults, the screening/evidence label, and
   honest stopped-count reporting.
4. **F3 — reuse.** A pure `cache.mjs` predicate over the six hashes, with tests;
   `compare` prints its decision.
5. **F4 — the scorecard.** One screen by default.
6. **F5 — the cutover.** Delete the two CLIs, update the live references, the
   policy and CI, and prove the corpus still parses.

## Data

- `scripts/run-evals.mjs` (921), `scripts/replay-evals.mjs` (481), replaced by
  `scripts/eval.mjs`.
- `scripts/lib/evals/{schedule,execute,report}.mjs` (draw ladder, reuse, scorecard)
  and a new `cache.mjs`.
- The live documents listed in F5.

## Acceptance Criteria

1. `scripts/eval.mjs` exposes `list`, `check`, `run`, `compare` and `inspect`;
   there is no other eval entry point.
2. `check` parses and validates the corpus without a model, exits non-zero on any
   finding, and resolves every fixture — the SPEC-0057 staging checks run through
   it.
3. `run` defaults to **one** draw; `compare` to **three** per arm; neither exceeds
   `--repeat`, and `--stop` reports the repetitions that actually ran.
4. The scorecard labels 1–3 draws **screening** and 5+ **evidence**, and prints
   the numerator and denominator for every arm.
5. `compare` reuses an arm only when all six inputs match, prints `reused <dir>`
   or `ran <dir>` per arm, and `--refresh` forces a rerun. `cache.mjs` is a pure
   predicate with a test for each input.
6. The default output fits one screen for a single-case comparison; `--json`
   carries the full record and `--verbose` the failures.
7. `scripts/run-evals.mjs` and `scripts/replay-evals.mjs` are deleted; no live
   file invokes them (history excluded by path).
8. `docs/pipeline.md`'s `selftest:` runs the new command and the policy change is
   flagged for the human gate at merge.
9. `package.json`, CI and `.githooks/pre-commit` run the new command; CI is green.
10. Total CLI code is smaller than the 1 402 lines it replaces, and the figure is
    published in Results with the per-file count.
11. No behaviour change: the corpus still parses 97 cases (94 runnable, 3 manual),
    no skill, fixture or assertion is edited, and the no-model test suite still
    covers parse, staging, the assertion truth table, provider abort, timeout,
    isolation, reuse, resume, early stop, comparison scoring and artefacts.
12. Zero paid draws.

## Decisions

- **The CLI absorbs both commands; the library is untouched.** `execute`,
  `assertions`, `fixture`, `schedule` and `result` already carry the behaviour.
  The 1 402 lines were two argument parsers and two report paths, not two engines.
- **`compare` defaults to three, not five.** Three matched draws answer "did this
  change anything" most of the time; five is a publication decision and should be
  typed deliberately. The label makes the difference visible instead of burying it
  in a number.
- **The policy edit is in scope, and it needs the human gate.** A CLI rename that
  leaves `docs/pipeline.md` naming a deleted script would break `preflight` for
  everyone. Doing it here, flagged, is cheaper than a second spec that exists only
  to rename a line.

## Open Questions

None. The CLI shape was chosen at review on 2026-11-10.

## Prompt Notes

- Move behaviour, do not re-derive it. Start by reading `run-evals.mjs` in full and
  labelling each block with the subcommand it belongs to; anything that does not
  belong to one is library code that stays.
- `--json` output shape should be the existing result/manifest record, not a new
  schema. Anything that consumes it today must keep working.
- Run `check` and `--level smoke` before claiming the cutover; a paid draw is not
  evidence about an argument parser.
- If a flag turns out to have no honest mapping, say so in `CONTRIBUTING.md` and
  drop it. A compatibility flag nobody uses is how the 921 lines came back.

## Results

**One entry point.** `scripts/eval.mjs` is the only eval CLI: `list`, `check`,
`run`, `compare`, `inspect`. `scripts/run-evals.mjs` and `scripts/replay-evals.mjs`
are deleted, and nothing delegates to them.

**Size, stated honestly.** This is a move plus new behaviour, not a net line
reduction. The CLI shrank by two lines; the harness grew because the scorecard,
the reuse predicate and the stored-run readers are new code.

| file | before | after |
| --- | ---: | ---: |
| `scripts/run-evals.mjs` | 921 | 0 (deleted) |
| `scripts/replay-evals.mjs` | 481 | 0 (deleted) |
| `scripts/eval.mjs` | 0 | 1 400 |
| `scripts/lib/evals/cache.mjs` | 0 | 103 |
| `scripts/lib/evals/report.mjs` | 70 | 361 |
| `scripts/lib/evals/report.test.mjs` | 86 | 197 |
| `scripts/lib/evals/cli.test.mjs` | 257 | 707 |
| `scripts/lib/evals/cache.test.mjs` | 0 | 162 |
| `scripts/lib/evals/fixture.test.mjs` | 317 | 317 (repointed) |
| `scripts/lib/evals/runcheck.test.mjs` | 997 | 997 (repointed) |

CLI 1 402 → 1 400 (−2); `report.mjs` +291 and `cache.mjs` +103, so the harness is
net +392. `report.mjs` grew because the scorecard and the stored-run readers live
there; the two readers are why `fixture.test.mjs`/`runcheck.test.mjs` had to be
repointed (they spawn the entry point), and the whole set is declared above as a
correction to this spec's `files:`.

**Flag mapping.** The full old → new table is in `CONTRIBUTING.md`. In short:
`--list`/`--check`/`--run` became subcommands; `--skill` became the positional
`<skill>` (and stays a flag on `inspect`, where positionals are run directories);
`--case` stays and `run`/`compare` also take the positional `<n>`; `--no-skill`
became `--arm without`; `--full` became `--level full`; `replay-evals --leaks`
became `inspect --leaks`; `replay-evals --run <id>` became `inspect <run-dir>` (a
directory, not a prefix); `replay-evals --judge` became `inspect --judge`.
Dropped rather than accepted and ignored: `--baseline` and `--save-baseline`
(`compare` is the comparison, by arm or by run directory), `--quiet` (replay;
`inspect --replay` prints only moved verdicts by default and `--verbose` prints
all), `--shared`, `--i-know` and `--no-isolate` (a run is always standalone and
isolated; the isolation contract is a reuse input). `--quick` was already gone
and is still refused. `inspect --judge` requires a model (the bare flag is
refused instead of silently meaning the model under test), and prints the
self-judged warning when the judge is the model under test.

**Exit codes.** Deliberate: 2 is a usage error, 1 is a finding (`check`), a
failed/unscored draw (`run`), a regressed or missing cell (the run-dir
`compare`), or a moved verdict (`inspect --replay --changed`). The single-case
arm `compare` exits 0: it prints a decision, it is not a gate. The old
`run-evals.mjs` used 1 for usage and `replay-evals.mjs` used 2; one CLI has one
code per class, and `CONTRIBUTING.md` says which.

**Defaults and labels.** `run` resolves `--repeat` to 1; `compare` to 3 per arm;
neither exceeds the flag. `drawLabel` calls 1–3 **screening**, 4 screening, 5+
**evidence**, and the scorecard heading carries it. Every arm row prints
`passed/valid` (numerator/denominator over clean draws). `--stop` reports the
repetitions that ran, and a stopped case prints
`stopped early (reps/requested)` in both `run` and `inspect`; the ceiling is
never shown as the count.

**The reuse predicate.** `cache.mjs` is pure. `reuseDecision({ current, stored,
refresh })` compares exactly six inputs — model+provider, `promptHash`,
`fixtureHash`, `gradingHash`, `skillHash`, isolation contract
(`isolate`/`enforced`/`mechanism`) — and returns the mismatched names.
`gradingHash` hashes the assertion list and the gate; a `gate: off` case
reconstructs `off` from the stored gate reason. `--refresh` forces a rerun
without a mismatch. `armReplayable()` refuses three arms the six inputs cannot
describe: a stopped-early arm, an arm with fewer stored draws than the requested
repeat, and any arm whose draws carry a `semantic` record (a judged arm was
scored against `expect:` text the artefact does not carry). `compare` prints
`reused <dir>` or `ran <dir>` per arm on stderr, and `--json` carries the existing
run/manifest record per arm unchanged.

**The scorecard.** One screen for a single-case comparison: heading with skill,
case, model and label; a row per arm with `valid`, `passed`, tokens, median and
result. The result is the arm's status from its clean draws (`passed`/`failed`/
`unscored`). Movement compares **rates**, not numerators: `none 5/5` and
`candidate 4/4` are both 100% and print no arrow, while `4/5` → `3/5` prints
`-> regresses`; a zero denominator is unknown and makes no claim. `--json` emits
the record and `--verbose` expands failing draws and assertions.

**`compare` has two forms.** `compare <skill> <n>` is the arm comparison above.
`compare <run-dir-a> <run-dir-b>` is the whole-run regression diff: it reads both
directories with `readRunDir`, uses the existing `compareRuns`/`formatComparison`,
and exits 1 when any cell regresses or disappears. That is the gate
`CONTRIBUTING.md` points at; the arm form reports a decision.

**`check`** stages all 94 runnable cases (3 manual excluded) in about ten seconds
and exits 1 on any finding.

**Live publication moved.** 68 command lines in
`docs/evals/{implement-from-prompt,pipeline-bookends,write-implementation-prompt,review-code}-matrix.md`
and `docs/evals/discriminating-cases.md` now name `eval.mjs` with the new flags
(the old `--no-skill`/`--run`/`--skill` forms are mapped, not left stale).
`docs/evals/experiments/**` is declared history in `CONTRIBUTING.md` where it is
introduced; no archived experiment was rewritten. In `evals/*/cases.md` the
mention was outside every `prompt:` block (the file preamble at line 7) in
`implement-from-prompt` and `write-implementation-prompt`; only those two were
touched, and `evals/corpus-baseline.json` records the new file bytes while the
parsed prompts, titles, assertions and fixtures stay byte-identical.

**Gates.** All exit 0:

- `node scripts/validate-skills.mjs --root skills` — 0
- `node scripts/eval.mjs check --root skills` — 0 (97 parsed, 94 runnable, 3
  manual, 94 staged, no findings)
- `node --test scripts/lib/evals/*.test.mjs` — 0 (517 tests)
- `node --test scripts/lib/*.test.mjs` — 0 (13 tests)
- `node --test skills/bootstrap-project-harness/scripts/*.test.mjs` — 0
- `node scripts/check-sensor-parity.mjs` — 0
- `node scripts/check-evidence.mjs` — 0
- `node scripts/check-staleness.mjs` — 0 (report-only; 51 stale, 3 uncited)
- `node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0060-one-command-one-decision.md --base main` — 0, with `files-declared-untouched` warnings only for the declared library files this move did not need.

The staging proof is a real, cited store directory:
`~/.local/share/opencode/evals/runs/2026-11-10T20-47-24--review-code` holds
`review-code` #7 at `--level smoke` — status `staged`, no assertions, no model.
**Zero paid draws.** The behavioural suite still covers parse, staging, the
assertion truth table, provider abort, timeout, isolation, cache eligibility,
resume, early stop, comparison scoring and the artefact shape: `cli.test.mjs`
has 40 tests (the old usage/resume cases plus rate scoring, reuse refusals, the
run-dir diff and the stopped-early line), `cache.test.mjs` has one test per input
plus the three refusals, and `report.test.mjs` covers the ladder, the
denominators, rate movement, contamination and the verbose failures.

**Policy.** `docs/pipeline.md`'s `selftest:` now runs `node scripts/eval.mjs check
--root skills`. That is a policy edit: **the merge needs the human gate.**
