---
spec: SPEC-0005
spec_sha: 30e5f12e2794237b5e887ff297a9f798a997ab7b15d5441f181425e7557e20ff
---

# Implementation Prompt: SPEC-0005 Apply the ratchet when the prompt grants approval

## Source Spec

- docs/specs/SPEC-0005-approval-given-apply.md

## Requirements

**User outcome.** A reader of the `tighten-harness` coverage sees both halves of
the approval contract: a run with no answer changes nothing, and a run with an
explicit yes applies the ratchet and leaves the source alone.

**Scope.**

- One new case, `tighten-harness` #6, with its own fixture.
- The approval is stated in the prompt; nothing else changes in the case format.
- Run the case three times; the rate decides `manual` or runnable.

**Acceptance criteria** (copied from the spec):

- AC-1 — Case #6 exists with a fixture and outcome assertions:
  `changed eslint.config.js`, `unchanged src/big.js`, `unchanged src/small.js`,
  `unchanged justfile`, `unchanged package.json`, `unchanged AGENTS.md`.
- AC-2 — The case runs three times. A run that applies the ratchet passes; a run
  that stops after the proposal fails `changed eslint.config.js` and names it.
  The case gates on `tighten-harness`.
- AC-3 — At 3/3 the case is runnable. If it stops in all three runs, write the
  step-6 clarification in `SKILL.md` and re-measure. If it is still below 3/3,
  it keeps `status: manual`, and its `why:` carries the rate and the assertion
  that failed.
- AC-4 — `--list --check` passes, and its totals match the case's `status:`.
- AC-5 — The paragraph in `skills/tighten-harness/references/evals.md` saying the
  apply path "stays manual until the runner can stage a reply" is replaced by the
  measured result and points at #6; the preamble's fixture-case list includes #6.

**Non-goals.** Do not add a `- reply:` line or a second turn
(`opencode run --continue`). Do not build a generic approval mechanism. Do not
stage answers for the bootstrap product interview. Do not re-measure case #1. Do
not change the skill text before measuring, and do not make a machine check that
the new value is stricter than 400.

## Entities

| Term | Meaning |
| --- | --- |
| ratchet | one tightening of an existing sensor (here, the file-length ceiling) |
| approval | the user's yes; in this case it is in the prompt, not a second turn |
| stop path | case #1: proposes, waits, applies nothing |
| apply path | case #6: approval given, applies the config change |
| outcome assertion | `changed` / `unchanged` on a path the behaviour would move |

## Approach

Start from case #1's fixture rather than inventing a new project: the case is
about applying, so the tree should look exactly like the one the skill already
knows. The only deliberate difference is the `justfile`: case #1 runs
`npx eslint .`, which needs an install; case #6 runs `node --check src/*.js`, so
the gate really runs in the scratch dir with no network.

The prompt carries the approval because the runner is single-turn. Do not
simulate an answer in a file and do not add a flag: the skill's step 6 says an
absent approval is not approval, and the user's message is the approval.

Leave the case gated (no `gate: off`). A pass must prove the skill ran, not that
a control agent happened to edit the config.

## Structure

- `skills/tighten-harness/references/evals/6/` — `AGENTS.md`,
  `eslint.config.js`, `justfile`, `package.json`, `src/big.js`, `src/small.js`.
- `skills/tighten-harness/references/evals.md` — case #6 and the stale preamble
  paragraph.

## Operations

1. **Create the fixture.** Copy
   `skills/tighten-harness/references/evals/1/` to `.../evals/6/`. Change only
   `justfile`:

   ```just
   check: lint

   lint:
     node --check src/big.js
     node --check src/small.js
   ```

   Keep `AGENTS.md`, `eslint.config.js`, `package.json`, `src/big.js` and
   `src/small.js` byte-identical to case #1.

