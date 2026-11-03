---
spec: SPEC-0006
spec_sha: 1d7340dd37906d94f68bfd66c3db018791b24a42c4081b931297104f428a2a92
---

# Implementation Prompt: SPEC-0006 Mutation Pilot for review-code

## Source Spec

- docs/specs/SPEC-0006-mutation-pilot-review-code.md

## Requirements

**User outcome.** Two answers, in this order: which rules of `review-code` have no
assertion that would fail if the rule were disobeyed, and — for the two worst of
those — whether the corpus notices when the rule is removed.

**Scope.**

- A **coverage map** first, with no model runs: every numbered rule of
  `skills/review-code/SKILL.md` mapped to the case and assertion that would fail,
  or marked `no assertion`.
- **One control mutation**, `no-gates`, on case #1, known to be covered by
  `ranpass npm test`. It proves the method can detect a mutation at all.
- **Two probe mutations** on rules the map marks `no assertion`, chosen by blast
  radius — a violation that could let a bad change merge outranks one that only
  affects prose.
- Baseline reproduced first (#1, #3, #4 at five repetitions), then each mutation
  three times against its case.
- Four roots under `docs/evals/experiments/mutation/review-code/`.

**Acceptance criteria** (copied from the spec):

- AC-1 — `rule-coverage.md` lists every numbered rule, each mapped to a case and
  assertion or marked `no assertion`, with the two probe rules justified by blast
  radius.
- AC-2 — Baseline #1, #3, #4 reproduced at 5/5 each before any mutation, verified
  in the result JSON.
- AC-3 — The control `no-gates` is detected on case #1 by the gate assertion; if
  not, the pilot stops and records a method failure.
- AC-4 — The two probes target rules marked `no assertion`; only the control
  targets a covered rule.
- AC-5 — Three mutant roots are byte-identical to the baseline except `SKILL.md`,
  and each passes `--list --check`.
- AC-6 — Every mutation run reports `loaded review-code` from inside the scratch;
  a run that loaded nothing is `invalid`.
- AC-7 — Each mutation runs three times and is classified, with one transcript
  per mutation; survivors are split into *manifested and not caught* versus *not
  manifested*, quoting the trace line.
- AC-8 — At most one new case, only for a *manifested and not caught* survivor,
  added to both roots and re-run.
- AC-9 — The README records repo sha, each root's `SKILL.md` hash, the model, the
  commands, the per-mutation result and the cost in runs.

**Non-goals.** Do not mutate a rule that already has an assertion, except the
single control. Do not add a `--variant` flag or a mutation library. Do not edit
`skills/review-code/SKILL.md`. Do not fix what a survivor exposes. Do not mutate
semantically. Do not add a case for a redundancy.

## Entities

- **Rule** — one numbered instruction in the workflow, the rules list or the
  verifier section.
- **Coverage map** — rule → case + assertion, or `no assertion`.
- **Control** — a mutation of a rule the corpus is known to assert; its job is to
  fail if the method is broken.
- **Probe** — a mutation of a rule the map marks uncovered.
- **Root** — a directory containing `skills/review-code/`, discovered by `--root`.
- **Classification** — `detected`, `survivor`, `invalid`; survivors split into
  *manifested and not caught* and *not manifested*.

## Approach

Map before mutating, and mutate before measuring. The map costs no runs and
decides which two mutations are worth paying for; choosing them in advance is how
the first draft ended up testing three rules that already had assertions. The
control runs before the probes so a broken method is discovered at three runs
instead of nine.

## Structure

- `docs/evals/experiments/mutation/review-code/rule-coverage.md`
- `docs/evals/experiments/mutation/review-code/README.md`
- `docs/evals/experiments/mutation/review-code/baseline/skills/review-code/`
- `docs/evals/experiments/mutation/review-code/no-gates/skills/review-code/`
- `docs/evals/experiments/mutation/review-code/<probe-1>/skills/review-code/`
- `docs/evals/experiments/mutation/review-code/<probe-2>/skills/review-code/`

Only `SKILL.md` differs between roots.

## Operations

1. Read `skills/review-code/SKILL.md` end to end and
   `skills/review-code/references/evals.md` end to end. Build
   `rule-coverage.md`: one row per rule, with the case and assertion that would
   fail, or `no assertion`. Do not trust memory — several assertions changed on
   2026-11-03 and case #3 was rewritten.
2. Rank the `no assertion` rules by blast radius and take the top two as probes.
   Record the ranking and the reason in the map. If fewer than two rules are
   uncovered, the pilot shrinks to what the map found and says so.
3. Create the four roots and copy `skills/review-code` into each. Verify with
   `diff -r` that they are identical before editing.
4. Mutate the control `no-gates`: remove the requirement to run the project's
   gates and the rule that APPROVE depends on them. That rule lives in the
   workflow step that runs the gates, in the decision step, and in the rules list
   ("Never approve with a failing or unrun gate"). Remove all three.
5. Mutate probe 1: remove the rule and every sentence that restates it, so the
   rest of the skill cannot compensate.
6. Mutate probe 2 the same way.
7. Validate every root: `--list --check` exits 0; `diff -r` against the baseline
   shows only `SKILL.md`; one throwaway run reports `loaded review-code` from the
   scratch dir.
8. Reproduce the baseline for #1, #3 and #4, five repetitions each:
   ```
   node scripts/run-evals.mjs --root docs/evals/experiments/mutation/review-code/baseline/skills \
     --skill review-code --case 1 --repeat 5 --timeout 240 --run
   ```
   All three must be 5/5. Any other result stops the pilot.
9. Run the control three times on case #1:
   ```
   .../no-gates/skills --skill review-code --case 1 --repeat 3 --timeout 240 --run
   ```
   It must be detected by `ranpass npm test` (or another named assertion). If it
   is not, stop and record a method failure — do not run the probes.
10. Run each probe three times against its discriminating case, inspecting one
    trace before paying for the other two repetitions.
11. Classify from the per-repetition JSON and the traces. For a survivor, state
    which kind it is and quote the line that settles it. If the trace shows
    neither the defect nor a detection, record the mutation as inconclusive.
12. Write `README.md`: repo sha, `SKILL.md` sha256 per root, model, exact
    commands, per-mutation table, evidence run directories, cost in runs.
13. If a survivor is *manifested and not caught*, add at most one case to
    `references/evals.md` in both roots, re-run that mutation, and record it.
14. Set the spec `status: implemented`, fill `tests:`, and report.

## Norms

- Experiment prose in Portuguese; code, commands and commit messages in English.
- Conventional Commits, imperative subject at most 72 characters.
- Keep the runner's defaults: isolated home, `--timeout 240`, `--repeat` as stated.
- One directory per experiment, README at its root, evidence linked by run
  directory rather than by prose.
- No new dependencies, no new script, no new flag.

## Safeguards

- Do not edit `skills/review-code/SKILL.md` or its evaluations. Mutants are copies.
- Only the control may remove a rule the corpus already asserts; a probe on a
  covered rule would restate what is known.
- Do not stage `references/evals.md` or `references/evals/` where the agent can
  read them; the runner excludes them, and a root that leaks the answer key
  measures nothing.
- Do not count an invalid mutant, a failed load or a missing skill load as
  detection.
- Do not add a case for a rule the model follows without being told: that is
  redundancy, and the fix would be in the skill, not the corpus.
- Do not compare against the pre-isolation matrix numbers.
- Do not change the real skill in this task, even if a survivor looks fixable.

## Verification

| AC | Check |
| --- | --- |
| AC-1 | Map read against `SKILL.md`; every rule accounted for; probes justified |
| AC-2 | Baseline result JSON: `passed`, 5/5 on #1, #3, #4 |
| AC-3 | Control result JSON shows the gate assertion failing |
| AC-4 | Map marks both probes `no assertion`; `diff -r` shows only the intended rule removed |
| AC-5 | `diff -r` between roots; `--list --check` exit 0 per root |
| AC-6 | `skillGate.ok` true and `loaded` names `review-code` in every repetition |
| AC-7 | Per-repetition results plus one transcript per mutation; survivor lines quoted |
| AC-8 | `--list --check` totals and the re-run recorded |
| AC-9 | README has sha, hashes, model, commands, table and run count |

The work is done when every AC above holds, the map stands on its own as a
coverage record, and the spec is `implemented` with `tests:` filled.
