---
id: SPEC-0038
title: Review the experience that was actually built
status: draft
priority: P1
task: TASK-60
created_at: 2026-11-08
updated_at: 2026-11-08
source_docs:
  - https://github.com/ricardowendell/agent-skills/issues/10
  - backlog/tasks/task-60 - skill-revisao-de-experiencia-read-only-com-evidencia-e-limites.md
  - docs/specs/active/SPEC-0034-iterative-corpus.md
  - docs/roadmap.md
related_decisions: []
depends_on:
  - SPEC-0034-iterative-corpus
blocks: []
files:
  - skills/experience-review/SKILL.md
  - skills/experience-review/references/evals.md
  - docs/evals/visual-corpus.md
  - docs/evals/coverage.md
  - docs/README.md
  - docs/specs/active/SPEC-0038-experience-review.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0038-experience-review.md --base main
---

# SPEC-0038: Review the experience that was actually built

## Purpose

Issue #10 names the gap between "the tests pass" and "a person can use it": an
unnamed button, a missing error state, a focus trap, a layout that breaks.

`review-code` reads a diff against a spec. An experience review reads the built
surface. The risk is that it becomes an opinion with a severity label, so this
spec is written around what can be evidenced.

## User Outcome

A review that says, per finding, what was observed, how to reproduce it, and how
certain it is — and that says `incomplete coverage` instead of approving when
there is no preview.

## Scope

- **Read-only.** No edits, no policy change, no gate change, no publish.
- **Four labels, never blurred**: `verified violation`, `observed UX issue`,
  `subjective recommendation`, `unverifiable`.
- **Evidence per finding**: the principle or requirement, the reproduction, the
  observed result, and the certainty.
- **States are part of the review**: loading, empty, error, plus keyboard
  navigation, focus and responsive behaviour, as far as the surface allows.
- **Contrast is measured** when claimed; a screenshot is not a WCAG proof.
- **Missing access is a finding about coverage**, not a pass.
- **Never approves a merge.** A review is input to a human decision.

## Blocker: why this is `draft`

Same oracle problem as `SPEC-0036`, plus one of its own:

1. **No visual or browser assertion** in the runner. Cases would be `manual`,
   which excludes them from a run and cannot separate arms.
2. **No preview contract.** The skill needs an authorised URL or a local preview
   and a read-only browser path; neither exists in this repo today.

It becomes `ready` when the 0.8.0 oracle decision is made and the preview path is
defined, or when the release explicitly accepts human review as its evidence and
says so in the claim.

## Non-Goals

- No browser automation engine, no replacement of `review-code`.
- No deploy approval, no policy change.
- No aesthetic preference turned into a deterministic gate.
- No WCAG claim from an image.

## Acceptance Criteria

1. **A fixture with an unnamed button and a missing error state produces
   reproducible findings.**
2. **Without a browser, screenshots or preview, the review declares incomplete
   coverage** and does not conclude approval.
3. **Read-only is observable**: no file, asset, policy or gate changed.
4. **The evaluation separates a provable violation from a preference**, and
   records a false positive.
5. **It never approves a merge, changes policy or publishes.**
6. **Every finding links to concrete evidence**; `unknown` stays explicit.
7. **No drift.** Every command in `tests:` passes, when it becomes `ready`.

## Open Questions

- **What is the independent oracle for a UX finding?** A DOM assertion (accessible
  name, focus order) is checkable; "the hierarchy is confusing" is not. The
  corpus must split those before this can claim a separation.
- **Where does the preview come from?** The consuming project, presumably, which
  makes this a skill with an integration contract, not a self-contained fixture.

## Prompt Notes

- **Requirements**: read-only, four certainty labels, evidence per finding,
  coverage honesty, no approval.
- **Entities**: finding, certainty, evidence, state, coverage limit.
- **Approach**: reuse Playwright/axe when the project already has them; otherwise
  declare the limit.
- **Safeguards**: no merge, no policy, no deploy; page content is untrusted.
- **Tests**: DOM and file assertions where possible; human review declared where
  not.
