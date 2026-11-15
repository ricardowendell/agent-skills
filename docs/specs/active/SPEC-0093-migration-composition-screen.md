---
id: SPEC-0093
title: The platform skill already sees the migration faults, or the gap is real
status: implemented
priority: P1
task: TASK-82
created_at: 2026-11-15
updated_at: 2026-11-15
source_docs:
  - backlog/tasks/task-82 - data-migrate-data-pipeline-com-equivalencia-semantica-e-rollback-issue-17.md
  - docs/specs/SPEC-0089-migration-slice-cutover-fixture.md
  - docs/analysis/data-corpus/decision.md
related_decisions: []
depends_on: []
blocks: []
files:
  - evals/implement-from-prompt/cases.md
  - evals/implement-from-prompt/fixtures/15/AGENTS.md
  - evals/implement-from-prompt/fixtures/15/pipeline.py
  - evals/implement-from-prompt/fixtures/15/check.py
  - docs/analysis/data-corpus/decision.md
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0093-migration-composition-screen.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0093-migration-composition-screen.md --base main
---

# SPEC-0093: The platform skill already sees the migration faults, or the gap is real

## Purpose

Issue #17 asks for the migration capability to be measured before it is built,
with a multi-stage fixture carrying a retry and a duplicated mapping, and it says
to **compose platform skills before creating**. `SPEC-0089` built the fixture:
`migration-sliced-cutover` fails on a duplicated `legacy_id` that fans the slice
join and on a cutover that backs up after deleting, independently, with
`negative-safe-cutover` as the false-positive guard. `TASK-82` is still open
because the candidate was never chosen.

This spec runs the composition arm the issue names: the platform skill
`implement-from-prompt`, given the symptom and the fixture's own contract,
against the defect tree. If it fixes both faults, the answer is `compose` and no
`migrate-data-pipeline` skill is justified. If it does not, the gap is measured
and the build decision has evidence.

## User Outcome

A reader of `docs/analysis/data-corpus/decision.md` sees the `migration`
capability decided by counts rather than by the earlier provisional wording, with
the two faults named, the run directories cited and the false-positive guard
stated.

## Scope

- **F0 — the fixture.** Copy `docs/analysis/data-corpus/migration-sliced-cutover/`
  (`AGENTS.md`, `pipeline.py`, `check.py`) into
  `evals/implement-from-prompt/fixtures/15/`, rewriting only the paths in
  `AGENTS.md` so its check command runs from the fixture root. Pipeline, oracle
  and contract are otherwise byte-identical.
- **F1 — the case.** Case 15 in `evals/implement-from-prompt/cases.md`:
  prompt `The migration is failing its contract. Fix it.` `why:` names the
  0.9.4 fixture and the two independent faults. Assertions:
  `ranpass python3 check\.py` (the oracle ran and passed), `unchanged check.py`
  and `unchanged AGENTS.md` (the oracle and the contract are not edited to fit).
  The fix's shape is not asserted — the oracle is the gate, and its own `PASS`
  line names the restored rows.
- **F2 — measure.** `node scripts/eval.mjs compare implement-from-prompt 15
  --repeat 5 --root skills`; model and detector recorded, both run dirs cited,
  raw counts and reds named, classified.
- **F3 — decide and publish.** The `migration` section of
  `docs/analysis/data-corpus/decision.md` gains the measured result and a
  decision that follows it (`compose`/`do not add` if the skill arm passes,
  `build` if it fails), the coverage row cites the dirs, and one `CHANGELOG.md`
  entry under `[Unreleased]`. `TASK-82` stays open until the decision lands; a
  `build` outcome is a follow-up spec.

**Blast radius.** One corpus case with a three-file fixture, the decision memo,
the coverage inventory and the release entry. No skill, no runner, no oracle.

## Non-Goals

- No new skill here: the result decides whether one is justified.
- No change to the 0.9.4 trees, the negative, or the frozen holdout.
- No new assertion kind, flag, stage or store field.
- No `TASK-116` and no contract work.
- No push and no issue action.

## Flow

1. **F0/F1 — fixture and case.** Copy, adjust the one path, prove the staged check
   still exits 1, then write the case.
2. **F2 — run.** Five draws per arm.
3. **F3 — decide and publish.** The memo and the coverage; no oracle edit after
   the first draw.

## Data

- `evals/implement-from-prompt/fixtures/15/` — the copied tree.
- `evals/implement-from-prompt/cases.md` — case 15.
- `docs/analysis/data-corpus/decision.md` — `migration`.
- `docs/evals/coverage.md`, `CHANGELOG.md`.
- Run directories under `~/.local/share/opencode/evals/runs/`.

## Acceptance Criteria

1. **The fixture is the corpus tree**: three files byte-identical apart from the
   `AGENTS.md` path rewrite, and the staged check exits 1 before the fix.
2. **The case is honest**: the prompt states the symptom only, the oracle is an
   assertion, and oracle and contract are `unchanged`.
