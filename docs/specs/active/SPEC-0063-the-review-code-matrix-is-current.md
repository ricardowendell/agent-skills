---
id: SPEC-0063
title: The review-code matrix is current
status: ready
priority: P2
task: TASK-98
created_at: 2026-11-10
updated_at: 2026-11-10
source_docs:
  - backlog/tasks/task-98 - evals-atualizar-review-code-matrix-para-os-10-casos-e-a-coluna-replayed-SPEC-0063.md
  - docs/evals/coverage.md
  - docs/evals/review-code-matrix.md
  - docs/specs/SPEC-0056-review-proportional-to-diff-risk.md
  - docs/specs/SPEC-0062-the-verdict-vocabulary-is-closed.md
related_decisions: []
depends_on: []
blocks: []
files:
  - docs/evals/review-code-matrix.md
  - docs/evals/coverage.md
  - docs/specs/active/SPEC-0063-the-review-code-matrix-is-current.md
  - CHANGELOG.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test scripts/lib/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
  - node scripts/check-evidence.mjs
  - node scripts/check-staleness.mjs
  - node scripts/spec-check.mjs --spec docs/specs/active/SPEC-0063-the-review-code-matrix-is-current.md --base main
---

## Purpose

`docs/evals/review-code-matrix.md` is the human-facing record of what
`review-code` was measured to do. It still describes three cases measured on
2026-11-01/02/05 at `c876d88`/`b44f0d4`, with no row for cases 8–10 and no mention
of the SPEC-0056 wave, while `docs/evals/coverage.md` publishes ten cases.

A reader who opens the matrix gets a confident and wrong picture: a 15/15 vs 0/15
aggregate for a skill that has since gained a risk profile, three new cases and a
corrected verdict vocabulary.

## User Outcome

- One document answers "what does `review-code` do, measured, and against what".
- Measured and re-judged numbers are visibly different things.
- Every cited run directory resolves.

## Scope

### F1 — the matrix covers the ten cases

Rows for cases 1–10, each with the arm, the run directory, the clean-draw count,
the assertion result and the classification:

- **separator** — the arms differ on the judgement.
- **token/contract separator** — the arms agree on the judgement and differ on the
  required output contract. Cases 1, 8, 9 and 10 are in this class after
  SPEC-0062's re-judge.
- **non-discriminator** — the arms agree on both. Case 2 is here (4/5 vs 5/5 on
  the re-judged control; the skill arm misses on the reply, not the judgement).

The classification must be the same one `coverage.md` publishes for the same
cell. Where the two documents disagree, `coverage.md` wins and this matrix is
corrected.

### F2 — measured and replayed are separate columns

The SPEC-0056 wave measured with the old verdict vocabulary; SPEC-0062 re-judged
the same transcripts. The matrix carries both, labelled, and never averages them:

```text
case  arm   run directory   clean   measured   replayed   class
```

A reader must be able to tell that the replayed column is the judgement-corrected
reading of the same draws, not a new measurement.

### F3 — the header states the provenance

The document's header names the model, the detector version, the isolation
mechanism, the repository state and the dates of the two waves it draws from. A
matrix that does not say when and how it was measured is a claim without a
subject.

### F4 — paths follow the corpus move

Every path the matrix names is the post-SPEC-0058 one (`evals/review-code/…`).
Historical sections may keep old paths only where they are explicitly labelled as
history.

## Non-Goals

- **No new draw.** Every number is already published in `coverage.md` or in a run
  directory; this spec reorganises them.
- No change to any case, assertion, fixture or skill.
- No rewriting of `coverage.md`'s per-cell table: the matrix points at it and
  must not become a second source that drifts. Only cross-reference links and the
  provenance note may change there.
- No change to SPEC-0056's or SPEC-0062's Results.

## Flow

1. **F1 — inventory.** Collect, per case, the run directories and counts from
   `coverage.md` and the stored runs. Do not compute a number this repository did
   not already publish.
2. **F2 — classify.** Apply the three classes above; when a case's class is
   ambiguous, copy `coverage.md`'s published class and cite it.
3. **F3 — write.** The new matrix, with provenance in the header and both columns.
4. **F4 — verify.** Every cited run directory resolves; `check-evidence` stays at
   0 errors / 0 warnings.

## Data

- `docs/evals/review-code-matrix.md` (rewritten).
- `docs/evals/coverage.md` (the source of the numbers; links and the provenance
  note only).
- The stored runs under `~/.local/share/opencode/evals/runs/` (read-only).

## Acceptance Criteria

1. The matrix has a row for every case 1–10 and names no case that does not exist.
2. Every cited run directory resolves in the store; `check-evidence` exits 0 with
   0 errors and 0 warnings over its documents.
3. Measured and replayed columns are separate and labelled, with the replayed
   column attributed to SPEC-0062.
4. Every cell's class matches `coverage.md` for the same cell; a disagreement
   between the two documents is a finding, not a wording choice.
5. The header names model, detector version, isolation mechanism, repository state
   and the two wave dates.
6. No number appears that is not already published in `coverage.md` or derivable
   from a cited run directory. No new draw was spent.
7. Paths are the post-move ones; any old path is explicitly labelled history.
8. `check-staleness` exits 0 and its stale count does not grow: the cells this
   spec touches are citations, not new measurements.
9. Zero paid draws; every gate in `tests:` passes.

## Decisions

- **`coverage.md` stays the source of numbers.** The matrix is a reading aid over
  the same evidence. If the two disagree, the matrix is wrong — a second
  independent count is how a repository ends up with two truths.
- **The matrix is not regenerated by a script.** Ten cases are read by a human
  once; a generator would be a new subsystem to maintain for a document that
  changes twice a year.

## Open Questions

None.

## Prompt Notes

- Do not "fix" a number to make the aggregate look better. If the published
  figure is 4/5, the matrix says 4/5 and the prose explains the miss.
- The SPEC-0056 wave's classification lives in `coverage.md` under "SPEC-0056
  wave"; copy it rather than deriving a new one.
- Keep the file readable in one screen per case, not one table with forty
  columns.

_Filled during implementation._
