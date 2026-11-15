---
id: SPEC-0092
title: The platform skill already sees the duplicated-key join, or the gap is real
status: ready
priority: P1
task: TASK-81
created_at: 2026-11-15
updated_at: 2026-11-15
source_docs:
  - backlog/tasks/task-81 - data-test-data-quality-orientada-a-invariantes-de-negocio-issue-16.md
  - docs/analysis/data-corpus/decision.md
  - docs/analysis/data-corpus/join-duplicate-keys/AGENTS.md
  - docs/analysis/data-corpus/negative-healthy/AGENTS.md
related_decisions: []
depends_on: []
blocks: []
files:
  - evals/implement-from-prompt/cases.md
  - evals/implement-from-prompt/fixtures/14/AGENTS.md
  - evals/implement-from-prompt/fixtures/14/pipeline.sql
  - evals/implement-from-prompt/fixtures/14/check.sql
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0092-data-quality-composition-screen.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0092-data-quality-composition-screen.md --base main
---

# SPEC-0092: The platform skill already sees the duplicated-key join, or the gap is real

## Purpose

Issue #16 asks for business invariants (grain, contract, consumers) and the
minimal checks that enforce them, and it says to test the datacontract/dbt reuse
**before** creating anything. `docs/analysis/data-corpus/decision.md` records the
`join/quality` decision as **build new — provisional**, with the reason stated
plainly: "the B arm is not staged, and `review-code`/`audit-code-quality` were
not measured against these trees."

This spec runs the cheapest composition test that can settle it: the platform
skill that turns a stated problem into a fix, `implement-from-prompt`, against
the `join-duplicate-keys` tree. If the platform skill fixes the grain defect from
a one-line symptom, no data-quality skill is justified and the answer is
`compose`/`do not add`. If it does not, the gap is measured, not assumed, and
`TASK-81` gets the evidence for `build new`.

## User Outcome

A reader of `docs/analysis/data-corpus/decision.md` and `docs/evals/coverage.md`
sees the composition arm measured on the join tree, with raw counts, run
directories and the named reds, and a decision that follows the numbers instead
of the earlier provisional wording.

## Scope

- **F0 — the fixture.** Copy `docs/analysis/data-corpus/join-duplicate-keys/`
  (`AGENTS.md`, `pipeline.sql`, `check.sql`) into
  `evals/implement-from-prompt/fixtures/14/`, rewriting only the paths in
  `AGENTS.md` so its check command runs from the fixture root. The pipeline, the
  oracle and the contract are byte-identical to the corpus tree apart from that
  path.
- **F1 — the case.** Case 14 in `evals/implement-from-prompt/cases.md`:
  prompt `The joined table has more rows than the orders grain. Fix the pipeline.`
  `why:` names the corpus tree and says the case measures the platform skill's
  reach, not a new capability. Assertions: `ranpass sqlite3 .*check\.sql` (the
  oracle ran and passed), `unchanged check.sql` and `unchanged AGENTS.md` (the
  oracle and the contract are not edited to fit), `filematch pipeline.sql (distinct|DISTINCT|GROUP BY|group by)`
  is **not** asserted: the fix's shape is the agent's, the oracle is the gate.
- **F2 — measure.** `node scripts/eval.mjs compare implement-from-prompt 14
  --repeat 5 --root skills`; model and detector recorded, both run dirs cited,
  raw counts and reds named, classified.
- **F3 — decide and publish.** The `join/quality` section of
  `docs/analysis/data-corpus/decision.md` gains the measured result and a
  decision that follows it (`compose`/`do not add` if the skill arm passes,
  `build` if the gap is real), the coverage row cites the dirs, and one
  `CHANGELOG.md` entry under `[Unreleased]`.

**Blast radius.** One corpus case with a three-file fixture, the decision memo,
the coverage inventory and the release entry. No skill, no runner, no oracle.

## Non-Goals

- No new skill in this spec: the result decides whether one is justified, and a
  `build` outcome is a follow-up spec with its own budget.
- No change to the six data-corpus trees, the holdout, or `negative-healthy`;
  the negative is read as the "does not manufacture a defect" reference, not
  re-staged.
- No new assertion kind, flag, stage or store field.
- No `TASK-116` and no contract work.
- No push and no issue action.

## Flow

1. **F0/F1 — fixture and case.** Copy, adjust the one path, write the case.
2. **F2 — run.** Five draws per arm.
3. **F3 — decide and publish.** The memo and the coverage; no oracle edit after
   the first draw.

## Data

- `evals/implement-from-prompt/fixtures/14/` — the copied tree.
- `evals/implement-from-prompt/cases.md` — case 14.
- `docs/analysis/data-corpus/decision.md` — `join/quality`.
- `docs/evals/coverage.md`, `CHANGELOG.md`.
- Run directories under `~/.local/share/opencode/evals/runs/`.

## Acceptance Criteria

1. **The fixture is the corpus tree**: the three files are byte-identical apart
   from the `AGENTS.md` path rewrite, and the documented check command exits 1
   before the fix.
2. **The case is honest**: the prompt states the symptom only, the oracle is an
   assertion (`ranpass`), and the oracle and contract are `unchanged`.
3. **The cell is measured**: five draws per arm, model, detector, both run dirs,
   raw counts and reds recorded.
4. **The decision follows the numbers**: `compose`/`do not add` if the skill arm
   passes, `build` if it fails, with the counts quoted and the old provisional
   sentence kept as history.
5. **Publication is complete** and `files:` is honest (`spec-check` clean);
   every `tests:` command passes.

## Open Questions

- **Will the platform skill pass?** The corpus tree's contract names the grain,
  so a careful reader can find the join without a data skill; if the skill arm
  passes 5/5, that is the answer and no capability is built. The run decides.
- **Does one defect tree prove "quality"?** No: it proves the grain check, the
  same limit the corpus memo already records. The negative tree stays the
  false-positive guard for a later, broader screen.

## Prompt Notes

- **Requirements**: one fixture copy, one case, one A/C measure, one decision,
  one publication.
- **Entities**: grain, duplicated dimension key, oracle, `unchanged`, composition
  arm, gap.
- **Approach**: copy first, prove the failing check, then write the case.
- **Structure**: only the seven `files:`; the corpus tree is a read-only source.
- **Operations**: `node scripts/eval.mjs check --root skills`; then
  `compare implement-from-prompt 14 --repeat 5 --root skills`.
- **Norms**: five draws per arm; the red is named; the decision memo keeps the
  old sentence as history.
- **Safeguards**: do not edit `check.sql` or `AGENTS.md` in the case; no skill;
  no new assertion kind.
- **Tests**: the gates above; `corpus.test.mjs` proves the one-digest-free move
  (a new case is an addition).
