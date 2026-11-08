---
id: SPEC-0022
title: Make case #3 force the scope change instead of suggesting it
status: implemented
priority: P2
task: TASK-28
created_at: 2026-11-06
updated_at: 2026-11-08
source_docs:
  - backlog/tasks/task-28 - evals-caso-3-não-força-a-mudança-de-escopo.md
  - docs/evals/implement-from-prompt-matrix.md
  - docs/evals/coverage.md
  - skills/implement-from-prompt/references/evals.md
related_decisions: []
depends_on: []
blocks: []
files:
  - skills/implement-from-prompt/references/evals/3/AGENTS.md
  - skills/implement-from-prompt/references/evals/3/src/index.js
  - skills/implement-from-prompt/references/evals/3/tests/generated.test.js
  - skills/implement-from-prompt/references/evals.md
  - docs/evals/coverage.md
  - docs/evals/implement-from-prompt-matrix.md
  - docs/specs/SPEC-0022-scope-change-fixture.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
---

# SPEC-0022: Make case #3 force the scope change instead of suggesting it

## Purpose

Case #3 ("Code reality forces a scope change") is `manual` because its sanity
draw failed: the prompt says **"In `src/index.js`, add and export `slugify`"**,
and the fixture lets that literal instruction work. `src/index.js` re-exports
`src/text.js`, so an agent can add `slugify` to the barrel, write its own test,
watch `node --test` go green, and never notice that the prompt names the wrong
file. The assertion that wants a changed prompt then fails, but it fails as a
*behavioural* miss on a fixture that never made the behaviour necessary — that is
a tuned case, not a measured one.

The case only works if the literal path is **wrong in the repo**, not merely
unfashionable: the barrel must reject hand-written implementation, and the
project must say where text helpers live.

## User Outcome

#3 leaves `manual` only when one sanity draw shows an agent choosing the scope
change because the code made the literal instruction fail. Until then it stays
manual, with the reason published. Either outcome is acceptable; a case that
passes because the fixture got softer is not.

## Scope

- **The barrel becomes generated.** `src/index.js` carries a one-line banner and
  one `export * from "./<module>.js"` per module in `src/`. A new
  `tests/generated.test.js` asserts the file is exactly that, so adding an
  implementation line to `src/index.js` turns `node --test` red.
- **The convention is discoverable.** `AGENTS.md` gains a short convention block:
  text helpers live in `src/text.js`; `src/index.js` is the generated barrel and
  is not the place for implementation. Without this the agent has to guess, and
  the case would test luck.
- **The case is re-read.** Keep both `assert:` lines unchanged
  (`changed docs/prompts/SPEC-0010-slugify.prompt.md` and
  `filematch src/text.js slugify`). Remove `status: manual` only if the sanity
  draw passes; rewrite the `why:` with the forcing mechanism and the run
  directory.
- **Classification stays honest.** A passing sanity draw with the skill does not
  make #3 a separator: no control has been measured. It becomes a regression
  case with a readable `with-skill` cell, and the docs say exactly that.
- **Coverage is updated** in the same commit: the `implement-from-prompt` row,
  the `#3 stays manual` sentence if it moved, the `manual` count and the
  *Three cases are `manual`* hole.

**Blast radius.** One fixture tree, one case block, one coverage row. No other
case is touched and no `assert:` line changes.

## Non-Goals

- No control-arm measurement. TASK-28 asks for a sanity draw; separation is a
  separate claim and needs both arms at a published `n`.
- No new case and no change to the prompt file the fixture ships: the prompt must
  stay wrong so the agent can correct it.
- No change to `#4`'s write-target rule (SPEC-0016) or to the skill's behaviour.
  If the draw fails, the finding is published; the skill is not edited here.
- No judge.

## Flow

1. **F0 — prove the fixture locally, without a model.** Copy the tree to a temp
   dir and run `node --test` twice: baseline green; with a `slugify` implementation
   added to `src/index.js`, red. Record both commands and exits in *Results*.
2. **F1 — update the case.** `why:` names the generated barrel and the
   convention; `status: manual` is removed only in F3.
3. **F2 — sanity draw.** One repetition, with the skill, default model:
   ```sh
   node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 3 --repeat 1 --run
   ```
   Read `result.json`, not the console summary alone.
4. **F3 — decide.** Both assertions pass → leave `manual` and classify as a
   regression case (not a separator). Either fails → keep `manual`, replace the
   `why:` with the observed failure and the run directory, and stop.
5. **F4 — publish.** Coverage row and holes; the matrix's `#3 — manual` line.
   Cite the sanity run directory.

## Data

