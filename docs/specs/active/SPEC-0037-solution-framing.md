---
id: SPEC-0037
title: Frame a solution before choosing a template
status: draft
priority: P3
task: TASK-59
created_at: 2026-11-08
updated_at: 2026-11-15
source_docs:
  - https://github.com/ricardowendell/agent-skills/issues/9
  - backlog/tasks/task-59 - skill-framing-leve-de-solucao-antes-de-escolher-template.md
  - docs/specs/SPEC-0034-iterative-corpus.md
  - docs/analysis/paused-specs-review.md
  - docs/roadmap.md
related_decisions: []
depends_on: []
blocks: []
files:
  - skills/solution-framing/SKILL.md
  - evals/solution-framing/cases.md
  - docs/evals/solution-framing-matrix.md
  - docs/evals/coverage.md
  - docs/README.md
  - docs/specs/active/SPEC-0037-solution-framing.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0037-solution-framing.md --base main
---

# SPEC-0037: Frame a solution before choosing a template

## Purpose

Issue #9 describes a gap between a vague intent ("I need to track several
initiatives") and code: generating immediately can solve the wrong problem, while
requiring a full specification for an early exploration is excessive.

The repo already has `capture-idea`, `groom-backlog` and `find-blind-spots`.
A framing skill is justified only if it adds something those three do not.

**Rewritten on 2026-11-15, status `draft`.** The previous text waited on
`SPEC-0034` to show the incumbent mishandling an underspecified request. That
gate ran and closed in the incumbent's favour: `SPEC-0034` measured the exact
case (`#12`) at **4/5 vs 0/5**, and the 2026-11-15 audit records that no cluster
in the 58-session sample maps to framing. The premise is falsified, not pending;
this rewrite states the trigger the skill now needs instead of re-waiting on a
gate that already answered.

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

## Trigger: why this is `draft`

The skill becomes `ready` only when a **named trigger** exists:

1. a real session transcript where the incumbent (`capture-idea`,
   `groom-backlog`, `find-blind-spots`) mishandles an underspecified request in
   a way those three do not cover, **and**
2. the comparison names a gap that is not a rewording of what they already do.

The falsified premise stays recorded: `SPEC-0034` `#12` separates 4/5 vs 0/5 in
the incumbent's favour, so "waiting for the corpus" is no longer a valid reason
to keep this open. Without a named trigger, this spec is `rejected`, not
re-paused.

**Draw ceiling.** The first measurement wave is capped at **20 draws** — a
3-draw smoke plus 5+5 on the first cell — with the total and the discarded draws
published. Exceeding it needs a new named trigger and a new ceiling.

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
7. **The first wave stays within 20 draws**, and the total cost including
   discarded draws is published.
8. **No drift.** Every command in `tests:` passes, when it becomes `ready`.

## Open Questions

- **What would the frame assert deterministically?** Presence of the three states
  and a question count are checkable; whether the question is *relevant* is a
  judgment. The corpus must say which part is graded and which is human.
- **Is this a skill or a section in `groom-backlog`?** Extension is the cheaper
  hypothesis and should be tested first.
- **Where does the named trigger come from?** The 2026-11-07 sample has no

  framing cluster; the trigger has to come from a new transcript, not from the
  same sample that already answered.

## Prompt Notes

- **Requirements**: short frame, three states, blocking-only questions, optional
  catalogued template, no promotion to `ready`.
- **Entities**: frame, assumption, open question, slice, template capability.
- The `tests:` command was updated on 2026-11-15: the old
  `run-evals.mjs --list --check` no longer exists (`SPEC-0060` consolidated the
  CLI), and `check-staleness` was missing.
- `files:` moved the corpus to `evals/solution-framing/cases.md` (`SPEC-0058`);
  a case never lives inside the skill.
