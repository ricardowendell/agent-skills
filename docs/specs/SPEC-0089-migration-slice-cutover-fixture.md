---
id: SPEC-0089
title: The migration fixture covers slices, duplicate mapping and a reversible cutover
status: implemented
priority: P1
task: TASK-82
created_at: 2026-11-13
updated_at: 2026-11-14
source_docs:
  - backlog/tasks/task-82 - data-migrate-data-pipeline-com-equivalencia-semantica-e-rollback-issue-17.md
  - docs/analysis/data-corpus/README.md
  - docs/analysis/data-corpus/decision.md
  - docs/analysis/data-corpus/migration-retry-backfill/AGENTS.md
  - docs/specs/SPEC-0082-data-corpus-gate.md
related_decisions: []
depends_on: []
blocks: []
files:
  - docs/analysis/data-corpus/migration-sliced-cutover/AGENTS.md
  - docs/analysis/data-corpus/migration-sliced-cutover/pipeline.py
  - docs/analysis/data-corpus/migration-sliced-cutover/check.py
  - docs/analysis/data-corpus/negative-safe-cutover/AGENTS.md
  - docs/analysis/data-corpus/negative-safe-cutover/pipeline.py
  - docs/analysis/data-corpus/negative-safe-cutover/check.py
  - docs/analysis/data-corpus/README.md
  - docs/analysis/data-corpus/decision.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0089-migration-slice-cutover-fixture.md
tests:
  - sh -c 'python3 docs/analysis/data-corpus/migration-sliced-cutover/check.py >/dev/null; test $? -eq 1'
  - sh -c 'FIXTURE_STATE=corrected python3 docs/analysis/data-corpus/migration-sliced-cutover/check.py >/dev/null'
  - sh -c 'FIXTURE_STATE=mapping-fixed python3 docs/analysis/data-corpus/migration-sliced-cutover/check.py >/dev/null; test $? -eq 1'
  - sh -c 'FIXTURE_STATE=cutover-fixed python3 docs/analysis/data-corpus/migration-sliced-cutover/check.py >/dev/null; test $? -eq 1'
  - sh -c 'python3 docs/analysis/data-corpus/negative-safe-cutover/check.py >/dev/null'
  - sh -c 'test -z "$(find docs/analysis/data-corpus -name __pycache__ -print -quit)"'
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0089-migration-slice-cutover-fixture.md --base main
---

# SPEC-0089: The migration fixture covers slices, duplicate mapping and a reversible cutover

## Purpose

Issue #17 asks for the migration capability to be **measured before it is built**:
dependency discovery, baseline/golden data, migration in slices, parallel
execution/reconciliation and a reversible cutover, on an offline multi-stage
fixture with a retry and a duplicated mapping, detecting two semantic faults.

The corpus built by `SPEC-0082` covers only the first half of that:
`migration-retry-backfill` proves retry and overlapping-backfill idempotency on a
single table, and `negative-safe-retry` proves the oracle accepts an upsert
loader. Nothing in the instrument has a mapping table, a sliced migration or a
cutover with a rollback, so a later measurement of that capability would fall
off the fixture at the second step.

This spec builds the missing instrument. It creates **no skill and no eval
case**: a corpus case needs a skill id to stage, and the candidate for `migration`
is still the human gate's call. The fixture is the prerequisite, exactly as the
contract fixtures were the prerequisite of the `#18` A/B.

## User Outcome

A reader of `docs/analysis/data-corpus/README.md` sees a migration tree whose
check fails on two independent semantic faults — a duplicated mapping that
multiplies the join and a cutover whose rollback loses the rows it migrated — and
a negative that passes, each with its exit code and finding line recorded in
`decision.md`. A later spec can stage that tree and measure a candidate against
it without writing a fixture first.

## Scope

- **F0 — the defect tree `migration-sliced-cutover`.** Three files, the corpus
  shape (`AGENTS.md`, `pipeline.py`, `check.py`), sqlite in memory, standard
  library only, `FIXTURE_STATE` switching `staged` (default), `corrected`, and
  the two mixed states added during review to prove fault independence —
  `mapping-fixed` (only the cutover still fails) and `cutover-fixed` (only the
  mapping still fails). The story: `orders_legacy` is migrated to `orders_v2` in two slices through a
  `customer_map`, then cut over with the legacy table kept for rollback.
  - **Fault 1, the duplicated mapping.** `customer_map(legacy_id, customer_ref,
    region, mapped_on)` has no unique key on `legacy_id` in `staged`, and the
    mapping load is replayed, so `C-200` has two rows; the slice join fans its
    orders into two `orders_v2` rows. `corrected` puts a unique key on
    `legacy_id` and upserts by the latest `mapped_on`.
  - **Fault 2, the cutover is not reversible.** In `staged`, `cutover()` copies
    the legacy table **after** deleting the rows it migrated, so `rollback()`
    restores an already-incomplete table. `corrected` takes the backup before any
    delete and the rollback restores the full pre-cutover state.
  - `check.py` runs the sequence once — legacy load, mapping load, mapping retry,
    slice 1, slice 2, cutover, rollback — applies the contract to every step and
    prints **one line per finding**, exit 1 if any. On `corrected` it prints one
    `PASS` line and exits 0. The two faults are independent: a state that fixes
    the mapping but not the cutover must still fail on the cutover line.