3. **The cell is measured**: five draws per arm, model, detector, both run dirs,
   raw counts and reds recorded.
4. **The decision follows the numbers**: `compose`/`do not add` if the skill arm
   passes, `build` if it fails, counts quoted, the provisional sentence kept as
   history.
5. **Publication is complete** and `files:` is honest (`spec-check` clean);
   every `tests:` command passes.

## Open Questions

- **Can the platform skill fix two independent faults?** They are independent by
  construction (`mapping-fixed` and `cutover-fixed` still fail), so a partial fix
  leaves a red. If the skill arm passes 5/5, composition covers the capability.
- **Does one tree prove the capability?** It proves slices, duplicate mapping and
  a reversible cutover on one offline tree — the limit the corpus memo already
  records. A build decision would still owe a second case.

## Prompt Notes

- **Requirements**: one fixture copy, one case, one A/C measure, one decision,
  one publication.
- **Entities**: slice join, duplicated mapping, reversible cutover, oracle,
  `unchanged`, composition arm.
- **Approach**: copy first, prove the staged failure, then write the case.
- **Structure**: only the eight `files:`; the 0.9.4 tree is a read-only source.
- **Operations**: `node scripts/eval.mjs check --root skills`; then
  `compare implement-from-prompt 15 --repeat 5 --root skills`.
- **Norms**: five draws per arm; the red is named; the provisional decision is
  kept as history.
- **Safeguards**: do not edit `check.py` or `AGENTS.md` in the case; no skill;
  no new assertion kind.
- **Tests**: the gates above; the new case is an addition, not a baseline move.

## Queue note (2026-11-15)

`SPEC-0092` merged (2026-11-15); this spec is the next in the queue and is now `ready`.

## Results

`evals/implement-from-prompt/fixtures/15/` stages the `migration-sliced-cutover`
tree (fixture treeHash `abc9aec8…`; `pipeline.py`/`check.py` byte-identical) and
case 15 asks for the failing contract in one sentence. Five draws per arm at
`repoSha 5588b08` (`opencode-go/deepseek-v4.1-flash`, detector
`cf2e2e319d975a5b`): **1/5** with the skill
(`2026-11-15T14-06-13--implement-from-prompt`) against **2/5** without
(`2026-11-15T13-56-31--implement-from-prompt--without-skill`), both clean and
`isolated=yes`. The limit is measured, not assumed: the tree's default state is
the defect switch, 0/5 skill draws touched `fixes()`, and the three scored draws
greened the check through the tree's own `corrected` branch. Per AC4 the failed
skill arm decides **build**; `docs/analysis/data-corpus/decision.md` §4 carries
the counts, the reds and the provisional sentence as history, and
`docs/evals/coverage.md` cites both run dirs. The follow-up owes a staged-only
copy of the tree as its first cell. No oracle change was made after the first
draw.

## Corrections during implementation

**F0 — the fixture.** `evals/implement-from-prompt/fixtures/15/` is the corpus
tree with only the two `AGENTS.md` check commands rewritten to `python3 check.py`
and `FIXTURE_STATE=corrected python3 check.py`; `pipeline.py` and `check.py` are
byte-identical (`pipeline.py`
`3d05b2568e5354ccc33844d9d823678a42d3515886bb04019f784e41a73e1629`,
`check.py`
`1c3d752506728aa4d127b01012dd17dc55823f0a99b127a64ab3793901cef4e4`), fixture
treeHash `abc9aec85e791b4e6ee41d2ef9aad7aac7f284d681983871f665118318cc65b2`. The
default `staged` run exits 1 with both findings before the fix; `corrected` exits
0 and each mixed state keeps the other line red.

**No oracle change after the first draw.** The case is exactly the four
assertions in F1. Two alternate forms were rejected without being measured:
dropping `unchanged AGENTS.md` (it would have read 4/5 with the skill and 5/5
without, because every one of those greens was a draw that had re-pointed the
default at the tree's `corrected` branch) and asserting `FIXTURE_STATE=staged`
in the invocation (the literal-invocation defect SPEC-0092 already recorded, and
it does not repair the switch).

**F2/F3 — the measured limit, carried into the decision.** The composition arm
scores 1/5 with the skill and 2/5 without, both clean and `isolated=yes`
(`2026-11-15T14-06-13--implement-from-prompt`,
`2026-11-15T13-56-31--implement-from-prompt--without-skill`, `repoSha 5588b08`).
The reds and the counts are in the memo §4 and the coverage section. The
finding that decides how the numbers are read: the tree's default state is the
defect switch, so **0/5** skill draws touched `fixes()` while 5/5 changed the
default, and the three scored draws across both arms greened the documented
command by running the tree's own `corrected` branch. That is enough for the
`build` the AC4 rule names when the skill arm fails, and not enough to claim a
rate for the capability: the follow-up's first cell must be a staged-only copy
of `migration-sliced-cutover` (no `corrected` branch, no state switch), so a
draw cannot green the check by flipping the default.

