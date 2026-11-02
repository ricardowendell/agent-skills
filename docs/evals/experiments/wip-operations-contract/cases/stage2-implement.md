# Evals — implement-from-prompt (experiment, stage 2)

Stage 2 of `wip-operations-contract`. The prompt was generated in stage 1 by a
frozen copy of `write-implementation-prompt` and copied into this fixture; this
case measures what that artifact produces, not what it looks like.

`gate: off` on purpose: the question is whether the prompt carries enough to
produce a correct implementation, so a trigger miss must not be scored as one.

1. **Implement the generated prompt.**
   - prompt: Implement docs/prompts/SPEC-0014-import-limits.prompt.md.
   - why: the prompt is the only input; the acceptance oracle and the spec are in the fixture.
   - gate: off
   - expect: Adds `src/import.js` and leaves the acceptance test untouched.
   - expect: Reuses `src/csv.js` instead of re-deriving line splitting.
   - expect: Runs `node --test` and reports the result.
   - expect: Marks the spec implemented, per the skill. (Measured by hand: run-to-run variance in the implementer, not a property of the prompt.)
   - assert: file src/import.js
   - assert: unchanged test/import.test.js
   - assert: unchanged src/csv.js
   - assert: ranpass node --test

2. **Implement the generated prompt (partial oracle).**
   - prompt: Implement docs/prompts/SPEC-0015-import-validation.prompt.md.
   - why: the staged oracle covers AC-1 and AC-3 only; AC-2 is probed after the run.
   - gate: off
   - expect: Adds `src/import.js` without touching the oracle or the shared helper.
   - assert: file src/import.js
   - assert: unchanged test/import.test.js
   - assert: unchanged src/csv.js
   - assert: ranpass node --test