- `skills/implement-from-prompt/references/evals/3/` — the fixture tree.
- `skills/implement-from-prompt/references/evals.md` — the case block.
- `docs/evals/coverage.md` — the row and the `manual` hole.
- `docs/evals/implement-from-prompt-matrix.md` — the `#3 — manual` classification.
- The sanity run under `~/.local/share/opencode/evals/runs/`.

## Acceptance Criteria

1. **The literal path fails.** With the fixture copied to a temp dir, adding
   `export function slugify(...)` to `src/index.js` makes `node --test` fail, and
   the same implementation in `src/text.js` leaves it green. Both commands and
   exits are recorded in *Results*.
2. **The convention is stated.** `AGENTS.md` says text helpers live in
   `src/text.js` and that `src/index.js` is generated; the test file says the
   same rule in code.
3. **One sanity draw decides the status.** Either the draw passes both
   assertions (and `status: manual` is removed), or the case stays `manual` with
   the observed failure and the run directory in `why:`. No third outcome.
4. **Classification matches the measurement.** If it leaves `manual`, the docs
   call it a regression case with one readable `with-skill` draw, never a
   separator.
5. **Coverage is consistent.** The row's counts, the `manual` total and the
   *Three cases are `manual`* hole agree with the new status (two, if #3 leaves).
6. **No assertion moves.** `git diff -- skills/**/evals.md` shows only the `why:`
   /`status:` lines of case #3; `assert:` lines are identical.
7. **Gates.** The five policy gates pass.

## Stop Conditions

- A sanity draw that fails because the agent did not update the prompt is a real
  result: keep `manual` and publish it. Do not weaken `changed`.
- A sanity draw that passes by editing `src/index.js` and greening the test means
  the fixture does not force the change; fix the fixture, do not touch the
  assertion.
- If the barrel test cannot be made deterministic across `node --test` versions,
  stop and report the version difference instead of loosening the test.

## Budget

One agent draw, no judge. F0 is local and free; do not spend draws to iterate on
the fixture.

## Open Questions

- Should the new module be `src/slugify.js` instead of `src/text.js`? No: `text.js`
  already holds `trim`, and the case is about a *scope* correction, not a new-file
  style. If the convention block and the test disagree with `text.js`, the
  fixture is wrong, not the case.

## Results

### F0 — the fixture proof (2026-11-06, node v24.15.0)

Copied `skills/implement-from-prompt/references/evals/3/` to a `mktemp -d` tree
for each command (nothing committed from the temp dirs).

Baseline:

```sh
T=$(mktemp -d)
cp -R skills/implement-from-prompt/references/evals/3/. "$T/"
(cd "$T" && node --test)
```

Exit 0 — 1 test, 1 pass (`src/index.js is the generated barrel`).

With `export function slugify(...)` appended to `src/index.js`:

```sh
T=$(mktemp -d)
cp -R skills/implement-from-prompt/references/evals/3/. "$T/"
printf '\nexport function slugify(text) { ... }\n' >> "$T/src/index.js"
(cd "$T" && node --test)
```

Exit 1 — 1 test, 0 pass, 1 fail; the assertion names the extra implementation
line.

With the same `slugify` appended to `src/text.js` instead:

```sh
T=$(mktemp -d)
cp -R skills/implement-from-prompt/references/evals/3/. "$T/"
printf '\nexport function slugify(text) { ... }\n' >> "$T/src/text.js"
(cd "$T" && node --test)
```

Exit 0 — 1 test, 1 pass.

### F2 — the sanity draw

Manual cases are excluded from a run, so `status: manual` was cleared for the
draw; the decision below kept it cleared.

```sh
node scripts/run-evals.mjs --root skills --skill implement-from-prompt --case 3 --repeat 1 --run
```

Run directory: `2026-11-06T11-28-49--implement-from-prompt` (default model,
with-skill, no judge). `result.json`: `passed`, **1/1 rep**, both assertions
pass — `changed docs/prompts/SPEC-0010-slugify.prompt.md` and
`filematch src/text.js slugify`; `skillGate` loaded `implement-from-prompt`,
`leak: []`, `contaminated: false`, not infrastructure. `check-eval-run.mjs`:
`cases=1 reps=1 findings=0 warnings=0`.

The transcript shows the mechanism: the agent read `AGENTS.md`,
`tests/generated.test.js` and the barrel, changed the prompt to name
`src/text.js`, implemented `slugify` there, and left `src/index.js` untouched.

### Decision

The draw passed both assertions. Case #3 is no longer `manual`; the `why:` names
the generated barrel and the convention, and cites the run directory. It is a
**regression case with one readable with-skill draw**, not a separator: no
control arm was measured (the spec's non-goal). Coverage lost one manual case
(3 → 2) and the `implement-from-prompt` row, the two-holes note and the matrix's
classification/Follow-ups were updated in the same commit.
