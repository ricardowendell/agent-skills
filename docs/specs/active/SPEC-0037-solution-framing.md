---
id: SPEC-0037
title: Frame a solution before choosing a template
status: draft
priority: P1
task: TASK-59
created_at: 2026-11-08
updated_at: 2026-11-08
source_docs:
  - https://github.com/ricardowendell/agent-skills/issues/9
  - backlog/tasks/task-59 - skill-framing-leve-de-solucao-antes-de-escolher-template.md
  - docs/specs/active/SPEC-0034-iterative-corpus.md
  - docs/roadmap.md
related_decisions: []
depends_on:
  - SPEC-0034-iterative-corpus
blocks: []
files:
  - skills/solution-framing/SKILL.md
  - skills/solution-framing/references/evals.md
  - docs/evals/framing-corpus.md
  - docs/evals/coverage.md
  - docs/README.md
  - docs/specs/active/SPEC-0037-solution-framing.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0037-solution-framing.md --base main
---

# SPEC-0037: Frame a solution before choosing a template

## Purpose

Issue #9 describes a gap between a vague intent ("I need to track several
initiatives") and code: generating immediately can solve the wrong problem, while
requiring a full specification for an early exploration is excessive.

The repo already has `capture-idea`, `groom-backlog` and `find-blind-spots`.
A framing skill is justified only if it adds something those three do not.

## User Outcome

A request that is not yet a spec gets a short, checkable frame — problem,
observable outcome, constraints, assumptions, blocking questions, and the
smallest demonstrable slice — without an interview and without being marked
`ready`.

## Scope

- **Compare before proposing.** Run the incumbent set first. Publish the
  difference, and if there is none, record `do not add skill`.
- **A short output.** Problem, persona, observable outcome, data and
  integrations, constraints, assumptions, open questions, smallest slice.
- **Three states, verifiable.** `confirmed`, `assumed`, `open`. A claim without a
  source is `assumed`, never `confirmed`.
- **Ask only what blocks.** One question when it changes the slice; none when the
  request is already clear.
- **A template is optional and catalogued.** A template may be chosen only from a
  versioned catalogue with declared capabilities; without one, the answer is
  `unknown / not suitable`, never an invented name.
- **Output feeds, never promotes.** The frame can feed `groom-backlog`; it does
  not set `ready` and does not change product scope.

## Blocker: why this is `draft`

0.7.0 is the corpus (`SPEC-0034`), and this skill's justification is a comparison
against three existing skills. Writing it before that evidence would be the exact
"feature factory" the roadmap forbids. It becomes `ready` when:

1. `SPEC-0034` shows what the incumbent does with an underspecified request, and
2. the comparison against `groom-backlog`, `capture-idea` and `find-blind-spots`
   names a gap that is not a rewording of what they already do.

## Non-Goals

- No interview ceremony, no approval gate for exploration.
- No ADR for reversible choices.
- No template registry, no taxonomy that belongs to the product.
- No replacement of `groom-backlog` or `find-blind-spots`.

## Acceptance Criteria

1. **Two ambiguous requests produce relevant questions** without inventing
   business rules.
2. **A clear request produces the smallest slice and testable criteria** without
   an interview.
3. **A request involving private data or an external effect names the
   authorisation and the scope limit.**
4. **Without a valid catalogue, no template name or capability is invented.**
5. **`confirmed`, `assumed` and `open` are distinguishable** in the output.
6. **The measurement supports create or extend**; without incremental value, the
   decision not to create is recorded.
7. **No drift.** Every command in `tests:` passes, when it becomes `ready`.

## Open Questions

- **What would the frame assert deterministically?** Presence of the three states
  and a question count are checkable; whether the question is *relevant* is a
  judgment. The corpus must say which part is graded and which is human.
- **Is this a skill or a section in `groom-backlog`?** Extension is the cheaper
  hypothesis and should be tested first.

## Prompt Notes

- **Requirements**: short frame, three states, blocking-only questions, optional
  catalogued template, no promotion to `ready`.
- **Entities**: frame, assumption, open question, slice, template capability.
- **Approach**: compare with the incumbent set first; extend if equal.
- **Safeguards**: no invented business rule, no product decision, no registry.
- **Tests**: reply assertions for the frame; human review for relevance.
