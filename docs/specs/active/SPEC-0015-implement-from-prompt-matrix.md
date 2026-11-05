---
id: SPEC-0015
title: Measure whether implement-from-prompt separates with and without the skill
status: ready
priority: P0
task: TASK-24
created_at: 2026-11-05
updated_at: 2026-11-05
source_docs:
  - backlog/tasks/task-24 - eval-medir-o-implement-from-prompt-com-matriz-2x2.md
  - docs/evals/coverage.md
  - skills/implement-from-prompt/references/evals.md
related_decisions: []
depends_on: []
blocks: []
files:
  - skills/implement-from-prompt/references/evals.md
  - skills/implement-from-prompt/references/evals/2/AGENTS.md
  - skills/implement-from-prompt/references/evals/2/package.json
  - skills/implement-from-prompt/references/evals/2/src/index.js
  - docs/evals/implement-from-prompt-matrix.md
  - docs/evals/coverage.md
  - docs/README.md
  - docs/specs/active/SPEC-0015-implement-from-prompt-matrix.md
tests:
  - node scripts/run-evals.mjs --root skills --skill implement-from-prompt --list --check
  - node scripts/validate-skills.mjs --root skills
  - node scripts/check-sensor-parity.mjs
---

# SPEC-0015: Measure whether `implement-from-prompt` separates with and without the skill

## Purpose

`implement-from-prompt` has eight cases, three of them `status: manual`, and no
control measurement. The 33 run directories on disk are all `with-skill`,
produced against older case versions, and predate the current fixture set. So
the repo cannot answer the only question that matters for this skill: does a
case change outcome because of the skill, or would a bare agent pass it anyway?

This spec produces that measurement, with the promotion of the three manual
cases where the fixtures support an honest run.

## User Outcome

A reader of `docs/evals/coverage.md` sees a run directory per case and per arm
for `implement-from-prompt`, and can tell which cases discriminate, which are
regression-only, and which could not be made runnable. The published table is
reproducible with the commands it records.

## Scope

