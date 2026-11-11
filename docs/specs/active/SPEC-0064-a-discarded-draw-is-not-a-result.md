---
id: SPEC-0064
title: A discarded draw is not a result
status: ready
priority: P1
task: TASK-100
created_at: 2026-11-10
updated_at: 2026-11-10
source_docs:
  - backlog/tasks/task-100 - evals-o-resume-nao-reexecuta-um-draw-de-infraestrutura-SPEC-0064.md
  - docs/specs/SPEC-0034-iterative-corpus.md
  - backlog/tasks/task-50 - evals-o-5-do-write-implementation-prompt-stalls-depois-do-load.md
related_decisions: []
depends_on: []
blocks: []
files:
  - scripts/eval.mjs
  - scripts/lib/evals/runs.mjs
  - scripts/lib/evals/runs.test.mjs
  - scripts/lib/evals/result.mjs
  - scripts/lib/evals/result.test.mjs
  - scripts/lib/evals/cli.test.mjs
  - CONTRIBUTING.md
  - docs/specs/active/SPEC-0064-a-discarded-draw-is-not-a-result.md
  - CHANGELOG.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/eval.mjs check --root skills
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0064-a-discarded-draw-is-not-a-result.md --base main
---

## Purpose

`--resume` exists so a dead wave never loses a paid draw. It has the opposite bug
at the other end: it also reuses draws the harness itself refused to score.

`scripts/eval.mjs:842` returns any stored draw for a slot. An infrastructure draw
— a stall, a provider abort — is stored with `status: unscored` and
`infrastructure: true`, so resuming a stalled run replays the discarded draw and
reports the same incomplete cell. The corpus wave (SPEC-0034) stopped at 30/40
draws because the `#12` control stalled; its documented resume is
`--resume` on that run, and that resume cannot reach five clean draws today.

A draw the harness discarded is not a result. Resuming must re-run it.

## User Outcome

- `--resume` on a stalled wave finishes the wave instead of replaying the stall.
- A resume never re-charges a draw that already produced a scored result.
- The rule is stated in `CONTRIBUTING.md`, so a reader knows which slots are
  re-run and which are reused.

## Scope

### F1 — the resume predicate is a function, not a line

Add a small pure predicate — `resumeSkip(result)` in `runs.mjs` or `result.mjs`,
whichever owns the status vocabulary — that answers one question: **is this
stored draw a result the harness will keep?**

- `passed` and `failed` → skip (already scored, already paid).
- `unscored` with `infrastructure: true` → **re-run**.
- `unscored` without infrastructure (e.g. "no assertions") → **do not re-run**:
  that is an authoring defect, and re-running it buys the same nothing.
- `contaminated` → skip. It was paid, it produced a behaviour, and the reason it
  is excluded is not going to change by repeating the draw. Re-running a
  contaminated draw is a decision, not a default; keep it out of this spec.

### F2 — the CLI uses it

`scripts/eval.mjs` calls the predicate instead of `if (cached) return cached`, and
the resumed run's summary says how many slots it re-ran and why:
`resume: re-running 1 infrastructure draw (#12 r3, stalled)`.

### F3 — `--resume` never silently changes the wave

The existing guards stay: arm, level, repeat and label must match the manifest. A
resume that would run a different selection is a usage error, not a new run.

## Non-Goals

- **No change to how a load miss is scored.** A behavioural draw where the skill
  never loaded is still `failed`; whether that is a routing finding or a
  behavioural one is `TASK-101`'s question, and the corpus publishes it as
  `unresolved` rather than reclassifying it here.
- No change to the stall watchdog: `TASK-50` fixed the policy at 120 s.
- No new status value. The status vocabulary stays
  `passed`/`failed`/`unscored`/`staged`; only the resume decision changes.
- No change to contamination, the detector or the isolation contract.
- No paid draw. Every test seeds stored results.

## Flow

1. **F1 — predicate.** Write `resumeSkip` with a test per status, including the
   four cases above.
2. **F2 — wire.** Replace the line in `eval.mjs`; print the count and the reason.
3. **F3 — prove.** Seed a run directory with one passed draw and one stalled
   draw, resume it with a no-op agent, and assert that only the stalled slot is
   spawned and that the case reaches a complete cell.
4. **F4 — document.** One paragraph in `CONTRIBUTING.md` next to the resume
   section.

## Data

- `scripts/eval.mjs` (the resume line and its summary).
- `scripts/lib/evals/runs.mjs` / `result.mjs` (where the predicate belongs) and
  their tests.
- `scripts/lib/evals/cli.test.mjs` for the end-to-end resume.
- Stored run `2026-11-08T06-44-22--implement-from-prompt--…--without-skill` as
  the reference shape (read-only; the test seeds its own).

## Acceptance Criteria

1. `resumeSkip` is a pure function with a test for `passed`, `failed`,
   `unscored+infrastructure`, `unscored` without infrastructure, and
   `contaminated`.
2. `--resume` re-runs an `unscored+infrastructure` slot and reuses every scored
   one; the end-to-end test proves exactly one spawn for a one-stall run.
3. The resumed run prints how many slots it re-ran and the reason per slot.
4. A resume whose arm, level, repeat or label does not match the manifest is a
   usage error and stages nothing.
5. Resuming the SPEC-0034 reference run no longer replays the stalled draw —
   proven against a copy in a temp directory, never against the store.
6. `CONTRIBUTING.md` states which slots are reused and which are re-run.
7. No status value, contamination rule or detector changes; `check` still parses
   97 cases (94 runnable, 3 manual).
8. Zero paid draws; every gate in `tests:` passes.

## Decisions

- **A discarded draw is re-run; a scored one is not.** The budget is spent either
  way, so the only question is whether the artefact carries evidence. Replaying a
  stall produces the same empty cell and the same claim; re-running it produces
  the observation the wave was paying for.
- **A contaminated draw is not re-run here.** It was paid and it produced a
  behaviour; the contamination is a fact about where the draw read, and repeating
  it is a judgement about the wave, not a resume default. If a wave wants it, that
  is a flag with its own name.
- **The load miss is left alone.** Reclassifying it would change what every
  behavioural cell means, and the corpus has a better answer available: publish
  the cell as `unresolved` and name the routing problem. A harness that hides a
  routing failure inside a denominator is the failure mode this repository exists
  to avoid.

## Open Questions

None.

## Prompt Notes

- Put the predicate where the status vocabulary lives, not in the CLI. The CLI
  should read as `if (resumeSkip(cached)) return cached`.
- The end-to-end test must use the no-op `opencode` shim; never reach a model.
- Do not touch the store. Copy the reference run into a temporary directory for
  the resume test.
- If the stored result's shape differs across CLI generations (the SPEC-0057
  legacy-manifest fix), the predicate must read the normalised result, not the
  raw file.

_Filled during implementation._
