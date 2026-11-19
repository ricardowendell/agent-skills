---
id: SPEC-0096
title: A migration skill, measured on a tree that cannot be re-pointed
status: implemented
priority: P1
task: TASK-82
created_at: 2026-11-15
updated_at: 2026-11-19
source_docs:
  - backlog/tasks/task-82 - data-migrate-data-pipeline-com-equivalencia-semantica-e-rollback-issue-17.md
  - docs/analysis/data-corpus/decision.md
  - docs/specs/SPEC-0093-migration-composition-screen.md
  - docs/analysis/data-corpus/migration-sliced-cutover/AGENTS.md
related_decisions: []
depends_on: []
blocks: []
files:
  - docs/analysis/data-corpus/migration-staged-only/AGENTS.md
  - docs/analysis/data-corpus/migration-staged-only/pipeline.py
  - docs/analysis/data-corpus/migration-staged-only/check.py
  - docs/analysis/data-corpus/README.md
  - docs/analysis/data-corpus/decision.md
  - docs/evals/coverage.md
  - CHANGELOG.md
  - backlog/tasks/task-82 - data-migrate-data-pipeline-com-equivalencia-semantica-e-rollback-issue-17.md
  - docs/specs/active/SPEC-0096-migrate-data-pipeline.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0096-migrate-data-pipeline.md --base main
---

# SPEC-0096: A migration skill, measured on a tree that cannot be re-pointed

## Purpose

`SPEC-0093` measured the migration capability on the 0.9.4 tree and found the
answer-key hole: the tree is state-switched and the defect is the default, so
**10/10 draws re-pointed the fixture state and 0/10 touched `connect`,
`load_mapping` or `cutover`**. The decision was **build**, with one explicit
condition: the first cell must be a **staged-only copy** — a tree with no switch
to flip, where the only way to a green check is to fix the fault bodies.

This spec writes that copy, authors the narrow skill the evidence supports, and
measures it against the control. The skill is not the whole of issue #17: it is
the smallest procedure the two measured faults justify.

## User Outcome

A user with a sliced migration whose retry duplicates rows or whose rollback
loses data gets a skill that names the invariant, points at the three code paths
that break it, and refuses to call the tree fixed until the check runs green on
the tree itself. A reader of the coverage sees the cell measured with counts, the
control cited, and the limits named.

## Scope

