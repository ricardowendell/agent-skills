---
id: SPEC-0085
title: The contract capability is measured before it is built
status: implemented
priority: P1
task: TASK-83
created_at: 2026-11-13
updated_at: 2026-11-13
source_docs:
  - backlog/tasks/task-83 - data-composicao-ODCS-para-design-data-contract-issue-18.md
  - https://github.com/ricardowendell/agent-skills/issues/18
  - https://github.com/datacontract/datacontract-skills
  - docs/specs/SPEC-0082-data-corpus-slice.md
  - docs/analysis/data-corpus/decision.md
  - docs/analysis/data-corpus/README.md
related_decisions: []
depends_on: []
blocks: []
files:
  - docs/analysis/data-corpus/contract-ab/README.md
  - docs/analysis/data-corpus/contract-ab/incompatible-staged/AGENTS.md
  - docs/analysis/data-corpus/contract-ab/incompatible-staged/pipeline.py
  - docs/analysis/data-corpus/contract-ab/incompatible-staged/check.py
  - docs/analysis/data-corpus/contract-ab/incompatible-staged/contract-v1.odcs.yaml
  - docs/analysis/data-corpus/contract-ab/incompatible-staged/contract-v2.odcs.yaml
  - docs/analysis/data-corpus/contract-ab/schema-drift-documented/AGENTS.md
  - docs/analysis/data-corpus/contract-ab/schema-drift-documented/pipeline.py
  - docs/analysis/data-corpus/contract-ab/schema-drift-documented/check.py
  - docs/analysis/data-corpus/contract-ab/schema-drift-documented/contract-v1.odcs.yaml
  - docs/analysis/data-corpus/contract-ab/schema-drift-documented/contract-v2.odcs.yaml
  - docs/analysis/data-corpus/contract-ab/semantic-change/AGENTS.md
  - docs/analysis/data-corpus/contract-ab/semantic-change/pipeline.py
  - docs/analysis/data-corpus/contract-ab/semantic-change/check.py
  - docs/analysis/data-corpus/contract-ab/semantic-change/contract-v1.odcs.yaml
  - docs/analysis/data-corpus/contract-ab/semantic-change/contract-v2.odcs.yaml
  - docs/analysis/data-corpus/contract-ab/composition/AGENTS.md
  - docs/analysis/data-corpus/contract-ab/composition/schema.sql
  - docs/analysis/data-corpus/contract-ab/composition/requirements.md
  - docs/analysis/data-corpus/contract-ab/composition/check.py
  - docs/analysis/data-corpus/ab-cases.md
  - docs/analysis/data-corpus/decision.md
  - docs/analysis/data-corpus/README.md
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0085-contract-ab-measurement.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0085-contract-ab-measurement.md --base main
---

# SPEC-0085: The contract capability is measured before it is built

## Purpose

Issue #18's hypothesis is that the catalog may only need a **thin routing
reference** that composes the official `datacontract-skills` with the product
context — not a new contract skill. The official skills are MIT
(`datacontract/datacontract-skills`), pinned at `dc06664`, and their
`breaking-change-check` already promises the hardest part of the issue:
*"breaking, needs review, or safe, including semantic changes no tool detects"*.
The `datacontract-cli` 1.2.9 is installed and exposes `lint`, `changelog` and
`breaking`.

The data corpus (0.8.3) gives the contract trees and a frozen holdout; what is
missing is the **A/B comparison**. This spec measures the official skills against
the control on the contract fixtures, and authors no local skill until the
verdict says the pin does not cover the capability.

## User Outcome

A reader of `docs/analysis/data-corpus/decision.md` sees, per contract cell,
whether the official `breaking-change-check`/`create-data-contract` separates
from the control, with the pin, the licence, the run dirs and the raw counts.
The verdict is `reuse external` (the deliverable is the thin routing reference
the issue predicted) or a documented gap that justifies C in its own spec.

## Scope

- **F0 — the pin (precondition, recorded).** `datacontract-skills` at
  `dc06664` (MIT, Copyright 2026 Entropy Data) and `datacontract-cli` 1.2.9.
  The mirror `.lane/pinned/datacontract/` is **gitignored**: `skills/` holds
  `breaking-change-check`, `create-data-contract` and `datacontract-cli` copied
  verbatim from the pinned clone; `evals/<id>/cases.md` and fixtures are the
  staged cases. Nothing is redistributed; the CI's third-party check stays green.
