---
id: SPEC-0006
title: Measure whether the eval corpus catches a broken skill
status: ready
priority: P0
created_at: 2026-11-03
updated_at: 2026-11-03
source_docs:
  - backlog/tasks/task-17 - eval-piloto-de-mutação-em-review-code.md
  - docs/inbox/2026-11-03-guia-pratico-tecnicas-agent-skills.md
  - docs/evals/review-code-matrix.md
  - skills/review-code/references/evals.md
  - scripts/run-evals.mjs
related_decisions: []
depends_on: []
blocks: []
tests: []
---

# SPEC-0006: Measure whether the eval corpus catches a broken skill

## Purpose

The matrix proves that `review-code` separates from a run without it: 30/30
against 0/30, re-measured under home isolation, with case 3 tightened after four
control runs satisfied it by saying nothing. That is a statement about the skill,
not about the corpus.

The open question is the inverse: if a rule that matters were removed from
`SKILL.md`, would any case fail? A corpus that cannot answer this cannot protect
the skill from a future edit, and every green number it produces is weaker than
it looks.

## User Outcome

A reader of `docs/evals/experiments/mutation/review-code/README.md` learns which
`review-code` rules the corpus actually defends, which mutations survived, and —
for each survivor — whether the agent failed to show the defect or the assertions
failed to catch it. Those are different problems with different fixes.

## Scope

- Three mutations of `review-code`, one rule each:
  - **M1 `no-gates`** — allow approval without running the verification commands.
    Discriminating case: #1 (review against SPEC-0007).
  - **M2 `ignore-spec-sha`** — review as if the contract were current when the
    spec moved after the stamp. Discriminating case: #4 (spec moved after the
    stamp).
  - **M3 `decide-without-declaration`** — issue a verdict on a branch with no
    spec and no fallback authorized by the user. Discriminating case: #3.
- Each mutation is staged as its own root, next to an untouched baseline root:

  ```
  docs/evals/experiments/mutation/review-code/baseline/skills/review-code/
  docs/evals/experiments/mutation/review-code/no-gates/skills/review-code/
  docs/evals/experiments/mutation/review-code/ignore-spec-sha/skills/review-code/
  docs/evals/experiments/mutation/review-code/decide-without-declaration/skills/review-code/
  ```

  Every root carries the same `references/evals.md` and the same fixtures. The
  only difference is the mutant `SKILL.md`.
- Reproduce the baseline first, on the current harness, for the three cases.
- Run each mutation three times against its case, then classify.
- Record the result, the commands, the hashes and the cost in the experiment
  `README.md`.

**Blast radius.** One skill's corpus (`review-code`), one experiment directory,
and at most one new case if a survivor turns out to be a real gap. No runner
code, no new flag, no change to the case format, no other skill, no matrix
re-run.

## Non-Goals

- **A mutation framework.** Three hand-made roots and `--root` are enough for the
  pilot. A `--variant` flag, a scheduler or a library is out of scope until a
  second skill needs the same thing.
- **Changing `SKILL.md`.** A mutation is a temporary copy under the experiment
  directory. The real skill is not edited in this spec.
- **Fixing what a survivor exposes.** A real gap becomes a task; the fix and its
  measurement are separate, so the corpus change and the skill change are not
  judged in the same run.
- **Semantic mutation.** Only rule removal. Rewriting instructions to be subtly
  wrong is a different experiment with a different failure mode.
- **Every skill and every case.** One skill, three rules, one case each.
- **A passing verdict for an invalid mutant.** If the mutant fails to load
  (bad YAML, provenance failure), that is an experiment failure, not detection.

## Flow

1. Copy `skills/review-code` into the baseline root and into the three mutant
   roots.
2. In each mutant root, remove one rule from `SKILL.md` **and** every sentence
   that restates it, so the rest of the skill cannot compensate. Leave headers
   coherent.
3. Confirm the mutant loads: `--list --check` parses, and a single run reports
   `loaded review-code` from the scratch dir. A provenance failure means the run
   tested something else.
4. Reproduce the baseline for cases #1, #3 and #4 at the configured repetitions.
   If the baseline does not pass, stop: the mutation would be measured against a
   corpus that was already red.
5. Run each mutation against its own case, inspect one trace before paying for
   the repetitions, then run the repetitions.
6. Classify each mutation as **detected**, **survivor** or **invalid**, with the
   failing assertion named for a detection, or the trace evidence for a survivor.
7. For a survivor, decide which of the two kinds it is: the defect was manifested
   and the assertions missed it, or the agent did not manifest the defect at all.
