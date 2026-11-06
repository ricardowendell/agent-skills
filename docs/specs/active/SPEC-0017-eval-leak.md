---
id: SPEC-0017
title: Deny or detect the control arm reading an installed skill
status: ready
priority: P0
task: TASK-29
created_at: 2026-11-05
updated_at: 2026-11-05
source_docs:
  - backlog/tasks/task-29 - evals-isolar-o-control-arm-de-cópias-externas-do-skill-e-do-corpus.md
  - docs/evals/implement-from-prompt-matrix.md
  - docs/evals/coverage.md
related_decisions: []
depends_on: []
blocks:
  - SPEC-0018
files:
  - scripts/lib/evals/isolation.mjs
  - scripts/lib/evals/isolation.test.mjs
  - scripts/lib/evals/leak.mjs
  - scripts/lib/evals/leak.test.mjs
  - scripts/lib/evals/result.mjs
  - scripts/lib/evals/report.mjs
  - scripts/lib/evals/report.test.mjs
  - scripts/run-evals.mjs
  - docs/evals/implement-from-prompt-matrix.md
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0017-eval-leak.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
---

# SPEC-0017: Deny or detect the control arm reading an installed skill

## Purpose

The control arm is supposed to know nothing about the skill under test. It does.
`--no-skill` denies the `skill` tool and stages nothing, but the child still runs
as this user, so it can read the installed copy at
`/Users/wendell/.agents/skills/<id>/SKILL.md` and stale copies under
`/private/var/folders/…/T/opencode/`. Three published draws did exactly that:

- `2026-11-05T13-22-08--implement-from-prompt--opencode-go-gpt-6-luna`, case #1,
  `transcript.r1.md` — `cat /Users/wendell/.agents/skills/implement-from-prompt/SKILL.md`.
  This is the single control pass that turned #1 into 5/5 vs 1/5 instead of 0/5.
- `2026-11-05T12-00-00--implement-from-prompt--without-skill`, case #2,
  `transcript.r1.md` — a stale `references/evals.md` under `/private/var/folders`.
- `2026-11-05T17-13-34--groom-backlog--without-skill`, case #2,
  `transcript.r2.md` — the installed `groom-backlog/SKILL.md`.

Every one of them was scored as a clean control pass, because the gate only sees
the `skill` tool. That makes the strongest claims in the repo — "12/12 vs 0/12" —
only as good as a grep nobody runs.

## User Outcome

A reader of a published matrix can trust the control column: either the child
could not reach an installed skill, or the run says it did and the cell is not
counted. The next matrix does not need a manual transcript grep to be honest.

## Scope

- **Prefer denial.** Try `permission.external_directory: "deny"` (the key exists
  in the installed binary) in the child's generated config, so a `read` outside
  the scratch fails. It must not break reading the staged skill, the fixture, or
  `~/.local/share/opencode` state.
- **Guarantee detection.** Whatever the config does, every repetition records
  `leak`: the tool calls whose input or metadata names a path outside the scratch
  that is a skill root (`…/skills/<id>/SKILL.md`, `…/skills`), the eval corpus
  (`references/evals.md`), or a stale copy under `$TMPDIR/opencode`.
  - The detector lives in `scripts/lib/evals/leak.mjs`, next to `events.mjs`, so
    the runner and the future checker read one implementation.
  - A repetition with a leak is marked `contaminated: true` and never counts as a
    pass for either arm, even when every assertion is green.
  - The run summary counts contaminated repetitions separately: they are neither
    pass nor fail, they are excluded with the reason.
- **Re-measure the affected cells.** `#1` control on `opencode-go/gpt-6-luna`
  (`--repeat 5`), and the `#2` controls of both skills. Publish the corrected
  numbers where the old ones are cited.

**Blast radius.** The runner's result schema gains two fields (`leak`,
`contaminated`), the child config gains one permission key, and three published
drills change their reading. It can regress every behavioural run if the
permission denies too much; the fallback is detection-only, and the spec requires
the fixture reads to be proven before the key ships.

