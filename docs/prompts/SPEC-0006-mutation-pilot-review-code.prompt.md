---
spec: SPEC-0006
spec_sha: c33c2e84f5c958d960a667f605223f8f4e93fda8c3091af8868840767f95adc3
---

# Implementation Prompt: SPEC-0006 Mutation Pilot for review-code

## Source Spec

- docs/specs/SPEC-0006-mutation-pilot-review-code.md

## Requirements

**User outcome.** Answer whether the eval corpus catches a broken skill: if a rule
that matters is removed from `review-code/SKILL.md`, does a case fail for the
right reason — and does the trace show the defect actually happened?

**Scope.**

- A **coverage map** first, with no model runs: every rule of
  `skills/review-code/SKILL.md` mapped to the case and assertion that would fail,
  or marked `no assertion`, plus a **manifestable** column — could any fixture
  tempt the violation?
- **One control**, `ignore-spec-sha`, on case #4. The fixture records `spec_sha`
  but never tells the reviewer to compare it. Remove the rule so the defect can
  appear.
- **No probes.** The map shows every uncovered rule is also not manifestable
  with the current fixtures. Record that instead of paying for runs that can only
  repeat it.
- Reproduce the case #4 baseline at five repetitions before the control, then
  run the control three times on #4.
- Keep the invalid first attempt (`no-gates`, case #1) as evidence, not as an
  active root.
- Three roots under `docs/evals/experiments/mutation/review-code/`: baseline,
  `no-gates` (invalid), and `ignore-spec-sha`.
- Record protocol, map, hashes, commands, result and cost in the experiment
  directory, and open a task for the red-gate fixture gap the map found.

**Acceptance criteria** (copied from the spec):

- AC-1 — `rule-coverage.md` lists every rule, each mapped to a case and assertion
  or marked `no assertion`, with a manifestability column and the reason.
- AC-2 — For each uncovered rule, the fixture that would tempt it is named and
  shown absent, or the rule is marked manifestable and a probe is run.
- AC-3 — The baseline for the control's case (#4) is reproduced at 5/5 before the
  control runs; the #1 baseline from the first attempt is also recorded at 5/5.
- AC-4 — The control `ignore-spec-sha` is detected on case #4 by the
  `reply spec hash:.*mismatch` assertion; if not, the pilot stops and records a
  method failure.
- AC-5 — The active roots are byte-identical except for `SKILL.md`, and both pass
  `--list --check`; the invalid `no-gates` root keeps the same property.
- AC-6 — Every control run reports `loaded review-code`; a run that loaded
  nothing is `invalid`, never detection.
- AC-7 — The control runs three times and is classified, with one transcript as
  evidence.
- AC-8 — The red-gate gap is recorded as a task with the fixture it would need;
  no case is added in this spec.
- AC-9 — The README records repo sha, each root's `SKILL.md` hash, the model, the
  exact commands, the result and the cost in runs, for both control attempts.

**Non-goals.** No new runner flag, dependency or mutation library. Do not edit
`skills/review-code/SKILL.md` or its evaluations. Do not add a case. Do not fix
what a survivor exposes. Do not count a load failure, a timeout with an empty
transcript, or an assertion that only quotes the removed output template as
detection.

## Entities

- **Rule** — one instruction in the workflow, the refusal conditions, the review
  standards, the output shape or the guardrails.
- **Coverage map** — rule → case + assertion, or `no assertion`, plus
  manifestable or not.
- **Control** — a mutation of a rule the corpus claims to assert; its job is to
  fail if the method is broken.
- **Root** — a directory containing `skills/review-code/`, discovered by
  `--root`.
- **Classification** — `detected`, `survivor`, `invalid`; a survivor is
  *manifested and not caught* or *not manifested*.

## Approach

Map first; it decides everything else and costs no runs. Then one control on the
one rule that is both covered and manifestable. The first control failed because
the fixture restated the gate rule; do not repeat that design error. A control
must remove the rule and every sentence that restates it, including the output
template and any fixture text that gives the same instruction.

Detection needs two things: a named assertion fails **and** the trace shows the
mutated behaviour. An assertion that fails only because the mutant removed the
template it quotes is a false positive. Classify that run `invalid` and record
the assertion coupling — do not claim the method works.

## Structure

- `docs/evals/experiments/mutation/review-code/rule-coverage.md`
- `docs/evals/experiments/mutation/review-code/README.md`
- `docs/evals/experiments/mutation/review-code/baseline/skills/review-code/`
- `docs/evals/experiments/mutation/review-code/no-gates/skills/review-code/`
- `docs/evals/experiments/mutation/review-code/ignore-spec-sha/skills/review-code/`

Only `SKILL.md` differs between roots. The roots are scratch and gitignored; the
README says how to rebuild them.

## Operations

1. Read `skills/review-code/SKILL.md` and `references/evals.md` end to end. Build
   `rule-coverage.md`: one row per rule, the case and assertion that would fail or
   `no assertion`, and whether a fixture can tempt the violation.
2. If no uncovered rule is manifestable, say so in the map and run only the
   control.
3. Copy `skills/review-code` into `baseline/`, `no-gates/` and
   `ignore-spec-sha/`. Verify with `diff -r` that they are identical before
   editing.
4. Mutate `no-gates` as the invalid first attempt: remove the gate step, the
   gate clause in the decision and the "never approve with a failing or unrun
   gate" guardrail.
5. Mutate `ignore-spec-sha`: remove the spec-hash clause from step 3, the
   `(spec hash: match|mismatch|n/a)` status from the output template, and the
   guardrail that a stale spec is a grooming problem. Leave no other sentence
   that tells the reviewer to compare the hash.
6. Validate every root: `--list --check` exits 0; `diff -r` against the baseline
   shows only `SKILL.md`; one throwaway run reports `loaded review-code` from the
   scratch dir.
7. Reproduce baseline #1 and #4 at five repetitions:
   ```
   node scripts/run-evals.mjs --root docs/evals/experiments/mutation/review-code/baseline/skills \
     --skill review-code --case 4 --repeat 5 --timeout 600 --run
   ```
   #4 must be 5/5 before the control runs. If a repetition times out with an
   empty transcript and `loaded: []`, that is environmental: retry with
   `--timeout 600` and record both attempts. Do not treat it as behaviour.
8. Run the control three times on #4, after the 5/5 baseline:
   ```
   .../ignore-spec-sha/skills --skill review-code --case 4 --repeat 3 --timeout 600 --run
   ```
   Inspect one trace before paying for the other two.
9. Classify from the per-repetition JSON and the traces. `detected` requires the
   failing assertion **and** the mutant behaviour in the trace. `survivor`
   requires 3/3 passing and the behaviour present. `invalid` covers a failed
   load, an empty timeout, or a run that never reached the mutated behaviour —
   including a wording-only assertion failure. Quote the line that settles it.
10. Write `README.md`: repo sha, `SKILL.md` sha256 per root, model, exact
    commands, per-run table, evidence directories, cost in runs, and both control
    attempts.
11. Open the red-gate fixture task if it does not exist (TASK-21) with the
    discrimination condition: the fixture must not restate the gate command.
12. Update the spec `## Result` with both controls, set `status: implemented`,
    fill `tests:`, and report. If AC-4's positive branch is not met, report the
    failure instead of claiming detection.

## Norms

- Experiment prose in Portuguese; code, commands and commit messages in English.
- Conventional Commits, imperative subject at most 72 characters.
- Keep the runner's defaults: isolated home, `--repeat` as stated. `--timeout`
  may be raised to 600 to separate an environment timeout from behaviour, and the
  README records both attempts.
- One directory per experiment, README at its root, evidence linked by run
  directory rather than by prose.
- No new dependencies, no new script, no new flag.

## Safeguards

- Do not stage `references/evals.md` or `references/evals/` where the agent can
  read them; the runner excludes them, and a root that leaks the answer key
  measures nothing.
- Do not count an invalid mutant, a failed load, an empty timeout or a
  wording-only assertion as detection.
- Do not add a case for a rule the model follows without being told: that is
  redundancy, and the fix would be in the skill, not the corpus.
- Do not change the real skill in this task, even if a survivor looks fixable.
- Do not compare against the pre-isolation matrix numbers.
- Do not commit the roots; they are scratch.

## Verification

| AC | Check |
| --- | --- |
| AC-1 | Map read against `SKILL.md`; every rule accounted for |
| AC-2 | Each uncovered rule has the tempting fixture named and shown absent |
| AC-3 | Result JSON: #1 and #4 at 5/5; #4's 5/5 precedes the control run |
| AC-4 | Control result JSON plus trace: assertion failure and the defect, or a recorded failure |
| AC-5 | `diff -r` between roots; `--list --check` exit 0 per root |
| AC-6 | `skillGate.ok` true and `loaded` names `review-code` in every repetition |
| AC-7 | Per-repetition results plus one transcript; classification quoted |
| AC-8 | TASK-21 contains the fixture and the discrimination condition |
| AC-9 | README has sha, hashes, model, commands, table and run count |

The work is done when every AC above holds, the map stands on its own as a
coverage record, and the spec is `implemented` with `tests:` filled — or the
failed AC is recorded with the fallback the spec prescribes.
