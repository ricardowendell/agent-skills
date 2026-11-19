---
id: SPEC-0096
title: A migration skill, measured on a tree that cannot be re-pointed
status: ready
priority: P1
task: TASK-82
created_at: 2026-11-15
updated_at: 2026-11-15
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
  counts beside the `build` decision; the coverage gains the new corpus row; one
  `CHANGELOG.md` entry under `[Unreleased]`. `TASK-82` closes only if the skill
  arm passes and the control fails; otherwise the counts are published and the
  task stays open with the gap named.

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
- `evals/migrate-data-pipeline/` — the new corpus.
- `skills/migrate-data-pipeline/SKILL.md`.
- `docs/analysis/data-corpus/decision.md`, `docs/evals/coverage.md`,
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
5. **The decision follows the counts**: a separation closes `TASK-82`; anything
   else publishes the counts and leaves the task open with the gap named.
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
