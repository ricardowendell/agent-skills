---
id: SPEC-0008
title: Measure the red-gate half of the review verdict
status: implemented
priority: P1
created_at: 2026-11-05
updated_at: 2026-11-05
source_docs:
  - backlog/tasks/task-21 - review-code-fixture-de-gate-vermelho.md
  - docs/evals/experiments/mutation/review-code/rule-coverage.md
  - skills/review-code/SKILL.md
  - skills/review-code/references/evals.md
related_decisions: []
depends_on: []
blocks: []
tests:
  - skills/review-code/references/evals/7/git.json
---

# SPEC-0008: Measure the red-gate half of the review verdict

## Purpose

`review-code` has one rule about gates and the corpus measures one half of it.
Case #1 proves the green path (`ranpass npm test`). No case presents a failing
gate and expects `REJECT`, so "never approve with a failing or unrun gate" is
half-asserted: the half that protects a merge is the unmeasured one.

A new assertion cannot close this. It needs a fixture where the gate is red and
nothing else is wrong, so the verdict can only come from the gate rule.

## User Outcome

A reader of the `review-code` coverage sees both halves of the gate contract
measured: a case that approves with a green gate and a case that refuses with a
red one. If the refusal does not reproduce, the reader learns that the skill,
not the corpus, is the gap.

## Scope

- One new runnable case, `review-code` #7, with its own base tree
  (`references/evals/base-red/`) and `git.json`. Cases 1–4 keep sharing `base/`.
- The base tree is a small Node project shaped like `base/` (spec, prompt,
  `AGENTS.md`, `node --test`), with one test that fails deterministically and no
  install step. `AGENTS.md` lists the gate command only; it does not say the
  gate must pass, and the prompt does not mention tests.
- The branch carries a clean change that satisfies the spec, so the only failing
  signal is the gate. The branch diff adds no defect of its own.
- Assertions: `verdict REJECT`, `ran npm test` (the command executed),
  a `reply` naming the failing test or the failing gate, and `unchanged` on the
  files the review must not rewrite.
- Run the case with the skill three times. Run the control arm three times to
  record whether the case separates.
- Update `docs/evals/coverage.md` and, only if the case separates,
  `docs/evals/review-code-matrix.md`.

**Blast radius.** One skill's eval corpus (one base tree, one case), two evidence
docs, no `SKILL.md` edit, no runner change, no new assertion kind, no change to
case #1.

## Non-Goals

- **A `ranfail` assertion kind.** `ranpass` passes only when a command exits 0,
  so it cannot express a failing gate. With a fixture that is red by
  construction, `ran` proves the gate was executed; adding a vocabulary kind for
  one case would change the parser, replay and README for every case.
- **Fixing the skill in this spec.** If the agent approves a red gate three times
  out of three, that is a defect of `review-code` and becomes its own task; this
  spec only records the result.
- **A gate-failure fixture family.** One case, one red source.
- **Changing case #1.** It stays the green-path half.
- **A new gate tool.** The fixture uses `node --test`, already available.

## Flow

1. Build `base-red/` from `base/`: same layout, plus one failing test with a
   stable name, and no dependency install.
2. Write `git.json` so `base-red` is committed as `main` and `change.patch` lands
   a clean, spec-satisfying change on `branch`.
3. Validate the corpus: `node scripts/run-evals.mjs --root skills --list --check`.
4. Run case #7 with the skill, `--repeat 3 --timeout 600`.
5. Run the control arm (`--no-skill`) three times on the same case.
6. Classify:
   - **discriminating** — with-skill rejects 3/3 and control does not;
   - **regression only** — both arms reject; tag it `regression`, keep it out of
     the matrix (the shape case #2 already has);
   - **skill defect** — with-skill approves 3/3; stop and open a task.
7. Update the coverage row with the run directory and the classification; update
   the matrix only in the first case.
8. Record one transcript that shows the gate command and its non-zero exit.

## Data

No persistence. The case lives in `skills/review-code/references/evals/7/`
with its base tree; the run artifacts live under the runner's normal run
directory. The case's `why:` line names the planted red test so the fixture can
be audited later.

## UI Notes

Not applicable.

## Acceptance Criteria

- AC-1 — Case #7 stages from `git.json` and `npm test` exits non-zero on `main`
  and on the branch, without network access or dependency install. Verified by
  staging the fixture and running the gate in the scratch tree.
- AC-2 — The branch diff introduces no defect of its own: the only failing test
  is the one seeded in `base-red`, unchanged by the patch. Verified by comparing
  the gate output on `main` and on the branch (same failing test) and by
  `git diff main...branch --stat` listing only the intended files.
- AC-3 — With the skill, the case rejects 3/3 and `ran npm test` passes in all
  three repetitions. Verified by the three `result.json` files.
- AC-4 — The reply names the failing test or the gate failure, not merely
  "gate failed". Verified by the `reply` assertion and one transcript.
- AC-5 — The control arm is measured three times and classified. If it also
  rejects, the case is tagged `regression` and is not counted as matrix
  evidence. Verified by the control results and the tag in `evals.md`.
- AC-6 — `--list --check` stays green and case #7 is runnable (no
  `status: manual`). Verified by the command's exit status.