- **F1 — the negative `negative-safe-cutover`.** The same shape on a different
  domain (`subscriptions` through a `plan_map`, two slices, backup before
  delete), already correct from the start: `check.py` exits 0 with zero findings.
  Anything else is a manufactured defect.
- **F2 — the proofs are recorded.** `README.md` gains the tree in "What is here",
  the runnable block and the requirements, and the "six trees" prose becomes
  eight; `decision.md` gains the exit-code rows in §1 and the healthy-input row
  in §3. The `migration` section of §4 says the instrument now covers slices,
  duplicate mapping and cutover, and keeps the decision **provisional** — no
  rate, no skill, the B arm still `unknown`.
- **F3 — publish.** One `CHANGELOG.md` entry under `[Unreleased]`; the release
  cut decides the roadmap slot.

**Blast radius.** Two new three-file trees and the corpus's own index/memo. No
skill, no `evals/` case, no runner, detector or template.

## Non-Goals

- No skill (`migrate-data-pipeline` or any other), no `skills/` change and no
  `evals/<id>/` case: staging requires the candidate the human gate has not
  picked.
- No change to the six existing trees, their proofs, the frozen holdout
  (`incompatible-contract`) or the `contract-ab/` fixtures.
- No new script, assertion kind, runner flag or pdlc stage.
- No paid draw; this spec is deterministic and costs 0 draws.
- No `TASK-116` and no issue action.

## Flow

1. **F0 — the defect tree.** Pipeline first, then the oracle; the check drives
   the sequence and owns the contract, the pipeline owns the loader.
2. **F1 — the negative.** Same pipeline shape, no `FIXTURE_STATE` switch: the
   tree has one state and it is the healthy one.
3. **F2/F3 — the proofs and the note.** Run every documented command from the
   repository root, paste the exit code and the finding line into `decision.md`,
   update the index and the `migration` decision, then the `CHANGELOG.md` entry.

## Data

- The two new trees under `docs/analysis/data-corpus/`.
- `docs/analysis/data-corpus/README.md` — table, commands, requirements.
- `docs/analysis/data-corpus/decision.md` — §1 exit codes, §3 healthy inputs, §4
  `migration`.
- Proof commands (from the repository root):
  - `python3 docs/analysis/data-corpus/migration-sliced-cutover/check.py` → 1
  - `FIXTURE_STATE=corrected python3 …/migration-sliced-cutover/check.py` → 0
  - `python3 docs/analysis/data-corpus/negative-safe-cutover/check.py` → 0

## Acceptance Criteria

1. **Two independent faults**: the staged check exits 1 with exactly two finding
   lines, one naming the duplicated `legacy_id` and the rows it multiplied, one
   naming what the rollback lost; fixing either one alone still leaves that
   finding red.
2. **The corrected state passes**: `FIXTURE_STATE=corrected` exits 0 with a
   single `PASS` line and zero findings.
3. **The negative passes**: `negative-safe-cutover` exits 0 with zero findings,
   and no check in the corpus reports a finding on its own healthy state.
4. **The fixture writes nothing**: in-memory sqlite only, `sys.dont_write_bytecode`
   before the sibling import, no file created, no `__pycache__` left, standard
   library only, no network.
5. **Deterministic**: two consecutive runs print byte-identical output; the rows
   are constants, not clock or random values.
6. **The corpus index and memo agree with the trees**: README lists both, the
   commands and the exit codes are recorded in `decision.md`, and the `migration`
   decision stays provisional with no rate and no skill.
7. **Publication is complete** and `files:` is honest (`spec-check` clean);
   every `tests:` command passes.

## Open Questions

- **Two faults in one tree?** Issue #17 asks for two semantic faults, and one
  coherent story is easier to stage and to judge than two thin trees; the case
  that measures it can assert each finding separately. If the later measurement
  needs the faults isolated, splitting is a follow-up, not a reason to blur them
  now.
- **Does the cutover fault need a real file copy?** No: the corpus never writes
  into a tree, so the backup and the restore are tables in the same in-memory
  database. The *order* of backup and delete is the whole fault; a filesystem
  copy would add a failure mode the instrument cannot control.

## Prompt Notes

- **Requirements**: one defect tree with two independent faults, one negative,
  the recorded proofs, the index/memo update; no skill, no case, 0 draws.
- **Entities**: sliced migration, mapping retry, duplicated `legacy_id`, join
  fan-out, cutover, rollback, backup-before-delete, `FIXTURE_STATE`.
- **Approach**: write the pipeline, then the check that owns the sequence; prove
  the corrected state before writing the findings.
- **Structure**: exactly the ten `files:`; the six existing trees are read-only.
- **Operations**: run each proof from the repository root and paste its exit code
  and line; the `sh -c` tests above pin the two non-zero and two zero exits.
- **Norms**: the oracle is the check script, not the prose; a healthy state that
  produces a finding is a broken instrument; the decision stays provisional
  until the measurement exists.
- **Safeguards**: no fixture writes, no clock/random in the data, no skill, no
  case, no rate.
- **Tests**: the exit-code proofs plus the repository gates; `check-evidence`
  must stay green with the new citations.
