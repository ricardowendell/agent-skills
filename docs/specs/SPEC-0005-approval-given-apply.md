---
id: SPEC-0005
title: Apply the ratchet when the prompt grants approval
status: implemented
priority: P2
created_at: 2026-11-02
updated_at: 2026-11-02
source_docs:
  - backlog/tasks/task-6 - bootstrap-project-harness-medir-o-caminho-harness-completo-parar.md
  - skills/tighten-harness/SKILL.md
  - skills/tighten-harness/references/evals.md
  - README.md
related_decisions: []
depends_on: []
blocks: []
tests: []
---

# SPEC-0005: Apply the ratchet when the prompt grants approval

## Purpose

`tighten-harness` proposes before applying, and an absent approval is not
approval. The only measured case stops after the proposal, so half of the
contract has never been observed: what the skill does when the user does say yes.
The runner is non-interactive, so the case has to carry the answer itself.

TASK-6's AC #2 asked for "a staged reply to the approval step". The step belongs
to `tighten-harness`, not to `bootstrap-project-harness`: the bootstrap's only
interactive step is the product interview, which is interactive by definition.
The cheapest staged reply is the prompt: the user grants approval in the same
message that asks for the ratchet.

## User Outcome

A reader of the `tighten-harness` coverage sees both halves of the approval
contract: a run with no answer changes nothing, and a run with an explicit yes
applies the ratchet and leaves the source alone.

## Scope

- One new case, `tighten-harness` #6, with its own fixture.
- The approval is stated in the prompt; nothing else changes in the case format.
- Run the case three times; the rate decides `manual` or runnable. If all three
  runs stop despite the approval, clarify the approval rule in `SKILL.md`
  (Flow step 5), then re-measure.

**Blast radius.** One eval corpus (`tighten-harness`), one fixture directory and
one case block. If the measurement shows a refusal, one sentence in
`SKILL.md` step 6 — and only then. No description, no runner, no case format, no
matrix.

## Non-Goals

- **A second turn.** No `- reply:` line and no `opencode run --continue`. The
  approval is in the prompt, so the runner stays a single turn.
- **A generic approval mechanism.** This case is the measurement; a runner
  feature would be a separate spec if a skill ever needs a real dialogue.
- **The bootstrap interview.** Product steps ask the user questions and stay
  interactive; this spec does not try to stage answers for them.
- **Re-measuring case 1.** It stays the "no answer, stop" half.
- **Changing the skill text before measuring.** The only permitted edit is the
  step-6 clarification described below, and only after a run refuses an explicit
  approval. Guessing the wording first would let the case measure the new text
  instead of the old behaviour.
- **A machine check that the value got stricter.** `changed` proves an edit, not
  a ratchet; the value is read in `expect:` and in review.

## Flow

1. The fixture is a small TypeScript project with a 400-line ceiling, a source
   file near 175 lines and a dependency-free `just check`, so the gate runs
   without an install.
2. The prompt asks for the ratchet and grants approval in the same message.
3. The skill measures, picks one tightening, applies it, runs the gates and
   reports the old and new value.
4. The assertions hold it to the outcome: the config changed, the source, the
   task runner, the manifest and `AGENTS.md` did not.
5. If all three runs stop despite the approval, the fix is one sentence in
   `SKILL.md` step 6: an explicit yes in the user's message is approval, even in
   a non-interactive run; a run with no such message is not, and stops after the
   proposal. The case is re-measured after the edit.

## Data

No persistence. The fixture lives in
`skills/tighten-harness/references/evals/6/`.

## UI Notes

Not applicable.

## Acceptance Criteria

- AC-1 — `tighten-harness` #6 exists with a fixture and outcome assertions:
  `changed eslint.config.js`, `unchanged src/big.js`, `unchanged src/small.js`,
  `unchanged justfile`, `unchanged package.json`, `unchanged AGENTS.md`.
  Verified by reading the case block and listing the fixture directory.
- AC-2 — The case runs three times. A run that applies the ratchet passes; a run
  that stops after the proposal fails `changed eslint.config.js` and names it.
  The approval is the prompt, so a pass cannot come from a missing skill load:
  the case gates on `tighten-harness`. **Result: 3/3 applied**, each after
  measuring the headroom, each halving `max-lines` (400 → 200), each leaving
  `src/` and the rest of the harness untouched.
- AC-3 — At 3/3 the case is runnable. If it stops in all three runs, the
  step-6 clarification in `SKILL.md` is written and the case is re-measured. If
  it is still below 3/3, it keeps `status: manual`, and its `why:` carries the
  rate and the assertion that failed. A conservative stop is recorded, not
  hidden. **Result: 3/3, so the case is runnable and no skill text changed.**
  The clarification stays unwritten because no run refused an explicit approval.
- AC-4 — `node scripts/run-evals.mjs --root skills --list --check` passes, and
  the runnable/manual totals it prints match the case's `status:`. **Result:**
  64 cases, 59 runnable, 5 manual.
- AC-5 — The paragraph in `skills/tighten-harness/references/evals.md` that says
  the apply path "stays manual until the runner can stage a reply" is replaced by
  the measured result and points at #6; the preamble's list of fixture cases
  includes #6. **Result: replaced, and the list now reads "1, 2, 5 and 6".**

## Open Questions

**Blocking — none.** Two judgements are recorded rather than asked. First, a
prompt that says "I approve" is treated as approval even though the run is
non-interactive, because it is the user speaking, not auto-approval; if the
measurement disagrees in all three runs, the step-6 sentence is the fix and the
case is re-measured. Second, `changed` proves the config moved, not that the new
value is stricter: the value and the churn are read in `expect:` and in review,
because a regex that excludes `400` would also miss a legitimate `350`.

## Prompt Notes

- Requirements: one case, one fixture, approval in the prompt, outcome
  assertions, measured status, and a conditional one-sentence skill fix.
- Entities: ratchet (one tightening of an existing sensor), approval (the user's
  yes, here in the prompt), outcome assertion (`changed`, `unchanged`).
- Approach: start from case 1's fixture. Change only the `justfile`'s `lint`
  recipe to `node --check src/*.js` so the gate needs no install — the case is
  about applying, not about resolving dependencies. Measure first; touch the
  skill text only if the runs refuse.
- Structure: `skills/tighten-harness/references/evals/6/` with `AGENTS.md`,
  `eslint.config.js`, `justfile`, `package.json`, `src/big.js`, `src/small.js`;
  the case block in `skills/tighten-harness/references/evals.md`; step 6 of
  `skills/tighten-harness/SKILL.md` if the measurement requires it.
- Operations: build the fixture, write case #6, run it three times, apply the
  conditional skill clarification and re-measure if it refuses, set `status:` and
  `why:` from the final rate, fix the stale paragraphs in the evals preamble.
- Norms: fixtures stay small and self-contained; `why:` may carry a rate;
  `expect:` stays a behaviour; conventional commits.
- Safeguards: do not assert `unchanged` on `eslint.config.js`; do not loosen case
  1; do not add a runner flag; do not change the skill text before the
  measurement, and change nothing else in it afterwards.
- Tests: case #6 at `--repeat 3`, plus the runner's unit suite.

## Notes

This repo has no `docs/product`, `docs/principles` or ADR tree, so the
design-principles and product-scope checks in the grooming workflow had nothing
to read. The gap is recorded rather than filled.