- **F1 — the durable fixture set.** `docs/analysis/data-corpus/contract-ab/`
  derives the contract trees without touching the frozen originals:
  - `incompatible-staged/` — the staged-only copy of `incompatible-contract`
    (the original embeds the corrected branch); its own `treeHash` is recorded,
    the original stays at `b96b88d3…`, and the two ODCS versions are
    `contract-v1` (requires `customer_id`) and `contract-v2` (requires
    `customer_ref`).
  - `schema-drift-documented/` — `contract-v1` → `contract-v2` adds the
    documented additive `channel`; the verdict must be safe.
  - `semantic-change/` — **new**: the schema is identical and only the semantics
    move (`amount_cents` unit changes from cents to dollars); the deterministic
    check passes, so the break is not schema-detectable and the report must
    declare it and name the consumer impact.
  - `composition/` — **new**: a small table (`schema.sql`) and requirements
    (`requirements.md`), no contract; the case asks to create the ODCS, and a
    valid result passes `datacontract lint`.
- **F2 — the cases.** `docs/analysis/data-corpus/ab-cases.md` records the case
  definitions durably (prompt, why, expect, assert); the mirror copies them into
  `evals/breaking-change-check/` (three behavioural cells) and
  `evals/create-data-contract/` (the composition cell), with
  `stage: datacontract-cli` so the official skill can follow its own Step 0.
- **F3 — A vs B.** For each cell, `compare <external-id> <n> --repeat 5
  --root .lane/pinned/datacontract` runs both arms: control (no skill) and the
  official skill. Four cells × ten draws = **40 draws**; model and detector
  recorded; five clean draws per arm or `unresolved` with the reason. The
  behavioural holdout is the staged-only `incompatible-staged` copy, reported
  against its own `treeHash`.
- **F4 — the verdict.** Publish per cell in `decision.md` (the B-arm section:
  pin, licence, comparability, counts, red assertions) and a note in
  `docs/evals/coverage.md`; the `CHANGELOG.md` 0.9.0 entry states what was
  measured and what was not. The decision is `reuse external` or a documented
  gap; the routing reference or the C spec is the follow-up, not this wave.

**Blast radius.** A new durable fixture set under `docs/analysis/`, the case
definitions, the pinned mirror (gitignored), the decision memo, the coverage note
and the release entry. No skill, runner, detector, existing corpus or frozen
hash changes.

## Non-Goals

- No local contract skill is authored this wave; C is conditional on the verdict.
- No ODPS (`#21`) and no quality rules (`#16`); the A/B cells are contract-only.
- No new contract engine: the official CLI is the tool, not a dependency to
  reimplement.
- No redistribution: the pinned skills stay in the gitignored mirror; nothing is
  committed from them.
- No network during a draw: the CLI is pre-installed and the fixtures are local;
  a cell that needs a live source is `unknown`, not measured.
- No new assertion kind, runner flag or detector change (the freeze covers
  those).
- No edit to the frozen `incompatible-contract` original or its `b96b88d3…`
  hash.

## Flow

1. **F0 — mirror.** Create `.lane/pinned/datacontract/` from the pinned clone
   (`skills/` + `evals/<id>/cases.md` + fixtures copied from `contract-ab/`).
   `node scripts/eval.mjs check --root .lane/pinned/datacontract` must stage the
   four cells clean.
2. **F1 — fixtures.** Write the `contract-ab/` set: the derived staged-only
   incompatible tree, the drift tree with two ODCS versions, the semantic tree,
   and the composition tree; prove each deterministic check (staged/corrected,
   documented/undocumented) and `datacontract lint` on the valid contracts.
3. **F2 — cases.** Write `ab-cases.md` (durable) and the mirror cases; the
   prompts and fixture hashes must be identical across the two external corpora.
4. **F3 — run.** Four `compare` runs, five draws per arm; record the model,
   detector, run dirs and raw counts; classify each cell.
