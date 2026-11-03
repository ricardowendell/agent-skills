---
id: SPEC-0006
title: Measure whether the eval corpus catches a broken skill
status: implemented
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
tests:
  - docs/evals/experiments/mutation/review-code/rule-coverage.md
  - docs/evals/experiments/mutation/review-code/README.md
---

# SPEC-0006: Measure whether the eval corpus catches a broken skill

## Purpose

The matrix proves that `review-code` separates from a run without it. That is a
statement about the skill, not about the corpus.

The open question is the inverse: if a rule that matters were removed from
`SKILL.md`, would any case fail? A corpus that cannot answer this cannot protect
the skill from a future edit.

The first draft named three rules whose coverage was already known — the gate
(`ranpass npm test`), the spec hash (case #4) and the unspoken review basis
(case #3, tightened the same day). All three would be detected by construction.
The second draft added a coverage map and picked probes from the uncovered rules.
The map was built first, and it changed the pilot again: see *Scope change*.

## User Outcome

A reader learns which rules of `review-code` have no assertion, which of those
could even manifest a defect with the current fixtures, and whether the one
control that is both covered and manifestable is caught. The map is the durable
artefact; the run tests whether the corpus can act on it.

## Scope

- **A coverage map, with no model runs.**
  `docs/evals/experiments/mutation/review-code/rule-coverage.md`: every rule of
  `review-code/SKILL.md` mapped to the assertion that would fail, or `no
  assertion`, plus a **manifestable** column — does any fixture create the
  temptation to violate it?
- **One control mutation**, `ignore-spec-sha` on case #4, expected to be covered
  by `reply spec hash:.*mismatch`. It tests whether the method can detect a
  mutation at all; the result was `invalid` (see Result), which is the finding,
  not a reason to rerun. The first control attempt, `no-gates` on case #1, is
  kept in the record as `invalid`: the fixture restates the gate rule, so the
  mutant could not isolate it.
- **No probe runs.** The map shows every uncovered rule is also not manifestable
  with the current fixtures (details in the map). A mutation there can only
  produce "defect not manifested", which the map already predicts and which does
  not distinguish a blind corpus from a redundant rule.
- The active roots are the untouched baseline and the control, under
  `docs/evals/experiments/mutation/review-code/`; the invalid `no-gates` root
  stays as evidence.
- Reproduce the baseline for case #4 (five repetitions), then run the control
  three times.
- Record protocol, map, hashes, commands, result and cost in the experiment
  directory, and open a task for each gap the map and the control found.

**Blast radius.** One skill's rule map, one experiment directory, one control
root, one follow-up task. No runner code, no new flag, no case-format change, no
other skill, no matrix re-run.

## Scope change

After the map was written, three things were true that the spec assumed otherwise:

1. Every rule without an assertion is also without a fixture that could tempt it.
   Step 6 (protections) needs a patch that weakens or deletes a test; step 2
   (range) needs an ambiguous base; step 9 (no merge/push) needs a remote; the
   two refusal conditions need prompts that do not exist. Running those mutations
   costs nine runs and answers nothing the map does not already say.
2. The map found a gap the original design missed: **"never approve with a
   failing gate" is half-asserted**. Case #1 proves the green path
   (`ranpass npm test`); no case presents a red gate and expects REJECT. That
   rule is not in the "no assertion" list because half of it is covered, which is
   exactly why a rule-level map is worth writing.
3. That gap is a **fixture** gap, not an assertion gap. A new assertion has
   nothing to fail against until a case stages a red gate.

## Non-Goals

- **Mutating rules that already have an assertion.** Only the control may do
  that; it exists to validate the method.
- **Probe runs on rules no fixture can tempt.** Recorded as a finding instead.
- **A mutation framework.** Two hand-made roots and `--root` are enough.
- **Changing `SKILL.md`.** Mutants are copies; the real skill is not edited.
- **Fixing the red-gate gap.** It becomes a task; the fixture and its measurement
  are separate work.
- **Semantic mutation.** Removal only.
- **Treating redundancy as a gap.** A rule the model follows without being told is
  a candidate for removal from the skill, not a corpus hole.

## Flow

1. Build the coverage map from the workflow steps, the refusal conditions, the
   review standards, the output shape and the guardrails of
   `review-code/SKILL.md`. For each rule, name the case and assertion that would
   fail, mark `no assertion`, and state whether a fixture could tempt the defect.
2. If an uncovered rule is manifestable, take up to two as probes and run them.
   If none is, record that in the map and run only the control.
3. Copy `skills/review-code` into the baseline and the control root.
4. Mutate the control (`ignore-spec-sha`): remove the spec-hash clause from
   step 3, the `(spec hash: match|mismatch|n/a)` status from the output template,
   and the guardrail that a stale spec is a grooming problem. The fixture records
   `spec_sha` but never tells the reviewer to compare it.
5. Validate every root: `--list --check` exits 0, `diff -r` shows only
   `SKILL.md`, and one throwaway run reports `loaded review-code` from inside the
   scratch dir.
6. Reproduce the baseline for case #4 at five repetitions. If it is not 5/5,
   stop: the harness moved and the pilot would measure that instead. A repetition
   that times out with an empty transcript is environmental, not a baseline miss:
   rerun at `--timeout 600` and record both attempts.
7. Run the control three times on case #4, inspecting one trace first.
8. Classify: `detected` (a named assertion failed **and** the trace shows the
   defect happened), `survivor` (3/3 passed and the trace shows the defect
   happened) or `invalid` (did not load, or never reached the mutated behaviour).
   A failing assertion is necessary but not sufficient: if it fails only because
   the mutant removed the output template the assertion quotes, the mutant never
   reached the behaviour and the run is `invalid`, not `detected`.
9. Write the README, and open a task for each gap the map and the control
   found.

## Data

No persistence. The experiment lives in
`docs/evals/experiments/mutation/review-code/`, with `rule-coverage.md` and
`README.md` at its root. The control root is a scratch artefact; the README says
how to rebuild it.

## UI Notes

Not applicable.

## Acceptance Criteria

- AC-1 — `rule-coverage.md` lists every rule of `review-code/SKILL.md`, each mapped
  to a case and assertion or marked `no assertion`, with a manifestability column
  and the reason. Verified by reading it against the skill file.
- AC-2 — The map's conclusion is checkable: for each uncovered rule, the fixture
  that would tempt it is named and shown absent, or the rule is marked
  manifestable and a probe is run. Verified by the map's evidence column.
- AC-3 — The baseline for the control's case (#4) is reproduced at 5/5 on the
  current harness before the control runs; the #1 baseline from the invalid first
  attempt is also recorded at 5/5. Verified in the result JSON.
- AC-4 — The control `ignore-spec-sha` is detected on case #4 by the
  `reply spec hash:.*mismatch` assertion; if it is not, the pilot stops and
  records a method failure. Verified by the result JSON and the failing assertion
  name.
- AC-5 — The active roots (baseline and `ignore-spec-sha`) are byte-identical
  except for `SKILL.md`, and both pass `--list --check`; the invalid `no-gates`
  root is kept as evidence with the same property. Verified by `diff -r` and the
  exit status.
- AC-6 — Every control run reports `loaded review-code` from inside the scratch
  dir; a run that loaded nothing is `invalid`, never detection. Verified by
  `skillGate` in the result JSON.
- AC-7 — The control is run three times and classified, with one transcript as
  evidence. Verified by the per-repetition results.
- AC-8 — The red-gate gap the map found is recorded as a task with the fixture it
  would need; no case is added in this spec. Verified by the backlog file.
- AC-9 — The README records repo sha, each root's `SKILL.md` hash, the model,
  the exact commands, the result and the cost in runs, for both control attempts.

## Result (2026-11-03)

Two control attempts, both **invalid**. The baseline is green; the corpus does
not catch the mutations for the reason the controls claim to test.

Environment: first attempt at `a248f6c` (`--timeout 240`), second at `6054b49`;
flash default, `build`, isolated home. Case #4 was re-measured at
`--timeout 600` after three 240 s timeouts with empty transcripts (environment,
not behaviour); the 240 s run is recorded in the README as evidence.

| step | runs | result | run |
| --- | --- | --- | --- |
| baseline #1 | 5 | 5/5 | `2026-11-03T11-18-06--review-code` |
| control `no-gates` #1 | 3 | 3/3, not detected | `2026-11-03T11-22-05--review-code` |
| baseline #4, 240 s | 5 | 2/5, three timeouts | `2026-11-03T11-52-15--review-code` |
| baseline #4, 600 s | 5 | 5/5 | `2026-11-03T12-12-41--review-code` |
| control `ignore-spec-sha` #4, before the 5/5 baseline | 3 | 0/3 | `2026-11-03T12-05-36--review-code` |
| control `ignore-spec-sha` #4, after the 5/5 baseline | 3 | 0/3 | `2026-11-03T12-21-41--review-code` |

**First control (`no-gates`, #1) — invalid.** The trace settles it: in all three
runs the agent executed `npm test` and saw 6 tests pass. The defect the mutant
should have produced — approving without running the gate — never happened. The
rule was not removed: it is still written in two other places in the same file
(step 1, "resolve … the gate commands"; the output template, `GATES: … — exact
commands and results`) and in two fixture files (the base `AGENTS.md`; the
implementation prompt, "`npm test` must pass"). A skill-only mutation cannot
remove the fixture's statement, so `ranpass` cannot be attributed to the removed
step.

**Second control (`ignore-spec-sha`, #4) — invalid.** The baseline reproduced
5/5 before the control, and the control ran 0/3 with `loaded: ["review-code"]` in
all three. But the trace again contradicts the assertion: in r1, r2 and r3 the
agent computed both hashes, compared them to the prompt pin and rejected naming
the stale spec. r3 ran `node spec-sha.mjs` and reported
`feb763b1…` vs `fa0d1363…`. The only failing assertion,
`reply spec hash:.*mismatch`, expects the template phrase the mutant removed; the
agents wrote `SPEC: SPEC-0007` and put the mismatch in prose. The defect —
reviewing as if the contract were current — did not happen.

The case also does not isolate the rule by verdict: the diff carries a second
defect (AC-3 now requires rejecting non-finite rates; the code only rejects
negatives), so `verdict REJECT` passes without the hash check. The only
rule-specific assertion left is the wording one.

**AC status.** AC-1, AC-2, AC-3, AC-5, AC-6, AC-7, AC-8 and AC-9 are met. AC-4
is **met only literally**: the named assertion failed, but the trace does not show
the mutated behaviour, which Flow 8 requires for `detected`. In substance the AC
is not met — the control is `invalid`, not `detected`. The fallback the AC
prescribes was followed: the pilot stopped before any probe and recorded the
failure. Under the spec's own categories both controls are `invalid`, not
`detected` and not `survivor`: a survivor requires the defect to have happened.

**What the failure is.** Two corpus defects, mirrored:

- `no-gates` failed because the fixture restates the rule, so the mutant could
  not isolate it.
- `ignore-spec-sha` failed because the assertion restates the output template, so
  a correct review that words the mismatch differently is scored as a miss.

The method remains unvalidated: neither control is a clean positive. The
follow-ups are TASK-21 (red-gate fixture, with the discrimination condition) and
TASK-22 (hash-only fixture plus a behaviour assertion for case #4).

The full record is in
`docs/evals/experiments/mutation/review-code/README.md`; the map gained sections
on both controls.

## Open Questions

**Control swapped.** The first control (`no-gates` on #1) was invalid because the
fixture restates the gate rule. The active control became `ignore-spec-sha` on
#4, where the fixture records the hash but never tells the reviewer to compare it
(decision taken 2026-11-03). It was also invalid: the assertion is coupled to the
output template the mutant removed. Both attempts stay in the record; Result
records both classifications.

**Probes dropped.** The spec's second draft promised two; the map showed none
would be manifestable. Running them would produce two "not manifested" results
that cannot be told apart from redundancy. The evidence is in the map, which is
checkable without a model.

**Three repetitions.** Only the control runs. Three is enough to read the trace,
not to estimate a rate: both controls were unanimous (3/3 pass, 3/3 fail) and the
classification came from the trace, not the count.

**No clean positive control yet.** The pilot did not validate the method; it
found two corpus defects instead. A next attempt needs a rule the fixture does
not restate and a defect that changes the verdict, not the wording (TASK-22 is
the concrete case).

**One model.** The default only.

**This repo has no `docs/product`, `docs/principles` or `AGENTS.md`.** The design
and copy checks in the grooming procedure have no source to read here, and are
recorded as not applicable rather than invented.

## Prompt Notes

- Requirements: a coverage map with no model runs, a manifestability column, one
  control mutation that must be detected, a reproduced baseline, three
  repetitions, and a README. Probes only if the map finds an uncovered rule that
  a fixture can tempt.
- Entities: rule, coverage map (rule → assertion → manifestable), control,
  root, classification (detected, survivor, invalid).
- Approach: map first; it decides the rest. If it closes the probe branch, say so
  and spend the runs on the control only.
- Structure: `docs/evals/experiments/mutation/review-code/<variant>/skills/review-code/`
  with `rule-coverage.md` and `README.md` at the experiment root.
- Operations: map, decide probes, copy roots, mutate control, validate, baseline,
  control runs, classify, record, open the gap task.
- Norms: no new runner flag, no dependency, isolated home on, `--timeout 240`,
  commands and hashes in the README, Portuguese in the experiment prose.
- Safeguards: don't edit the real `SKILL.md`; only the control may mutate a
  covered rule; don't count an invalid mutant as detection; don't compare against
  pre-isolation numbers; don't add cases for redundancy.
- Tests: the experiment is the test; evidence is the map, the run artifacts and
  the trace.
