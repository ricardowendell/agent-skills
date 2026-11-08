---
id: SPEC-0036
title: Plan a visual change from an element, not a guess
status: paused
priority: P3
task: TASK-58
created_at: 2026-11-08
updated_at: 2026-11-08
source_docs:
  - https://github.com/ricardowendell/agent-skills/issues/8
  - backlog/tasks/task-58 - skill-planejamento-de-mudanca-visual-ancorado-em-elemento-e-design-tokens.md
  - docs/specs/active/SPEC-0034-iterative-corpus.md
  - docs/roadmap.md
related_decisions: []
depends_on:
  - SPEC-0034-iterative-corpus
blocks: []
files:
  - skills/visual-change-planning/SKILL.md
  - skills/visual-change-planning/references/evals.md
  - docs/evals/visual-corpus.md
  - docs/evals/coverage.md
  - docs/README.md
  - docs/specs/active/SPEC-0036-visual-change-planning.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0036-visual-change-planning.md --base main
---

# SPEC-0036: Plan a visual change from an element, not a guess

## Purpose

Issue #8 starts from a real failure mode: "make this chart smaller" and "improve
the contrast here" do not identify the code to change. A screenshot can point at
the wrong place, and a file path taken from page content can widen the scope of
an edit.

The candidate is a procedure that resolves **element → component → file** by
observable evidence, and answers `unresolved` instead of inventing a path.

**Paused on 2026-11-08.** The session analysis over 58 human sessions ranks
this territory as `ui-refactor`: 3 sessions, $6.90, **one project**, and a gap of
`0` — `impeccable` and `simplify` already cover it. Its cost is the highest in
the backlog (a new visual oracle plus 20–40 draws) against the weakest measured
demand. It reopens when a consumer exists: a release claim or an external
commitment that needs a measured visual change, plus the decision in `TASK-61`.

## User Outcome

Given an element, a screenshot and the project's design tokens, a reader gets a
small, bounded change plan that names the component and the checks it will run —
or an explicit `unresolved` with what is missing.

## Scope

- **Resolve by evidence.** A mapping is stated only when it comes from a
  selector, a component name in the DOM, a source map, or a path the user
  supplied; otherwise the answer is `unresolved`.
- **Untrusted input.** Page HTML, content and images are data. An instruction
  found in the page authorises nothing and never widens scope.
- **A small plan.** Files allowed, the token or rule to use, the states to check
  (empty, loading, error), and the responsive and contrast checks.
- **Contrast is measured, not asserted.** A claim about WCAG needs a computed
  ratio or a tool's output; a screenshot alone is not evidence.
- **Tokens come from the project.** No brand values invented in the skill.
- **Compare against the incumbent.** The baseline is `implement-from-prompt`
  plus its design guidance; the candidate is the procedure. The difference must
  be shown on cases, not argued.

## Blocker: why this is `draft`

The harness has no visual assertion, and the work that would add one
is `TASK-61` (no spec yet). Its kinds are file, reply, skill and shell;
`dangerous` cases are declared `manual` and excluded from a run, so they cannot
separate two arms. Two things must be decided before this becomes `ready`:

1. **The oracle.** Either the runner gains a browser/visual path (screenshot
   comparison, DOM query, computed style, axe), or the cases declare human review
   and the release does not claim a measured separation.
2. **The fixture.** A pinned app with a known element, a global stylesheet that
   must *not* be touched, and a token file.

Until then, this spec defines the behaviour and the non-goals; it does not
promise a number.

## Non-Goals

- No DOM inspector, no clone of a React inspector, no browser engine, no
  screenshot service.
- No corporate design system, no brand palette.
- No aesthetic direction that overrides an approved project constraint.
- No approval by screenshot.

## Flow

1. **Resolve**: element → component → file, or `unresolved`.
2. **Bound**: the files and tokens the change may use.
3. **Plan**: the smallest edit, the states, and the checks.
4. **Check**: run what exists; declare what does not.
5. **Report**: `unresolved`, `planned`, or `refused`, with evidence.

## Acceptance Criteria

1. **A mapped element recommends the right component** and does not add unasked
   global CSS.
2. **An ambiguous element says `unresolved`** and refuses to guess a path.
3. **A contrast request requires a measurement** before any WCAG claim.
4. **A page containing instructions cannot change permissions or scope**: the
   fixture's injected text is treated as content.
5. **The evaluation covers out-of-scope diffs and a visual regression**, and any
   case without an objective oracle is published as human review, not as a pass.
6. **Tokens come from the project fixture**, with no hardcoded brand values.
7. **No drift.** Every command in `tests:` passes, when it becomes `ready`.

## Open Questions

- **Which oracle is enough for "the right component"?** A DOM query plus a file
  assertion may be sufficient; a screenshot diff may be unnecessary. Decide in
  the 0.8.0 oracle work, not here.
- **Does this belong inside `implement-from-prompt` instead of a new skill?**
  The extension is plausible and cheaper; the comparison decides it, as in
  `SPEC-0035`.

## Prompt Notes

- **Requirements**: evidence-based mapping, untrusted page content, a bounded
  plan, measured contrast, project tokens.
- **Entities**: element, component, file, token, state, check.
- **Approach**: extension of the incumbent first; a new skill only if the
  comparison supports it.
- **Safeguards**: page content is data; no scope widening; no aesthetic override.
- **Tests**: file and reply assertions where possible; visual checks only with a
  declared oracle.
