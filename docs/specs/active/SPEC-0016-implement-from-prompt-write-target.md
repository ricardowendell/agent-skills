---
id: SPEC-0016
title: Teach implement-from-prompt to tell a write target from a read dependency
status: implemented
priority: P1
task: TASK-26
created_at: 2026-11-05
updated_at: 2026-11-05
source_docs:
  - backlog/tasks/task-26 - implement-from-prompt-add-é-lido-como-extend-e-bloqueia-o-caso-4.md
  - docs/evals/implement-from-prompt-matrix.md
  - skills/implement-from-prompt/references/evals.md
related_decisions: []
depends_on: []
blocks: []
files:
  - skills/implement-from-prompt/SKILL.md
  - skills/implement-from-prompt/references/evals/4/package.json
  - skills/implement-from-prompt/references/evals.md
  - docs/evals/implement-from-prompt-matrix.md
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0016-implement-from-prompt-write-target.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
---

# SPEC-0016: Tell a write target from a read dependency

## Purpose

The `implement-from-prompt` matrix (SPEC-0015) measured case #4 at 1/5 with the
skill and 1/5 without, and the transcript names the reason: the prompt says
"In `src/echo.js`, add and export `echo`", the file does not exist, and the skill
reads that as a blocking gap. The model's own words, from
`2026-11-05T11-45-57--implement-from-prompt`, case 4, `transcript.r1.md`:

> "`src/echo.js` do not exist. This wording assumes an existing module to extend."

Step 3 of the skill says to check that "every module, file and helper the prompt
tells you to extend, reuse or build on already exists". It never separates a path
the prompt tells you to **write** from a path it tells you to **depend on**, so
the model collapses both into "must already exist" and stops on a case whose
whole point is that verification cannot run locally.

The fixture compounds the defect: it has no `package.json`, so the same
transcript also reports that it cannot tell ESM from CJS. That is a second,
unrelated reason to stop, and it is not what the case is measuring.

## User Outcome

A bare agent reading the skill creates a file the prompt names as a write target
and reports the missing verification gate, instead of refusing to start. The same
agent still stops when the prompt says "the existing `src/format.js`" and that
file is absent, so the gap rule keeps protecting against invented dependencies.

## Scope

- `skills/implement-from-prompt/SKILL.md` step 3: replace the single
  "already exists" rule with a two-way rule.
  - **Write target** — a path the prompt names as the place to add code, without
    claiming it exists ("in `src/x.js`, add and export `f`"). The implementer
    creates it.
  - **Read dependency** — a path named as existing or to extend, reuse, build on,
    or wire into ("the existing `src/x.js`", "extend `f`", "reuse `g`"). Absence
    stays a blocking gap: stop and report.
  - Keep the existing prohibition: do not create a missing dependency and call it
    the implementation.
- `skills/implement-from-prompt/references/evals/4/package.json`: new file,
  `"type": "module"`, a `test` script. This removes the ESM/CJS ambiguity without
  touching the assertion that the prompt's `just check` cannot run.
- `skills/implement-from-prompt/references/evals.md`: the #4 `why:` records the
  removed confound and the rule the case now covers.
- `docs/evals/implement-from-prompt-matrix.md` and `docs/evals/coverage.md`: the
  re-measurement of #4 with its run directories; the pre-fix #4 runs are labelled
  pre-fix, not deleted.

**Blast radius.** One skill's step 3, one fixture file, one eval `why:`, two
evidence documents. The case it can regress is #8 ("the existing `src/format.js`,
extend `formatAmount`", currently 12/12 vs 0/12), re-measured below at 5/5. #2
also depends on the refusal path, but it stays out of this measurement because
its skill-load defect (gate 2/5) predates this change and is tracked in TASK-30.

## Non-Goals

- No change to the runner, the assertion vocabulary, the judge, or the isolation.
  TASK-27, TASK-28, TASK-29 and TASK-30 keep those defects.
