---
id: SPEC-0026
title: Measure the pipeline bookends and close the coverage hole
status: ready
priority: P2
task: TASK-32
created_at: 2026-11-06
updated_at: 2026-11-06
source_docs:
  - docs/evals/coverage.md
  - docs/evals/write-implementation-prompt-matrix.md
  - CONTRIBUTING.md
related_decisions: []
depends_on:
  - SPEC-0025-measure-write-implementation-prompt
blocks: []
files:
  - docs/evals/pipeline-bookends-matrix.md
  - docs/evals/coverage.md
  - docs/README.md
  - docs/specs/active/SPEC-0026-measure-pipeline-bookends.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
---

# SPEC-0026: Measure the pipeline bookends

## Purpose

`capture-idea`, `process-inbox` and `record-decision` hold the two ends of the
`/capture → /process-inbox → /groom → /prompt → /implement` pipeline: an idea in,
a decision out. All eleven of their cases parse and stage, and none has ever been
measured — `docs/evals/coverage.md` says `none` for all three.

With SPEC-0025 this closes the inventory: every skill in the repo has evidence,
or a written reason it does not. It also finishes what TASK-34 started — a case
that cannot tell the skill from nothing becomes a recorded regression case
instead of an unexamined one.

## User Outcome

Each of the eleven cases has five clean draws per arm (triggers in the skill arm
only), a classification with the failing assertion named, and a row in the
inventory that cites the run directories. The three skills stop reading `none`.

## Scope

- **Eleven cases, measured as they are.**
  - `capture-idea`: `#1` behavioural; `#2`/`#3` triggers.
  - `process-inbox`: `#1` behavioural; `#2`/`#3` triggers.
  - `record-decision`: `#1`–`#3` behavioural; `#4`/`#5` triggers.
- **A load canary per skill** before its Gate A:
  `--case 1 --repeat 12 --run`. 12/12 with the gate held is the precondition. A
  miss is a finding about the skill and stops that skill's gate, not the wave.
- **Gate A: five draws per arm on the five behavioural cases**, default model,
  default concurrency, `--level behavior`, deterministic asserts only, no judge.
  `--repeat 5` runs all five draws.
- **Triggers run in the skill arm only**, five draws each. They carry
  `gate: off`: their evidence is the routing assertion, not a gate.
- **Classification per case**, same rule as SPEC-0025:
  `separator` (skill ≥ 4/5, control ≤ 1/5), `non-discriminator` (both ≥ 4/5, or
  a gap under 3/5), `broken` (skill ≤ 3/5). A with-skill draw with
  `skillGate.ok !== true` is not a pass; more than one miss in five makes the
  cell unreadable and the case is re-run after diagnosis.
- **Publish `docs/evals/pipeline-bookends-matrix.md`** in the shape of the
  existing matrices: arms, commands, run directories, one table per skill, the
  red cells by assertion, and the classification. No judge column.
