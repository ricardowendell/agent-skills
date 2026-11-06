---
id: SPEC-0023
title: Record the disposition of the two undecided regression cases
status: implemented
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

- `audit-code-quality` #4 — the `2026-11-04T21-57-53` control ran the earlier
  5-assertion version, before the contract rules existed. On the final
  8-assertion version the pair separated once: `2026-11-04T21-59-17` 1/1 with
  the skill against `…--without-skill` 0/1, one draw per arm.
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
- **Decision: keep both as regression cases.** Neither is removed: the final #4
  pair separated once on the contract assertions but one draw per arm cannot
  carry a discriminator claim, and `review-code` #2 fails a reviewer that misses
  an obvious AC violation or approves on a green suite. Removal would shrink the
  corpus without adding evidence.
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

## Results

**Dispositions (2026-11-06, TASK-34).** Both cases stay in the corpus as
`regression`; neither is removed.

- **`audit-code-quality` #4 — `regression`.** The earlier
  `2026-11-04T21-57-53--audit-code-quality--without-skill` ran the 5-assertion
  version, before `SCOPE:`, `rule`/`judgement` and `CAPTURE OPTIONS` existed, so
  its pass says nothing about the contract. On the final 8-assertion version the
  case separated once: `2026-11-04T21-59-17--audit-code-quality` 1/1 with the
  skill against `2026-11-04T21-59-17--audit-code-quality--without-skill` 0/1 on
  those assertions. One draw per arm cannot carry a discriminator claim, so it
  stays `regression`; re-measure with n≥5 before promoting it.
- **`review-code` #2 — `regression`.** 5/5 in both arms on the replaced fixture
  (`2026-11-02T10-27-26--review-code`,
  `2026-11-02T10-31-40--review-code--without-skill`); the control finds the spec
  and cites AC-2, so the diff-reading case cannot discriminate.

The cited pairs are pre-detector (`review-code` `warnings=5`,
`audit-code-quality` `warnings=1`); the numbers are cited as history, and the
decision does not rest on a clean rate. `docs/evals/coverage.md` carries a
`Dispositions` table with the reasons, directories and date;
`docs/evals/review-code-matrix.md` carries the dated decision in *Case #2 left
the matrix*.

**Discrimination audit.** Every separator claim the audit walked has a control on
the same fixture and prompt, so nothing was reclassified:
`implement-from-prompt` #1/#8 (default, both arms at `3779a20`; the with-skill
cells `2026-11-05T12-35-30` and `12-48-46` predate SPEC-0016, so that pairing is
historical for the with-skill arm while the control does not load the skill; luna
#1 pairs `2026-11-05T13-18-27` at `3779a20` — pre-fix `SKILL.md` — with the
`2026-11-06T07-05-38` control at `8777e0b`, with `references/evals/1/` and the
case-1 assertions unchanged but no post-fix with-skill luna #1; luna #8 runs both
arms at `3779a20`, also pre-fix on the with-skill side), `review-code` #1 at
`61978f1`/`81cba18`, #3 at `8b74222`, #4/#7 at `7a44564`, and
`survey-inflight-work` #1/#2 plus `audit-code-quality` #1 at `3784ae7`. None of
the runs cited here carries `fixtureHash`/`promptHash`, so sameness is established
by `repoSha` plus the identical case prompt. Caveats recorded in coverage: the
default `implement-from-prompt` cells are pre-detector (`warnings=12`); the luna
with-skill and #8 cells and `review-code` #4/#7 are pre-detector too
(`warnings=5`; #7 `warnings=3`), with the luna #1 control the one clean
re-measure (`warnings=0`); `review-code` #1/#3 are pre-detector as well; and the
`survey` and `audit-code-quality` #1 cells are one draw per case, directional
only. A post-SPEC-0016 with-skill re-measure of `implement-from-prompt` #1/#8
would close the skill-version gap; it is not opened as a task here.

**Sibling reconciliation.** The `implement-from-prompt` judge sentence no longer
says tool-call evidence is `unverifiable`: it records that the judge sees the
tool-call ledger since SPEC-0021, #7 moved 1/5 → 5/5, #1 stays 0/5 on a
behavioural residual (TASK-40), `unverifiable` still fails, and both re-judged
cells are `provenance: partial`. `#3` is already published as a regression after
SPEC-0022 (1/1 with skill, no control), and the `Manual`/total columns already
read 2 manual out of 76. Re-running `--list` prints
`Parsed 76 case(s): 74 runnable, 2 manual`.

**Citations.** `node scripts/check-eval-run.mjs` on the five disposition
directories: `findings=0 warnings=5` each for the `review-code` pair and
`findings=0 warnings=1` each for the three `audit-code-quality` directories. No
post-detector directory is cited as a clean rate.

**Files.** The diff is the three `files:` entries:
`docs/evals/coverage.md`, `docs/evals/review-code-matrix.md`,
`docs/specs/active/SPEC-0023-case-dispositions.md`. No draw, no code, no
`skills/` or `scripts/` change.

## Open Questions

- Should `Dispositions` live in `coverage.md` or a new `docs/evals/dispositions.md`?
  Coverage, because the inventory is what a reader opens first and a separate file
  would be a second place to drift. Revisit if the table grows past the corpus.
