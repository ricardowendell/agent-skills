---
spec: SPEC-0006
spec_sha: e1ef43410b9727f7680781293e440706f8ca63a4687de96a578817933bd6e141
---

# Implementation Prompt: SPEC-0006 Mutation Pilot for review-code

## Source Spec

- docs/specs/SPEC-0006-mutation-pilot-review-code.md

## Requirements

**User outcome.** A reader of `docs/evals/experiments/mutation/review-code/README.md`
learns which `review-code` rules the corpus actually defends, which mutations
survived, and — for each survivor — whether the agent failed to show the defect
or the assertions failed to catch it.

**Scope.**

- Three rule-removal mutations of `review-code`, each with its discriminating case:
  `no-gates` → case #1, `ignore-spec-sha` → case #4,
  `decide-without-declaration` → case #3.
- Four roots: one untouched baseline, three mutants, each a full copy of
  `skills/review-code` under
  `docs/evals/experiments/mutation/review-code/<variant>/skills/review-code/`.
- Reproduce the baseline first, then run each mutation three times.
- Record protocol, hashes, commands, results and cost in the experiment `README.md`.

**Acceptance criteria** (copied from the spec):

- AC-1 — The baseline for #1, #3 and #4 is reproduced on the current harness
  before any mutation runs, and the run artifacts show the same case status as
  the matrix records (5/5 each with the skill). Verified by the result JSON, not
  by the console summary.
- AC-2 — Three mutant roots exist, each byte-identical to the baseline except for
  the removed rule in `SKILL.md`, and
  `node scripts/run-evals.mjs --root <mutant>/skills --list --check` exits 0 for
  all of them. Verified by diffing the roots and by the command's exit status.
- AC-3 — Every mutation run shows `loaded review-code` from inside the scratch
  dir; a run that loaded nothing is **invalid**, not detection. Verified by
  `skillGate` in the result JSON.
- AC-4 — Each mutation runs three times against its case and is classified:
  detected (a named assertion failed in at least one repetition), survivor (three
  of three passed and the trace shows the defect was manifested), or invalid.
  Verified by per-repetition results plus one transcript per mutation.
- AC-5 — For every survivor the README states which kind it is — manifested and
  not caught, or not manifested — quoting the trace line that settles it.
- AC-6 — The README records repo sha, the `SKILL.md` hash of each root, the
  model, the exact commands, the per-mutation result and the cost in runs.
- AC-7 — If and only if a survivor is a real gap, one new case is added to both
  roots and that mutation is re-run; the corpus grows by at most one case.

**Non-goals.** Do not add a `--variant` flag, scheduler or mutation library. Do
not edit `skills/review-code/SKILL.md` — mutants are copies. Do not fix what a
survivor exposes. Do not mutate semantically (rewrite a rule to be subtly wrong);
removal only. Do not run other skills or other cases. Do not count an invalid
mutant as detection.

## Entities

- **Mutation** — one removed rule plus every sentence that restates it, so the
  rest of the skill cannot compensate.
- **Root** — a directory containing `skills/review-code/`, discoverable by
  `--root`.
- **Discriminating case** — the case whose assertions can fail only if the
  removed rule mattered: #1 for gates, #4 for the spec hash, #3 for the
  undeclared review basis.
- **Classification** — `detected`, `survivor`, `invalid`; survivors split into
  *manifested and not caught* versus *not manifested*.
- **Baseline** — the untouched copy, run on the current harness.

## Approach

Copy first, then mutate, then validate, then measure. The order matters: a mutant
that fails to load produces a red run that looks like detection, so loading is
verified before any repetition is paid for. The baseline is reproduced before the
mutants so a red result can be attributed to the mutation rather than to a
harness that moved since the matrix.

The three rules already exist in `skills/review-code/SKILL.md`; do not invent
replacements. For each mutation, remove the rule and its restatements, and leave
the surrounding prose coherent — a `SKILL.md` that contradicts itself measures an
ambiguous skill instead of a broken one.

## Structure

- `docs/evals/experiments/mutation/review-code/README.md` — protocol and results.
- `docs/evals/experiments/mutation/review-code/baseline/skills/review-code/`
- `docs/evals/experiments/mutation/review-code/no-gates/skills/review-code/`
- `docs/evals/experiments/mutation/review-code/ignore-spec-sha/skills/review-code/`
- `docs/evals/experiments/mutation/review-code/decide-without-declaration/skills/review-code/`

Each root carries the same `references/evals.md` and `references/evals/**` as the
real skill. Only `SKILL.md` differs, and only in the mutant roots.

## Operations

1. Create the four roots and copy `skills/review-code` into each. Verify with
   `diff -r` that every mutant root is identical to the baseline at this point.