2. **Write case #6** in `skills/tighten-harness/references/evals.md`, after case
   #5:

   ```md
   6. **Apply the ratchet when the prompt grants approval.**
      - prompt: Tighten the harness and apply the change — I approve it.
      - why: the other half of case 1; here the user says yes in the same message
      - expect: Measures the headroom before changing anything.
      - expect: Applies exactly one tightening to `eslint.config.js`, not to the source.
      - expect: Reports the sensor, the old and new value, and the gates it ran.
      - expect: Watch for: stopping as if approval were missing, or refactoring source.
      - assert: changed eslint.config.js
      - assert: unchanged src/big.js
      - assert: unchanged src/small.js
      - assert: unchanged justfile
      - assert: unchanged package.json
      - assert: unchanged AGENTS.md
   ```

   No `tags`, no `gate: off`, no `status:` line yet.

3. **Measure.** Run

   ```sh
   node scripts/run-evals.mjs --root skills --skill tighten-harness --case 6 --repeat 3 --run
   ```

4. **Set the status from the rate.** At 3/3 add nothing (runnable) and put the
   measured rate in `why:`. If all three runs stop after the proposal despite the
   approval, make the one permitted skill edit in step 6 of
   `skills/tighten-harness/SKILL.md`, replacing

   > An unanswered or absent approval is **not** approval: in a non-interactive or
   > auto-approved run, stop after the proposal and apply nothing.

   with

   > An explicit yes in the user's message is approval, even in a non-interactive
   > run. A run with no such message is not: stop after the proposal and apply
   > nothing.

   Re-run the three repetitions. If it is still below 3/3, add
   `- status: manual` and record the rate plus the assertion that failed in
   `why:` — if the skill still stops, say that it read the run as lacking
   approval.

5. **Fix the preamble.** In the same file, replace:

   > Case 1 therefore asserts the proposal-and-stop path; the apply-after-approval
   > path stays manual until the runner can stage a reply.

   with the measured result and a pointer to #6. Also add #6 to the sentence that
   lists the fixture cases at the top of the file.

6. **Update the spec** to `implemented` with the final measured rate in
   AC-2/AC-3 (and note whether the skill sentence was needed), then regenerate
   this prompt's `spec_sha` with
   `shasum -a 256 docs/specs/SPEC-0005-approval-given-apply.md`.

## Norms

- Fixtures stay small and self-contained; no install step, no network.
- A case states what it checks; `why:` may carry a rate, `expect:` stays a
  behaviour.
- Conventional commits, imperative subject ≤72 chars, body explains why.
- The new case is a behaviour case: it must load `tighten-harness` from the
  scratch copy (the gate checks provenance).

## Safeguards

- Do not assert `unchanged eslint.config.js` — the case exists because that file
  must change.
- Do not weaken, re-tag or re-measure case #1.
- Do not add a runner flag, a case-format field, or a second `opencode run`.
- Do not change `SKILL.md` before measuring. The only permitted edit is the
  step-6 sentence above, and only after all three runs refuse an explicit
  approval; change nothing else in the skill.
- Do not add a check that the new limit is numerically stricter: a regex that
  excludes `400` also misses a legitimate `350`. The value lives in `expect:`.
- Do not touch `src/big.js` or `src/small.js` in the fixture to make a ratchet
  easier: the ceiling and the headroom are the point.
- Do not touch the matrix, the runner, or another skill's cases.

## Verification

| AC | Check |
| --- | --- |
| AC-1 | `ls skills/tighten-harness/references/evals/6`; the case block lists the six assertions and no `notskill` |
| AC-2 | The three repetitions: `changed eslint.config.js` passes and every `unchanged` passes; read one transcript to confirm the skill loaded and named the ratchet |
| AC-3 | `status:` and `why:` match the final measured rate; if the skill sentence was needed, the spec and the re-run say so; below 3/3 the failing assertion is named |
| AC-4 | `node scripts/run-evals.mjs --root skills --list --check` passes and its totals match the case files |
| AC-5 | The preamble paragraph points at #6 and states the measured outcome; #6 is in the fixture-case list |

Also run `node --test scripts/lib/evals/*.test.mjs`. Done when every AC passes
and the spec status is `implemented`.
