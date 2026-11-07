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
  - scripts/lib/evals/parse.mjs
  - scripts/lib/evals/parse.test.mjs
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
  `skillHash`, so the runnable with-skill cells (#1, #2, #4) are re-run, five
  draws each, and #5/#6 five draws each. The controls do not stage the skill;
  the matrix says which are replay-clean and which SPEC-0031 re-measured.
- **Name the stall.** Read the `#5` transcripts; if it is provider silence, say
  so with the event gap and add a note to the matrix about retry behaviour. The
  AC is five loads; the stall-free run is `TASK-50`.
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
4. **F3 — re-measure**: #1, #2 and #4 with skill, #5/#6 triggers, five draws
   each.
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
2. **The real trigger still loads.** `#5` loads in 5/5 draws. The stall that
   follows the load is provider-side, named with its event gap and retry, and a
   stall-free run is a documented follow-up (`TASK-50`), not a condition of this
   spec. A stall *before* the load would still block.
3. **The runnable behavioural cells are re-measured** at the new `skillHash`:
   #1, #2 and #4 with the skill, five draws each, run directories cited. #3 is
   `manual` and stays that way (a 4/5 historical split), cited as history; the
   matrix states which controls are replay-clean and which SPEC-0031
   re-measured.
4. **The validator refuses an undeclared assertion.** A case asserting `skill X`
   without `stage: X` (or X being the case's own skill) fails `--check`; a
   declared stage with no assertion warns.
5. **The deviation is recorded.** Results says the trigger-overlap lint was
   dropped, with the reason and the replacement.
6. **No drift.** No assertion or fixture changed, five gates pass, and the matrix
   numbers reproduce from their run directories.

## Results

### F0 — the cue is the description, not the fixture

The failing `#6` draws in `14-07-04`, `15-49-43` and `16-02-56` all call the
`skill` tool as their **first action**, before any `glob`/`grep`/`read`:

- `2026-11-06T14-07-04` `r1`: "I'll load the skill first, then find the spec."
  Then `skill write-implementation-prompt`, then `glob **/*0012*` (no files).
- `2026-11-06T14-07-04` `r2`: "I'll load the implementation-prompt skill since
  this looks like a spec-related request." Then `skill`.
- `2026-11-06T15-49-43` `r1`/`r2`: the `skill` call precedes the `glob`; `r2`
  says "I'll load the skill that handles spec-to-prompt work, then find the
  spec."
- `2026-11-06T16-02-56` `r2`: "I'll load the implementation-prompt skill since
  it owns spec handling, then find SPEC-0012." Then `skill`.

The trigger fixture is an **empty scratch** (`fixtureHash e3b0c442…`): it
contains no `SPEC-0012`, and the failing draws discover that *after* loading the
skill. The cue is therefore the advertised description matching "spec handling",
not the fixture. The passing draws in the same runs search first and never load.
That is why the fix is the description plus an explicit boundary, not a case
rewrite.

### F1 — the edit

`skills/write-implementation-prompt/SKILL.md` now advertises:

> Create or update an implementation prompt file that a coding agent can execute
> from a ready feature spec. Use when the user asks to write, generate, or update
> that executable prompt, or to make a ready spec implementable. Does not
> summarise, explain, or review a spec. Stops if the spec is not `ready`.

and its Purpose carries the boundary line: the skill produces an **executable
prompt file**; summarising, explaining, or reviewing a spec is not this work.
The case `#6` prompt and its `notskill` assertion are byte-identical to the
published case. The new staged `skillHash` is
`046369c29a8383dbca48e0437201a229c5686375db6c01cbff8a9a0bf26af8e0` (old
`ab314e2ceb8f793f…`).

### F3 — re-measure at `dcf5177` (detector v2)

All cited dirs are under `~/.local/share/opencode/evals/runs/` and print
`isolated=yes` unless a finding is named.

| cell | run directory | result | checker |
| --- | --- | --- | --- |
| #1 with skill | `2026-11-06T19-25-26--write-implementation-prompt` | 5/5 | `findings=0 warnings=0 isolated=yes` |
| #2 with skill | `2026-11-06T19-28-47--write-implementation-prompt` | 5/5 | `findings=0 warnings=0 isolated=yes` |
| #3 | — | 0 draws (`status: manual`) | history `14-01-54` split 4/5 |
| #4 with skill | `2026-11-06T19-30-26--write-implementation-prompt` | 5/5 | `findings=0 warnings=0 isolated=yes` |
| #5 trigger | `2026-11-06T19-32-45--write-implementation-prompt` | 5/5 loaded; 1/1 clean scored, 2 contaminated, 2 stalled | `findings=6 isolated=no` |
| #5 trigger | `2026-11-06T19-53-34--write-implementation-prompt` | 5/5 loaded; 2/2 clean scored, 1 contaminated, 2 stalled | `findings=3 isolated=no` |
| #6 near-miss | `2026-11-06T20-12-15--write-implementation-prompt` | **5/5 not loaded** | `findings=0 warnings=0 isolated=yes` |
| #6 near-miss | `2026-11-06T19-32-45--write-implementation-prompt` | 5/5 not loaded | run has #5 findings |
| #6 near-miss | `2026-11-06T19-53-34--write-implementation-prompt` | 4/5 (`r3` loaded) | run has #5 findings |

The #6 split is 5/5, 5/5, 4/5 of five. The clean cell `20-12-15` meets AC-1
(five draws, `findings=0 warnings=0`, `isolated=yes`). It is not deterministic:
`19-53-34 r3` still says "I'll start by loading the skill that governs this kind
of request", calls `skill`, and only then reads the boundary and declines. The
near-miss is materially improved but not proven stable at five draws.

**#5 is not fixed.** It loaded in all ten draws across the two trigger runs, but
no stall-free five-draw cell exists. The stalls are provider silence after the
load, named by the last event before the watchdog's 120 s gap:

- `19-32-45 r1`: last event at 161.6 s, then 120 s of silence; retried once.
- `19-32-45 r4`: last event at 27.2 s; retried once.
- `19-32-45 r2`: first attempt stalled (attempts 2, retries 1), retry passed.
- `19-53-34 r3`: last event at 355.0 s; retried once.
- `19-53-34 r5`: last event at 145.0 s; retried once.

The contamination is separate: `19-32-45 r3`/`r5` read the installed skill and
host corpus; `19-53-34 r4` read a stale copy under
`/private/var/folders/.../opencode/agent-skills-pr`. These are excluded, not
scored. The best clean subsets are 1/1 and 2/2. AC-2 was amended at the human
gate: the load is 10/10, the stall is provider-side and follows it, and a
stall-free run is `TASK-50`, not a condition of this spec.

### Controls — superseded by detector v2

The controls were **not re-run**. They stage no skill, so the description edit
cannot move `fixtureHash`/`promptHash`; the old control artefacts remain
readable. But the sentence in the spec that "the controls stay citable" is
superseded by the v2 replay:

- `#1` is **unresolved**: four attempts, no five-draw clean run (clean subsets
  0/3, 0/4, 0/3, 0/4; every clean draw failed `spec_sha:`).
- `#2` is **0/4 replay-clean** (`15-30-39 r1` is `dirty(host)`); SPEC-0031
  re-measured it at v2 as **0/4 clean, unresolved**.
- `#3` is manual; its control is a leak-verified 0/4 clean history.
- `#4` is **4/5 draws clean (4/4 passed)** (`14-37-23 r5` is `dirty(host)`);
  SPEC-0031 re-measured it at v2 as **2/2 clean passed, non-discriminator**.

The matrix states the same status in its control rows and says why.

### F2 — the validator rule

`assert: skill <id>` and `assert: notskill <id>` are now rejected when `<id>` is
neither the skill under review nor a `stage:` declared by the same case. A
`stage:` that no `skill`/`notskill` assertion uses is a warning. The rule lives
in `scripts/lib/evals/parse.mjs` and is reached by both authoring-time paths:

- `run-evals --check` calls `readEvals`, which derives the skill id from
  `<skill>/references/evals.md`;
- `validate-skills --root skills` imports the same parser and runs it for each
  skill's `references/evals.md`.

This is a deliberate divergence from the spec's `files:` line naming only
`scripts/validate-skills.mjs`: `--check` is defined by `run-evals`, and a rule
that lives only in `validate-skills` would not satisfy AC-4. No new test file
was created; the cases were added to the existing `scripts/lib/evals/parse.test.mjs`
(inside the selftest glob).

Temporary-fixture proof (siblings `other-skill` and `unused-skill` exist so the
`stage:` ids resolve; case 1 is the undeclared assertion, case 2 is valid, case
3 is the unused stage):

```text
### run-evals --check (fixture root)
warn: demo: case 3: stage 'unused-skill' has no skill/notskill assertion
error: demo: case 1: assert 'skill other-skill' names a skill the run will not stage (assert 'demo' or add "- stage: other-skill")

1 validation error(s); refusing to run.
exit=1

### validate-skills (fixture root)
Scanned 3 SKILL.md across 1 roots.

ERRORS (1):
  - .../demo/references/evals.md: case 1: assert 'skill other-skill' names a skill the run will not stage (assert 'demo' or add "- stage: other-skill")

WARNINGS (1):
  - .../demo/references/evals.md: case 3: stage 'unused-skill' has no skill/notskill assertion
exit=1
```

### Deviations, budget and gates

- **Trigger-overlap lint dropped** (the spec's Non-Goal). A deterministic
  overlap check either fires on legitimate pairs (`record-decision` #5 watches
  the artefact on purpose) or catches nothing; the stage/assert rule is the
  same defect class from the authoring side and is the replacement. This is the
  deviation AC-5 asks to record.
- **Budget:** 40 draws (5 #1 + 5 #2 + 0 #3 + 5 #4 + 10 trigger + 10 trigger
  repeat + 5 #6-only). The spec budget was ~30; the extra 10 are the mandatory
  repeat after the first trigger run was dirty(host) and the #6-only run that
  produced the `findings=0` AC-1 cell. No further draws were spent after two
  consecutive dirty trigger runs; #5 is reported, not chased.
- **No drift:** no assertion or fixture changed. The case #6 prompt and
  `notskill` line are unchanged.
- **Gates:** `lint`, `selftest` (`--list --check`, harness tests, bootstrap
  tests, sensor parity) all pass; see the report.
- **Left out:** a stall-free `#5` run (`TASK-50`, after AC-2 was amended); `#3` is
  manual and was not re-measured. SPEC-0031 re-measured the #2/#4 controls at
  v2: #2 is 0/4 clean (unresolved) and #4 is 2/2 clean passed
  (non-discriminator). The #6 result is 5/5 clean in one run but 4/5 in another,
  so the near-miss is improved, not proven deterministic.

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
