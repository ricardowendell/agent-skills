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
the skill from a future edit.

The first draft of this spec chose three rules whose coverage was already known:
the gate (`ranpass npm test` on case #1), the spec hash (case #4) and the
unspoken review basis (case #3, tightened the same day). All three would be
detected by construction. That measures the method, not the corpus. The design
below separates the two.

## User Outcome

A reader learns two things. First, which rules of `review-code` have no
assertion that would fail if the rule were disobeyed — a coverage map that costs
no model runs. Second, for the two rules that map to nothing, whether the corpus
notices when the rule is removed, and if not, whether the defect happened and was
missed or never happened at all.

## Scope

- **A coverage map, first and without model runs.** Every numbered rule in
  `skills/review-code/SKILL.md` mapped to the assertion that would fail if it were
  violated, or explicitly marked `no assertion`. Deliverable:
  `docs/evals/experiments/mutation/review-code/rule-coverage.md`.
- **One control mutation**, chosen because it is known to be asserted:
  `no-gates` on case #1 (`ranpass npm test`). Its purpose is to prove the method
  can detect a mutation at all. If it is not detected, the pilot stops.
- **Two probe mutations** on rules the map marks `no assertion`, chosen by blast
  radius: the ones whose violation could reach a merge unnoticed. The map decides
  which; the spec does not name them in advance.
- Four roots under
  `docs/evals/experiments/mutation/review-code/`: an untouched baseline, the
  control, and the two probes.
- Reproduce the baseline first (cases #1, #3, #4 at five repetitions), then run
  each mutation three times against its discriminating case.
- Record protocol, map, hashes, commands, results and cost in the experiment
  directory.

**Blast radius.** One skill's rule map, one experiment directory, at most one new
case. No runner code, no new flag, no case-format change, no other skill, no
matrix re-run.

## Non-Goals

- **Mutating rules that already have an assertion.** Only the single control may
  do that; it exists to validate the method. A probe on a covered rule restates
  what the corpus already claims.
- **A mutation framework.** Four hand-made roots and `--root` are enough.
- **Changing `SKILL.md`.** Mutants are copies; the real skill is not edited.
- **Fixing what a survivor exposes.** A gap becomes a task, measured separately.
- **Semantic mutation.** Removal only.
- **Treating redundancy as a gap.** A rule the model follows without being told is
  not a corpus hole; it is a candidate for removal from the skill, and that is a
  different decision with its own evidence.
- **Every skill and every case.** One skill, three mutations, one case each.

## Flow

1. Build the coverage map from the workflow steps, the rules list and the
   verifier section of `review-code/SKILL.md`. For each rule, name the case and
   assertion that would fail. Mark the rest `no assertion`. Re-read the case
   files for this; do not trust memory of what the corpus checks.
2. Rank the `no assertion` rules by blast radius: a violation that could let a
   bad change merge ranks above one that only affects the report's prose.
3. Take the top two as probes. Record the ranking and why these two won.
4. Copy `skills/review-code` into the baseline and into three mutant roots.
5. Mutate the control (`no-gates`) and the two probes, each by removing the rule
   **and** every sentence that restates it.
6. Validate every root: `--list --check` exits 0, `diff -r` against the baseline
   shows only `SKILL.md`, and one throwaway run reports `loaded review-code` from
   inside the scratch dir.
7. Reproduce the baseline for #1, #3 and #4 at five repetitions. If one is not
   5/5, stop: the harness moved and the pilot would measure that instead.
8. Run the control three times. If it is not detected, stop and report the method
   as broken; the probes would mean nothing.
9. Run each probe three times, inspecting one trace before paying for the other
   repetitions.
10. Classify each mutation: `detected` (a named assertion failed), `survivor`
    (3/3 passed and the trace shows the defect happened) or `invalid` (did not
    load, or the agent never reached the mutated behaviour).
11. For each survivor, state the kind and quote the line that settles it. Only
    *manifested and not caught* produces a new case (at most one), added to both
    roots and re-run. *Not manifested* is recorded as redundancy, with no corpus
    change.

## Data

No persistence. The experiment lives in
`docs/evals/experiments/mutation/review-code/`, with `rule-coverage.md` and
`README.md` at its root. Mutant roots are scratch artefacts; the README must say
how to rebuild them.

## UI Notes

Not applicable.

## Acceptance Criteria

- AC-1 — `rule-coverage.md` lists every numbered rule of `review-code/SKILL.md`,
  each mapped to a case and assertion or marked `no assertion`, and the two probe
  rules are justified by blast radius. Verified by reading the map against the
  skill file.
- AC-2 — The baseline for #1, #3 and #4 is reproduced on the current harness at
  5/5 each before any mutation runs, verified in the result JSON.
- AC-3 — The control mutation `no-gates` is detected on case #1 by the gate
  assertion; if it is not, the pilot stops and the failure is recorded as a
  method failure. Verified by the result JSON and the failing assertion name.
- AC-4 — The two probes target rules the map marks `no assertion`, and only the
  control targets a rule that already has one. Verified by cross-reading the map,
  the roots and `diff -r`.
- AC-5 — Three mutant roots exist, byte-identical to the baseline except for the
  removed rule in `SKILL.md`, and each passes `--list --check`. Verified by
  `diff -r` and the command's exit status.
- AC-6 — Every mutation run reports `loaded review-code` from inside the scratch
  dir; a run that loaded nothing is `invalid`, never detection. Verified by
  `skillGate` in the result JSON.
- AC-7 — Each mutation is run three times and classified, with one transcript per
  mutation as evidence; survivors are split into *manifested and not caught*
  versus *not manifested*, quoting the trace line. Verified by the results and
  the README.
- AC-8 — At most one new case is added, and only for a *manifested and not
  caught* survivor; it is added to both roots and the mutation is re-run.
- AC-9 — The README records repo sha, the `SKILL.md` hash of each root, the model,
  the exact commands, the per-mutation result and the cost in runs.

## Open Questions

**Blocking — none.** Four judgements are recorded rather than asked.

**Which two probes.** The map decides, the spec does not. Naming them now would
repeat the original mistake: guessing coverage instead of reading it.

**Three repetitions is a small sample.** A survivor at 3/3 is weak evidence, so
the trace decides: a detection needs the named assertion, a survivor needs the
defect visible. A mutation whose trace shows neither is recorded as inconclusive.

**One model.** The default only. The matrix already shows both models agreeing on
the baseline.

**This repo has no `docs/product`, `docs/principles` or `AGENTS.md`.** The design
and copy checks in the grooming procedure have no source to read here, and are
recorded as not applicable rather than invented.

## Prompt Notes

- Requirements: a coverage map with no model runs, one control mutation that must
  be detected, two probes on rules the map marks uncovered, a reproduced baseline,
  three repetitions each, a classification with trace evidence, and a README.
- Entities: rule (a numbered instruction in `SKILL.md`), coverage map (rule →
  assertion), control (known-covered mutation), probe (uncovered mutation),
  root, classification (detected, survivor, invalid).
- Approach: map first, then choose; copy once per root; edit only `SKILL.md`;
  verify load before spending repetitions; run the existing runner.
- Structure: `docs/evals/experiments/mutation/review-code/<variant>/skills/review-code/`
  with `rule-coverage.md` and `README.md` at the experiment root.
- Operations: map, rank, control, probes, baseline, control run, probe runs,
  classify, record.
- Norms: no new runner flag, no dependency, isolated home on, `--timeout 240`,
  commands and hashes in the README, Portuguese in the experiment prose.
- Safeguards: don't edit the real `SKILL.md`; only the control may mutate a
  covered rule; don't count an invalid mutant as detection; don't compare against
  pre-isolation numbers; don't add cases for redundancy.
- Tests: the experiment is the test; evidence is the run artifacts and the
  traces.
