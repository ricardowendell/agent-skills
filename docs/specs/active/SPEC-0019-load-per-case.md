---
id: SPEC-0019
title: Measure the load rate per case and remove the unreadable cell
status: implemented
priority: P1
task: TASK-30
created_at: 2026-11-06
updated_at: 2026-11-06
source_docs:
  - backlog/tasks/task-30 - evals-re-diagnosticar-a-carga-do-implement-from-prompt-por-caso.md
  - docs/evals/implement-from-prompt-matrix.md
  - docs/evals/coverage.md
related_decisions: []
depends_on:
  - docs/specs/active/SPEC-0020-runner-efficiency.md
blocks: []
files:
  - docs/evals/implement-from-prompt-matrix.md
  - docs/evals/coverage.md
  - skills/implement-from-prompt/SKILL.md
  - docs/specs/active/SPEC-0019-load-per-case.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
---

# SPEC-0019: Measure the load rate per case and remove the unreadable cell

## Purpose

A `with-skill` cell only means something when the skill actually loaded. The
matrix already says so in prose and excludes the bad draws, but it has only ever
measured the load on one case: `#1` passed a 12-draw canary, while `#2` lost the
gate in **3 of 5** runs and `#8` in 1 of 5. `#2`'s with-skill cell is therefore
unreadable, and the matrix cannot say whether that is a prompt problem, a
description problem, or variance.

The misses all load **nothing** — `skillGate.loaded` is `[]`, not another skill —
so this is not "the model picked a different skill". `skillGate.loaded` cannot
tell whether it read the staged `SKILL.md` directly, which is why that is now one
of the shapes F1 diagnoses. That is the behaviour to explain.

## User Outcome

Every `with-skill` cell in the matrix comes with a load rate and, when the rate is
bad, a reason. A reader can tell a case that measures the skill from a case that
measures whether the model felt like loading it.

## Scope

- **Measure, n=12, default model, no judge**, for the four cases that matter:

  ```sh
  node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 1 --repeat 12 --run
  node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 2 --repeat 12 --run
  node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 5 --repeat 12 --run
  node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 8 --repeat 12 --run
  ```

  `#1` is the canary that previously held 12/12; `#2` is the unreadable cell;
  `#5` is the trigger, where the gate is off and the `assert: skill` is the
  signal; `#8` lost one draw in five. `#7` had no miss in 5/5 and is not
  re-measured.
- **Diagnose every miss from the transcript**, recording which of these shapes it
  is:
  - the agent never called the `skill` tool and answered from its own knowledge;
  - it called the tool and it failed or was denied;
  - it loaded a different skill;
  - it read the staged `SKILL.md` directly, so the skill informed the answer
    without the tool call the assertion checks.
- **At most one change** if the cause is a cue the skill controls — most likely
  the `description` frontmatter, the only text the model sees before loading.
  Measure it before/after at n=12 on the affected case, same model, same prompt.
- **Resolve `#2`.** Either its load rate is good enough to keep as a `with-skill`
  cell, or it is published as a case whose with-skill cell is not readable, with
  the observed rate. Both are acceptable outcomes; an unreadable cell kept quiet
  is not.

**Blast radius.** The matrix and coverage rows gain a load column; one skill
description line may change, which affects selection for every case of that skill.
That is why the before/after is required on the same cases, not just the one that
prompted the change.

## Non-Goals

- No change to any `assert:` line, to the gate, or to the fixtures.
- No judge. Load is a deterministic fact and the judge spends money.
- No new case. `#2` is either readable or labelled; it is not replaced here.
- No change to how `--no-skill` works; the control arm has no load question.
- No fix for the model's selection beyond one description edit. If the edit does
  not move the rate, the finding is that the rate is variance on this model.

## Flow

1. **F0 — measure.** The four runs above. For each: `passed/12`, `skillGate.ok`
  count, and the `loaded` list of every miss.
2. **F1 — diagnose.** Group the misses by the shapes above, citing the
  transcript of at least one miss per case. `#5` is special: the gate is off, so
  read the `assert: skill` result rather than `skillGate`.
3. **F2 — decide per case.**
   - Miss rate 0/12 or 1/12: variance; record the rate and stop.
   - A repeated miss tied to the description: one edit, then the before/after.
   - `#2` at a persistent miss: publish it as a case with no readable with-skill
     cell, name the rate, and leave the assertion alone.
