---
id: SPEC-0014
title: Drift mode for audit-docs, without leaving the read-only boundary
status: implemented
priority: P1
created_at: 2026-11-05
updated_at: 2026-11-05
source_docs:
  - backlog/tasks/task-20 - audit-docs-modo-drift-contra-o-código.md
  - docs/inbox/2026-11-03-egm-para-agent-skills.md
  - skills/audit-docs/SKILL.md
  - docs/README.md
related_decisions: []
depends_on: []
blocks: []
tests:
  - skills/audit-docs/references/evals.md
---

# SPEC-0014: Drift mode for audit-docs, without leaving the read-only boundary

## Purpose

`audit-docs` compares documents with each other. It cannot answer the other
question a reader has: does this document still describe the code? A feature
described but absent, a field or contract that diverged, a shortcut that changes
the promised behaviour — none of those are contradictions between docs, and none
are found by the current checklist.

The obvious failure mode is turning a drift audit into a refactor. The mode has
to read and propose, never correct, and it has to filter by status and intent so
that a spec that describes the future is not reported as drift.

## User Outcome

A reader asking "what in our docs no longer matches the code?" gets a list of
claims with evidence: each divergence classified as a defect, an intentional
evolution or a stale doc, each with `file:line` on both sides. Planned work is
not in the list. No file is modified.

## Scope

- Add a **drift** mode to `skills/audit-docs/SKILL.md`, distinct from the
  doc-vs-doc consistency audit:
  1. read `AGENTS.md`, then locate the normative docs, the code entry points and
     the documented gates;
  2. enumerate falsifiable claims in the docs (a command, a field, a contract, a
     behaviour, a component);
  3. for each claim, find evidence in code, tests or config; when the claim is
     about behaviour and the project documents a local gate, run it and keep the
     command and result; otherwise mark the claim as not verified rather than
     guessing;
  4. filter by status and intent: `status: draft`/`ready` specs, roadmap items,
     backlog notes and `proposed` decisions describe the future and are not
     drift;
  5. classify every remaining divergence as **defect** (code and doc disagree
     and the doc is the contract), **intentional evolution** (a later decision
     changed the contract) or **stale doc** (the code is the contract and the
     doc did not follow);
  6. report findings with `file:line` on both sides and a proposed scoped edit;
     change nothing.
- Reuse the existing sensors instead of duplicating them: the docs-check
  `spec_sha` comparison for prompt/spec pairs and the project's documented gates
  for behaviour claims. No new runtime dependency.
- Update the skill description to name drift against code, within the existing
  description budget.
- Add one eval case with a fixture that stages four claims: true, false,
  intentionally future, and intentionally evolved. Run it three times.
- Update the `audit-docs` row in `docs/evals/coverage.md`.

**Blast radius.** One skill file and its description, one eval case with one
fixture, one coverage row. No product docs, no bootstrap templates, no sensor
change, no new dependency, no repository-wide code audit.

## Non-Goals

- **Correcting the drift.** The mode proposes edits; applying them is a separate
  request.
- **A new scanner.** Reuse `spec_sha`/docs-check and the documented gates; do
  not build a parser for arbitrary formats.
- **Auditing every claim in a large repository.** The mode works on the claims
  the user's question scopes, plus what the normative docs make checkable.
- **Changing the doc-vs-doc audit.** It stays as it is; drift is an additional
  mode.
- **Treating planned work as drift.** A `draft`/`ready` spec, a roadmap item or
  a proposed ADR is future by definition.
- **Running arbitrary or destructive commands.** Only documented, local gates.

## Flow

1. Add a **Mode: drift** section to the skill with the six steps above and the
   rule that findings are proposals.
2. Extend the review checklist with code-facing checks: promised command exists,
   documented field/contract matches, described behaviour is implemented, no
   undocumented behaviour change in a shortcut.
3. Update the description so a drift question routes here, keeping it under the
   validator's budget.
4. Build the fixture:
   - a claim that is true (the documented gate matches the package script);
   - a claim that is false (the docs say a negative rate is rejected; the code
     does not reject it);
   - a claim about future work (a `status: ready` spec for an unimplemented
     feature);
   - a claim superseded by a decision (an ADR chooses the new behaviour, the old
     doc still describes the old one).
