---
id: SPEC-0082
title: A data corpus that can see a duplicated-key join
status: ready
priority: P1
task: TASK-78
created_at: 2026-11-12
updated_at: 2026-11-12
source_docs:
  - backlog/tasks/task-78 - evals-corpus-discriminativo-de-arquitetura-e-produtos-de-dados-issue-13.md
  - https://github.com/ricardowendell/agent-skills/issues/13
  - docs/specs/SPEC-0054-architecture-corpus-slice.md
  - docs/evals/coverage.md
  - docs/pipeline.md
related_decisions: []
depends_on: []
blocks: []
files:
  - docs/analysis/data-corpus/README.md
  - docs/analysis/data-corpus/join-duplicate-keys/AGENTS.md
  - docs/analysis/data-corpus/join-duplicate-keys/pipeline.sql
  - docs/analysis/data-corpus/join-duplicate-keys/check.sql
  - docs/analysis/data-corpus/migration-retry-backfill/AGENTS.md
  - docs/analysis/data-corpus/migration-retry-backfill/pipeline.py
  - docs/analysis/data-corpus/migration-retry-backfill/check.py
  - docs/analysis/data-corpus/incompatible-contract/AGENTS.md
  - docs/analysis/data-corpus/incompatible-contract/pipeline.py
  - docs/analysis/data-corpus/incompatible-contract/check.py
  - docs/analysis/data-corpus/schema-drift-documented/AGENTS.md
  - docs/analysis/data-corpus/schema-drift-documented/pipeline.py
  - docs/analysis/data-corpus/schema-drift-documented/check.py
  - docs/analysis/data-corpus/negative-healthy/AGENTS.md
  - docs/analysis/data-corpus/negative-healthy/pipeline.sql
  - docs/analysis/data-corpus/negative-healthy/check.sql
  - docs/analysis/data-corpus/negative-safe-retry/AGENTS.md
  - docs/analysis/data-corpus/negative-safe-retry/pipeline.py
  - docs/analysis/data-corpus/negative-safe-retry/check.py
  - docs/analysis/data-corpus/decision.md
  - docs/specs/active/SPEC-0082-data-corpus-slice.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0082-data-corpus-slice.md --base main
---

# SPEC-0082: A data corpus that can see a duplicated-key join

## Purpose

Issue #13 is the gate for the data-product program, and its architecture half
already shipped: `SPEC-0054` built three fixtures, `SPEC-0055`/`SPEC-0056`
measured the skills in 0.7.6. The data half (`TASK-78`) is still missing, and
without it every issue from #16 to #21 asks for a skill that no oracle can judge.

The instrument comes first because the corpus pairs with a skill id
(`evals/<id>/cases.md` beside `skills/<id>/`, `scripts/eval.mjs`
`discoverEvals`), and no data skill exists yet — the program's own rule is that
no skill is created before the corpus shows a gap. So this spec builds the
fixtures and their deterministic oracles as a durable instrument under
`docs/analysis/data-corpus/`; staging them into `evals/<candidate>/` and running
A/B/C is the follow-up the decision memo names, once a capability is chosen.

This spec does not create a skill, does not run a model and does not publish a
rate. It makes the next spec able to.

## User Outcome

A reader opens `docs/analysis/data-corpus/` and finds six small, realistic
trees: four data defects and two negatives. Each tree carries its contract in
`AGENTS.md` and a check script that exits non-zero on the defect and zero on the
corrected tree — deterministically, with `sqlite3` or `python3`, no API key and
no model. The decision memo states, per capability, whether the evidence supports
`reuse external`, `extend existing`, `build new` or `do not add`.

## Scope

- **Four defect fixtures**, one per behaviour the issue names:
  1. `join-duplicate-keys` — an orders/dimension join multiplies rows when the
     dimension key is duplicated. `check.sql` counts rows against the source
     grain and fails on multiplication.
  2. `migration-retry-backfill` — an incremental load that inserts the same batch
     twice when a retry or a backfill re-runs it. `check.py` asserts idempotency
     after a simulated retry (row count plus a content hash).
  3. `incompatible-contract` — a consumer reads a required column the producer
     renamed or dropped. `check.py` asserts the documented contract (required
     fields, nullability) and fails on the incompatible change.
  4. `schema-drift-documented` — an additive nullable column that the contract
     documents as allowed. The oracle must **accept** it; flagging it is a false
     positive.
- **Two negatives** that must produce zero findings:
  5. `negative-healthy` — a correct aggregate join and a correct incremental
     load.
  6. `negative-safe-retry` — a retry that is already idempotent (upsert on the
     natural key, no duplicate rows).
- **Deterministic oracle proof**: for every defect fixture, record the check
  script exiting non-zero on the staged tree and zero on the corrected tree; for
  both negatives, the check script exits zero on the staged tree. The corrected
  tree is a second fixture state, not a model run.
- **Holdout**: `incompatible-contract` is the holdout for the later behavioural
  measurement. Its tree hash is recorded in the decision memo before any
  candidate is measured, and the tree is not edited afterwards.
- **Decision memo** (`decision.md`): per capability (`join/quality`,
  `migration`, `contract`, `review/ops`), the oracle evidence, the B-arm
  comparability (dbt Labs / Databricks skills, licence and pin) or the recorded
  reason it is not comparable, and the gap the corpus shows — or the explicit
  "no gap shown".
- **README**: what each tree is, the command that runs its check, and the rule
  that the fixtures are an instrument, not a skill.

