---
spec: SPEC-0001
spec_sha: 2171027ca4248e0e5d9e35e07eb296a3ad1319ecab03f800c10012e8085f8970
---

# Implementation Prompt: SPEC-0001 Re-measure the skill matrix

## Source Spec

- docs/specs/SPEC-0001-remeasure-eval-matrix.md

## Requirements

**User outcome.** A reader of `docs/evals/review-code-matrix.md` sees, per model
and per arm, how many of the four matrix cases passed across five repetitions,
which assertion failed in each red cell, and the commands that produced it. The
README links to that document instead of carrying the numbers.

**Scope.**

- The four cases tagged `matrix` (`review-code` #1–#4 only).
- Two models: the config default (currently `opencode-go/deepseek-v4.1-flash`)
  and `opencode-go/gpt-6-luna`.
- Two arms: `with-skill` (default) and `without-skill` (`--no-skill`).
- Five repetitions per cell: 4 cases × 2 models × 2 arms × 5 = 80 runs.
- Each cell's directory is deleted before it runs.
- A parity smoke: `review-code` #3, both arms, three repetitions through
  Promptfoo.
- The table lives in `docs/evals/review-code-matrix.md`.

**Acceptance criteria** (copied from the spec): AC-1 sixteen per-case JSONs across
four cells, each with `reps: 5`, `passed`, `passRate`, a matching `meta.model` and
a modification time inside this run; AC-2 the document reports `passed/5` per case
per arm per model, an aggregate per arm, and the failing assertion for every red
cell; AC-3 re-running one cell reproduces its counts, and a moving cell is written
as a new number rather than excused; AC-4 the parity smoke classifies every run
the same way the runner does, and a difference is a defect; AC-5 zero transcripts
from this run read `references/evals.md`; AC-6 the document records date, model
ids, repetition count and commands, states that pre-`c876d88` figures are not
comparable, and the README links to it.

**Non-goals.** No new assertions, flags or runner features. No skills other than
`review-code`. No judge in the matrix. No per-case verdict promoted from a rate.
No table in the README. No CI job. No change to `--no-skill` semantics.

## Entities

| Term | Meaning |
| --- | --- |
| cell | one (model, arm) pair; four in total |
| arm | `with-skill` (skill pinned in the scratch) or `without-skill` (`--no-skill`) |
| repetition | one agent run of one case inside a cell; five per case |
| cell directory | `~/.local/share/opencode/evals/<skill>[--<model>][--without-skill]/` |
| aggregate | `passed` summed over the four cases of one cell, out of 20 |

The default model's cell reuses the directory `review-code/`, shared with every
earlier run. That is why the directory is cleared first: a staging failure writes
only the transcript, so a stale JSON would keep `reps: 5` and `passed` from a
different execution.

## Approach

Clear, run, attribute, publish. Each cell is a separate invocation so its
artifacts are attributable. The reading is an aggregate per arm over five
repetitions; a 4/5 cell is reported as a rate, never promoted to "the case
passes". Parity is a separate, small check on the path — one case in both arms —
because comparing two independent batches across twelve cells would measure the
agent's consistency rather than the adapter's correctness.

Nothing is measured while a case is being edited. If a case looks wrong mid-run,
record it and finish; changing the instrument inside a measurement is what the
spec forbids.

## Structure

- `scripts/run-evals.mjs` — runs; `--tag matrix`, `--repeat 5`, `--no-skill`,
  `--model`.
- `scripts/emit-promptfoo.mjs` — emits the config for the parity smoke
  (`--skill review-code --case 3 --arms with-skill,without-skill`).
- `scripts/promptfoo/provider.mjs` — the adapter, sharing `executeCase()`.
- `scripts/replay-evals.mjs` — re-judge the new transcripts if an assertion looks
  like it moved, instead of paying for another run.
- `docs/evals/review-code-matrix.md` — new; the table and its commands.
- `README.md` §Validate — a pointer and the command, no numbers.

## Operations

1. Confirm both models resolve:
   `opencode models | grep -E 'deepseek-v4\.1-flash|gpt-6-luna'`. Record the exact
   ids before running; a model that moved would make AC-3 unverifiable.
2. Clear the four cell directories:
   `rm -rf ~/.local/share/opencode/evals/review-code ~/.local/share/opencode/evals/review-code--without-skill ~/.local/share/opencode/evals/review-code--opencode-go-gpt-6-luna ~/.local/share/opencode/evals/review-code--opencode-go-gpt-6-luna--without-skill`
3. Cell 1 (default model, with skill):
   `node scripts/run-evals.mjs --root skills --tag matrix --repeat 5 --run`
4. Cell 2 (default model, control):
   `node scripts/run-evals.mjs --root skills --tag matrix --repeat 5 --no-skill --run`
5. Cell 3 (`opencode-go/gpt-6-luna`, with skill):
   `node scripts/run-evals.mjs --root skills --tag matrix --repeat 5 --model opencode-go/gpt-6-luna --run`
6. Cell 4 (`opencode-go/gpt-6-luna`, control):
   `node scripts/run-evals.mjs --root skills --tag matrix --repeat 5 --model opencode-go/gpt-6-luna --no-skill --run`
7. Collect the 16 per-case JSONs. Check every one has `reps: 5`, a `meta.model`
   that matches its cell, and a modification time inside this run. A file that
   fails any of the three is a hole, not a number.
8. For every cell below 5/5, read `reason` and attribute it to the assertion that
   failed. The document gets that attribution, not a guess.
9. Parity smoke: `node scripts/emit-promptfoo.mjs --skill review-code --case 3 --arms with-skill,without-skill --out /tmp/parity.yaml`,
   then `npx promptfoo eval -c /tmp/parity.yaml --repeat 3`. Every run must
   classify the same way the runner classified that case in its cell. A
   difference is a defect in one of the two paths and is reported as such.
10. Integrity check: search the four cell directories for a read of
    `references/evals.md`. The count must be zero; a hit voids the measurement
    and means `c876d88` regressed.
11. Write `docs/evals/review-code-matrix.md`: one table per model, rows are the
    four cases, columns are the two arms as `passed/5`, plus the aggregate per arm
    (`n/20`), plus the failure attribution from step 8, plus the commands from
    steps 3–6, the date, both model ids and the note that pre-`c876d88` figures
    are not comparable.
12. Add the pointer to `README.md` §Validate — one sentence and the command, no
    numbers.
13. Set the spec to `status: implemented` and fill `tests:` with the four run
    commands and the replay command.

## Norms

- English docs and commit messages, Conventional Commits, imperative subject.
- A flake is reported as `4/5`, never rounded to a pass or a failure.
- Every number carries the command that produced it.
- Keep the diff small: the new document, the README pointer, the spec status.
- Do not reformat unrelated sections of the README.
- This repo has no `spec-sha.mjs`; regenerate `spec_sha` with
  `shasum -a 256 docs/specs/SPEC-0001-remeasure-eval-matrix.md`.

## Safeguards

- Do not add or change assertions, flags or cases to make a cell green.
- Do not run the matrix with the judge; the default model judges itself and the
  arms stop being comparable.
- Do not count a JSON whose modification time predates the run, whatever it says.
- Do not skip clearing the cell directories "because the run overwrites anyway" —
  a staging failure does not.
- Do not describe `--no-skill` as proving the skill text is unreachable.
- Do not put numbers in the README, and do not touch `~/.opencode/plan/`.
- Do not commit `scripts/promptfoo/promptfoo.yaml` or `/tmp/parity.yaml`.

## Verification

| AC | Check |
| --- | --- |
| AC-1 | 16 JSONs across four cell directories; each has `reps: 5`, matching `meta.model`, and mtime inside the run |
| AC-2 | read the document: `passed/5` per cell, aggregate `n/20` per arm, a failing assertion for every red |
| AC-3 | re-run one cell and compare its `passed` values with the document |
| AC-4 | compare the parity smoke's six classifications with the runner's for case #3 |
| AC-5 | `grep -rl 'references/evals.md'` over the four cell directories returns nothing |
| AC-6 | the document states date, models, repetitions and commands; the README links to it |

Done when all six pass and the spec reads `status: implemented` with `tests:`
filled.