- **Close the inventory** (`docs/evals/coverage.md`):
  - the three rows name the matrix and their run directories;
  - the Known-holes bullet "Four skills have no recorded measurement" is
    deleted — after SPEC-0025 it is no longer true;
  - every `non-discriminator` becomes a `regression` case with its reason and
    run directories, in the same shape as the two existing disposition rows;
  - the `Manual` and `Trigger` counts in the total row match
    `--list --check` (SPEC-0025 changes `Manual` only if case #3 stayed manual);
  - a number with no run directory is written `none` or `no run dir`, never as a
    measurement.
- **Link both new matrices** in `docs/README.md`: the `evals/` map line and the
  "Where to start" list beside `review-code-matrix.md` and
  `implement-from-prompt-matrix.md`.

**Blast radius.** One new evidence doc, two docs updated. No `skills/` file, no
fixture, no assertion, no runner and no gate changes.

**Budget.** About 116 draws: 36 canary (three skills × 12), 50 behavioural (five
cases × five × two arms), 30 triggers. Roughly 30–45 minutes of wall time at
concurrency 4. No judge.

## Non-Goals

- **No case redesign.** `process-inbox #1` asserts only that nothing changed
  (`dir`, `filematch`, `unchanged`, `nodir`), so a control that does nothing can
  pass it. That is a predictable `non-discriminator`; it is recorded, not fixed.
  Adding a reply assertion is a case-design spec of its own.
- No skill prose change. A `broken` case stops the spec and becomes a finding.
- No `implement-from-prompt` re-measure and no second model.
- No edit to `skills/*/references/evals.md`. All eleven cases already carry a
  `prompt:` and, where they need one, a fixture. If one fails to stage, stop and
  report instead of editing it here.
- No judge. No new case, no removed case.

## Flow

1. **F0 — repro**: `--list --check`; eleven cases across three skills, no
   `manual`.
2. **F1 — canaries**: one per skill, 12 draws, gate held.
3. **F2 — Gate A, with the skill**: five draws for the five behavioural cases;
   five for `capture-idea`, `process-inbox` and `record-decision` triggers.
4. **F3 — Gate A, control**: the five behavioural cases with `--no-skill`.
5. **F4 — checker** every run directory; a cell enters the table only with
   `findings=0 warnings=0`.
6. **F5 — publish** the matrix; update three rows, the Known holes and the total;
   link both matrices in `docs/README.md`.

## Data

- `~/.local/share/opencode/evals/runs/<timestamp>--capture-idea*/`,
  `…--process-inbox*/`, `…--record-decision*/` — manifests and per-case results
  (`repetitions[]`, `skillGate`, `leak`, provenance hashes).
- `docs/evals/pipeline-bookends-matrix.md` — the published evidence.
- `docs/evals/coverage.md` — three rows, the Known holes, the total.
- `docs/README.md` — the map and the reading order.

## Acceptance Criteria

1. **Every behavioural case has five draws per arm** at one commit, and every
   trigger has five draws in the skill arm; each run directory is cited and
   passes `check-eval-run` with `findings=0 warnings=0`, or is cited as the
   failure record with the finding named and no rate taken from it.
2. **Every case has a classification**, and every red cell names the assertion
   or gate reason that failed. `reps`/`passed` are the numbers; no repetition is
   rounded into a rate.
3. **A case that does not separate is a recorded `regression`** in the Known
   holes with its reason and run directories — specifically including
   `process-inbox #1` unless it separates. No such case is deleted or re-scored.
4. **The inventory is true**: the three rows cite the matrix and run directories,
   the "Four skills have no recorded measurement" bullet is gone, every
   number without a run directory is marked `none`/`no run dir`, and the
   `Manual`/`Trigger` totals match `--list --check`.
5. **Both new matrices are linked** from `docs/README.md` (map and reading
   order).
6. **No behavior change.** `git diff main...HEAD -- skills/` is empty, no
   assertion is weakened, and the five policy gates pass.

## Results

Measured at `db7c49a` on `opencode-go/deepseek-v4.1-flash`, the config default,
with deterministic assertions only and no judge. Every arm ran at that commit;
the tree stayed clean, so the two arms share `fixtureHash`, `promptHash` and
`detectorVersion` for every case. Published in
[`docs/evals/pipeline-bookends-matrix.md`](../evals/pipeline-bookends-matrix.md).

**F0** — `--list --check`: 76 cases, 74 runnable, 2 manual, 26 triggers; the
eleven cases below all parse and stage.

**F1 — canaries**, 12/12 with the gate held, `findings=0 warnings=0` each:
`2026-11-06T16-30-55--capture-idea`,
`2026-11-06T16-33-51--process-inbox`,
`2026-11-06T16-37-00--record-decision`.

**F2/F3 — behavioural cases** (five draws per arm):

| case | with skill | control | classification | run directories |
| --- | --- | --- | --- | --- |
| `capture-idea` #1 | 5/5 | no clean run (0/2, 0/2, 0/0) | **unresolved** | `2026-11-06T16-40-32--capture-idea`; `2026-11-06T17-07-09--capture-idea--without-skill`, `…17-23-44…`, `…17-32-50…` |
| `process-inbox` #1 | 5/5 | no clean run (0/1, 0/1, 0/1) | **unresolved** | `2026-11-06T16-41-50--process-inbox`; `2026-11-06T17-08-43--process-inbox--without-skill`, `…17-25-52…`, `…17-34-41…` |
| `record-decision` #1 | 4/5 | **1/5** | **separator** | `2026-11-06T16-43-33--record-decision`, `2026-11-06T17-11-37--record-decision--without-skill` |
| `record-decision` #2 | 4/5 | **0/5** | **separator** | `2026-11-06T16-45-46--record-decision`, `2026-11-06T17-28-10--record-decision--without-skill` |
| `record-decision` #3 | 4/5 | **5/5** | **non-discriminator** | `2026-11-06T16-48-00--record-decision`, `2026-11-06T17-20-53--record-decision--without-skill` |

The three `record-decision` skill misses are behavioural, not infrastructure:
one draw asked for a missing consequence (`#1 r3`), one filed an ADR for an
incomplete decision after the `question` tool was refused (`#2 r1`), and one
asked for the queue level (`#3 r3`). One miss in five keeps the cell readable;
`skillGate.ok` was true in every draw.

**Triggers (skill arm only)**:
`capture-idea` #2 5/5, `#3` 0/4 clean (`skill process-inbox`, one contaminated
draw) in `2026-11-06T16-50-30--capture-idea` (`findings=1`);
`process-inbox` #2 4/4 clean scored draws, `#3` 0/5 (`skill capture-idea`, with
`notskill process-inbox` also red in two draws) in
`2026-11-06T16-55-11--process-inbox` (`findings=1`); `record-decision` #4 and #5
5/5 in `2026-11-06T17-04-07--record-decision` (`findings=0 warnings=0`). The
cross-skill pair cannot pass in the clean environment: only the skill under
review is staged, so the named target is absent; that is a construction defect,
recorded in the matrix and the Known holes, not fixed here.