- No change to case #3 (still `manual`) or to #8's prompt, which is the correct
  side of the distinction.
- No behavioural run in `verify`. The measurement is local evidence; `verify`
  runs `lint` and `selftest` only.
- No promise that #4 separates from the control. The control's pre-fix rate is
  1/5, so the case may remain a regression case; the spec measures and reports,
  it does not force.

## Flow

1. **F0 — the rule.** Rewrite step 3 in `SKILL.md` with the write-target /
   read-dependency split. Keep the paragraph's density and the existing sentence
   against inventing dependencies; do not add a new section.
2. **F1 — the fixture.** Add `references/evals/4/package.json`. Update the #4
   `why:` in `references/evals.md` to name the removed confound.
3. **F2 — sanity draw.** One draw of #4 with the skill
   (`--case 4 --repeat 1 --run`). If it still stops, read the transcript before
   spending the matrix; a second failure after one text iteration escalates as a
   blocking finding, and the assertion is never tuned.
4. **F3 — measurement, case #4.** `--case 4 --repeat 5 --run` and
   `--case 4 --repeat 5 --no-skill --run`, default model, no judge.
5. **F4 — regression.** `--case 1 --repeat 5 --run`, `--case 7 --repeat 5 --run`,
   `--case 8 --repeat 5 --run`. Baselines from SPEC-0015: 12/12, 5/5, 12/12.
6. **F5 — publish.** Add the #4 re-measurement and the regression lines to the
   matrix document; update the coverage row and the "defective cases" note.

## Data

- `~/.local/share/opencode/evals/runs/<id>/cases/implement-from-prompt--<n>/result.json`
  — pass rate, gate result, failing assertion per draw.
- `…/transcript.r<i>.md` — read on every red cell, to name the cause.
- `docs/evals/implement-from-prompt-matrix.md` — the published evidence.
- `docs/evals/coverage.md` — the inventory row.

## Acceptance Criteria

- **AC-1** — The skill's step 3 distinguishes a write target from a read
  dependency, and keeps the prohibition on inventing a missing dependency.
  Verified by reading `SKILL.md`.
- **AC-2** — Case #4 passes **5/5** with the skill in a fresh run directory; the
  control is re-measured at n=5 and reported, and stays **≤2/5** (pre-fix
  baseline 1/5). If the control rises above 2/5, the case is published as a
  non-discriminator — the assertion is not changed to restore separation.
- **AC-3** — #1, #7 and #8 keep their with-skill baselines at n=5 (12/12 → 5/5,
  5/5, 12/12 → 5/5). A red draw is read for its cause and blocks the merge if it
  is caused by this change.
- **AC-4** — No existing assertion is edited and no skill other than
  `implement-from-prompt` changes. Verified by `git diff` over
  `skills/*/references/evals.md` and `skills/*/SKILL.md`.
- **AC-5** — The run directories for #4 and the three regression cases are cited
  in the matrix document and the coverage row, and the pre-fix #4 runs are
  labelled as such.

## Stop Conditions

- #4 with skill below 5/5: read the transcript, iterate the step-3 text once,
  then escalate. Never relax an assertion.
- Control above 2/5: publish the measured split as a non-discriminator; do not
  change the fixture to make the control fail.
- Any regression in #1/#8: the change is rejected, not averaged.
- The skill edit grows step 3 into a second paragraph or a list: stop; other
  skills' text density is the house style.

## Budget

Sanity 1 run, #4 both arms 10 runs, regression 15 runs. 26 model runs, no judge.
Two text iterations maximum.

## Open Questions

- **Where the module-system signal belongs.** `package.json` is the realistic
  answer and the one this spec takes. If the fixture is later reused for a
  different point, that file is the place the format lives.
- **Literal word list.** "extend", "reuse", "the existing", "built on", "wire
  into" are the shapes seen so far. If a later prompt uses another verb, the rule
  still holds by intent; the eval corpus is the place to add the shape.
