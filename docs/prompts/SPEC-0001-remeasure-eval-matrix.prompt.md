---
spec: SPEC-0001
spec_sha: ba0ad831b8b4f03b1e0550a668b3dec4916128ef222d11e3d1d739ae1e69f757
---

# Implementation Prompt: SPEC-0001 Re-measure the skill matrix

## Source Spec

- docs/specs/SPEC-0001-remeasure-eval-matrix.md

## Requirements

**User outcome.** A reader of the README can see, per case and per model, how
many repetitions passed with the skill pinned and how many passed without it,
and can re-run the same measurement to get the same counts.

**Scope.**

- The four cases tagged `matrix` (`review-code` #1–#4 only).
- Two models: the config default (currently `opencode-go/deepseek-v4.1-flash`)
  and `opencode-go/gpt-6-luna`.
- Two arms: `with-skill` (default) and `without-skill` (`--no-skill`).
- Three repetitions per cell: 4 cases × 2 models × 2 arms × 3 = 48 runs.
- Promptfoo parity over the same cases and arms.
- Replace the stale README numbers, keeping the old table with a caption marker.

**Acceptance criteria** (copied from the spec, in order): AC-1 sixteen per-case
result files across four cells, each with `reps: 3`, `passed`, `passRate` and the
resolved model id; AC-2 a README table with per-case and per-model counts for
both arms plus an aggregate per arm; AC-3 a fresh run of the documented command
reproduces each cell, and a moving cell is reported as a new number, not excused;
AC-4 Promptfoo reports the same per-case counts as the runner; AC-5 zero
transcripts from this run read `references/evals.md`; AC-6 the superseded table
stays in the README with the marker in its caption.

**Non-goals.** No new assertions, flags or runner features. No skills other than
`review-code`. No judge in the matrix. No CI job. No change to `--no-skill`
semantics.

## Entities

| Term | Meaning |
| --- | --- |
| cell | one (model, arm) pair; four cells in total |
| arm | `with-skill` (skill pinned in the scratch) or `without-skill` (`--no-skill`) |
| repetition | one agent run of one case inside a cell; three per cell |
| passRate | `passed / total` from the per-case JSON written by the runner |
| cell directory | `~/.local/share/opencode/evals/<skill>[--<model>][--without-skill]/` |

Model ids are recorded by the runner as `<id> (config default)` when the default
is used; the table should show the resolved id, not the word "default".

## Approach

Run each cell as a separate invocation so its artifacts are attributable, then
join the four tables by `(case, arm)`. Promptfoo runs afterwards over the same
selection and is compared against the runner, not used as a second source of
truth. Nothing is measured while a case is being edited: if a case looks wrong
mid-run, record it and finish the run.

## Structure

- `scripts/run-evals.mjs` — runs and writes the artifacts; `--tag matrix`,
  `--repeat 3`, `--no-skill`, `--model`.
- `scripts/emit-promptfoo.mjs` — emits the Promptfoo config for the same cases
  and arms (`--tag matrix --models default,opencode-go/gpt-6-luna`).
- `scripts/promptfoo/provider.mjs` — the adapter, sharing `executeCase()` with
  the CLI.
- `scripts/replay-evals.mjs` — re-judge the new transcripts if any assertion
  looks like it moved, instead of paying for another run.
- `README.md` §Validate — the table and the superseded one live here.

## Operations

1. Confirm both models resolve: `opencode models | grep -E 'deepseek-v4.1-flash|gpt-6-luna'`.
   Record the exact ids before running anything; a model that moved would make
   AC-3 unverifiable.
2. Run cell 1 (default model, with skill):
   `node scripts/run-evals.mjs --root skills --tag matrix --repeat 3 --run`
3. Run cell 2 (default model, control):
   `node scripts/run-evals.mjs --root skills --tag matrix --repeat 3 --no-skill --run`
4. Run cell 3 (`opencode-go/gpt-6-luna`, with skill):
   `node scripts/run-evals.mjs --root skills --tag matrix --repeat 3 --model opencode-go/gpt-6-luna --run`
5. Run cell 4 (`opencode-go/gpt-6-luna`, control):
   `node scripts/run-evals.mjs --root skills --tag matrix --repeat 3 --model opencode-go/gpt-6-luna --no-skill --run`
6. Collect the 16 per-case JSONs from the four cell directories and check each
   has `reps: 3`. Any cell whose count is 0 or 1 is reported, not rerun until it
   looks better — unless the transcript shows a harness failure (staging error,
   timeout), which is a different thing and should be stated.
7. Emit and run the Promptfoo matrix:
   `node scripts/emit-promptfoo.mjs --tag matrix --models default,opencode-go/gpt-6-luna`
   then `npx promptfoo eval -c scripts/promptfoo/promptfoo.yaml --repeat 3`.
   Compare per-case counts with step 6.
8. Check integrity of the new transcripts: search the four cell directories for a
   read of `references/evals.md`; the count must be zero. A hit means the fix in
   `c876d88` regressed and the measurement is void.
9. Write the README table: rows are cases, columns are model × arm (or two
   tables, one per model), cells are `passed/3`, plus a per-arm aggregate. State
   the exact commands under the table.
10. Move the previous numbers into a second table whose caption reads: *measured
    before `c876d88`; the agent could read the eval corpus; do not cite*.
11. Update the spec: `status: implemented`, and fill `tests:` with the commands
    that produced the table.

## Norms

- English docs and commit messages, Conventional Commits, imperative subject.
- A flake is reported as `2/3`, never rounded to a pass.
- Every number in the README carries the command that produced it.
- Keep the diff small: the README table, the spec status, and nothing else.
- Do not reformat unrelated sections of the README.
- This repo has no `spec-sha.mjs`; regenerate `spec_sha` with
  `shasum -a 256 docs/specs/SPEC-0001-remeasure-eval-matrix.md`.

## Safeguards

- Do not add or change assertions, flags, or cases to make a cell green.
- Do not run with the judge in the matrix; the default model judges itself and
  would make the two arms incomparable.
- Do not describe `--no-skill` as proving the skill text is unreachable; it
  measures "not auto-loaded".
- Do not delete the superseded table, and do not move the marker out of its
  caption.
- Do not touch `~/.opencode/plan/` artifacts: they are outside the repo and out
  of scope for AC-6.
- Do not commit generated files (`scripts/promptfoo/promptfoo.yaml` is ignored).

## Verification

| AC | Check |
| --- | --- |
| AC-1 | `ls ~/.local/share/opencode/evals/*/1.json` shows four cells; each JSON has `"reps": 3` |
| AC-2 | read the README table; every case appears twice (with/without skill) per model |
| AC-3 | re-run one cell and compare its `passed` values with the table |
| AC-4 | diff the runner counts against the Promptfoo output per case and arm |
| AC-5 | `grep -rl 'references/evals.md'` over the four cell directories returns nothing |
| AC-6 | read the second table's caption |

Done when all six pass and the spec reads `status: implemented` with `tests:`
filled.
