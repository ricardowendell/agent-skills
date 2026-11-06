---
id: SPEC-0023
title: Record the disposition of the two undecided regression cases
status: ready
priority: P2
task: TASK-34
created_at: 2026-11-06
updated_at: 2026-11-06
source_docs:
  - backlog/tasks/task-34 - evals-decidir-audit-code-quality-4-e-review-code-2.md
  - docs/evals/coverage.md
  - docs/evals/review-code-matrix.md
related_decisions: []
depends_on:
  - docs/specs/active/SPEC-0021-judge-tool-evidence.md
  - docs/specs/active/SPEC-0022-scope-change-fixture.md
blocks: []
files:
  - docs/evals/coverage.md
  - docs/evals/review-code-matrix.md
  - docs/specs/active/SPEC-0023-case-dispositions.md
tests:
  - node scripts/validate-skills.mjs --root skills
  - node scripts/run-evals.mjs --root skills --list --check
  - node --test scripts/lib/evals/*.test.mjs
  - node --test skills/bootstrap-project-harness/scripts/*.test.mjs
  - node scripts/check-sensor-parity.mjs
---

# SPEC-0023: Record the disposition of the two undecided regression cases

## Purpose

Two cases are published as regression cases without a written decision:
`audit-code-quality` #4 and `review-code` #2. The coverage prose reads like a
conclusion, but it never names the alternative (remove from the corpus), the run
directories that support it, or the date. TASK-34 asks for that decision to be
explicit, and for an audit that no case is called a discriminator without a
measured separation.

The evidence is already recorded; no new draw is needed:

- `audit-code-quality` #4 — control passed once (`2026-11-04T21-57-53`) and
  failed once on the contract assertions (`…21-59-17`), so it separates only
  when the control drops the output contract.
- `review-code` #2 — 5/5 in **both** arms on the replaced fixture
  (`2026-11-02T10-27-26--review-code`,
  `2026-11-02T10-31-40--review-code--without-skill`); both arms found the spec and
  cited AC-2.

## User Outcome

The corpus has a written disposition per case: either it is a regression guard,
with the evidence that justifies keeping it, or it is removed, with the reason.
"Not a discriminator" stops being an inference from absence and becomes a dated
decision a later wave can cite.

## Scope

- **A `Dispositions` table in `docs/evals/coverage.md`** with one row per decided
  case: case, decision (`regression` or `removed`), the one-line reason, the run
  directories, and the date. Start with the two cases above; add any other case
  the audit reclassifies.
- **Decision: keep both as regression cases.** Neither is removed: #4 fails a
  control that drops the output contract, and `review-code` #2 fails a reviewer
  that misses an obvious AC violation or approves on a green suite. Removal would
  shrink the corpus without adding evidence.
- **Name the run directories in the prose**, not only in the matrix. The
  `review-code` #2 line currently says "kept as a regression case" with no
  directory; the matrix has them, coverage does not.
- **Dated decision in `review-code-matrix.md`** so the matrix and the inventory
  agree.
- **Discrimination audit.** Walk every case that coverage or a matrix calls a
  separator (`implement-from-prompt` #1 and #8, `review-code` #4 and #7,
  `survey-inflight-work` #1 and #2, `audit-code-quality` #1) and check that the
  control was measured on the same fixture and prompt. Record the result: a
  separator with a missing or stale control is reclassified, not grandfathered.
  Two known caveats must be named rather than hidden: the pre-detector
  `implement-from-prompt` controls carry `warnings=12`, and the `survey` and
  `audit-code-quality` cells are one draw per case.
- **Reflect the two sibling specs.** `coverage.md` must no longer say the judge
  marks tool-call evidence `unverifiable` (SPEC-0021), and the `#3` status and
  `manual` counts must match what SPEC-0022 measured.

**Blast radius.** Two evaluation docs and one spec. No case definition, fixture,
assertion, gate or code.

## Non-Goals

- No new draw, no judge, no re-measurement. This spec records decisions the
  existing evidence supports.
- No removal of a case unless the audit finds a separator claim with no control;
  even then, the default is reclassification, not deletion.
- No change to `skills/` or to any `assert:` line.
- No rewriting of the historical run numbers; a pre-detector directory keeps its
  `warnings` and is cited as history.

## Flow

1. **F0 — audit.** List every separator claim and its control run directory.
   Check the fixture/prompt provenance where the artifacts carry it; where they
   predate the hashes, say so.
2. **F1 — decide.** Write the `Dispositions` table for `audit-code-quality` #4
   and `review-code` #2, with the run directories and the date.
3. **F2 — reconcile.** Add the directories to the `review-code` #2 prose and a
   dated line to the matrix section. Reclassify anything F0 could not support.
4. **F3 — sync the siblings.** Update the judge sentence and the `#3`/`manual`
   counts to the outcomes SPEC-0021 and SPEC-0022 published.
5. **F4 — check the citations.** Run `node scripts/check-eval-run.mjs` on each
   cited directory that is post-detector; name the `warnings` for the ones that
   are not.
6. **F5 — gates and publish.**

## Data

- `docs/evals/coverage.md` — inventory, Known holes.
- `docs/evals/review-code-matrix.md` — *Case #2 left the matrix*, *Why the
  control failed*.
- `docs/evals/implement-from-prompt-matrix.md` — classifications and the judge
  text SPEC-0021 changed.
- Run directories named above and in the matrices.

## Acceptance Criteria

1. **Every decided case has a row.** `Dispositions` names the case, `regression`
   or `removed`, the reason, the run directories and the date. `audit-code-quality`
   #4 and `review-code` #2 are both present.
2. **Coverage carries the evidence.** The `review-code` #2 prose names
   `2026-11-02T10-27-26--review-code` and
   `2026-11-02T10-31-40--review-code--without-skill`; `audit-code-quality` #4
   names `2026-11-04T21-57-53` and `…21-59-17`.
3. **No unsupported separator.** Every case the docs call a separator has a
   control measured on the same fixture and prompt. Any that does not is
   reclassified and named in the audit note; the note also names the
   pre-detector `warnings=12` and the one-draw cells.
4. **The siblings are reconciled.** The judge sentence matches SPEC-0021's
   measured result, and `#3` plus the `manual` counts match SPEC-0022's outcome.
   Re-running `--list` gives the same totals the table claims.
5. **Citations are checkable.** Each post-detector directory used for a pass rate
   passes `check-eval-run` with `findings=0 warnings=0`; a directory that does
   not is cited as history with its finding named, never as a clean rate.
6. **No draws and no code.** `git diff --stat` shows only the three `files:`
   entries; no `skills/`, no `scripts/`.
7. **Gates.** The five policy gates pass.

## Stop Conditions

- If SPEC-0021 or SPEC-0022 is not merged, stop: this spec depends on their
  published outcome and must not guess it.
- If the audit finds a separator whose control ran on a different fixture, say so
  and propose the re-run as a task; do not promote the case.
- If a cited directory fails `check-eval-run`, keep the number as history and
  name the finding; do not re-run the eval inside this spec.

## Budget

Zero draws. Documentation only; `check-eval-run` is local and free.

## Open Questions

- Should `Dispositions` live in `coverage.md` or a new `docs/evals/dispositions.md`?
  Coverage, because the inventory is what a reader opens first and a separate file
  would be a second place to drift. Revisit if the table grows past the corpus.