- AC-7 — `docs/evals/coverage.md` names the new case and the run directory that
  backs it. Verified by reading the row.
- AC-8 — If the with-skill arm approves 3/3, `review-code/SKILL.md` is unchanged
  by this work and a backlog task names the rule that failed. Verified by
  `git diff --stat` and the new task file.

## Result (2026-11-05)

`base-red/` carries a failing `test/legacy.test.js` (packaging fee); the branch
adds `total()` and its tests, and the diff touches only `src/cart.js` and
`test/cart.test.js`. The gate exits 1 on `main` and on the branch, with the same
failing test.

| arm | runs | result | run |
| --- | --- | --- | --- |
| with skill | 3 | 3/3 rejected on the assertions; one run exited 1 after the review | `2026-11-05T09-05-36--review-code` |
| without skill | 3 | 0/3 — all three approved and named the failure | `2026-11-05T09-32-10--review-code--without-skill` |

The first with-skill batch (`2026-11-05T08-35-22--review-code`) had 2/3 passes and
one provider timeout; a second batch was run under the same fixture. Across the
completed reviews, every one rejected and ran `npm test`.

The case separates: the control saw the red gate and approved anyway, naming the
failure as out of scope, which is exactly the behaviour the rule forbids. It is
tagged `matrix` and recorded as a preliminary three-draw cell.

AC-1–AC-8 are met. AC-3 is met on the assertions (3/3 rejected and ran the
gate); the harness status is reported separately because one run exited 1 after
producing a passing review. AC-8 was not triggered.

## Open Questions

- A red test that already exists on `main` is the cleanest way to keep the
  branch diff free of defects, but a reviewer can argue the failure is out of
  the branch's scope. The skill's rule is absolute ("never approve with a
  failing or unrun gate"), so the expected verdict is still `REJECT`. If the
  pilot shows reviewers consistently scoping a pre-existing failure out, the
  fixture needs another red source and AC-2 changes.
- If the control arm also rejects, is the case worth keeping? Yes as a
  regression case, but it never becomes matrix evidence; AC-5 already says so.
  The open point is whether a regression case with a red gate should also carry
  a `reply` assertion, or only the verdict.

## Prompt Notes

- Requirements: one runnable case, a red gate that is the only failing signal,
  a clean branch diff, three with-skill runs and three control runs.
- Entities: `base-red/`, `references/evals/7/git.json`, `change.patch`, the
  planted failing test, the case block in `references/evals.md`.
- Approach: copy the `base/` shape; plant one failing test; keep the branch
  patch small and correct; measure before editing any skill text.
- Structure: fixture beside the existing `base/`, case #7 after the trigger and
  near-miss cases, evidence in the two docs.
- Operations: stage, validate, run with skill, run control, classify, update
  coverage, update matrix only if discriminating.
- Norms: case format is `- prompt:`, `- why:`, `- expect:`, `- assert:`,
  optional `- tags:`; assertions are the vocabulary in `kinds.mjs`.
- Safeguards: do not weaken `AGENTS.md` to make the gate fail; do not add an
  install step; do not edit `SKILL.md` before the measurement; do not count a
  control-arm rejection as skill evidence.
- Tests: a filesystem/state check (the branch diff and unchanged guard files),
  a transcript check (`verdict`, `ran`, `reply`), and the three-run
  classification.