8. If a survivor is a real gap, write at most one new case, add it to both roots,
   and re-run that mutation.

## Data

No persistence. The experiment lives in
`docs/evals/experiments/mutation/review-code/`, with one `README.md` holding the
protocol, the baseline, the per-mutation result and the cost. Mutant roots are
scratch artefacts of the experiment and stay untracked unless a result needs them
reproduced later — the README must say how to rebuild them either way.

## UI Notes

Not applicable.

## Acceptance Criteria

- AC-1 — The baseline for `review-code` #1, #3 and #4 is reproduced on the
  current harness before any mutation runs, and the run artifacts show the same
  case status as the matrix records (5/5 each with the skill). Verified by the
  result JSON of each case, not by the console summary.
- AC-2 — Three mutant roots exist, each byte-identical to the baseline except for
  the removed rule in `SKILL.md`, and `node scripts/run-evals.mjs --root
  <mutant>/skills --list --check` exits 0 for all of them. Verified by listing
  the diff between roots and by the command's exit status.
- AC-3 — Every mutation run shows `loaded review-code` from inside the scratch
  dir; a run that loaded nothing is recorded as **invalid**, not as detection.
  Verified by `skillGate` in the result JSON.
- AC-4 — Each mutation is run three times against its case and classified:
  detected (a named assertion failed in at least one repetition), survivor (three
  of three passed and the trace shows the defect was manifested), or invalid.
  Verified by the per-repetition results plus the transcript of at least one run
  per mutation.
- AC-5 — For every survivor, the README states which of the two kinds it is —
  manifested and not caught, or not manifested — quoting the trace line that
  settles it. Verified by reading the README.
- AC-6 — `docs/evals/experiments/mutation/review-code/README.md` records repo
  sha, the `SKILL.md` hash of each root, the model, the exact commands, the
  per-mutation result and the cost in runs. Verified by reading it against the
  run artifacts.
- AC-7 — If and only if a survivor is a real gap, one new case is added to both
  roots and that mutation is re-run; the corpus grows by at most one case.
  Verified by `--list --check` totals and by the re-run result.

## Open Questions

**Blocking — none.** Three judgements are recorded rather than asked.

**Three repetitions is a small sample.** A survivor at 3/3 is weak evidence that
the assertions are blind, and a detection at 1/3 is weak evidence that they are
not. The decision rule uses the trace: a detection needs the named assertion, a
survivor needs the defect visible in the transcript. If the two disagree, the
mutation is inconclusive and is recorded as such rather than forced into a
verdict. The alternative — enough repetitions to make a rate — costs more than
the pilot is worth.

**One model.** The pilot runs the default model only. The matrix already shows
both models agreeing on the baseline; a mutation surviving on one and not the
other is a finding worth recording, not worth a second matrix.

**This repo has no `docs/product`, `docs/principles` or `AGENTS.md`.** The design
principles check and the UI-state check in the grooming procedure have no source
to read here, so they are recorded as not applicable rather than invented. The
product boundary comes from the README and from the specs that exist.

**Scratch roots and the corpus filter.** The runner stages a skill without
`references/evals.md` and `references/evals/`, so a mutant root's corpus is only
used by the runner, never shown to the agent. The experiment must keep that
property; a root that leaks the answer key measures nothing.

## Prompt Notes

- Requirements: three rule-removal mutants of `review-code`, a reproduced
  baseline, three repetitions per mutation, a classification with trace evidence,
  and a README that a later reader can reproduce.
- Entities: mutation (a removed rule plus its restatements), root (a directory
  with `skills/review-code/` that `--root` discovers), discriminating case (#1,
  #3, #4), classification (detected, survivor, invalid).
- Approach: copy the skill once per root; edit only `SKILL.md`; verify load and
  parsing before spending repetitions; run the existing runner; read the traces
  instead of trusting the aggregate.
- Structure: `docs/evals/experiments/mutation/review-code/<variant>/skills/review-code/`
  and one `README.md` at the experiment root.
- Operations: baseline first, then M1, M2, M3 in that order — the cases they use
  are already covered by the matrix, so a baseline failure means the harness
  moved, not the skill.
- Norms: no new runner flag, no dependency, isolated home on (the default),
  commands and hashes in the README, Portuguese in the experiment prose.
- Safeguards: do not edit the real `skills/review-code/SKILL.md`; do not add
  cases beyond one; do not count an invalid mutant as detection; do not compare
  against the pre-isolation matrix numbers.
- Tests: none automated beyond the existing corpus checks. The experiment is the
  test; its evidence is the run artifacts and the traces.