2. Mutate **`no-gates`**. In `SKILL.md`, remove the requirement to run the
   project's gates and to hold a verdict on a red or unrun gate. Today that rule
   lives in the workflow step that runs the gates, in the decision step that makes
   APPROVE contingent on them, and in the rules list ("Never approve with a
   failing or unrun gate"). Remove all three; do not replace them with a weaker
   instruction, and do not touch unrelated steps.
3. Mutate **`ignore-spec-sha`**. Remove the stale-spec rule: the workflow step
   that stops when the recorded spec hash no longer matches, and the rule that the
   verdict line carries `(spec hash: mismatch)` and sends the change back. Leave
   the rest of the evidence walk intact, so the mutant still reviews — it just
   reviews against a contract that moved.
4. Mutate **`decide-without-declaration`**. Remove the rule that a missing spec
   must be declared by the user before the review adopts a fallback basis, and the
   rules-list statement that an unanswered question is not a declaration. The
   mutant should be able to decide on its own initiative when no basis is given.
5. Validate every root before measuring:
   - `node scripts/run-evals.mjs --root <root>/skills --list --check` exits 0.
   - `diff -r baseline/skills/review-code <mutant>/skills/review-code` shows only
     `SKILL.md`, and only the lines the mutation intended.
   - One throwaway run per mutant root reports `loaded review-code` from inside
     the scratch dir; otherwise fix the root before spending repetitions.
6. Reproduce the baseline, five repetitions per case:
   ```
   node scripts/run-evals.mjs --root docs/evals/experiments/mutation/review-code/baseline/skills \
     --skill review-code --case 1 --repeat 5 --timeout 240 --run
   ```
   and the same for `--case 3` and `--case 4`. All three must land at 5/5. If one
   does not, stop: the harness moved and the pilot would measure that instead.
7. Run the mutations, three repetitions each, in this order:
   ```
   .../no-gates/skills --skill review-code --case 1 --repeat 3 --timeout 240 --run
   .../ignore-spec-sha/skills --skill review-code --case 4 --repeat 3 --timeout 240 --run
   .../decide-without-declaration/skills --skill review-code --case 3 --repeat 3 --timeout 240 --run
   ```
   Inspect one trace per mutation before paying for the other two repetitions. If
   the mutant still obeys the rule, the result is inconclusive about the corpus;
   do not force a failure to produce a rate.
8. Classify each mutation from the per-repetition result JSON and the traces:
   - `detected` when a named assertion failed; record the assertion.
   - `survivor` when 3/3 passed and the transcript shows the defect happened.
   - `invalid` when the run loaded nothing, the root did not parse, or the trace
     shows the agent never reached the mutated behaviour.
   For a survivor, state which kind it is and quote the line that settles it.
9. Write `README.md` with: repo sha, the `SKILL.md` sha256 of each root, the
   model, the exact commands, the per-mutation table, the traces or run
   directories used as evidence, and the cost in runs.
10. If a survivor is a real gap, add at most one case to `references/evals.md` in
    **both** roots, re-run that mutation, and record the new case and the re-run
    in the README.
11. Set the spec `status: implemented`, fill `tests:`, and report the results.

## Norms

- Commands and results in the README; experiment prose in Portuguese, code and
  commit messages in English.
- Conventional Commits, imperative, at most 72 characters in the subject.
- Keep the runner's defaults: isolated home, `--timeout 240` to bound a stalled
  run, `--repeat` as stated.
- Match the surrounding experiment conventions: one directory per experiment,
  README at its root, evidence linked by run directory, not by prose.
- No new dependencies, no new script, no new flag.

## Safeguards

- Do not edit `skills/review-code/SKILL.md` or its evaluations. Mutants are
  copies under the experiment directory.
- Do not stage `references/evals.md` or `references/evals/` inside a root that the
  agent can read: the runner already excludes them from the scratch copy, and a
  root that leaks the answer key measures nothing.
- Do not add more than one new case, and only after a survivor is shown to be a
  real gap.
- Do not treat an invalid mutant, a failed load or a missing skill load as
  detection.
- Do not compare against the pre-isolation matrix numbers; the baseline for this
  pilot is the isolated one.
- Do not change the real skill in this task, even if a survivor looks obviously
  fixable.

## Verification

| AC | Check |
| --- | --- |
| AC-1 | Baseline result JSON for #1, #3, #4 shows `passed`, 5/5 each |
| AC-2 | `diff -r` between roots prints only `SKILL.md`; `--list --check` exits 0 for each root |
| AC-3 | `skillGate.ok` is true and `loaded` names `review-code` in every mutation repetition |
| AC-4 | Per-repetition results and one transcript per mutation, classified |
| AC-5 | README quotes the trace line for every survivor |
| AC-6 | README has sha, hashes, model, commands, table and run count |
| AC-7 | `--list --check` totals show at most one added case, and the re-run is recorded |

The work is done when every AC above holds, the README reads as a standalone
record, and the spec is `implemented` with `tests:` filled.