**Blast radius.** A new evidence tree under `docs/analysis/` and this spec. No
skill, no runner change, no assertion kind, no eval-store write, no paid draw.
The corpus staging into `evals/` and the A/B/C run are a follow-up spec.

## Non-Goals

- No skill is created, renamed or extended; the program's per-capability decision
  comes after this evidence.
- No case is staged under `evals/<id>/` yet: that needs a candidate skill id and
  the corpus pairing, and it is the decision memo's next step.
- No runner, assertion kind or matcher change — the freeze lists those, and this
  spec tests the existing mechanism instead.
- No paid draw and no published pass rate; a deterministic proof is the evidence.
- No refactor of the architecture fixtures (`SPEC-0054`) and no edit to the
  `implement-from-prompt` corpus.
- No external data source, credential or proprietary sample; every input is a
  small local CSV/SQLite tree.

## Flow

1. **F0 — trees.** Write the six fixture trees with their `AGENTS.md` contract,
   pipeline and check script. Inputs are local CSVs or a SQLite file; the check
   uses `sqlite3` or `python3` only.
2. **F1 — the oracle proof.** For each defect tree, run the check on the staged
   tree (must fail) and on the corrected tree (must pass); record both. For each
   negative, run the check on the staged tree (must pass).
3. **F1.1 — holdout.** Record the `incompatible-contract` tree hash in
   `decision.md` before any candidate is measured.
4. **F2 — the false-positive check.** Feed a healthy tree to every check script
   in scope and confirm none of them invents a defect.
5. **F3 — the decision memo.** For each capability, record the oracle evidence,
   the B arm's comparability or its limit, and the next step (stage into
   `evals/<candidate>/` for a behavioural measurement, or `do not add`).
6. **F4 — publish.** `README.md`, `decision.md`, and the `files:` list complete
   before `implemented`.

## Data

- `docs/analysis/data-corpus/<fixture>/` — the six trees.
- `docs/analysis/data-corpus/decision.md` — the per-capability decision and the
  holdout hash.
- `docs/analysis/data-corpus/README.md` — how to run each check.
- `sqlite3` and `python3` on the host; the checks must not need a network.

## Acceptance Criteria

1. **Six trees exist**, each with `AGENTS.md` stating the contract and the exact
   check command, a pipeline, and a check script.
2. **Every defect is detectable by the oracle**: the check exits non-zero on the
   staged tree and zero on the corrected tree, and both runs are recorded. The
   proof is deterministic — no model, no draw.
3. **The negatives pass**: both negative trees exit zero, so the oracle does not
   manufacture a defect.
4. **The documented drift is accepted**: `schema-drift-documented` passes, and a
   variant with the same additive column left undocumented fails; both runs are
   recorded.
5. **Row multiplication and incompatible contract are caught by the oracle**, not
   by reading the generated text: the join check counts the source grain and the
   contract check reads the schema, and both fail on the staged tree.
6. **The holdout is frozen**: `incompatible-contract`'s tree hash is recorded in
   `decision.md` before any candidate measurement, and the tree is not edited
   after.
7. **The decision memo is honest**: each capability names the evidence, the B-arm
   comparability or its limit, and the next step; a capability with no gap says
   `do not add`, and a missing comparison is `unknown`, not zero.
8. **No mechanism moves**: no skill, runner, assertion, fixture of another corpus
   or eval-store change; every `tests:` command passes.
9. **No drift in the contract**: every fixture file is added to `files:` before
   `implemented`, so `spec-check` reports no `files-touched-undeclared`.

## Open Questions

- **Which candidate id hosts the corpus later?** The runner pairs a corpus with a
  skill (`evals/<id>/cases.md` beside `skills/<id>/`). The memo recommends
  staging the first behavioural measurement under the capability the evidence
  supports most (candidate: `test-data-quality`, #16), and keeping the other
  fixtures tagged for their capabilities. The human gate picks the id before that
  follow-up is groomed.
- **Is the B arm comparable?** dbt Labs and Databricks publish agent skills, but
  a pinned, licence-compatible copy has not been staged. If it is not comparable,
  the memo records `unknown` and no rate is claimed.
- **SQLite or DuckDB?** The issue allows either. This spec uses `sqlite3` for the
  join cases and `python3` for the migration/contract cases, so the host needs no
  extra dependency; DuckDB is recorded as an option, not a requirement.
- **Is `python3` assumed?** Yes, local and version-agnostic; the checks must stay
  dependency-free.

## Prompt Notes

- **Requirements**: six trees, four defects and two negatives; deterministic
  oracles that fail on the defect and pass on the fix; a frozen holdout; a
  per-capability decision memo; no skill and no paid draw.
- **Entities**: fixture, contract, pipeline, check script, source grain, retry,
  backfill, required column, documented drift, capability, decision.
- **Approach**: build the smallest tree that carries the defect — a CSV or SQLite
  input, one pipeline file, one check script — and prove the check on the staged
  and corrected states before writing the memo.
- **Structure**: one directory per fixture under `docs/analysis/data-corpus/`,
  plus `README.md` and `decision.md`; no `evals/` entry yet.
- **Operations**: write the trees, run each check twice (staged and corrected),
  record the exit codes and output, then write the memo. The `tests:` list is
  model-free.
- **Norms**: local inputs only; the check is the oracle, not the prose; `unknown`
  is not zero; the holdout is frozen before iteration; no wildcard that matches
  nothing counts as a pass.
- **Safeguards**: no network, no credential, no proprietary sample; no skill is
  created by anticipation; the fixtures are an instrument, not a product.
- **Tests**: every `tests:` command; the oracle proof is the behavioural
  evidence, and no paid draw is part of it.