4. **F3 — publish.** Add the load table to
   `docs/evals/implement-from-prompt-matrix.md` and the per-case notes to the
   `implement-from-prompt` row in `docs/evals/coverage.md`; label `#2` as the
   spec decides.

## Data

- `~/.local/share/opencode/evals/runs/<id>/cases/implement-from-prompt--<n>/result.json`
  — `skillGate.loaded`, `passRate`, per-draw status.
- `…/transcript.r<i>.md` — the miss analysis.
- `docs/evals/implement-from-prompt-matrix.md`, `docs/evals/coverage.md` — the
  published rates.

## Results

Measured at `07f4fe6`, default model, `--stop 12/0` (stop rule disabled so the
denominator is the full twelve), no judge. *Clean* means "not excluded by the
runner"; a clean draw may still fail an assertion. The full table is in
`docs/evals/implement-from-prompt-matrix.md` under *Load re-measurement*.

| case | run directory | gate | clean (not excluded) | outcome |
| --- | --- | --- | --- | --- |
| `#1` | `2026-11-06T10-34-26--implement-from-prompt` | 12/12 | 12 | 12/12 |
| `#2` | `2026-11-06T10-38-39--implement-from-prompt` | 12/12 | 12 | 11/12 (reply) |
| `#5` | `2026-11-06T10-45-29--implement-from-prompt` | 12/12 (gate off) | 10 | 9/10 loaded; 1 contaminated, 1 stalled |
| `#8` | `2026-11-06T10-53-13--implement-from-prompt` | 12/12 | 12 | 12/12 |

The load defect did not reproduce: of 48 draws, two were excluded (`#5 r4`
contaminated, `#5 r6` stalled), leaving 46 clean; **45 of those 46 loaded the
skill**. `#5`'s single miss (`r9`) never called the `skill` tool, but
`transcript.r9.md` shows it read the staged `SKILL.md` directly and cited its
rules — the fourth shape above, not "answered from its own knowledge". One in ten
is variance by the spec's stop condition, not a cue. The `description` was **not**
changed, because there was no repeated miss to attribute to it (AC-3's negative
branch). `#2 r12` failed the reply assertion because the agent offered to draft the
missing prompt itself (`transcript.r12.md`), which is behavioural, not load.

`#2` is readable at 11/12 but not a separator: its control has 0/2 clean draws.
It stays a regression case until a control re-run gives a denominator.

## Acceptance Criteria

- **AC-1** — `#1`, `#2`, `#5` and `#8` each have a load rate at n=12 with the run
  directory cited, and every miss lists `loaded` as observed. Verified by reading
  the four `result.json` files.
- **AC-2** — Every miss in the measured set has a diagnosed shape, with at least
  one transcript cited per case; a case with no pattern is recorded as variance,
  not given a cause it did not show.
- **AC-3** — If the `description` changed, the same case was measured before and
  after at n=12 and both rates are published. If it did not change, the spec says
  why the cause was not a cue the skill controls.
- **AC-4** — `#2` is either readable at n=12 or published as a case with no
  readable `with-skill` cell and its measured rate. No `assert:` line changed.
- **AC-5** — No case accepts a skill-less run: the gate still fails a `with-skill`
  repetition with `loaded: []`. Verified by a run or by the existing gate test.
- **AC-6** — `lint` and `selftest` are green; no behavioural run was added to CI
  or to the hook.

## Stop Conditions

- A miss rate of 1/12 or less on every case: publish the rates and stop; do not
  hunt variance.
- The only way to raise the rate requires relaxing the gate or editing an
  assertion: stop; that trades the measurement for a green number.
- The description edit does not move the rate: revert it or keep it only if it is
  independently better, and record the negative result.
- `#2` needs a fixture or a prompt change to become readable: that is a case
  redesign, not this spec; label the cell and open a follow-up.

## Budget

48 runs for F0 (four cases × 12), plus at most 12 for a before/after on one case.
60 model runs, no judge.

## Open Questions

- **Is `#2` a matrix case at all?** It expects the agent to refuse and point at
  `write-implementation-prompt`. A model that answers without loading any skill
  can still produce the right refusal, so the case may measure the refusal rather
  than the skill. The measurement decides; if the cell stays unreadable, `#2`
  becomes a refusal case like the trigger ones.
- **Does the description carry the trigger?** The current text names "implement a
  prompt", "build from a SPEC prompt" and "continue the prompt-driven workflow".
  If misses cluster on `#5` ("go build it"), the verb is the gap; if they cluster
  on `#2` (a missing file), the file is.