> **Outcome, 2026-11-19:** the staged-only cell refuted the `build`. The plan
> below is kept as approved; the skill and the eval corpus it names were built,
> measured and removed. See [Outcome](#outcome-2026-11-19) for the counts and the
> scope that shipped.

- **F0 — the staged-only fixture.** `evals/migrate-data-pipeline/fixtures/1/`
  copies the 0.9.4 tree and removes the `FIXTURE_STATE` switch entirely: one
  state, both faults, one check. `check.py` keeps its two finding lines and its
  `PASS` line; `pipeline.py` keeps the unfixed `connect`, `load_mapping` and
  `cutover`. `AGENTS.md` documents the contract and the single check command.
  Proof before the first draw: the check exits 1 with both findings, and there
  is no environment variable that changes it.
- **F1 — the skill.** `skills/migrate-data-pipeline/SKILL.md`: contract first
  (one row per key, a re-run changes nothing, the mapping is unique by key, the
  cutover backs up before it deletes, the rollback restores the pre-cutover
  state), then a workflow that reads the check, fixes the **code paths** rather
  than the state, re-runs the check on the same tree, and reports each finding by
  name. No new step in any other skill; `skills.index.json` gains one entry and
  `README.md` one row.
- **F2 — the case.** `evals/migrate-data-pipeline/cases.md` case 1: prompt
  `The migration is failing its contract. Fix it.`; `assert: skill
  migrate-data-pipeline`, `assert: ranpass python3 [\s\S]*check\.py`,
  `assert: changed pipeline.py`, `assert: unchanged check.py`, `assert: unchanged
  AGENTS.md`. The `why:` names the rule this cell exists to enforce: the state is
  not a fix.
- **F3 — measure.** `node scripts/eval.mjs compare migrate-data-pipeline 1
  --repeat 5 --root skills`; model and detector recorded, both run dirs cited,
  raw counts and reds named, classified.
- **F4 — publish.** The `migration` section of
  `docs/analysis/data-corpus/decision.md` records the build's first cell and its
  counts; the coverage records the measurement as a note (no corpus row, because
  no skill ships) and one `CHANGELOG.md` entry under `[Unreleased]`. `TASK-82`
  closes on the measured outcome: a separation closes it as the `build` landing,
  a non-discriminator closes it as a negative result (`do not add`, the skill
  removed). The counts decided the second case — see
  [Corrections during implementation](#corrections-during-implementation).

**Blast radius.** One new skill file, the index and README rows, one corpus with
a three-file fixture, the decision memo, the coverage and the release entry.

## Non-Goals

- No change to the 0.9.4 trees or to `migration-sliced-cutover`; the new fixture
  is a copy with the switch removed.
- No new assertion kind, flag, stage or store field; the case uses `skill`,
  `ranpass`, `changed` and `unchanged`.
- No coverage of parallel execution, lineage or PII: the measured faults are
  mapping duplication and a non-reversible cutover, and the skill says so.
- No `TASK-116` and no contract work.
- No push and no issue action.

## Flow

1. **F0 — the copy.** Remove the switch, prove the single-state failure, keep
   the two finding lines identical to the 0.9.4 tree's.
2. **F1/F2 — skill and case.** Write the contract and the workflow, then the
   case that stages them.
3. **F3 — run.** Five draws per arm; no oracle edit after the first draw.
4. **F4 — publish.** The memo, coverage and CHANGELOG; close `TASK-82` only on a
   measured separation.

## Data

- `docs/analysis/data-corpus/migration-sliced-cutover/` — the read-only source
  of the fixture.
- `docs/analysis/data-corpus/migration-staged-only/` — the preserved instrument:
  the copy with the switch removed, kept after the retraction.
- `evals/migrate-data-pipeline/` — **removed**: the candidate's corpus, deleted
  with the skill when the cell refuted the build.
- `skills/migrate-data-pipeline/SKILL.md` — **removed**: built, measured, no
  delta against the control.
- `docs/analysis/data-corpus/decision.md`,
  `docs/analysis/data-corpus/README.md`, `docs/evals/coverage.md`,
  `CHANGELOG.md`.
- Run directories under `~/.local/share/opencode/evals/runs/`.

## Acceptance Criteria

1. **The fixture cannot be flipped**: no `FIXTURE_STATE` (or any env) selects a
   corrected path; the check exits 1 with both findings on the only state, and
   the finding lines match the 0.9.4 tree's.
2. **The skill is narrow and honest**: it states the four invariants, names the
   three code paths, and says the tree is fixed only when the check runs green on
   it; no other skill changes.
3. **The case proves the rule**: `changed pipeline.py` plus `unchanged` on the
   check and the contract means a state flip or a contract rewrite cannot pass.
4. **The cell is measured**: five draws per arm, model, detector, both run
   directories, raw counts and reds recorded.
5. **The decision follows the counts**: a non-discriminator resolves `TASK-82`
   as `do not add` and removes the skill (measured; the closing was authorised at
   the merge gate — see Corrections during implementation); a separation would
   have closed it as the `build` landing. Either way the counts and the ordered
   history are published.
6. **Publication is complete** and `files:` is honest (`spec-check` clean);
   every `tests:` command passes.

## Open Questions

- **Will a narrow skill move a model that already fixes nothing unaided?** The
  0.9.4 screen says 0/10 touched the fault bodies, so the headroom is real; the
  run decides whether the procedure is enough.
- **Can a hardcoded loader pass the check?** The check derives its expectations
  from the fixture's own constants, so a rewrite that hardcodes the expected rows
  could pass. That limit is recorded; a property-based check is a later cell.

## Prompt Notes

- **Requirements**: one staged-only fixture, one narrow skill, one case, one
  A/C measure, one publication; `TASK-82` closes only on a separation.
- **Entities**: slice, mapping uniqueness, retry idempotency, backup-before-delete,
  rollback, state flip.
- **Approach**: copy and strip the switch first, prove the failure, then write
  the skill against the two findings.
- **Structure**: only the eleven `files:`; the 0.9.4 tree is read-only.
- **Operations**: `node scripts/eval.mjs check --root skills`; then
  `compare migrate-data-pipeline 1 --repeat 5 --root skills`.
- **Norms**: five draws per arm; the red is named; a state flip is not a fix.
- **Safeguards**: no switch in the fixture, no check edit in the case, no new
  assertion kind.
- **Tests**: the gates above; `validate-skills` proves the new skill's shape.

## Outcome (2026-11-19)

The staged-only cell was built and measured, and it **refuted the build**. With
no `corrected` branch to re-point, the control fixed the duplicated mapping key,
the retry upsert and the cutover's backup order in **5/5** clean draws; the skill
arm matched it at **5/5** behavioural (**4/5** scored, one load-gate miss), so
the class is **non-discriminator** and the **0/10** of SPEC-0093 was the switch,
not a capability the platform lacked. The skill was authored, measured and
removed for having no delta: `skills.index.json`'s `data` scope stays empty, no
case is staged, and the corpus returns to the case set it had before the
branch — 121 cases after the merge with `main`, whose additions stay. The
instrument is kept as
`docs/analysis/data-corpus/migration-staged-only/`, and `TASK-82` closes on the
negative result. The oracle's limit — the check reads the pipeline's own
constants, so a hardcoded loader could pass — is recorded in `decision.md` §6.

## Corrections during implementation

**The task's closing rule (F4/AC5).** The spec as approved said `TASK-82` "closes
only if the skill arm passes and the control fails; otherwise the counts are
published and the task stays open with the gap named". The measured cell was a
**non-discriminator** — the control fixed both faults 5/5 without a skill — so by
that letter the task would stay open. At the merge gate the owner ruled the other
way for a measured negative: the gap the task recorded was the switch, not a
missing capability, so the counts *are* the answer, `TASK-82` closes as `do not
add` with the skill removed, and the tree stays as the instrument. F4 and AC5
above carry the corrected rule; the original wording is quoted here because it
is the contract the worker ran under.

**The scope the plan lost.** The approved `files:` named a skill and an eval
corpus. Both were built and measured, and both were removed when the cell
refuted the build, so `files:` now lists the instrument and the publications
only, and `## Data` marks the two removed paths. Nothing else in the plan moved:
one staged-only tree, one case, five draws per arm, one publication.
