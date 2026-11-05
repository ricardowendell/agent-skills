---
id: SPEC-0009
title: Isolate the spec-hash check from the case #4 diff
status: implemented
priority: P0
created_at: 2026-11-05
updated_at: 2026-11-05
source_docs:
  - backlog/tasks/task-22 - review-code-asserção-do-hash-mede-template.md
  - docs/evals/experiments/mutation/review-code/README.md
  - skills/review-code/references/evals/4/change.patch
  - skills/review-code/SKILL.md
related_decisions: []
depends_on: []
blocks: []
tests:
  - skills/review-code/references/evals/4/change.patch
---

# SPEC-0009: Isolate the spec-hash check from the case #4 diff

## Purpose

Case #4 says it measures the stale-spec rule, and it does not. Its only
rule-specific assertion, `reply spec hash:.*mismatch`, quotes the output template.
The `ignore-spec-sha` control from SPEC-0006 computed the hash, compared it with
the prompt's pin and rejected in all three runs; the assertion still failed in
all three because the reviews put the mismatch in prose. That is a false
positive: the run is scored as a miss for wording, not behaviour.

The case also fails to isolate the rule by verdict. The branch carries a second
defect (AC-3 moved to require rejecting non-finite rates; the code rejects only
negatives), so `verdict REJECT` passes without the hash check. Today the case
cannot distinguish "compared the hash" from "wrote the template phrase".

## User Outcome

A reader of the matrix can trust the #4 cell: the case rejects only when the
reviewer noticed the spec moved, and the assertion that proves it accepts any
wording that names the pin and the head hash. If the rule turns out to be
redundant in this fixture, the matrix says that instead of claiming coverage.

## Scope

- Rewrite case #4's `change.patch` so it edits **only**
  `docs/specs/SPEC-0007-cart-tax.md`, in a semantics-preserving way (for example
  reword AC-3 without changing what it requires). Code and tests stay untouched
  and the suite stays green.
- The prompt keeps its original `spec_sha`; the spec edit necessarily moves the
  spec's hash. The stale spec becomes the only defect in the tree.
- Replace the two assertions with behaviour checks: `verdict REJECT`, a reply
  naming the pin, and a reply naming the head hash (short prefixes are enough).
  No template sentence is required.
- Re-measure: baseline 5/5, then the existing frozen `ignore-spec-sha` control
  three times.
- Update the #4 row in `docs/evals/review-code-matrix.md` and the `review-code`
  evidence cell in `docs/evals/coverage.md`.

**Blast radius.** One case's patch and assertions, one re-measurement of an
existing control root, two evidence docs. No `SKILL.md` edit, no runner change,
no new case, no new assertion kind, no change to cases #1–#3.

## Non-Goals

- **Fixing the assertion inside SPEC-0006.** That spec is implemented and its
  non-goal was explicitly not to repair the gap the pilot exposed; this is the
  follow-up.
- **A hash helper or a new assertion kind.** `reply` already expresses the
  behaviour; the fixture's hashes are static.
- **Deleting case #4.** If the control survives, the case stays with its true
  meaning (regression case), and the finding is the redundancy.
- **Keeping the concurrent AC defect.** It was never the point of #4 and it
  prevents verdict isolation. If that path needs coverage, it is a separate case.
- **Re-running the whole matrix.** Only the #4 cell moves.

## Flow

1. Edit `references/evals/4/change.patch` so the only change is a wording edit in
   `docs/specs/SPEC-0007-cart-tax.md`; the spec's acceptance criteria keep the
   same meaning.
2. Confirm the branch tree: `git diff main...branch --stat` lists one file, and
   `npm test` exits 0 in the staged tree.
3. Compute the head hash with the fixture's `spec-sha.mjs` and record the pin and
   head prefixes the assertions will use.
4. Replace the assertions:
   - `assert: verdict REJECT`
   - `assert: reply <pin-prefix>`
   - `assert: reply <head-prefix>`
   - keep `unchanged src/cart.js` and `unchanged test/cart.test.js`
5. Validate: `node scripts/run-evals.mjs --root skills --list --check`.
6. Reproduce the baseline on #4 at `--repeat 5 --timeout 600`.
7. Run the frozen `ignore-spec-sha` control three times on the same case.
8. Classify with SPEC-0006's categories: `detected`, `survivor` or `invalid`.
   A control run that does not load the skill is `invalid`, never detection.
9. Update the matrix row and the coverage evidence cell with the run directory.
10. If the control survives, record the redundancy of the rule in this fixture
    and do not claim hash coverage in the matrix.

## Data

No persistence beyond the fixture and the run artifacts. The case's answer key
is the diff itself: one file, one semantic-neutral edit. The pinned hash and the
head prefix live in the case's `why:` line so a later edit of the fixture is
forced to update them.