**F4 — checker**: every behavioural run cited as clean passes
`findings=0 warnings=0`; the contaminated/stalled ones are cited as failure
records with the finding named. The full checker output is in the matrix.

**Honest deviation from the expectation.** `process-inbox` #1 measured
**unresolved**, not the predicted `non-discriminator`: the control never had
five clean draws, and every clean control draw marked the note processed and
created `docs/backlog`, failing `unchanged` and `nodir`. The case was recorded,
not redesigned. `capture-idea` #1 is also `unresolved` for the same
contamination reason; its clean control draws all failed `status: unprocessed`.

**Budget** — 141 draws: 36 canary, 25 with-skill behavioural, 30 trigger, and
50 control (25 first attempt, 15 second, 10 third). The estimate was about 116;
the overrun is the control re-runs made necessary by contamination. No run drew
on a second model and no judge ran.

**TASK-43 caveat** — `findings=0 warnings=0` means no read of an installed skill
or a `references/evals.md` answer key; it does not mean the draw was isolated,
because `scripts/lib/evals/leak.mjs` does not classify the host's `docs/`, the
global `AGENTS.md`, or this worktree.

## Open Questions

- **Will `process-inbox #1` separate?** Probably not: its assertions observe
  only that the fixture is untouched, which a do-nothing control satisfies. The
  spec treats that as the expected outcome and records it; see TASK-32 AC-3.
- **Do `capture-idea #3` and `process-inbox #3` disagree?** They are a routing
  pair — each asserts the other skill is not loaded. They must be read together:
  one passing and the other failing on the same prompt would mean the router is
  ambiguous, and that is a finding, not two independent cells.
- **What does five draws prove?** A direction on the default model, consistent
  with the `coverage.md` rule. No claim of stability is made.

## Prompt Notes

- **Requirements**: evidence for eleven cases, canary per skill, clean runs
  only, one matrix, three rows, one inventory sweep.
- **Entities**: skill, case number, arm, run directory, draw, assertion, gate
  reason, classification, disposition.
- **Approach**: canary → skill arm → control arm → checker → doc. Run both arms
  at one commit; a control from an earlier commit is not citable.
- **Structure**: one new doc under `docs/evals/`; the sweep edits `coverage.md`
  and `docs/README.md`; nothing under `skills/` or `scripts/`.
- **Operations**: the command per step is in `CONTRIBUTING.md > Measuring`. Use
  `--root skills`. The trigger tag selects the six routing cases.
- **Norms**: English prose, run directories in backticks, the arms explained
  before the scores, dispositions in the same shape as the two existing rows.
- **Safeguards**: never weaken an assertion so a control passes; never cite a
  rejected run as clean; never report a rate under five draws; if a case is
  `broken`, stop and report instead of repairing the skill here.
- **Tests**: the five gates are model-free. The matrix is evidence, not a gate.
