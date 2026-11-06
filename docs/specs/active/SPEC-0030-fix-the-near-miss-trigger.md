---
id: SPEC-0030
title: Fix the near-miss trigger and the stage/assert check
status: ready
priority: P2
task: TASK-45
created_at: 2026-11-06
updated_at: 2026-11-06
source_docs:
  - docs/evals/write-implementation-prompt-matrix.md
  - docs/evals/coverage.md
related_decisions: []
depends_on:
  - SPEC-0028-detector-host-corpus
  - SPEC-0029-measure-cross-skill-routing
blocks: []
files:
  - skills/write-implementation-prompt/SKILL.md
  - scripts/validate-skills.mjs
  - skills/write-implementation-prompt/references/evals.md
  - docs/evals/write-implementation-prompt-matrix.md
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0030-fix-the-near-miss-trigger.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
---

# SPEC-0030: Fix the near-miss trigger and the stage/assert check

## Purpose

Two findings from the 0.5.0 measurement, both about the same skill.

**The near-miss is not a near-miss.** `write-implementation-prompt` #6 is
"Summarise SPEC-0012 into three bullets for the standup" and asserts
`notskill write-implementation-prompt`. Measured: the skill is the **first
action** in 2 to 4 of 5 draws, across four runs (5/5, 3/5, 4/5, 3/5). The prompt
looks like a summary; the description says "convert a spec into a prompt", and
the model reads them as the same job.

**`#5` stalls.** The trigger that should load the skill stalled in three of five
runs, each stall costing up to 120 s of silence before the watchdog fires.

And one harness finding, which is deterministic: a case could assert on a skill
that is not even staged — that is exactly how `capture-idea` #3 and
`process-inbox` #3 became 0/N (SPEC-0029). `validate-skills` should refuse that
at authoring time.

## User Outcome

The "summarise this spec" prompt stops loading the skill, and the validator
refuses a case whose assertion names a skill the run will not stage.

## Scope

- **Fix the source, not the case.** Read the transcripts of the draws that
  loaded on #6 and name the cue. Narrow the description so a summary request
  does not match, and add an explicit boundary line in `SKILL.md`: the skill
  produces an executable prompt; a summary or an explanation is not its job.
  The case text stays as published — it is a valid near-miss.
- **Re-measure what the edit invalidates.** Changing `SKILL.md` changes
  `skillHash`, so the four with-skill cells (#1–#4) are re-run, five draws each,
  and #5/#6 five draws each. The controls do not stage the skill and keep their
  `fixtureHash`/`promptHash`/`detectorVersion`, so they stay citable; the matrix
  says which arm moved and why.
- **Name the stall.** Read the `#5` transcripts; if it is provider silence, say
  so with the event gap and add a note to the matrix about retry behaviour. The
  AC is five loads in a stall-free run, not "no stall ever".
- **A validator check for stage/assert consistency.** Every `assert: skill <id>`
  and `notskill <id>` must name the skill under review or an id declared with
  `stage:` (SPEC-0029). A `stage:` that no assertion uses is also a warning.
  This would have caught both cross-skill cases at authoring time.

**Blast radius.** One skill description and one boundary line, one validator
rule, one matrix and one inventory row. No fixture, no assertion, no runner
change. **Budget: ~30 draws** (four with-skill cells + two triggers).

## Non-Goals

- **No "trigger overlap" lint.** The approved scope named it, but a deterministic
  overlap check either fires on legitimate pairs (`record-decision` #5 watches
  the artefact on purpose) or catches nothing. The check that pays is
  stage/assert consistency, which is the same defect class seen from the
  authoring side. This deviation is recorded in Results.
- No change to the `#6` prompt or its assertion; a case is not rewritten to make
  the skill look better.
- No retry-policy change in the runner. If the stall is provider-side, that is a
  note, not a code change here.
- No judge.

## Flow

1. **F0 — evidence**: read the four runs' #6 transcripts and the #5 stall gaps.
2. **F1 — description**: narrow it; add the boundary line.
3. **F2 — validator**: the stage/assert rule plus its test.
4. **F3 — re-measure**: #1–#4 with skill, #5/#6 triggers, five draws each.
5. **F4 — publish**: matrix rows, inventory, Results.

## Data

- `skills/write-implementation-prompt/SKILL.md` — description and boundary.
- `~/.local/share/opencode/evals/runs/2026-11-06T1[4-6]*--write-implementation-prompt*/`
  — the #6 loads and #5 stalls.
- `scripts/validate-skills.mjs` — the new rule.
- `docs/evals/write-implementation-prompt-matrix.md` — the re-measured cells.

## Acceptance Criteria

1. **The near-miss holds.** `#6` does not load the skill in 5/5 draws of one run
   with `findings=0 warnings=0`, or the spec stops and reports that the
   description cannot separate without breaking a real trigger.
2. **The real trigger still loads.** `#5` loads in 5/5 draws of a stall-free
   run; any stall is named with its event gap and retry.
3. **The behavioural cells are re-measured** at the new `skillHash`: #1–#4 with
   the skill, five draws each, run directories cited, and the matrix states that
   the controls are unchanged and why they remain citable.
4. **The validator refuses an undeclared assertion.** A case asserting `skill X`
   without `stage: X` (or X being the case's own skill) fails `--check`; a
   declared stage with no assertion warns.
5. **The deviation is recorded.** Results says the trigger-overlap lint was
   dropped, with the reason and the replacement.
6. **No drift.** No assertion or fixture changed, five gates pass, and the matrix
   numbers reproduce from their run directories.

## Results

_Filled during implementation._

## Open Questions

- **What cue makes a summary look like a prompt?** If the transcripts show the
  model reading the *fixture* (a ready spec) rather than the description, the fix
  is the boundary line, not a shorter description. The spec does not prescribe
  the wording.
- **Is `#5` stalling because of the skill or the provider?** The matrix must say
  which, from the event gaps.

## Prompt Notes

- **Requirements**: the near-miss stops matching, the real trigger still
  matches, the validator catches the authoring defect.
- **Entities**: description, boundary line, `skillHash`, stage, assertion.
- **Approach**: evidence first (four transcripts), then the smallest wording
  change that separates, then the validator rule, then the draws.
- **Structure**: `SKILL.md` for the behaviour; `validate-skills.mjs` for the
  structural rule.
- **Norms**: no case rewrite to make a skill look good; the matrix explains
  which arm moved.
- **Safeguards**: do not drop the near-miss; do not weaken `notskill`; do not
  claim the stall is fixed if it recurs.
- **Tests**: one validator fixture per rule branch; the draws are evidence, not
  a gate.