## UI Notes

Not applicable.

## Acceptance Criteria

- AC-1 — The branch diff touches only `docs/specs/SPEC-0007-cart-tax.md`.
  Verified by `git diff main...branch --stat` in the staged tree.
- AC-2 — The spec edit changes no requirement: every AC means the same before
  and after. Verified by reading the diff against the `why:` line that records
  the old and new wording.
- AC-3 — The gate is green on the branch: `npm test` exits 0 in the staged tree,
  with no install step. Verified by the staged run.
- AC-4 — The assertions fail when the reviewer does not compare the hash and
  pass when it does, without requiring a template sentence. Verified by the
  control run (comparison happened, assertion passes) and by replaying a
  transcript where the comparison is absent.
- AC-5 — The baseline is reproduced at 5/5 before the control runs. Verified by
  the five `result.json` files.
- AC-6 — The control is run three times and classified `detected`, `survivor` or
  `invalid`, with the classification recorded. Verified by the three results and
  the experiment record.
- AC-7 — `--list --check` stays green. Verified by the command's exit status.
- AC-8 — The #4 matrix row and the `review-code` coverage cell name the new rate
  and the run directory that backs it. Verified by reading both docs.
- AC-9 — If the control survives 3/3, the record names the rule as redundant in
  this fixture, no additional case is added, and the matrix stops claiming hash
  coverage. Verified by the record and the matrix text.

## Result (2026-11-05)

The fixture now changes only `docs/specs/SPEC-0007-cart-tax.md` (AC-3 loses its
backticks around `taxRate`); the suite is green and the branch spec hashes to
`36c915b0…` against the prompt pin `feb763b1…`. The assertions require both
prefixes.

| step | runs | result | run |
| --- | --- | --- | --- |
| baseline, #4 | 5 | 5/5 | `2026-11-05T07-34-32--review-code` |
| control arm (`--no-skill`), #4 | 5 | 3/5 | `2026-11-05T07-47-21--review-code--without-skill` |
| control `ignore-spec-sha`, #4 | 3 | 3/3 compared the hash (2 passed, 1 exit 1) | `2026-11-05T07-38-29--review-code` |

The control arm's two failures are exactly `reply feb763b1` and `reply
36c915b0`: those runs rejected without showing both hashes. The case therefore
separates on hash evidence, not on the verdict.

The mutation control is a **survivor**: all three runs computed both hashes and
rejected without the skill's hash clause, because the prompt's `spec_sha` field
is the cue. The rule is redundant in this fixture. One run exited non-zero after
producing a passing review and is recorded as environmental, not as detection.

AC-1–AC-3, AC-5 and AC-7 are met. AC-4 is met on the pass side (the baseline
quotes both hashes; the assertion is a literal match, so its absence fails by
construction). AC-6 and AC-9 are met by the survivor classification. AC-8 is met
by the new *Case #4 fixture revision* section in the matrix and the updated
coverage row. The matrix now states that separation is on the hash evidence and
that the luna cells were not re-measured.

## Open Questions

- Requiring both hashes in the reply is stronger than requiring "names the stale
  spec". It proves the reviewer computed the head hash instead of quoting the
  pin, but a correct review that says "the spec no longer matches its prompt"
  without numbers would fail. The task asks for the pin and the head hash, so
  the spec follows it; if the baseline shows reviewers consistently omit the
  numbers, the assertion can drop to `reply (stale|mismatch|moved)` plus a
  `reply` that names the spec id.
- If the control becomes `detected`, case #4 returns to the matrix. If it is
  `survivor`, the matrix cell should read "regression only" and the coverage row
  should not claim the hash rule. Both outcomes are recorded, not inferred.

## Prompt Notes

- Requirements: one-file branch diff, semantics-preserving spec edit, green
  gate, behaviour assertions, baseline 5/5, control 3×, classification.
- Entities: `references/evals/4/change.patch`, `base/docs/specs/SPEC-0007-cart-tax.md`,
  the pinned `spec_sha`, the head hash, the frozen `ignore-spec-sha` root.
- Approach: remove the concurrent defect first, then the assertion measures one
  variable; compute the head hash after the patch is final.
- Structure: patch and case block only; no new fixture directory.
- Operations: edit patch, verify diff and gate, update assertions, validate,
  measure baseline, run control, classify, update docs.
- Norms: assertion vocabulary is `kinds.mjs`; keep `unchanged` guards; the
  case's `why:` line is the answer key.
- Safeguards: do not edit the spec's requirements; do not edit `SKILL.md`; do
  not treat a failed template phrase as evidence; do not add a case to rescue a
  surviving control.
- Tests: state (diff touches one file, gate green, guard files unchanged),
  transcript (verdict plus both hash prefixes), and the repeated control
  classification.