## Non-Goals

- No sandbox, container or second user. The child keeps running as this user;
  denial is a permission rule and detection is a transcript fact, not an OS
  boundary.
- No change to the judge, to the load gate, or to any `assert:` line.
- No new behavioural matrix. Re-measure only the cells named above.
- No CI behavioural run. TASK-33 owns the guard; this spec produces the fact.

## Flow

1. **F0 — reproduce.** Run the detector's logic by hand over the three run dirs
   above; the list must match exactly. This is the detector's acceptance fixture.
2. **F1 — detector.** `leak.mjs` with a pure function over `toolCalls(out)` and a
   scratch path; unit tests with synthetic events (a `read` inside the scratch, a
   `read` of `…/skills/x/SKILL.md`, a `bash` with `cat …`, and a benign path that
   only resembles one).
3. **F2 — wire.** `result.json` gains `leak` per repetition and `contaminated`;
   the summary excludes contaminated reps and prints them. Assertions keep
   running, so a contaminated repetition is still readable.
4. **F3 — denial.** Add `permission.external_directory: "deny"` to the child
   config; prove with one with-skill draw that staged skill + fixture reads still
   work and the case passes. If anything breaks, revert the key and record the
   attempt in the spec — detection still ships.
5. **F4 — re-measure.** `#1` control luna `--repeat 5`; `#2` control for
   `implement-from-prompt` and `groom-backlog` at n=3. Update the two documents
   with the corrected numbers and the run dirs; keep the old numbers labelled
   pre-fix.

## Data

- `~/.local/share/opencode/evals/runs/<id>/cases/<skill>--<n>/result.json` —
  gains `leak` and `contaminated` per repetition.
- `…/transcript.r<i>.md` — the detector's input, unchanged.
- `docs/evals/implement-from-prompt-matrix.md`, `docs/evals/coverage.md` — the
  corrected reading and the run dirs.

## Acceptance Criteria

- **AC-1** — A repetition whose tool calls touch an external skill or the eval
  corpus records `leak` with the path and is marked `contaminated`; it never
  counts as a pass. Verified by unit tests and by replaying the three known run
  dirs.
- **AC-2** — The summary reports contaminated repetitions apart from pass and
  fail, and a case verdict names them. Verified by reading a re-run's
  `result.json` and the CLI output.
- **AC-3** — Either `permission.external_directory: "deny"` blocks the external
  read and the case still passes with the skill, or the spec records that denial
  was attempted and detection is the whole guarantee. Verified by one draw and by
  the spec's note.
- **AC-4** — `#1` control on `gpt-6-luna` is re-measured at n=5; the published
  number reflects it (0/5 if the pass was the leak, 1/5 if a clean pass survives),
  with the run dir cited.
- **AC-5** — The `#2` controls of `implement-from-prompt` and `groom-backlog` are
  re-read under the detector; draws that read externally are marked contaminated
  and excluded from the published rates.
- **AC-6** — `lint` and `selftest` are green and no existing `assert:` line
  changed.

## Stop Conditions

- Denial breaks a legitimate read: revert the permission key, keep detection, and
  write the failure in the spec. Do not weaken the detector to compensate.
- A contaminated draw was the only pass in a cell: the cell's rate drops and the
  document says so; do not re-run until the number looks better.
- The detector flags the staged skill or the fixture: the scratch-relative logic
  is wrong; fix it before any measurement.

## Budget

One draw for F3, five for the #1 control, six for the two #2 controls. Twelve
model runs, no judge.

## Open Questions

- **What counts as a skill root.** The list starts as `.agents/skills`,
  `.claude/skills`, `.codex/skills`, `.config/opencode/skills` and any
  `…/T/opencode/**/skills`. A new install path is a detector change, made with a
  test, not a guess.
- **Contaminated vs failed.** The harness has no third status today. The spec
  proposes `contaminated: true` over a new status, because the assertions still
  ran and their result is worth reading; the summary is where exclusion happens.