5. Write the case block with assertions: a finding naming the false claim, no
   finding for the future claim, a classification token per divergence, and
   `unchanged`/`nofile` guards proving the run wrote nothing.
6. Validate and run the case three times.
7. Update the coverage row with the run directory and the classification.
8. Confirm no new dependency: `package.json` and the skill's references are
   unchanged apart from the case.

## Data

Fixtures only; the case lives in `skills/audit-docs/references/evals/<n>/`. The
run artifacts live under the runner's normal run directory. The mode produces a
report, never a file.

## UI Notes

Not applicable.

## Acceptance Criteria

- AC-1 — A drift question routes to `audit-docs` and the skill has a drift mode
  distinct from the doc-vs-doc audit. Verified by a trigger case and by reading
  the mode section.
- AC-2 — The report enumerates claims and cites evidence for each: `file:line`
  in the doc and the code/test/command result that confirms or contradicts it.
  Verified by the false-claim fixture.
- AC-3 — Every divergence is classified as `defect`, `intentional evolution` or
  `stale doc`. Verified by the output of the four-claim fixture.
- AC-4 — The future claim produces no drift finding, and the superseded claim is
  classified as intentional evolution rather than a defect. Verified by the
  answer key and the output.
- AC-5 — No file is modified: `git status --porcelain` is empty after the run
  and the case's `unchanged`/`nofile` assertions pass.
- AC-6 — No new runtime dependency: `package.json` is unchanged and the mode
  invokes only existing sensors or documented gates. Verified by the diff and
  the mode text.
- AC-7 — The case runs three times and the classification and run directory are
  recorded in `docs/evals/coverage.md`. Verified by the three results and the
  row.
- AC-8 — `node scripts/run-evals.mjs --root skills --list --check` stays green
  and the description stays within the validator's limit. Verified by the
  commands.

## Result (2026-11-05)

The drift mode is in `audit-docs` and its description names code drift. The
four-claim fixture ran three times, green all three
(`2026-11-05T08-46-00--audit-docs`): the rate doc was reported as a defect with
both sides cited, the removed cap was classified **intentional evolution**
against ADR-0001, the `ready` refunds spec was explicitly filtered as future
work, and every `unchanged` guard passed. One transcript records the gate run
(`npm test`, exit 0) and the closing "No files were modified."

AC-1–AC-8 are met: the mode is separate from the doc-vs-doc audit, the report
cites both sides, the three classifications appear, no file changed, the only
invocation is an existing gate, and the case is runnable and recorded in
`coverage.md`.

## Open Questions

- Running a gate can be slow or blocked (install, network). The mode must prefer
  a documented local gate and otherwise cite the test that proves the claim,
  marking it not verified. The exact cut-off is a judgement; the spec requires
  the report to say which claims were verified by execution and which by
  reading.
- "Intentional evolution" can be indistinguishable from "stale doc" without a
  decision record. The mode uses spec status, ADRs and release notes; when the
  evidence is missing it reports an open question rather than a defect. If the
  pilot shows this happens often, a fourth classification ("undecidable") may be
  needed — that is a later decision, not part of this scope.
- The repo has no product-doc tree; the fixture is the only place the mode is
  exercised here. A consuming project's docs are the real target.

## Prompt Notes

- Requirements: drift mode, claim enumeration, evidence citation, status/intent
  filter, three-way classification, read-only behaviour, one exercised case.
- Entities: `skills/audit-docs/SKILL.md`, its description, the four-claim
  fixture, the case block, `docs/evals/coverage.md`.
- Approach: add the mode beside the existing one; reuse docs-check/`spec_sha`
  and documented gates; measure with a fixture where each claim type is known.
- Structure: mode section in the workflow, checklist extension, one new case
  directory, one coverage row.
- Operations: write mode, update description, build fixture, write case, run
  three times, update coverage.
- Norms: findings ordered by severity; proposed edits stay scoped; the skill
  never applies an edit; no new dependency.
- Safeguards: do not report planned work as drift; do not treat a missing
  decision record as a defect; do not run installs or network commands; do not
  modify the doc-vs-doc mode.
- Tests: an interaction-level check (a drift question routes and reports the
  false claim), a state-level check (no file changed; no new dependency), and a
  classification check (future and evolved claims are not defects).
