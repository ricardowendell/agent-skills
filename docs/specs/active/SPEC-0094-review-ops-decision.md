---
id: SPEC-0094
title: Review/ops is decided by the measured controls, not asserted
status: ready
priority: P2
task: TASK-84
created_at: 2026-11-15
updated_at: 2026-11-15
source_docs:
  - backlog/tasks/task-84 - data-review-data-pipeline-para-semantica-idempotencia-e-recuperacao-issue-19.md
  - docs/analysis/data-corpus/decision.md
  - docs/specs/SPEC-0092-data-quality-composition-screen.md
  - docs/specs/SPEC-0093-migration-composition-screen.md
related_decisions: []
depends_on: []
blocks: []
files:
  - docs/analysis/data-corpus/decision.md
  - skills/review-code/references/data-review.md
  - skills/review-code/SKILL.md
  - docs/evals/coverage.md
  - CHANGELOG.md
  - docs/specs/active/SPEC-0094-review-ops-decision.md
  - backlog/tasks/task-84 - data-review-data-pipeline-para-semantica-idempotencia-e-recuperacao-issue-19.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0094-review-ops-decision.md --base main
---

# SPEC-0094: Review/ops is decided by the measured controls, not asserted

## Purpose

Issue #19 asks whether a data-pipeline review capability (grain/cardinality,
joins, CDC/upsert, idempotency, schema evolution, lineage, PII) should extend
`review-code`, compose, be built, or not exist. The issue itself says the
decision depends on #15/#16/#18, and `docs/analysis/data-corpus/decision.md`
records `review` as **do not add** with a conditional: "Revisit only if a
pipeline-review fixture is groomed and shows a gap."

`SPEC-0092` and `SPEC-0093` now groom exactly that: the join tree and the
migration tree, each measured against the platform skill. This spec reads those
results and records the decision with the evidence in front of it — the last step
of the data program that does not need a new draw.

## User Outcome

A reader of `docs/analysis/data-corpus/decision.md` finds the `review` decision
stated with the counts from the two screens, the option chosen (`extend`,
`compose`, `build` or `do not add`), and — where the answer is `extend` — the
smallest reference the existing `review-code` needs to reach the data trees.

## Scope

- **F0 — read the evidence.** Take the measured outcomes of `SPEC-0092` and
  `SPEC-0093` as the input; cite both run directories and counts.
- **F1 — decide.** Choose exactly one of: `extend review-code` (add a data
  review reference and a corpus case), `compose` (the platform path is enough),
  `build` (a new skill, with a follow-up spec), `do not add`. The choice follows
  the counts: a skill arm that passes on both trees means the platform covers
  it; a passing join screen and a failing migration screen means the gap is
  narrower than the issue assumed.
- **F2 — implement the smallest consequence.**
  - `do not add` or `compose`: write the decision and change nothing else.
  - `extend`: add `skills/review-code/references/data-review.md` (grain,
    cardinality, idempotency, cutover, PII — one screen per dimension, citing
    the corpus trees) and a single line in `skills/review-code/SKILL.md`
    pointing at it, with no new step and no new case in this spec.
  - `build`: record the decision and leave the build to a follow-up spec; this
    spec creates no skill.
- **F3 — publish.** The coverage note and one `CHANGELOG.md` entry under
  `[Unreleased]`; `TASK-84` closes only if the decision is `do not add`,
  `compose` or `extend` implemented here.

**Blast radius.** The decision memo, the coverage inventory, the release entry,
and — only in the `extend` branch — one reference file plus one line in
`review-code`'s skill.

## Non-Goals

- No new draw: the evidence already bought by `SPEC-0092`/`0093` is the input.
- No new skill in this spec, in any branch.
- No change to the data corpus trees or to the platform skill.
- No `TASK-116` and no contract work.
- No push and no issue action.

## Flow

1. **F0/F1 — evidence and decision.** Read both screens; write the decision with
   the counts.
2. **F2 — the smallest consequence.** Implement only what the chosen branch
   names.
3. **F3 — publish.** Coverage and CHANGELOG; no measurement is invented.

## Data

- `docs/analysis/data-corpus/decision.md` — the `review` section.
- Run directories from `SPEC-0092`/`0093` (cited, not re-run).
- `skills/review-code/` — only in the `extend` branch.
- `docs/evals/coverage.md`, `CHANGELOG.md`.

## Acceptance Criteria

1. **The decision is one of the four options**, named explicitly, with the two
   screens' counts and run directories cited.
2. **The branch is implemented exactly**: nothing in `do not add`/`compose`;
   one reference plus one pointer in `extend`; nothing but the decision in
   `build`.
3. **The old `do not add` is kept as history** with the new evidence beside it.
4. **No draw is bought** and no number is recomputed.
5. **Publication is complete** and `files:` is honest (`spec-check` clean);
   every `tests:` command passes.

## Open Questions

- **What if the two screens disagree?** A passing join screen and a failing
  migration screen is the most likely split; the decision then names the
  narrower gap (migration) and `review-code` is not extended for a capability
  the platform already reaches.
- **Does `extend` need a case?** Not here: a reference without a measured case is
  a pointer, not a claim. If the decision is `extend`, the case is the follow-up
  that proves it.

## Prompt Notes

- **Requirements**: read two measured screens, choose one option, implement the
  smallest consequence, publish.
- **Entities**: grain, cardinality, idempotency, cutover, PII, `extend`,
  `compose`, `build`, `do not add`.
- **Approach**: evidence first, branch second; the decision text carries the
  counts.
- **Structure**: only the six `files:`; the corpus and the screens are read-only
  inputs.
- **Operations**: no eval command; the gates above only.
- **Norms**: no draw, no recomputation, the old decision stays as history.
- **Safeguards**: no new skill, no corpus edit, no silent rewrite of the memo.
- **Tests**: the gates above; `validate-skills` proves the `extend` branch's
  reference does not break the skill.

## Queue note (2026-11-15)

Both screens merged (2026-11-15): the join screen decided `do not add`, the migration screen decided `build` on a deliverable-level red. This spec reads those results and is now `ready`.

## Results

The decision is **do not add** for review/ops, read from the two screens this
queue already merged — no draw was bought and no number recomputed. In
`join/quality` the control fixed the grain defect in **5/5** clean draws
(`2026-11-15T13-16-31--implement-from-prompt--without-skill`) against **3/5**
scored for the staged skill arm (`2026-11-15T13-21-22--implement-from-prompt`);
`migration` scored **1/5** with the skill
(`2026-11-15T14-06-13--implement-from-prompt`) against **2/5** without
(`2026-11-15T13-56-31--implement-from-prompt--without-skill`), with **10/10**
draws re-pointing the fixture state and **0/10** touching the fault body.

The join half is reached without a skill, so `extend review-code` has no measured
delta for grain/cardinality; the migration half is a builder gap whose screen has
no rate and is already owned by the `build` recorded in the `migration` section
(`TASK-82`); `compose` is contradicted by the 3/5 and 1/5 skill arms; and one
builder screen with no rate cannot underwrite a new review skill. F2 therefore
changed nothing outside the decision — no `references/data-review.md`, no
`SKILL.md` line, no new skill — and the two `review-code` paths declared in
`files:` stay untouched, which `spec-check` reports as warnings, not errors.
`docs/analysis/data-corpus/decision.md` §4 carries the counts, the dirs and the
old `do not add` as history; `docs/evals/coverage.md` carries both screens and
the decision. `TASK-84` closes on this negative result.