- The six behaviour cases (#1, #2, #3, #4, #7, #8) and the two trigger cases
  (#5, #6). Trigger cases are routing-only: they run in the skill arm and are
  never compared against the control.
- Two arms: `with-skill` (default) and `without-skill` (`--no-skill`).
- Default model `opencode-go/deepseek-v4.1-flash`; the second model,
  `opencode-go/gpt-6-luna`, only for cases that separate in Gate A.
- Judge `opencode-go/gpt-6-luna` over the `expect:` lines for the behaviour
  cases, so the model under test does not grade itself. The deterministic
  assertions still decide the case; the judge can fail a case, never rescue one.
- Promotion of `#2`, `#3` and `#4` from `status: manual` to runnable:
  - `#3` and `#4` already have fixtures; they gain a `prompt:` line.
  - `#2` gets a minimal fixture 2 (`AGENTS.md` + `package.json` + `src/index.js`,
    no `docs/prompts/`) and an assertion that the reply points to
    `write-implementation-prompt`, replacing `nofile AGENTS.md` with
    `unchanged AGENTS.md`.
  - If a promoted case fails its sanity draw because the scenario is not
    actually forced by the fixture, it stays manual with the reason written; the
    assertion is not tuned to make it pass.
- `tags: matrix` on the six behaviour cases, for selection with `--tag matrix`.

**Blast radius.** Case text, one new fixture, one published measurement, and the
coverage row. No skill or runner change. What it can invalidate is the current
claim that this skill's cases are informative; a case that fails to separate is
reclassified, not hidden.

## Non-Goals

- No change to `implement-from-prompt` itself (skill text, description, gates).
  A defect the measurement exposes becomes a follow-up spec.
- No change to the runner, assertion vocabulary, or isolation. The instrument is
  frozen after the sanity draws.
- No behavioural run in the `verify` gate. Those runs stay local and cost money;
  `verify` runs only `lint` and `selftest`.
- No reuse of the historical run directories as evidence. They answer a
  different question (old case versions, no control, pre-isolation).
- No matrix table in the README. The README points; the document holds numbers.

## Flow

1. **F0 — instrument.** Promote #2/#3/#4, add `tags: matrix`, run one sanity
   draw per promoted case, then run `--list --check` and the validator. Commit
   the instrument and freeze it. A defect found later is recorded and handled as
   a follow-up, never fixed mid-measurement.
2. **F1 — load canary.** `--case 1 --repeat 12 --run`. Stop on any skill-gate
   miss: zero in 12 rejects the pre-isolation 23% rate (P = 4.3%). With a miss,
   diagnose before spending the matrix.
3. **F2 — Gate A, with skill.** `--tag matrix --repeat 5 --run --judge
   opencode-go/gpt-6-luna` (30 runs) and `--tag trigger --repeat 5 --run` (10
   runs). Record `passed/5`, `skillGate.loaded`, and the failing assertion or
   gate reason per red cell. `5/5` is a separator candidate; anything less is a
   broken case or a skill failure and is read before the control is spent.
4. **F3 — Gate A, control.** `--tag matrix --repeat 5 --no-skill --run --judge
   opencode-go/gpt-6-luna` (30 runs). `0/5` separates; `1–2/5` is inconclusive;
   `>=3/5` is a non-discriminator and stays as a regression case.
5. **F4 — Gate B, separators only.** Top up to `n=12` on the default model (7
   extra draws per arm), and run `opencode-go/gpt-6-luna` at `n=5` in both arms.
   Report the observed spread; never round a repetition into a rate.
6. **F5 — publish.** `docs/evals/implement-from-prompt-matrix.md` with date,
   commit, models, repetitions, commands, per-case table, failure reason per red
   cell, and the run directories. Update the coverage row and, if the manual
   count changed, the totals.

## Data

- `~/.local/share/opencode/evals/runs/<id>/manifest.json` — model, arm, repo sha,
  skill hash per case.
- `…/cases/implement-from-prompt--<n>/result.json` and `transcript.r<i>.md` —
  per-case result, pass rate, gate result, failing assertion.
- `docs/evals/implement-from-prompt-matrix.md` — the published table.
- `docs/evals/coverage.md` — the inventory row and totals.

## Acceptance Criteria

- **AC-1** — The instrument is frozen at one commit; `--list --check` is clean
  and `validate-skills` prints `All clear`. Verified by the commands and by the
  recorded sha.
- **AC-2** — Each of #2/#3/#4 is either runnable with a prompt and fixture that
  force the scenario, or `manual` with a written reason. The coverage row and
  totals reflect the result. Verified by `--list` and by reading the cases.
- **AC-3** — The canary records 12 draws of #1 with zero skill-gate misses. A
  non-zero count stops the matrix and is written as the finding. Verified by the
  run directory.
- **AC-4** — Gate A has separate with-skill and control run directories, each
  with `reps: 5`, the default model in `meta.model`, and the judge recorded.
  Verified by reading `result.json` and `manifest.json`.
- **AC-5** — Every behaviour case is classified as separator, non-discriminator,
  or broken-with-skill, with the failing assertion or gate reason named for
  every red cell. Verified by inspection of the published table.
- **AC-6** — Every separator has Gate B: `n=12` on the default model and `n=5`
  on `opencode-go/gpt-6-luna`, both arms, with the observed spread stated.
  Verified by the run directories and the document.
- **AC-7** — The published document names the date, commit, models, repetitions,
  commands and run directories; zero transcripts read `references/evals.md`.
  Verified by searching the run directories.
- **AC-8** — No skill or runner file changed in the diff. A defect the
  measurement exposes is recorded as a follow-up task/spec. Verified by
  `git diff --stat`.

## Stop Conditions

- Canary with a gate miss: stop and diagnose; do not run the matrix.
- A promoted case fails its sanity draw: leave it manual, write the reason, and
  continue without it.
- A case fails `5/5` with the skill: read the reason before spending the
  control; do not tune the assertion to pass.
- No separator after Gate A: publish the negative result (as the mutation pilot
  did) and skip Gate B.

## Budget

Gate A: ~85 runs (canary 12, with-skill 40, control 30). Gate B: 30–60 runs for
the separators. Total ~115–145 runs. Judge calls add model cost, not runs.

## Open Questions

- **#2 redesign.** The new fixture must still be the "missing prompt file" case,
  not a different scenario. If it cannot be staged honestly, it stays manual.
- **#3 forced scope change.** The fixture must make `src/text.js` the right
  target; if it only suggests it, the sanity draw will show a case defect.
- **Judge language.** The replies are expected in English because the prompts
  are; a reply in another language may be invisible to the deterministic regex
  and is covered only by the judge.
