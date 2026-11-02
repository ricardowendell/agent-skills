# Evals — write-implementation-prompt (experiment, stage 1)

This file exists only inside `docs/evals/experiments/wip-operations-contract`.
It is not part of the skill's shipped corpus: the runner here tests a frozen
copy of the skill, not the skill itself.

1. **Prompt for a spec whose AC includes an error condition.**
   - prompt: Create the implementation prompt for SPEC-0014.
   - why: AC-2 is a rejection with a line number, so the prompt has to say how to check it, not just that it exists.
   - expect: Records the spec hash in the prompt frontmatter.
   - expect: Names the existing CSV helpers instead of re-deriving splitting.
   - assert: filematch docs/prompts/SPEC-0014-*.prompt.md spec_sha:
   - assert: unchanged docs/specs/SPEC-0014-import-limits.md

2. **Prompt for a spec whose acceptance criterion the oracle does not check.**
   - prompt: Create the implementation prompt for SPEC-0015.
   - why: AC-2 is invisible to the staged tests, so the prompt is the only carrier; a prompt that only restates AC-1 and AC-3 loses it.
   - expect: Records the spec hash in the prompt frontmatter.
   - expect: Conveys the physical-line rule of AC-2, including that blanks do not shift it.
   - assert: filematch docs/prompts/SPEC-0015-*.prompt.md spec_sha:
   - assert: unchanged docs/specs/SPEC-0015-import-validation.md