5. **F4 — publish.** `decision.md`, `coverage.md`, `CHANGELOG.md`; the verdict
   names the next step (`reuse external` → routing reference; gap → C spec).

## Data

- `docs/analysis/data-corpus/contract-ab/` — the durable fixtures.
- `docs/analysis/data-corpus/ab-cases.md` — the case definitions.
- `.lane/pinned/datacontract/` — the gitignored mirror (not committed).
- `docs/analysis/data-corpus/decision.md` — the pin and the counts.
- Run directories under `~/.local/share/opencode/evals/runs/`.

## Acceptance Criteria

1. **The pin is recorded**: commit `dc06664`, MIT, CLI 1.2.9, the mirror is
   gitignored and nothing from it is committed; `check-sensor-parity` and the CI
   third-party check are green.
2. **The durable set exists**: `contract-ab/` has the four trees with AGENTS.md,
   the pipeline, the check and the ODCS v3 YAML where a contract applies; the
   deterministic proofs are recorded.
3. **The holdout is respected**: the original `incompatible-contract` tree is
   untouched (`treeHash b96b88d3…`), the staged-only copy has its own recorded
   `treeHash`, and no draw reads the corrected branch.
4. **The semantic case is not schema-detectable**: the deterministic check passes
   on the semantic tree, and the case asserts the report declares the semantic
   break and the consumer impact instead of blessing it as safe.
5. **The composition case is tool-valid**: a contract created for the
   composition tree passes `datacontract lint`, and the case asserts the lint
   and the required fields.
6. **A/B is comparable**: the same prompt and fixture hash are used in the
   control and the official-skill corpora; five draws per arm; model and detector
   recorded; both run dirs cited; a cell with fewer than five clean draws is
   `unresolved` with the exact reason.
7. **The verdict is honest**: per-cell separation or non-separation is stated
   with the raw counts; the decision is `reuse external` or a documented gap;
   no rate is claimed from a contaminated draw.
8. **Nothing else moves**: no skill, runner, detector, existing corpus or frozen
   hash changes; every `tests:` command passes.
9. **`files:` is complete**: every fixture and case file is declared before
   `implemented`; `spec-check` reports no `files-touched-undeclared`.

## Open Questions

- **TASK-83 declares a dependency on `TASK-81` (#16).** The human gate ordered
  the contract first; the A/B cells do not need the quality-rules skill, and #16
  will be decided by its own screen. The deviation is recorded here, not hidden.
- **Which external skill answers a contract request?** The routing is implicit in
  the prompts: a change verdict loads `breaking-change-check`, a creation request
  loads `create-data-contract`; each case asserts the expected load, so no
  separate trigger case is measured.
- **Consumer impact without Entropy Data.** The official skill points at the
  Entropy Data `contract-change-review` skill for lineage; without it, the
  consumer-impact statement is a declared limit, not a measured claim.

## Prompt Notes

- **Requirements**: pin the MIT skills, build the durable dual-format fixtures,
  measure the four contract cells A vs B, publish the verdict; no local skill.
- **Entities**: pin, mirror, ODCS v1/v2, staged-only copy, semantic change,
  composition, control arm, official-skill arm, clean draw, verdict.
- **Approach**: copy the external skills verbatim into the gitignored mirror;
  derive the fixture trees into `contract-ab/` so the frozen originals stay
  intact; use the official CLI for `lint`/`breaking` and the existing python
  oracles for the deterministic proof.
- **Structure**: `contract-ab/` beside the 0.8.3 trees; `ab-cases.md` beside
  `decision.md`; the mirror under `.lane/pinned/` only.
- **Operations**: `node scripts/eval.mjs check --root .lane/pinned/datacontract`
  first; then `compare breaking-change-check <n> --repeat 5` and
  `compare create-data-contract 1 --repeat 5`, both with that `--root`; record
  the model and the four run dirs.
- **Norms**: five draws, never three; a contaminated or timed-out draw leaves the
  base; the frozen hash is never rewritten; a red cell is named.
- **Safeguards**: no live data source, no credential, no redistribution, no
  commit from the mirror; the CLI is pre-installed, the fixtures are local.
- **Tests**: the gates above; `check-evidence` validates the run-dir citations;
  `spec-check` keeps `files:` honest.
